/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { env } from 'node:process';
import { OpenAI } from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z, ZodType } from 'zod/v3';
import { supabase } from '../supabase';
export interface SchedulerProps {
  team: string;
  location: string;
}

@Injectable()
export class OpenAiService {
  client: OpenAI;

  managerResponse: ZodType = z.object({
    managers: z.array(
      z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string(),
        sourceUrl: z
          .string()
          .describe('Source URL for the contact information'),
      }),
    ),
  });

  constructor() {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY || '',
    });
  }

  async generateReply(conversationId: string) {
    const messages = await supabase
      .from('messages')
      .select()
      .eq('conversation_id', conversationId)
      .limit(100)
      .order('created_at', { ascending: true });

    const context = messages.data?.map((m) => ({
      role: m.sender === 'contact' ? 'user' : 'assistant',
      content: m.content,
    }));

    if (!context || context.length === 0) {
      throw new Error('No messages found for conversation');
    }

    const response = await this.client.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a friendly hockey team manager scheduling games.',
        },
        ...(context as any),
      ],
    });

    return response.choices[0].message.content;
  }

  // TODO: needs refactor
  async contactScheduler(props: SchedulerProps) {
    const existingManager = await supabase
      .from('managers')
      .select('*')
      .ilike('team', `%${props.team}%`);

    if (existingManager.error) {
      console.error('Error checking existing manager:', existingManager.error);
      throw new Error('Could not check existing manager');
    }

    if (existingManager.data && existingManager.data.length > 0) {
      console.log(
        'Found existing manager, skipping OpenAI call:',
        existingManager.data,
      );
      return existingManager.data;
    }

    const response = await this.client.responses.create({
      model: 'gpt-5-mini',
      tools: [{ type: 'web_search' }],
      input: this.generateSchedulerPrompt(props),
      text: {
        format: zodTextFormat(this.managerResponse, 'managers'),
      },
    });

    console.log(JSON.stringify(response, null, 2));

    const managers = JSON.parse(response.output_text).managers.map(
      (manager) => ({
        name: manager.name.replace(/ cite.*/g, '').trim(),
        email: manager.email.replace(/ cite.*/g, '').trim(),
        phone: manager.phone.replace(/ cite.*/g, '').trim(),
        sourceUrl: manager.sourceUrl.replace(/ cite.*/g, '').trim(),
        team: props.team,
      }),
    );

    if (managers.length === 0) {
      console.warn('No managers found');
      return response;
    }

    const { error } = await supabase.from('managers').insert(managers);

    if (error) {
      console.error('Error inserting manager:', error);
      throw new Error('Could not save manager');
    }

    return response;
  }

  generateSchedulerPrompt(props: SchedulerProps): string {
    return `You are a contact information extraction agent.

  Search for the youth hockey team named "${props.team}" located in "${props.location}".
  Find official contact information for the **team manager** or **scheduler**.

  Search query example:
  "${props.team}" "${props.location}" hockey manager contact

  Return only verifiable information from official or authoritative sites.
  If found, return JSON exactly in this format:

  {
    "team": "${props.team}",
    "location": "${props.location}",
    "managerName": "string | null",
    "email": "string | null",
    "phone": "string | null",
    "sourceURL": "string | null"
  }

  If nothing is found, use null values.
`;
  }
}
