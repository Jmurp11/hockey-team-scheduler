import { Inject, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { GamesService } from '../../games/games.service';
import { OPENAI_CLIENT } from './openai-client.provider';

export interface WebSearchPlace {
  name: string;
  address: string;
  rating: string;
  priceRange: string;
  description: string;
  website: string;
}

export function cleanCitations(value: string | undefined | null): string {
  return (value || '').replace(/ cite.*/g, '').trim();
}

interface CachedLocation {
  location: string;
  timestamp: number;
}

const LOCATION_CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class WebSearchService {
  private readonly logger = new Logger(WebSearchService.name);
  private readonly locationCache = new Map<string, CachedLocation>();

  constructor(
    @Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
    private readonly gamesService: GamesService,
  ) {}

  async resolveLocation(inputData: Record<string, unknown>): Promise<string | null> {
    let location = inputData.gameLocation as string | undefined;
    const gameId = inputData.gameId as string | undefined;

    if (gameId) {
      const cached = this.locationCache.get(gameId);
      if (cached && Date.now() - cached.timestamp < LOCATION_CACHE_TTL_MS) {
        this.logger.log(`Cache hit for game ${gameId}: ${cached.location}`);
        return cached.location;
      }

      this.logger.log(`Looking up game ${gameId} for location`);
      const game = await this.gamesService.findOne(gameId);
      if (game) {
        location = `${game.city}, ${game.state}`;
        this.logger.log(`Found game location: ${location}`);
        this.locationCache.set(gameId, { location, timestamp: Date.now() });
      }
    }

    return location || null;
  }

  async searchPlaces(searchPrompt: string): Promise<WebSearchPlace[]> {
    const response = await this.openai.responses.create({
      model: 'gpt-5-mini',
      tools: [{ type: 'web_search', search_context_size: 'low' } as any],
      store: false,
      input: searchPrompt,
    });

    const result = JSON.parse(response.output_text);
    const places = result.places || [];

    return places.map((p: any) => ({
      name: cleanCitations(p.name),
      address: cleanCitations(p.address),
      rating: cleanCitations(p.rating),
      priceRange: cleanCitations(p.priceRange),
      description: cleanCitations(p.description),
      website: cleanCitations(p.website),
    }));
  }
}
