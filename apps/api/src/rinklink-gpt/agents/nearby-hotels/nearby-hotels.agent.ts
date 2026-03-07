import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BaseAgent, AgentContext, AgentResult } from '../../shared/base-agent';
import { AgentRegistryService } from '../../shared/agent-registry.service';
import { AgentTracingService } from '../../shared/agent-tracing.service';
import { WebSearchService } from '../../shared/web-search.service';
import { ToolDefinition } from '../../rinklink-gpt.types';
import { getNearbyHotelsPrompt } from './nearby-hotels.prompt';

@Injectable()
export class NearbyHotelsAgent extends BaseAgent implements OnModuleInit {
  readonly agentName = 'nearby_hotels';
  readonly description =
    'Finds hotels near game locations using web search, considering team-friendly amenities';

  private readonly logger = new Logger(NearbyHotelsAgent.name);

  constructor(
    private readonly webSearchService: WebSearchService,
    private readonly registry: AgentRegistryService,
    private readonly tracing: AgentTracingService,
  ) {
    super();
  }

  onModuleInit() {
    this.registry.register(this.agentName, this);
  }

  getTools(): ToolDefinition[] {
    return [];
  }

  getSystemPrompt(context: AgentContext): string {
    return getNearbyHotelsPrompt(context);
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const inputData = context.inputData || {};
    const maxResults = (inputData.maxResults as number) || 5;

    const location = await this.webSearchService.resolveLocation(inputData);

    if (!location) {
      return {
        success: false,
        error:
          'Could not determine location. Please specify a game or location.',
        needsMoreInfo: true,
        clarificationQuestion:
          'What location should I search near? You can provide a city/state or mention a specific game.',
      };
    }

    return this.searchNearbyHotels(location, maxResults);
  }

  private async searchNearbyHotels(
    location: string,
    maxResults: number,
  ): Promise<AgentResult> {
    try {
      this.logger.log(`Starting web search for hotels near ${location}`);

      const places = await this.webSearchService.searchPlaces(
        `You are a local recommendations assistant for hockey families traveling to games.

Search for the best hotels near ${location}.

For hotels:
- Look for hotels near ice rinks or sports complexes
- Consider places that offer team rates or have room for equipment
- Include options with pools (kids love them after games)

Return a JSON object with an array of places:

{
  "places": [
    {
      "name": "Place Name",
      "address": "123 Main St, City, State",
      "rating": "4.5",
      "priceRange": "$$",
      "distanceFromRink": "1.2 miles",
      "description": "Brief description of why this is a good choice",
      "website": "https://..."
    }
  ]
}

IMPORTANT: Include the approximate distance from the rink/arena for each hotel in the "distanceFromRink" field (e.g., "0.5 miles", "2.3 miles").

Return up to ${maxResults} results. If nothing is found, return: { "places": [] }`,
      );

      if (places.length === 0) {
        return {
          success: true,
          formattedResponse: `I searched for hotels near ${location} but couldn't find specific recommendations. Try searching on Google Maps for "hotels near ${location}".`,
          data: {
            places: [],
            location,
            placeType: 'hotel',
          },
        };
      }

      const lines = places.map(
        (p, i) =>
          `${i + 1}. **${p.name}** — ${p.address}\n   ${p.rating ? `Rating: ${p.rating}` : ''}${p.priceRange ? ` | ${p.priceRange}` : ''}${(p as any).distanceFromRink ? ` | ${(p as any).distanceFromRink}` : ''}\n   ${p.description}${p.website ? `\n   ${p.website}` : ''}`,
      );

      return {
        success: true,
        formattedResponse: `Here are some hotels near ${location}:\n\n${lines.join('\n\n')}`,
        data: {
          places,
          totalCount: places.length,
          location,
          placeType: 'hotel',
        },
      };
    } catch (error) {
      this.logger.error('Error in web search for hotels:', error);
      return {
        success: true,
        data: {
          message: `I encountered an issue searching for hotels near ${location}. Try searching on Google Maps for better results.`,
          places: [],
          location,
          placeType: 'hotel',
        },
      };
    }
  }
}
