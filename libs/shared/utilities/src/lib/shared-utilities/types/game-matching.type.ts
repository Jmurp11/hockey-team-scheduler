import { EmailDraft } from '@hockey-team-scheduler/shared-data-access';

/**
 * Scoring breakdown for a potential opponent match.
 * All scores are 0-100 scale.
 */
export interface MatchScores {
  ratingCloseness: number;
  distance: number;
  scheduleCompatibility: number;
  overall: number;
}

/**
 * Team data included in an opponent match.
 */
export interface MatchTeam {
  id: number;
  name: string;
  age: string;
  rating: number;
  record: string;
  association: {
    name: string;
    city: string;
    state: string;
  };
}

/**
 * Manager contact status for an opponent match.
 */
export type ManagerStatus = 'found' | 'not-found' | 'manual-contact';

/**
 * A ranked opponent match with scoring, manager info, and email draft.
 */
export interface OpponentMatch {
  rank: number;
  team: MatchTeam;
  distanceMiles: number;
  scores: MatchScores;
  explanation: string; // Plain English explanation of why this is a good match
  manager?: {
    name: string;
    email: string;
    phone?: string;
    team: string;
  };
  managerStatus: ManagerStatus;
  emailDraft?: EmailDraft;
  alreadyPlayed?: boolean;
}

/**
 * User team context included in match results.
 */
export interface UserTeamContext {
  id: number;
  name: string;
  rating: number;
  age: string;
}

/**
 * Complete results from the game matching assistant.
 */
export interface GameMatchResults {
  userTeam: UserTeamContext;
  dateRange: {
    start: string;
    end: string;
  };
  searchRadius: number;
  matches: OpponentMatch[];
  totalCandidatesFound: number;
}
