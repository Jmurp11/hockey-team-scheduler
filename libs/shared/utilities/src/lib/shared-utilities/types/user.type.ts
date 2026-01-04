export interface User {
  id: string;
  name: string;
  email: string;
  association: string;
  team: string;
  age: string;
  phone: string;
}

export interface UpdateUser extends User {
  password: string;
}

export type AssociationMemberRole = 'ADMIN' | 'MANAGER' | null;

export interface UserProfile {
  idx: number;
  id: number;
  display_name: string;
  association_name: string;
  team_name: string;
  user_id: string; // UUID
  age: string; // e.g. "16u"
  association_id: number;
  team_id: number;
  team_rating: number;
  email: string;
  role?: AssociationMemberRole;
}
