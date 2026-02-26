import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../supabase';
import { SearchUtilsService } from './search-utils.service';

export interface ManagerRecord {
  id?: number;
  name: string;
  email: string;
  phone: string;
  team: string;
}

export interface ManagerSearchResult {
  matchType: 'exact' | 'fuzzy' | 'none';
  searchTerm: string;
  matchedTerm?: string;
}

@Injectable()
export class ManagerSearchService {
  private readonly logger = new Logger(ManagerSearchService.name);

  constructor(private readonly searchUtils: SearchUtilsService) {}

  async searchByTeam(
    searchTerm: string,
  ): Promise<{ managers: ManagerRecord[]; searchResult: ManagerSearchResult }> {
    const searchResult: ManagerSearchResult = {
      matchType: 'none',
      searchTerm,
    };

    const expandedTerms = this.searchUtils.expandAbbreviations(searchTerm);
    this.logger.log(
      `Manager search: "${searchTerm}" expanded to: ${JSON.stringify(expandedTerms)}`,
    );

    const orFilter = expandedTerms
      .map((t) => `team.ilike.%${t}%`)
      .join(',');

    const { data: matches, error: matchError } = await supabase
      .from('managers')
      .select('id, name, email, phone, team')
      .or(orFilter)
      .limit(5);

    this.logger.log(
      `Searching managers with expanded terms [${expandedTerms.join(', ')}]: found ${matches?.length || 0} results`,
    );

    if (!matchError && matches && matches.length > 0) {
      const foundTeamName = matches[0].team?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      const isExact =
        foundTeamName.includes(searchLower) ||
        searchLower.includes(foundTeamName);

      searchResult.matchType = isExact ? 'exact' : 'fuzzy';
      searchResult.matchedTerm = expandedTerms[0];

      this.logger.log(
        `Found ${isExact ? 'exact' : 'fuzzy'} match in managers table: ${matches[0].team}`,
      );
      return { managers: matches, searchResult };
    }

    const managers = await this.keywordFallbackSearch(
      searchTerm,
      expandedTerms,
    );

    if (managers.length > 0) {
      searchResult.matchType = 'fuzzy';
    }

    return { managers, searchResult };
  }

  async saveWebSearchResults(
    managers: Array<{
      name: string;
      email: string;
      phone: string;
      team: string;
      sourceUrl?: string;
    }>,
  ): Promise<number> {
    const results = await Promise.allSettled(
      managers.map(async (manager) => {
        const { data: existingManager } = await supabase
          .from('managers')
          .select('id')
          .or(
            `email.eq.${manager.email},and(name.ilike.%${manager.name}%,team.ilike.%${manager.team}%)`,
          )
          .limit(1)
          .single();

        if (existingManager) {
          this.logger.log(
            `Manager "${manager.name}" already exists in database, skipping insert`,
          );
          return false;
        }

        const { error: insertError } = await supabase.from('managers').insert({
          name: manager.name,
          email: manager.email,
          phone: manager.phone,
          team: manager.team,
          source_url: manager.sourceUrl,
        });

        if (insertError) {
          this.logger.warn(
            `Failed to save manager "${manager.name}" to database:`,
            insertError,
          );
          return false;
        }

        this.logger.log(
          `Saved manager "${manager.name}" to database for team "${manager.team}"`,
        );
        return true;
      }),
    );

    return results.filter(
      (r) => r.status === 'fulfilled' && r.value === true,
    ).length;
  }

  private async keywordFallbackSearch(
    searchTerm: string,
    expandedTerms: string[],
  ): Promise<ManagerRecord[]> {
    const ignoreWords = [
      'the',
      'team',
      'hockey',
      'youth',
      'ice',
      'club',
      'association',
      'for',
      'and',
    ];
    const allKeywords = new Set<string>();

    const originalWords = searchTerm.toLowerCase().split(/[\s-]+/);
    for (const word of originalWords) {
      if (word.length >= 2 && !ignoreWords.includes(word)) {
        allKeywords.add(word);
        if (this.searchUtils.stateAbbreviations[word]) {
          const expandedState = this.searchUtils.stateAbbreviations[word];
          expandedState.split(/\s+/).forEach((w) => allKeywords.add(w));
        }
      }
    }

    for (const term of expandedTerms) {
      const keywords = term
        .toLowerCase()
        .split(/[\s-]+/)
        .filter(
          (word) => word.length >= 2 && !ignoreWords.includes(word),
        );
      keywords.forEach((k) => allKeywords.add(k));
    }

    const keywordArray = Array.from(allKeywords);
    this.logger.log(
      `Searching managers with keywords: ${keywordArray.join(', ')}`,
    );

    if (keywordArray.length === 0) {
      return [];
    }

    const sortedKeywords = keywordArray.sort((a, b) => b.length - a.length);

    const eligibleKeywords = sortedKeywords.filter(
      (keyword) =>
        keyword.length >= 3 ||
        this.searchUtils.stateAbbreviations[keyword],
    );

    if (eligibleKeywords.length === 0) {
      return [];
    }

    const orFilter = eligibleKeywords
      .map((k) => `team.ilike.%${k}%`)
      .join(',');

    const { data, error } = await supabase
      .from('managers')
      .select('id, name, email, phone, team')
      .or(orFilter)
      .limit(5);

    this.logger.log(
      `Keyword batch search [${eligibleKeywords.join(', ')}]: found ${data?.length || 0} results`,
    );

    if (!error && data && data.length > 0) {
      this.logger.log(
        `Found manager(s) matching keywords (fuzzy match): ${data[0].team}`,
      );
      return data;
    }

    return [];
  }
}
