export interface Profile {
  user_id: string;
  display_name: string;
  email: string;
  age: string[];
  association_name: string;
  team_name: string[];
  association: { label: string; value: any };
  team: { label: string; value: any };
  team_rating: number;
}
