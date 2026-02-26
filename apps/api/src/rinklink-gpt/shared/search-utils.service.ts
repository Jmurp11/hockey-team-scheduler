import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../supabase';

@Injectable()
export class SearchUtilsService {
  private readonly logger = new Logger(SearchUtilsService.name);

  private readonly ageGroups: string[][] = [
    ['9u', '10u'],
    ['11u', '12u'],
    ['13u', '14u'],
    ['15u', '16u'],
  ];

  getCompatibleAges(age: string): string[] {
    const normalizedAge = age.toLowerCase().replace(/\s+/g, '');
    const group = this.ageGroups.find((g) => g.includes(normalizedAge));
    return group || [normalizedAge];
  }

  private buildAgePattern(compatibleAges: string[]): string {
    // Builds a pattern like "%(9U%|%(10U%" for use with ilike/or filters
    // Since Supabase doesn't support regex in .ilike, we'll use this for post-filtering
    return compatibleAges.join('|');
  }

  private teamMatchesAge(teamName: string, compatibleAges: string[]): boolean {
    const nameAge = teamName.match(/(\d+U)/i)?.[1]?.toLowerCase();
    if (!nameAge) return false;
    return compatibleAges.includes(nameAge);
  }

  readonly stateAbbreviations: Record<string, string> = {
    'nj': 'new jersey',
    'ny': 'new york',
    'pa': 'pennsylvania',
    'ct': 'connecticut',
    'ma': 'massachusetts',
    'ri': 'rhode island',
    'nh': 'new hampshire',
    'vt': 'vermont',
    'me': 'maine',
    'md': 'maryland',
    'va': 'virginia',
    'dc': 'washington dc',
    'de': 'delaware',
    'oh': 'ohio',
    'mi': 'michigan',
    'il': 'illinois',
    'in': 'indiana',
    'wi': 'wisconsin',
    'mn': 'minnesota',
    'ia': 'iowa',
    'mo': 'missouri',
    'nd': 'north dakota',
    'sd': 'south dakota',
    'ne': 'nebraska',
    'ks': 'kansas',
    'tx': 'texas',
    'ok': 'oklahoma',
    'ar': 'arkansas',
    'la': 'louisiana',
    'ms': 'mississippi',
    'al': 'alabama',
    'tn': 'tennessee',
    'ky': 'kentucky',
    'wv': 'west virginia',
    'nc': 'north carolina',
    'sc': 'south carolina',
    'ga': 'georgia',
    'fl': 'florida',
    'co': 'colorado',
    'ut': 'utah',
    'az': 'arizona',
    'nm': 'new mexico',
    'nv': 'nevada',
    'ca': 'california',
    'or': 'oregon',
    'wa': 'washington',
    'id': 'idaho',
    'mt': 'montana',
    'wy': 'wyoming',
    'ak': 'alaska',
    'hi': 'hawaii',
    // Canadian provinces
    'on': 'ontario',
    'qc': 'quebec',
    'bc': 'british columbia',
    'ab': 'alberta',
    'mb': 'manitoba',
    'sk': 'saskatchewan',
    'ns': 'nova scotia',
    'nb': 'new brunswick',
    'nl': 'newfoundland',
    'pe': 'prince edward island',
    // Common hockey abbreviations
    'pee wee': 'peewee',
    'bantam': 'bantam',
    'midget': 'midget',
    'squirt': 'squirt',
    'mite': 'mite',
  };

  expandAbbreviations(search: string): string[] {
    const searchLower = search.toLowerCase();
    const words = searchLower.split(/\s+/);
    const expandedTerms = [searchLower];

    const expandedWords = words.map((word) => {
      if (this.stateAbbreviations[word]) {
        return this.stateAbbreviations[word];
      }
      return word;
    });

    const expandedSearch = expandedWords.join(' ');
    if (expandedSearch !== searchLower) {
      expandedTerms.push(expandedSearch);
    }

    return expandedTerms;
  }

  calculateTeamMatchScore(
    team: { name?: string; association?: { name?: string } },
    searchTerms: string[],
    originalSearch: string,
  ): number {
    const teamName = team.name?.toLowerCase() || '';
    const associationName = team.association?.name?.toLowerCase() || '';
    const fullName = `${teamName} ${associationName}`;
    const originalLower = originalSearch.toLowerCase();

    let score = 0;

    if (teamName === originalLower || teamName.includes(originalLower)) {
      score += 100;
    }

    for (const term of searchTerms) {
      if (teamName.includes(term)) {
        score += 50;
      }
      if (associationName.includes(term)) {
        score += 30;
      }

      const keywords = term.split(/\s+/).filter((k) => k.length > 1);
      for (const keyword of keywords) {
        if (teamName.includes(keyword)) {
          score += 10;
        }
        if (associationName.includes(keyword)) {
          score += 5;
        }
      }
    }

    const searchWords = originalLower.split(/\s+/);
    for (const word of searchWords) {
      if (word.length > 2) {
        const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
        if (wordRegex.test(fullName)) {
          score += 15;
        }
      }
    }

    return score;
  }

  async lookupOpponentInRankings(
    teamName: string,
    age?: string,
  ): Promise<{ id: number; team_name: string } | null> {
    this.logger.log(`Looking up opponent "${teamName}" in rankings table (age: ${age || 'any'})`);

    const compatibleAges = age ? this.getCompatibleAges(age) : [];
    this.logger.log(`Compatible ages: ${JSON.stringify(compatibleAges)}`);

    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedSearch = normalize(teamName);

    const expandedTerms = this.expandAbbreviations(teamName);
    this.logger.log(`Expanded search terms: ${JSON.stringify(expandedTerms)}`);

    // Helper: filter results to compatible age group, falling back to all results if none match
    const filterByAge = (results: { id: number; team_name: string }[]): { id: number; team_name: string }[] => {
      if (compatibleAges.length === 0) return results;
      const ageFiltered = results.filter((t) => this.teamMatchesAge(t.team_name, compatibleAges));
      if (ageFiltered.length > 0) return ageFiltered;
      this.logger.warn(`No results matched compatible ages ${JSON.stringify(compatibleAges)}, falling back to unfiltered results`);
      return results;
    };

    // Try exact match on team_name (case-insensitive), then filter by age
    for (const term of expandedTerms) {
      const { data: exactData, error: exactError } = await supabase
        .from('rankings')
        .select('id, team_name')
        .ilike('team_name', term)
        .limit(5);

      if (!exactError && exactData && exactData.length > 0) {
        const filtered = filterByAge(exactData);
        this.logger.log(`Found exact match (after age filter): ${JSON.stringify(filtered[0])}`);
        return filtered[0];
      }
    }

    // Extract base team name (without age/level) for partial search
    const baseNameMatch = teamName.match(/^(.+?)\s*\d+U/i);
    const baseName = baseNameMatch ? baseNameMatch[1].trim() : teamName;
    this.logger.log(`Base team name for search: "${baseName}"`);

    const { data, error } = await supabase
      .from('rankings')
      .select('id, team_name')
      .ilike('team_name', `%${baseName}%`)
      .limit(50);

    this.logger.log(`Partial search for "${baseName}" returned ${data?.length || 0} results`);

    if (!error && data && data.length > 0) {
      // Filter by compatible age group first
      const ageFilteredData = filterByAge(data);
      this.logger.log(`After age filtering: ${ageFilteredData.length} results`);

      if (ageFilteredData.length === 1) {
        this.logger.log(`Single match found: ${JSON.stringify(ageFilteredData[0])}`);
        return ageFilteredData[0];
      }

      const scoredResults = ageFilteredData.map((t) => {
        const normalizedName = normalize(t.team_name);
        let score = 0;

        if (normalizedName === normalizedSearch) {
          score = 1000;
        } else {
          const searchWords = normalizedSearch.split(' ');
          const nameWords = normalizedName.split(' ');
          const matchedWords = searchWords.filter((w) => nameWords.includes(w));
          score = (matchedWords.length / searchWords.length) * 100;

          const searchAge = teamName.match(/(\d+U)/i)?.[1]?.toLowerCase();
          const nameAge = t.team_name.match(/(\d+U)/i)?.[1]?.toLowerCase();
          if (searchAge && nameAge && searchAge === nameAge) {
            score += 50;
          }

          const searchLevel = teamName.match(/\b(AAA|AA|A|B|Rec)\b/i)?.[1]?.toLowerCase();
          const nameLevel = t.team_name.match(/\b(AAA|AA|A|B|Rec)\b/i)?.[1]?.toLowerCase();
          if (searchLevel && nameLevel && searchLevel === nameLevel) {
            score += 30;
          }
        }

        return { ...t, score };
      });

      scoredResults.sort((a, b) => b.score - a.score);
      this.logger.log(`Top 3 scored results: ${JSON.stringify(scoredResults.slice(0, 3).map(r => ({ id: r.id, team_name: r.team_name, score: r.score })))}`);

      const bestMatch = scoredResults[0];
      this.logger.log(`Best match (score: ${bestMatch.score}): ${JSON.stringify({ id: bestMatch.id, team_name: bestMatch.team_name })}`);
      return { id: bestMatch.id, team_name: bestMatch.team_name };
    }

    // Keyword-based search fallback
    const ignoreWords = ['the', 'team', 'hockey', 'youth', 'ice', 'club', 'association'];
    const keywords = teamName
      .toLowerCase()
      .split(/[\s-]+/)
      .filter((word) => word.length > 2 && !ignoreWords.includes(word));

    this.logger.log(`Trying keyword search with: ${JSON.stringify(keywords)}`);

    for (const keyword of keywords) {
      const { data: keywordData, error: keywordError } = await supabase
        .from('rankings')
        .select('id, team_name')
        .ilike('team_name', `%${keyword}%`)
        .limit(20);

      if (!keywordError && keywordData && keywordData.length > 0) {
        const filtered = filterByAge(keywordData);
        this.logger.log(`Keyword "${keyword}" found ${keywordData.length} results, after age filter: ${filtered.length}, returning: ${JSON.stringify(filtered[0])}`);
        return filtered[0];
      }
    }

    this.logger.warn(`No match found for opponent "${teamName}"`);
    return null;
  }
}
