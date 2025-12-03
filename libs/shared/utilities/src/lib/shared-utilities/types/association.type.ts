import { League } from './league.type';
import { Team } from './team.type';

export interface Association {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
}

export interface AssociationFull extends Association {
  leagues: League[];
  teams: Team[];
}
