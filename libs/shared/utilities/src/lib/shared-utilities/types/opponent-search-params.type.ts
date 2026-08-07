import { SelectOption } from '@hockey-team-scheduler/shared-domain';

export interface OpponentSearchParams {
  association: SelectOption<number> | null;
  distance: number;
  rating: [number, number];
  girlsOnly: boolean;
  changeAssociation: boolean;
}
