import { Injectable, Logger } from '@nestjs/common';
import { GamesService } from '../../games/games.service';
import {
  EmailService,
  buildHeading,
  buildParagraph,
  buildHighlightBox,
} from '../../email/email.service';
import { CreateGameDto } from '../../types';
import {
  ChatRequestDto,
  ChatResponseDto,
  PendingAction,
  EmailDraft,
} from '../rinklink-gpt.types';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class ConfirmationService {
  private readonly logger = new Logger(ConfirmationService.name);

  constructor(
    private readonly gamesService: GamesService,
    private readonly emailService: EmailService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async executeConfirmedAction(
    request: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    const { pendingAction } = request;

    if (!pendingAction) {
      return {
        message: 'No action to confirm.',
        error: 'Missing pending action',
      };
    }

    try {
      switch (pendingAction.type) {
        case 'create_game': {
          const data = pendingAction.data;
          const gameData = {
            date: new Date(data.date as string),
            time: data.time as string,
            opponent: (data.opponent as number) || null,
            game_type: data.game_type as string,
            isHome: data.isHome as boolean,
            rink: (data.rink as string) || '',
            city: (data.city as string) || '',
            state: (data.state as string) || '',
            country: (data.country as string) || 'USA',
            team: data.team as number,
            association: data.association as number,
            user: data.user as number,
          };

          const createdGames = await this.gamesService.create([gameData as CreateGameDto]);

          await this.auditLogService.logChatAction(request.userId, 'create_game', {
            gameId: createdGames[0]?.id,
            gameData,
          });

          return {
            message: `I've added the game to your schedule. Here's a summary:

**Game Added:**
- Date: ${data.date}
- Time: ${data.time}
- Type: ${data.game_type}
- Opponent: ${data.opponentName || 'Open slot'}

You can view and manage this game in your Schedule.`,
            actionExecuted: true,
            data: { game: createdGames[0] },
          };
        }

        case 'add_tournament_to_schedule': {
          const tournamentData = pendingAction.data;
          const tournamentGame = {
            date: new Date(tournamentData.startDate as string),
            time: '00:00',
            opponent: null,
            game_type: 'tournament',
            isHome: false,
            rink: '',
            city: '',
            state: '',
            country: 'USA',
            team: tournamentData.team as number,
            association: tournamentData.team as number,
            user: tournamentData.user as number,
          };

          const createdGames = await this.gamesService.create([tournamentGame as unknown as CreateGameDto]);

          await this.auditLogService.logChatAction(request.userId, 'add_tournament', {
            tournamentId: pendingAction.data.tournamentId,
            gameId: createdGames[0]?.id,
          });

          return {
            message: `I've added the tournament to your schedule. Here's a summary:

**Tournament Added:**
- Name: ${tournamentData.tournamentName}
- Dates: ${tournamentData.startDate} to ${tournamentData.endDate}
- Location: ${tournamentData.location}
${tournamentData.registrationUrl ? `\nDon't forget to complete registration at: ${tournamentData.registrationUrl}` : ''}

You can view this in your Schedule.`,
            actionExecuted: true,
            data: { tournament: tournamentData },
          };
        }

        case 'send_email': {
          const emailData = pendingAction.data as EmailDraft;

          const htmlBody = `
            ${buildHeading('Message from ' + (emailData.fromName || 'Team Manager'), 2)}
            ${buildParagraph(emailData.body.replace(/\n/g, '<br />'))}
            ${buildHighlightBox(emailData.signature.replace(/\n/g, '<br />'), 'info')}
          `;

          const emailSent = await this.emailService.sendEmail({
            to: emailData.to,
            subject: emailData.subject,
            body: htmlBody,
            textBody: `${emailData.body}\n\n${emailData.signature}`,
            fromName: emailData.fromName || 'RinkLink Team Manager',
            replyTo: emailData.fromEmail,
          });

          if (!emailSent) {
            return {
              message: 'I apologize, but there was an error sending the email. Please try again.',
              error: 'Failed to send email',
            };
          }

          await this.auditLogService.logChatAction(request.userId, 'send_email', {
            to: emailData.to,
            toName: emailData.toName,
            toTeam: emailData.toTeam,
            subject: emailData.subject,
            intent: emailData.intent,
            relatedGameId: emailData.relatedGameId,
            sentAt: new Date().toISOString(),
          });

          return {
            message: `Your email has been sent successfully!

**Email Sent:**
- To: ${emailData.toName} (${emailData.toTeam})
- Subject: ${emailData.subject}

The recipient will receive your message at ${emailData.to}. They can reply directly to your email address.`,
            actionExecuted: true,
            data: {
              emailSent: true,
              to: emailData.to,
              subject: emailData.subject,
            },
          };
        }

        default:
          return {
            message: 'Unknown action type.',
            error: `Unknown action type: ${(pendingAction as PendingAction).type}`,
          };
      }
    } catch (error) {
      this.logger.error('Error executing confirmed action:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        message: 'I apologize, but I encountered an error while processing your request. Please try again.',
        error: errorMessage,
      };
    }
  }
}
