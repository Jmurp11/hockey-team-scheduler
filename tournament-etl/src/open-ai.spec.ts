import {
  findTournaments,
  findTournamentsMultiPass,
  generateTournamentPrompt,
} from './open-ai';
import { TournamentProps } from './types';

// Mock the entire OpenAI module
jest.mock('openai/client', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        responses: {
          create: jest.fn(),
        },
      };
    }),
  };
});

// Import OpenAI after mocking
import { OpenAI } from 'openai/client';

describe('open-ai', () => {
  describe('findTournaments', () => {
    const mockProps: TournamentProps = {
      location: 'New York',
      locationType: 'state',
    };

    const mockOpenAIResponse = {
      output_text: JSON.stringify({
        tournaments: [
          {
            name: 'Test Tournament',
            location: 'Buffalo, NY',
            startDate: '2025-12-01',
            endDate: '2025-12-03',
            registrationUrl: 'https://example.com/tournament',
            description: 'Test tournament description',
            rink: 'Test Rink',
            age: ['10U', '12U'],
            level: ['AAA', 'AA'],
            latitude: 42.8864,
            longitude: -78.8784,
          },
        ],
      }),
    };

    let mockCreate: jest.Mock;
    let mockOpenAIInstance: { responses: { create: jest.Mock } };

    beforeEach(() => {
      jest.clearAllMocks();
      mockCreate = jest.fn().mockResolvedValue(mockOpenAIResponse);
      mockOpenAIInstance = {
        responses: {
          create: mockCreate,
        },
      };
      (OpenAI as unknown as jest.Mock).mockImplementation(() => mockOpenAIInstance);
    });

    it('should successfully find tournaments and return formatted data', async () => {
      // Act
      const result = await findTournaments(mockProps);

      // Assert
      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        name: 'Test Tournament',
        location: 'Buffalo, NY',
        startDate: '2025-12-01',
        endDate: '2025-12-03',
        registrationUrl: 'https://example.com/tournament',
        description: 'Test tournament description',
        rink: 'Test Rink',
        age: ['10U', '12U'],
        level: ['AAA', 'AA'],
        latitude: 42.8864,
        longitude: -78.8784,
      });
    });

    it('should call OpenAI API with correct model', async () => {
      // Act
      await findTournaments(mockProps);

      // Assert
      expect(mockCreate).toHaveBeenCalled();
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.model).toBe('gpt-5-mini');
    });

    it('should handle multiple tournaments in response', async () => {
      // Arrange
      const multiTournamentResponse = {
        output_text: JSON.stringify({
          tournaments: [
            {
              name: 'Tournament 1',
              location: 'Buffalo, NY',
              startDate: '2025-12-01',
              endDate: '2025-12-03',
              registrationUrl: 'https://example.com/tournament1',
              description: 'Tournament 1 description',
              rink: 'Rink 1',
              age: ['10U'],
              level: ['AAA'],
              latitude: 42.8864,
              longitude: -78.8784,
            },
            {
              name: 'Tournament 2',
              location: 'Rochester, NY',
              startDate: '2025-12-10',
              endDate: '2025-12-12',
              registrationUrl: 'https://example.com/tournament2',
              description: 'Tournament 2 description',
              rink: 'Rink 2',
              age: ['12U'],
              level: ['AA'],
              latitude: 43.1566,
              longitude: -77.6088,
            },
          ],
        }),
      };
      mockCreate.mockResolvedValue(multiTournamentResponse);

      // Act
      const result = await findTournaments(mockProps);

      // Assert
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Tournament 1');
      expect(result[1].name).toBe('Tournament 2');
    });

    it('should handle tournaments with null values', async () => {
      // Arrange
      const nullValueResponse = {
        output_text: JSON.stringify({
          tournaments: [
            {
              name: 'Tournament with nulls',
              location: 'Unknown, NY',
              startDate: '2025-12-01',
              endDate: '2025-12-03',
              registrationUrl: 'https://example.com/tournament',
              description: 'Tournament description',
              rink: null,
              age: null,
              level: null,
              latitude: null,
              longitude: null,
            },
          ],
        }),
      };
      mockCreate.mockResolvedValue(nullValueResponse);

      // Act
      const result = await findTournaments(mockProps);

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].rink).toBeNull();
      expect(result[0].age).toBeNull();
      expect(result[0].level).toBeNull();
      expect(result[0].latitude).toBeNull();
      expect(result[0].longitude).toBeNull();
    });

    // `noRetryDelay` keeps the backoff from making these tests sleep.
    const noRetryDelay = { initialDelayMs: 0 };

    it('should throw after exhausting retries when the OpenAI API fails', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      mockCreate.mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(findTournaments(mockProps, noRetryDelay)).rejects.toThrow(
        /Could not find tournaments after 3 attempts: API rate limit exceeded/
      );
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should retry and succeed when a transient failure clears', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      mockCreate
        .mockRejectedValueOnce(new Error('502 Bad Gateway'))
        .mockResolvedValueOnce(mockOpenAIResponse);

      const result = await findTournaments(mockProps, noRetryDelay);

      expect(result).toHaveLength(1);
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });

    it('should not retry when the first attempt succeeds', async () => {
      const result = await findTournaments(mockProps, noRetryDelay);

      expect(result).toHaveLength(1);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should throw a descriptive error when the response is invalid JSON', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      mockCreate.mockResolvedValue({ output_text: 'invalid json' });

      await expect(findTournaments(mockProps, noRetryDelay)).rejects.toThrow(
        /Model returned invalid JSON/
      );
    });

    it('should throw when the response has no tournaments array', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      mockCreate.mockResolvedValue({ output_text: JSON.stringify({ foo: 1 }) });

      await expect(findTournaments(mockProps, noRetryDelay)).rejects.toThrow(
        /no "tournaments" array/
      );
    });

    it('should handle empty tournaments array', async () => {
      // Arrange
      const emptyResponse = {
        output_text: JSON.stringify({
          tournaments: [],
        }),
      };
      mockCreate.mockResolvedValue(emptyResponse);

      // Act
      const result = await findTournaments(mockProps);

      // Assert
      expect(result.length).toBe(0);
      expect(result).toEqual([]);
    });

    it('should request medium reasoning effort', async () => {
      // "low" stopped searching early and often returned nothing.
      await findTournaments(mockProps);

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.reasoning).toEqual({ effort: 'medium' });
    });
  });

  describe('findTournamentsMultiPass', () => {
    const mockProps: TournamentProps = {
      location: 'New York',
      locationType: 'state',
    };

    let mockCreate: jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
      jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      mockCreate = jest.fn();
      (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
        responses: { create: mockCreate },
      }));
    });

    afterEach(() => jest.restoreAllMocks());

    const tournament = (name: string, startDate: string, url: string) => ({
      name,
      location: 'Buffalo, NY',
      startDate,
      endDate: '2026-12-03',
      registrationUrl: url,
      description: 'd',
      rink: null,
      age: null,
      level: null,
      latitude: null,
      longitude: null,
    });

    const responseWith = (...items: ReturnType<typeof tournament>[]) => ({
      output_text: JSON.stringify({ tournaments: items }),
    });

    it('unions results across passes', async () => {
      mockCreate
        .mockResolvedValueOnce(responseWith(tournament('A', '2026-12-01', 'u1')))
        .mockResolvedValueOnce(responseWith(tournament('B', '2026-12-05', 'u2')))
        .mockResolvedValueOnce(responseWith(tournament('C', '2026-12-09', 'u3')));

      const result = await findTournamentsMultiPass(mockProps, { passes: 3 });

      expect(mockCreate).toHaveBeenCalledTimes(3);
      expect(result.tournaments.map((t) => t.name).sort()).toEqual(['A', 'B', 'C']);
      expect(result.passYields).toEqual([1, 1, 1]);
    });

    it('dedups on name + startDate across passes', async () => {
      mockCreate
        .mockResolvedValueOnce(responseWith(tournament('A', '2026-12-01', 'u1')))
        .mockResolvedValueOnce(responseWith(tournament('A', '2026-12-01', 'u1')))
        .mockResolvedValueOnce(responseWith(tournament('A', '2026-12-01', 'u1')));

      const result = await findTournamentsMultiPass(mockProps, { passes: 3 });

      expect(result.tournaments.length).toBe(1);
      // The raw per-pass counts still reflect what the model returned.
      expect(result.passYields).toEqual([1, 1, 1]);
    });

    it('keeps distinct tournaments that share a registrationUrl', async () => {
      // The model often returns a listing page shared by several events.
      // Keying the union on registrationUrl would collapse them into one.
      mockCreate
        .mockResolvedValueOnce(
          responseWith(
            tournament('Fall Prep', '2026-12-01', 'https://x.com/tournaments/'),
            tournament('Spring Cup', '2027-03-01', 'https://x.com/tournaments/')
          )
        )
        .mockResolvedValueOnce(responseWith());

      const result = await findTournamentsMultiPass(mockProps, { passes: 2 });

      expect(result.tournaments.length).toBe(2);
    });

    it('tolerates a failing pass and returns the surviving results', async () => {
      mockCreate
        .mockResolvedValueOnce(responseWith(tournament('A', '2026-12-01', 'u1')))
        .mockRejectedValue(new Error('boom'));

      // Pass 2 exhausts its internal retries, pass 1's result must survive.
      const result = await findTournamentsMultiPass(mockProps, {
        passes: 2,
        maxAttempts: 1,
      });

      expect(result.tournaments.map((t) => t.name)).toEqual(['A']);
      expect(result.passYields).toEqual([1, 0]);
    });

    it('throws only when every pass fails', async () => {
      mockCreate.mockRejectedValue(new Error('boom'));

      await expect(
        findTournamentsMultiPass(mockProps, { passes: 2, maxAttempts: 1 })
      ).rejects.toThrow('All 2 passes failed');
    });

    it('defaults to 3 passes', async () => {
      mockCreate.mockResolvedValue(responseWith());

      await findTournamentsMultiPass(mockProps);

      expect(mockCreate).toHaveBeenCalledTimes(3);
    });
  });

  describe('generateTournamentPrompt', () => {
    it('should generate prompt with location and locationType', () => {
      // Arrange
      const props: TournamentProps = {
        location: 'New York',
        locationType: 'state',
      };

      // Act
      const prompt = generateTournamentPrompt(props);

      // Assert
      expect(prompt).toContain('state of New York');
      expect(prompt).toContain('real, upcoming youth hockey tournaments');
    });

    it('should include all required sources in prompt', () => {
      // Arrange
      const props: TournamentProps = {
        location: 'California',
        locationType: 'state',
      };

      // Act
      const prompt = generateTournamentPrompt(props);

      // Assert
      expect(prompt).toContain('hockeyfinder.com');
      expect(prompt).toContain('nickelcityhockey.com');
      expect(prompt).toContain('defenderhockeytournaments.com');
      expect(prompt).toContain('myhockeyrankings.com');
      expect(prompt).toContain('sportsengine.com');
      expect(prompt).toContain('tourneycentral.com');
      expect(prompt).toContain('200x85.com');
      expect(prompt).toContain('silverstick.org');
    });

    it('should include data extraction requirements', () => {
      // Arrange
      const props: TournamentProps = {
        location: 'Ontario',
        locationType: 'province',
      };

      // Act
      const prompt = generateTournamentPrompt(props);

      // Assert
      expect(prompt).toContain('name');
      expect(prompt).toContain('location');
      expect(prompt).toContain('startDate');
      expect(prompt).toContain('endDate');
      expect(prompt).toContain('registrationUrl');
      expect(prompt).toContain('description');
      expect(prompt).toContain('rink');
      expect(prompt).toContain('age');
      expect(prompt).toContain('level');
      expect(prompt).toContain('latitude');
      expect(prompt).toContain('longitude');
    });

    it('should include field inference rules', () => {
      // Arrange
      const props: TournamentProps = {
        location: 'Massachusetts',
        locationType: 'state',
      };

      // Act
      const prompt = generateTournamentPrompt(props);

      // Assert
      expect(prompt).toContain('10U');
      expect(prompt).toContain('12U');
      expect(prompt).toContain('AAA');
      expect(prompt).toContain('AA');
      expect(prompt).toContain('YYYY-MM-DD');
    });

    it('should work with different location types', () => {
      // Arrange
      const stateProps: TournamentProps = {
        location: 'Texas',
        locationType: 'state',
      };
      const provinceProps: TournamentProps = {
        location: 'Quebec',
        locationType: 'province',
      };

      // Act
      const statePrompt = generateTournamentPrompt(stateProps);
      const provincePrompt = generateTournamentPrompt(provinceProps);

      // Assert
      expect(statePrompt).toContain('state of Texas');
      expect(provincePrompt).toContain('province of Quebec');
    });

    it('should state an explicit 12-month date window', () => {
      // "current or upcoming season" is ambiguous when the job runs in
      // August, between seasons.
      const props: TournamentProps = {
        location: 'Ohio',
        locationType: 'state',
      };

      const prompt = generateTournamentPrompt(props, new Date('2026-08-03'));

      expect(prompt).toContain('startDate between 2026-08-03 and 2027-08-03');
      expect(prompt).toContain('Today is 2026-08-03');
    });

    it('should describe the output as an object, not a bare array', () => {
      // zodTextFormat requires { tournaments: [...] }; the prompt used to show
      // a bare array, contradicting the schema it was sent with.
      const props: TournamentProps = {
        location: 'Ohio',
        locationType: 'state',
      };

      const prompt = generateTournamentPrompt(props);

      expect(prompt).toContain('"tournaments"');
      expect(prompt).toContain('```json');
      expect(prompt).not.toContain('***json');
    });

    it('should ask for event-specific registration URLs', () => {
      const props: TournamentProps = {
        location: 'Ohio',
        locationType: 'state',
      };

      const prompt = generateTournamentPrompt(props);

      expect(prompt).toContain('Do not return a directory or listing page');
    });
  });
});
