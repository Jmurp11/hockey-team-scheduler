import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../supabase';
import { SearchUtilsService } from './search-utils.service';
import {
  EmailVerificationService,
  STORE_CONFIDENCE_THRESHOLD,
} from './email-verification.service';
import { eqTerm, ilikeContainsTerm } from '../../common/postgrest-filter.util';

export interface ManagerRecord {
  id?: number;
  name: string;
  email: string;
  phone: string;
  team: string;
  confidence?: number | null;
  verified_at?: string | null;
  created_at?: string | null;
  sourceUrl?: string | null;
}

export interface ManagerSearchResult {
  matchType: 'exact' | 'fuzzy' | 'none';
  searchTerm: string;
  matchedTerm?: string;
}

/** A discovered contact ready to persist, carrying its verification metadata. */
export interface DiscoveredManager {
  name: string;
  email: string;
  phone: string;
  team: string;
  sourceUrl?: string;
  confidence?: number;
}

// Columns selected whenever we return a contact so callers can rank by quality/recency.
const MANAGER_COLUMNS = 'id, name, email, phone, team, confidence, verified_at, created_at, sourceUrl';

@Injectable()
export class ManagerSearchService {
  private readonly logger = new Logger(ManagerSearchService.name);

  constructor(
    private readonly searchUtils: SearchUtilsService,
    private readonly emailVerification: EmailVerificationService,
  ) {}

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

    // Parameterized filter terms (improvements.md #8): values are escaped so a
    // term containing PostgREST syntax (`,` `.` `(` `)`) can't break out of the
    // predicate.
    const orFilter = expandedTerms
      .map((t) => ilikeContainsTerm('team', t))
      .join(',');

    const { data: matches, error: matchError } = await supabase
      .from('managers')
      .select(MANAGER_COLUMNS)
      .or(orFilter)
      // Best-quality, freshest contact first (improvements.md #16) — no longer
      // locked to whichever row happened to be inserted first.
      .order('confidence', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
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
      return { managers: matches as ManagerRecord[], searchResult };
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

  /**
   * Resolves a team primary key (a `rankings.id`) to its team name. Used by the
   * email agent so a supplied team ID is looked up correctly instead of doing an
   * `ilike '%<number>%'` on the manager-name column (improvements.md #17). In
   * this schema a "team" is a `rankings` row (many-to-one to `associations`).
   */
  async getTeamNameById(teamId: number): Promise<string | null> {
    const { data, error } = await supabase
      .from('rankings')
      .select('team_name')
      .eq('id', teamId)
      .maybeSingle();

    if (error || !data) {
      this.logger.warn(`No rankings row found for team id ${teamId}`);
      return null;
    }
    return (data as { team_name: string | null }).team_name ?? null;
  }

  /** Corroborating signal for discovery confidence: does this team exist in rankings? */
  async teamExistsInRankings(teamName: string): Promise<boolean> {
    const term = teamName?.trim();
    if (!term) {
      return false;
    }
    const { data, error } = await supabase
      .from('rankings')
      .select('id')
      .ilike('team_name', `%${term}%`)
      .limit(1);
    return !error && !!data && data.length > 0;
  }

  /**
   * Returns true if the given email belongs to a manager contact already known
   * to the platform (i.e. previously discovered and saved). Used to gate
   * outbound email so the AI can only send to discovered contacts, not to
   * arbitrary attacker-supplied addresses.
   */
  async isKnownManagerEmail(email: string): Promise<boolean> {
    const normalized = email?.trim();
    if (!normalized) {
      return false;
    }

    const { data, error } = await supabase
      .from('managers')
      .select('id')
      .ilike('email', normalized)
      .limit(1);

    return !error && !!data && data.length > 0;
  }

  /**
   * Persists web-search-discovered contacts, but only those that clear
   * verification (improvements.md #14). Each contact is stamped with its
   * confidence and `verified_at`. If a matching contact already exists it is
   * refreshed when the new hit is more confident or the stored one is stale,
   * rather than being permanently locked to the first hit (improvements.md #16).
   */
  async saveWebSearchResults(managers: DiscoveredManager[]): Promise<number> {
    const results = await Promise.allSettled(
      managers.map(async (manager) => {
        const confidence = manager.confidence ?? 0;
        if (confidence < STORE_CONFIDENCE_THRESHOLD) {
          // Unverified / low-confidence contacts are surfaced to the user but
          // never persisted as fact.
          return false;
        }

        const nowIso = new Date().toISOString();

        // Dedup on email OR (name + team). Parameterized so scraped values can't
        // inject PostgREST filter syntax (improvements.md #8).
        const dedupFilter = [
          eqTerm('email', manager.email),
          `and(${ilikeContainsTerm('name', manager.name)},${ilikeContainsTerm('team', manager.team)})`,
        ].join(',');

        const { data: existing } = await supabase
          .from('managers')
          .select('id, confidence, verified_at')
          .or(dedupFilter)
          .limit(1)
          .maybeSingle();

        if (existing) {
          const existingConfidence = (existing as { confidence: number | null }).confidence ?? 0;
          const existingVerifiedAt = (existing as { verified_at: string | null }).verified_at;
          const shouldRefresh =
            confidence > existingConfidence ||
            this.emailVerification.isStale(existingVerifiedAt);

          if (!shouldRefresh) {
            this.logger.log(
              `Manager "${manager.name}" already current, skipping refresh`,
            );
            return false;
          }

          const { error: updateError } = await supabase
            .from('managers')
            .update({
              email: manager.email,
              phone: manager.phone,
              sourceUrl: manager.sourceUrl,
              confidence,
              verified_at: nowIso,
            })
            .eq('id', (existing as { id: number }).id);

          if (updateError) {
            this.logger.warn(
              `Failed to refresh manager "${manager.name}":`,
              updateError,
            );
            return false;
          }
          this.logger.log(`Refreshed manager "${manager.name}" (confidence ${confidence})`);
          return true;
        }

        const { error: insertError } = await supabase.from('managers').insert({
          name: manager.name,
          email: manager.email,
          phone: manager.phone,
          team: manager.team,
          sourceUrl: manager.sourceUrl,
          confidence,
          verified_at: nowIso,
        });

        if (insertError) {
          this.logger.warn(
            `Failed to save manager "${manager.name}" to database:`,
            insertError,
          );
          return false;
        }

        this.logger.log(
          `Saved manager "${manager.name}" to database for team "${manager.team}" (confidence ${confidence})`,
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
      .map((k) => ilikeContainsTerm('team', k))
      .join(',');

    const { data, error } = await supabase
      .from('managers')
      .select(MANAGER_COLUMNS)
      .or(orFilter)
      .order('confidence', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(5);

    this.logger.log(
      `Keyword batch search [${eligibleKeywords.join(', ')}]: found ${data?.length || 0} results`,
    );

    if (!error && data && data.length > 0) {
      this.logger.log(
        `Found manager(s) matching keywords (fuzzy match): ${data[0].team}`,
      );
      return data as ManagerRecord[];
    }

    return [];
  }
}
