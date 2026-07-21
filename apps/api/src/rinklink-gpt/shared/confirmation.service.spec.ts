import { ConfirmationService } from './confirmation.service';
import { UserContext } from './user-context.service';
import { ChatRequestDto } from '../rinklink-gpt.types';

// Avoid real Supabase/env side effects from transitively-imported services.
jest.mock('../../supabase', () => ({ supabase: { from: jest.fn() } }));

describe('ConfirmationService (security)', () => {
  let service: ConfirmationService;
  let gamesService: { create: jest.Mock };
  let emailService: { sendEmail: jest.Mock };
  let auditLogService: { logChatAction: jest.Mock };
  let managerSearchService: { isKnownManagerEmail: jest.Mock };

  const userContext: UserContext = {
    userId: 'auth-owner',
    userDbId: '42',
    teamId: 100,
    associationId: 200,
    email: 'owner@team.com',
    userName: 'Real Owner',
  };

  beforeEach(() => {
    gamesService = { create: jest.fn().mockResolvedValue([{ id: 1 }]) };
    emailService = { sendEmail: jest.fn().mockResolvedValue(true) };
    auditLogService = { logChatAction: jest.fn().mockResolvedValue(undefined) };
    managerSearchService = { isKnownManagerEmail: jest.fn() };

    service = new ConfirmationService(
      gamesService as any,
      emailService as any,
      auditLogService as any,
      managerSearchService as any,
    );
  });

  it('ignores tampered team/association/user in create_game and uses the server context', async () => {
    const request: ChatRequestDto = {
      message: '',
      userId: 'auth-owner',
      confirmAction: true,
      pendingAction: {
        type: 'create_game',
        description: 'add game',
        data: {
          date: '2026-01-01',
          time: '10:00',
          game_type: 'league',
          isHome: true,
          // Attacker-supplied identity fields — must be ignored:
          team: 999,
          association: 888,
          user: 777,
        },
      },
    } as ChatRequestDto;

    await service.executeConfirmedAction(request, userContext);

    expect(gamesService.create).toHaveBeenCalledTimes(1);
    const gameArg = gamesService.create.mock.calls[0][0][0];
    expect(gameArg.team).toBe(100);
    expect(gameArg.association).toBe(200);
    expect(gameArg.user).toBe('42');
  });

  it('blocks send_email to an address that is not a known manager contact', async () => {
    managerSearchService.isKnownManagerEmail.mockResolvedValue(false);

    const request: ChatRequestDto = {
      message: '',
      userId: 'auth-owner',
      confirmAction: true,
      pendingAction: {
        type: 'send_email',
        description: 'send',
        data: {
          to: 'attacker@evil.com',
          subject: 'hi',
          body: 'body',
          signature: 'sig',
        },
      },
    } as ChatRequestDto;

    const result = await service.executeConfirmedAction(request, userContext);

    expect(emailService.sendEmail).not.toHaveBeenCalled();
    expect(result.error).toBe('Recipient is not a known manager contact');
  });

  it('sends to a known contact using server-derived sender identity', async () => {
    managerSearchService.isKnownManagerEmail.mockResolvedValue(true);

    const request: ChatRequestDto = {
      message: '',
      userId: 'auth-owner',
      confirmAction: true,
      pendingAction: {
        type: 'send_email',
        description: 'send',
        data: {
          to: 'coach@known.com',
          subject: 'hi',
          body: 'body',
          signature: 'sig',
          // Attacker-supplied sender fields — must be ignored:
          fromName: 'Spoofed Name',
          fromEmail: 'spoof@evil.com',
        },
      },
    } as ChatRequestDto;

    await service.executeConfirmedAction(request, userContext);

    expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
    const sent = emailService.sendEmail.mock.calls[0][0];
    expect(sent.to).toBe('coach@known.com');
    expect(sent.fromName).toBe('Real Owner');
    expect(sent.replyTo).toBe('owner@team.com');
  });
});
