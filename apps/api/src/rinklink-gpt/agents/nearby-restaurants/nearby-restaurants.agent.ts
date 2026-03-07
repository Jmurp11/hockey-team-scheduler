import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BaseAgent, AgentContext, AgentResult } from '../../shared/base-agent';
import { AgentRegistryService } from '../../shared/agent-registry.service';
import { AgentTracingService } from '../../shared/agent-tracing.service';
import { WebSearchService } from '../../shared/web-search.service';
import { ToolDefinition } from '../../rinklink-gpt.types';
import { getNearbyRestaurantsPrompt } from './nearby-restaurants.prompt';

@Injectable()
export class NearbyRestaurantsAgent extends BaseAgent implements OnModuleInit {
  readonly agentName = 'nearby_restaurants';
  readonly description =
    'Finds family-friendly restaurants near game locations using web search';

  private readonly logger = new Logger(NearbyRestaurantsAgent.name);

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
    return getNearbyRestaurantsPrompt(context);
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

    return this.searchNearbyRestaurants(location, maxResults);
  }

  private async searchNearbyRestaurants(
    location: string,
    maxResults: number,
  ): Promise<AgentResult> {
    try {
      this.logger.log(
        `Starting web search for restaurants near ${location}`,
      );

      const places = await this.webSearchService.searchPlaces(
        `You are a local recommendations assistant for hockey families traveling to games.

Search for the best restaurants near ${location}.

For restaurants:
- Look for family-friendly options
- Consider places with quick service (good for before/after games)
- Include a mix of casual and sit-down options

Return a JSON object with an array of places:

{
  "places": [
    {
      "name": "Place Name",
      "address": "123 Main St, City, State",
      "rating": "4.5",
      "priceRange": "$$",
      "distanceFromRink": "0.3 miles",
      "description": "Brief description of why this is a good choice",
      "website": "https://..."
    }
  ]
}

IMPORTANT: Include the approximate distance from the rink/arena for each restaurant in the "distanceFromRink" field (e.g., "0.5 miles", "2.3 miles").

Return up to ${maxResults} results. If nothing is found, return: { "places": [] }`,
      );

      if (places.length === 0) {
        return {
          success: true,
          formattedResponse: `I searched for restaurants near ${location} but couldn't find specific recommendations. Try searching on Google Maps for "restaurants near ${location}".`,
          data: {
            places: [],
            location,
            placeType: 'restaurant',
          },
        };
      }

      const lines = places.map(
        (p, i) =>
          `${i + 1}. **${p.name}** — ${p.address}\n   ${p.rating ? `Rating: ${p.rating}` : ''}${p.priceRange ? ` | ${p.priceRange}` : ''}${(p as any).distanceFromRink ? ` | ${(p as any).distanceFromRink}` : ''}\n   ${p.description}${p.website ? `\n   ${p.website}` : ''}`,
      );

      return {
        success: true,
        formattedResponse: `Here are some family-friendly restaurants near ${location}:\n\n${lines.join('\n\n')}`,
        data: {
          places,
          totalCount: places.length,
          location,
          placeType: 'restaurant',
        },
      };
    } catch (error) {
      this.logger.error('Error in web search for restaurants:', error);
      return {
        success: true,
        data: {
          message: `I encountered an issue searching for restaurants near ${location}. Try searching on Google Maps for better results.`,
          places: [],
          location,
          placeType: 'restaurant',
        },
      };
    }
  }
}
