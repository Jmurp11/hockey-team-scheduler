export interface User {
  id: string;
  name: string;
  email: string;
  association: string;
  team: string;
  stripeCustomerId?: string;
}

export interface UpdateUser extends User{
  password: string;
}
