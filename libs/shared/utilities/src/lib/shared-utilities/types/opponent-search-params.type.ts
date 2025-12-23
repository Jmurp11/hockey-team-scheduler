import { SelectOption } from './select-option.type';

export interface OpponentSearchParams {
  association: SelectOption<number> | null;
  distance: number;
  rating: [number, number];
  girlsOnly: boolean;
  changeAssociation: boolean;
}
