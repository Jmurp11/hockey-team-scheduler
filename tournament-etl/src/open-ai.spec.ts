import { findTournaments, generateTournamentPrompt } from './open-ai';
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

    it('should throw error when OpenAI API fails', async () => {
      // Arrange
      const mockError = new Error('API rate limit exceeded');
      mockCreate.mockRejectedValue(mockError);

      // Act & Assert
      try {
        await findTournaments(mockProps);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Could not find tournaments: API rate limit exceeded');
      }
    });

    it('should throw error when response contains invalid JSON', async () => {
      // Arrange
      const invalidResponse = {
        output_text: 'invalid json',
      };
      mockCreate.mockResolvedValue(invalidResponse);

      // Act & Assert
      try {
        await findTournaments(mockProps);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Could not find tournaments:');
      }
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
  });
});
