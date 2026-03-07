import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import OpenAI from 'openai';
import { GamesService } from '../../../games/games.service';
import { BaseAgent, AgentContext, AgentResult } from '../../shared/base-agent';
import { OPENAI_CLIENT } from '../../shared/openai-client.provider';
import { AgentRegistryService } from '../../shared/agent-registry.service';
import { AgentTracingService, TraceContext } from '../../shared/agent-tracing.service';
import { ManagerSearchService } from '../../shared/manager-search.service';
import { ToolDefinition, EmailDraft, PendingAction } from '../../rinklink-gpt.types';
import { EMAIL_TOOLS } from './email.tools';
import { getEmailPrompt } from './email.prompt';

@Injectable()
export class EmailAgent extends BaseAgent implements OnModuleInit {
  readonly agentName = 'email';
  readonly description =
    'Drafts and prepares emails to other team managers for scheduling, rescheduling, canceling games, or general communication';

  private readonly logger = new Logger(EmailAgent.name);
  private _traceContext?: TraceContext;
  private _parentSpanId?: string;

  constructor(
    @Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
    private readonly gamesService: GamesService,
    private readonly managerSearchService: ManagerSearchService,
    private readonly registry: AgentRegistryService,
    private readonly tracing: AgentTracingService,
  ) {
    super();
  }

  onModuleInit() {
    this.registry.register(this.agentName, this);
  }

  getTools(): ToolDefinition[] {
    return EMAIL_TOOLS;
  }

  getSystemPrompt(context: AgentContext): string {
    return getEmailPrompt(context);
  }

  checkRequiredInfo(context: AgentContext): string | null {
    const input = context.inputData || {};
    if (!input.intent && !context.message) {
      return 'Please specify the email intent (schedule, reschedule, cancel, or general).';
    }
    return null;
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    this._traceContext = context.inputData?._traceContext as TraceContext | undefined;
    this._parentSpanId = context.inputData?._parentSpanId as string | undefined;

    const args = (context.inputData || {}) as {
      recipientTeamName?: string;
      recipientTeamId?: number;
      intent: 'schedule' | 'reschedule' | 'cancel' | 'general';
      proposedDate?: string;
      proposedTime?: string;
      existingGameId?: string;
      additionalContext?: string;
    };

    return this.prepareDraftEmail(args, context.userContext);
  }

  private async prepareDraftEmail(
    args: {
      recipientTeamName?: string;
      recipientTeamId?: number;
      intent: 'schedule' | 'reschedule' | 'cancel' | 'general';
      proposedDate?: string;
      proposedTime?: string;
      existingGameId?: string;
      additionalContext?: string;
    },
    userContext: AgentContext['userContext'],
  ): Promise<AgentResult> {
    try {
      let recipientManager: {
        name: string;
        email: string;
        phone: string;
        team: string;
      } | null = null;
      let wasFuzzyMatch = false;

      if (args.recipientTeamId) {
        const { managers, searchResult } =
          await this.managerSearchService.searchByTeam(
            args.recipientTeamId.toString(),
          );
        if (managers.length > 0) {
          recipientManager = managers[0];
          wasFuzzyMatch = searchResult.matchType === 'fuzzy';
        }
      } else if (args.recipientTeamName) {
        const { managers, searchResult } =
          await this.managerSearchService.searchByTeam(
            args.recipientTeamName,
          );
        if (managers.length > 0) {
          recipientManager = managers[0];
          wasFuzzyMatch = searchResult.matchType === 'fuzzy';
        }
      }

      if (!recipientManager || !recipientManager.email) {
        const searchedName = args.recipientTeamName || 'the specified team';
        return {
          success: false,
          error: `Could not find contact information for "${searchedName}" in our managers database. This team may not have a manager registered yet. You can try: 1) Searching with a different spelling or the full team name, 2) Ask the user for the exact team name, or 3) Use get_team_manager to search the web for their contact info.`,
          data: {
            searchedFor: searchedName,
            suggestion:
              'Try searching with the full team name or ask the user to confirm the team name.',
          },
        };
      }

      const originalSearch = args.recipientTeamName || '';
      const foundTeamName = recipientManager.team;

      if (
        wasFuzzyMatch &&
        originalSearch.toLowerCase() !== foundTeamName.toLowerCase()
      ) {
        this.logger.log(
          `Fuzzy match: searched for "${originalSearch}", found "${foundTeamName}"`,
        );
      }

      let existingGame: any = null;
      if (args.existingGameId) {
        existingGame = await this.gamesService.findOne(args.existingGameId);
      }

      const signature = this.buildEmailSignature(userContext);

      const emailDraft = await this.generateEmailDraft({
        intent: args.intent,
        senderName: userContext.teamName || 'Team Manager',
        senderTeam: userContext.teamName || '',
        recipientName: recipientManager.name,
        recipientTeam: recipientManager.team,
        proposedDate: args.proposedDate,
        proposedTime: args.proposedTime,
        existingGame,
        additionalContext: args.additionalContext,
        signature,
      });

      const emailDraftData: EmailDraft = {
        to: recipientManager.email,
        toName: recipientManager.name,
        toTeam: recipientManager.team,
        subject: emailDraft.subject,
        body: emailDraft.body,
        signature,
        intent: args.intent,
        relatedGameId: args.existingGameId,
        fromName: userContext.userName
          ? `${userContext.userName} - ${userContext.teamName || 'Team Manager'}`
          : userContext.teamName
            ? `${userContext.teamName} Manager`
            : 'Team Manager',
        fromEmail: userContext.email,
      };

      const pendingAction: PendingAction = {
        type: 'send_email',
        description: `Send email to ${recipientManager.name} (${recipientManager.team}) - ${args.intent}`,
        data: emailDraftData,
      };

      const fuzzyMatchNote =
        wasFuzzyMatch &&
        originalSearch.toLowerCase() !== foundTeamName.toLowerCase()
          ? `\n\n**Note:** You searched for "${originalSearch}" and I found "${foundTeamName}". Please confirm this is the correct team.\n`
          : '';

      return {
        success: true,
        requiresConfirmation: true,
        pendingAction,
        data: {
          confirmationMessage: `I've drafted the following email for your review:${fuzzyMatchNote}

**To:** ${recipientManager.name} (${recipientManager.team})
**Email:** ${recipientManager.email}
**Subject:** ${emailDraft.subject}

---

${emailDraft.body}

${signature}

---

You can edit this email before sending. Would you like me to send this email?`,
          emailDraft: {
            to: recipientManager.email,
            toName: recipientManager.name,
            toTeam: recipientManager.team,
            subject: emailDraft.subject,
            body: emailDraft.body,
            signature,
            intent: args.intent,
          },
          fuzzyMatch: wasFuzzyMatch,
          searchedFor: originalSearch,
          foundTeam: foundTeamName,
        },
      };
    } catch (error) {
      this.logger.error('Error in prepareDraftEmail:', error);
      return {
        success: false,
        error: 'Failed to draft email. Please try again.',
      };
    }
  }

  private async generateEmailDraft(params: {
    intent: 'schedule' | 'reschedule' | 'cancel' | 'general';
    senderName: string;
    senderTeam: string;
    recipientName: string;
    recipientTeam: string;
    proposedDate?: string;
    proposedTime?: string;
    existingGame?: any;
    additionalContext?: string;
    signature: string;
  }): Promise<{ subject: string; body: string }> {
    const intentDescriptions = {
      schedule: 'scheduling a new game',
      reschedule: 'rescheduling an existing game',
      cancel: 'canceling a game',
      general: 'general communication about hockey',
    };

    const hasRecipientName =
      params.recipientName && params.recipientName.trim() !== '';
    const greetingInstruction = hasRecipientName
      ? `Start the email with "Hi ${params.recipientName},"`
      : 'Start the email with "To Whom It May Concern," since we do not have the recipient\'s name';

    const prompt = `You are drafting a professional email from a youth hockey team manager to another team manager.

Purpose: ${intentDescriptions[params.intent]}

Sender: ${params.senderName} (${params.senderTeam})
Recipient: ${hasRecipientName ? `${params.recipientName} (${params.recipientTeam})` : `Unknown contact at ${params.recipientTeam}`}
${params.proposedDate ? `Proposed Date: ${params.proposedDate}` : ''}
${params.proposedTime ? `Proposed Time: ${params.proposedTime}` : ''}
${params.existingGame ? `Existing Game: ${JSON.stringify(params.existingGame)}` : ''}
${params.additionalContext ? `Additional Context: ${params.additionalContext}` : ''}

Write a professional, friendly, and concise email. The tone should be collegial - these are both volunteer coaches/managers in youth hockey.

Return your response as JSON with this exact format:
{
  "subject": "Brief, clear subject line",
  "body": "Email body text"
}

CRITICAL GUIDELINES:
- ${greetingInstruction}
- Keep it brief and to the point
- Be friendly but professional
- For scheduling: Propose specific dates/times if provided, or ask for their availability
- For rescheduling: Acknowledge the change and apologize for any inconvenience
- For canceling: Be apologetic and offer to reschedule if appropriate
- ALWAYS use 12-hour time format with AM/PM (e.g., "7:00 PM", "10:30 AM") - never use military/24-hour time
- IMPORTANT: Do NOT include ANY signature, sign-off, or closing (no "Best regards", "Thanks", "Sincerely", names, or contact info at the end). The signature will be added automatically by the system. The email body should end with the last sentence of content, not a sign-off.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      if (this._traceContext) {
        const usage = response.usage;
        this.tracing.logEvent({
          trace_id: this._traceContext.traceId,
          parent_span_id: this._parentSpanId,
          span_id: this.tracing.startSpan().spanId,
          event_type: 'agent_llm_call',
          user_id: this._traceContext.userId,
          agent_name: this.agentName,
          model: 'gpt-4o',
          prompt_tokens: usage?.prompt_tokens,
          completion_tokens: usage?.completion_tokens,
          total_tokens: usage?.total_tokens,
          finish_reason: response.choices[0].finish_reason,
        });
      }

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        subject:
          result.subject || `Game ${params.intent} - ${params.senderTeam}`,
        body:
          result.body ||
          'Please contact me regarding our upcoming game.',
      };
    } catch (error) {
      this.logger.error('Error generating email draft:', error);
      return this.getDefaultEmailTemplate(params);
    }
  }

  private getDefaultEmailTemplate(params: {
    intent: 'schedule' | 'reschedule' | 'cancel' | 'general';
    senderTeam: string;
    recipientName: string;
    recipientTeam: string;
    proposedDate?: string;
    proposedTime?: string;
  }): { subject: string; body: string } {
    const greeting =
      params.recipientName && params.recipientName.trim()
        ? `Hi ${params.recipientName},`
        : 'To Whom It May Concern,';

    const templates = {
      schedule: {
        subject: `Game Request - ${params.senderTeam} vs ${params.recipientTeam}`,
        body: `${greeting}

I hope this message finds you well. I'm reaching out to see if ${params.recipientTeam} would be interested in scheduling a game against ${params.senderTeam}.

${params.proposedDate ? `We were thinking about ${params.proposedDate}${params.proposedTime ? ` at ${params.proposedTime}` : ''}.` : 'Please let me know what dates work for your team.'}

Looking forward to hearing from you.`,
      },
      reschedule: {
        subject: `Game Reschedule Request - ${params.senderTeam}`,
        body: `${greeting}

I hope you're doing well. Unfortunately, we need to reschedule our upcoming game.

${params.proposedDate ? `Would ${params.proposedDate}${params.proposedTime ? ` at ${params.proposedTime}` : ''} work for your team?` : 'Could you please let me know what alternative dates might work?'}

I apologize for any inconvenience this may cause.`,
      },
      cancel: {
        subject: `Game Cancellation - ${params.senderTeam}`,
        body: `${greeting}

I regret to inform you that we need to cancel our upcoming game. I apologize for any inconvenience this may cause.

If you'd like to reschedule for a future date, please let me know and we can work something out.`,
      },
      general: {
        subject: `Message from ${params.senderTeam}`,
        body: `${greeting}

I wanted to reach out regarding our teams.

Please let me know if you have any questions or if there's anything we need to discuss.`,
      },
    };

    return templates[params.intent];
  }

  private buildEmailSignature(
    userContext: AgentContext['userContext'],
  ): string {
    const lines = ['Best regards,'];

    if (userContext.userName) {
      lines.push(userContext.userName);
    } else {
      lines.push('Team Manager');
    }

    if (userContext.teamName) {
      lines.push(userContext.teamName);
    }

    if (userContext.associationName) {
      lines.push(userContext.associationName);
    }

    if (userContext.phone) {
      lines.push(`Phone: ${userContext.phone}`);
    }

    return lines.join('\n');
  }
}
