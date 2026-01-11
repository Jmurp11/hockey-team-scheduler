export interface AssociationMember {
  id: string;
  user_id: string;
  association: string;
  role: 'ADMIN' | 'MANAGER';
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REMOVED';
  created_at: string;
  // Joined fields
  user_name?: string;
  user_email?: string;
  team_name?: string;
}

export interface AssociationInvitation {
  id: string;
  subscription_id: string;
  association: string;
  invited_email: string;
  role: 'ADMIN' | 'MANAGER';
  status: 'pending' | 'ACCEPTED' | 'expired' | 'canceled';
  expires_at: string;
  created_at: string;
}

export interface SubscriptionInfo {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELED';
  total_seats: number;
  seats_in_use: number;
  current_period_end?: string;
  billing_email?: string;
}

export interface AssociationAdminData {
  associationId: string;
  associationName: string;
  subscription: SubscriptionInfo | null;
  members: AssociationMember[];
  invitations: AssociationInvitation[];
}
