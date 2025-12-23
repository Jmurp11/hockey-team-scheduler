import { SelectOption } from './select-option.type';

export interface Profile {
  user_id: string;
  display_name: string;
  email: string;
  age: string;
  association_name: string;
  team_name: string;
  association: SelectOption<number>;
  team: SelectOption<number>;
  team_rating: number;
}
