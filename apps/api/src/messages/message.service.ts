import { ForbiddenException, Injectable } from '@nestjs/common';
import { supabase } from '../supabase';
import {
  Conversation,
  ConversationWithMessages,
  CreateConversationDto,
  MessageDto,
} from '../types';
import { OpenAiService } from '../open-ai/open-ai.service';
import { Twilio } from 'twilio';
import { env } from 'node:process';

@Injectable()
export class MessageService {
  private twilio: Twilio;

  constructor(private openAiService: OpenAiService) {
    this.twilio = new Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }

  async sendText(to: string, body: string) {
    console.log({
      to,
      from: env.TWILIO_PHONE,
      body,
    });
    return this.twilio.messages.create({
      to,
      from: env.TWILIO_PHONE,
      body,
    });
  }

  async sendInitialMessage(
    conversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    const contact = await supabase
      .from('managers')
      .select('*')
      .ilike('name', conversationDto.contactName)
      .ilike('team', conversationDto.contactTeam)
      .single();

    const twilioMessage = await this.sendText(
      '+19142174246', // contact.data.phone,
      conversationDto.message,
    );

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: conversationDto.userId,
        manager_id: '-1', // contact.data.id,
        ai_enabled: true,
      })
      .select();

    await supabase.from('messages').insert({
      conversation_id: data?.[0].id,
      sender: 'user',
      content: conversationDto.message,
      twilio_sid: twilioMessage.sid,
    });

    return data?.[0];
  }

  async incoming(body: MessageDto): Promise<void> {
    const from = body.phone;
    const text = body.body.trim();

    const contact = await supabase
      .from('managers')
      .select('*')
      .ilike('phone', from)
      .single();

    if (!contact.data) {
      throw new Error('Unknown contact');
    }

    const convo = await supabase
      .from('conversations')
      .select('*')
      .eq('manager_id', contact.data.id)
      .single();

    // Save inbound message
    await supabase.from('messages').insert({
      conversation_id: convo.data.id,
      sender: 'contact',
      content: text,
    });

    if (convo.data.ai_enabled) {
      const aiReply = await this.openAiService.generateReply(convo.data.id);

      if (!aiReply) {
        throw new Error('AI did not generate a reply');
      }

      const twilioMessage = await this.sendText(contact.data.phone, aiReply);

      await supabase.from('messages').insert({
        conversation_id: convo.data.id,
        sender: 'ai',
        content: aiReply,
        twilio_sid: twilioMessage.sid,
      });
    }
  }

  async getMessages(
    conversationId: string,
    userId: string,
  ): Promise<MessageDto[]> {
    const { data: convo, error } = await supabase
      .from('conversations')
      .select('id, contact_id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (error || !convo) throw new ForbiddenException();

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    return messages || [];
  }

  async getConversations(userId: string): Promise<ConversationWithMessages[]> {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(
        `
        id,
        user_id,
        manager_id,
        ai_enabled,
        created_at,
        updated_at,
        managers (
          name,
          team
        )
      `,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    return this.getConversationLastMessage(conversations);
  }

  // TODO: move to stored procedure or view that returns all of this data
  async getConversationLastMessage(
    conversations: Conversation[],
  ): Promise<ConversationWithMessages[]> {
    return [];
    // return Promise.all(
    //   (conversations || []).map(async (convo) => {
    //     const { data: lastMessage } = await supabase
    //       .from('messages')
    //       .select('content, created_at')
    //       .eq('conversation_id', convo.id)
    //       .order('created_at', { ascending: false })
    //       .limit(1)
    //       .single();

    //     const { data: unreadCount } = await supabase
    //       .from('messages')
    //       .select('id', { count: 'exact', head: true })
    //       .eq('conversation_id', convo.id)
    //       .eq('sender', 'contact')
    //       .eq('read', false);

    // return {
    //   id: convo.id,
    //   user_id: convo.user_id,
    //   manager_id: convo.manager_id,
    //   managerTeam: convo.managers?.team || '',
    //   lastMessage: lastMessage?.content || '',
    //   lastMessageTimestamp: lastMessage?.created_at || convo.created_at,
    //   unreadCount: (unreadCount as any)?.count || 0,
    // };
    // }),
    // );
  }
}
