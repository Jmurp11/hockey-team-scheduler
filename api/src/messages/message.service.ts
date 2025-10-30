import { ForbiddenException, Injectable } from '@nestjs/common';
import { supabase } from '../supabase';
import { Conversation, CreateConversationDto, MessageDto } from '../types';
import { OpenAiService } from '../open-ai/open-ai.service';
import { Twilio } from 'twilio';

@Injectable()
export class MessageService {
  private twilio: Twilio;

  constructor(private openAiService: OpenAiService) {
    this.twilio = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  async sendText(to: string, body: string) {
    return this.twilio.messages.create({
      to,
      from: process.env.TWILIO_PHONE,
      body,
    });
  }

  async sendInitialMessage(
    conversationDto: CreateConversationDto,
    message: string,
  ): Promise<Conversation> {
    const contact = await supabase
      .from('managers')
      .select('*')
      .ilike('name', conversationDto.contactName)
      .ilike('team', conversationDto.contactTeam)
      .single();

    const twilioMessage = await this.sendText(contact.data.phone, message);

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: conversationDto.userId,
        manager_id: contact.data.id,
        ai_enabled: true,
      })
      .select();

    await supabase.from('messages').insert({
      conversation_id: data?.[0].id,
      sender: 'user',
      content: message,
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

    // Make sure this conversation belongs to the user
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

    return messages;
  }
}
