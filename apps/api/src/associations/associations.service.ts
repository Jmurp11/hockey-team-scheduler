import { Injectable } from '@nestjs/common';
import { supabase } from '../supabase';
import { AssociationFull } from '../types';
@Injectable()
export class AssociationsService {
  async getAssociation(id: number): Promise<AssociationFull | null> {
    let { data: associationsfull, error } = await supabase
      .from('associationsfull')
      .select('*')
      .eq('id', `${id}`);
    if (error) {
      console.error('Error fetching association:', error);
      throw new Error('Failed to fetch association data');
    }

    if (!associationsfull || associationsfull.length === 0) {
      console.warn(`No association found with id: ${id}`);
      return null;
    }

    associationsfull = associationsfull.map((assoc) => ({
      ...assoc,
      leagues: assoc.leagues.map((league) => JSON.parse(league)),
      teams: assoc.teams.map((team) => JSON.parse(team)),
    }));

    return associationsfull[0] as AssociationFull;
  }

  async getAssociations(
    city?: string,
    name?: string,
    state?: string,
  ): Promise<AssociationFull[]> {
    const filters = [
      { field: 'name', value: name },
      { field: 'city', value: city },
      { field: 'state', value: state },
    ];

    let query = supabase.from('associationsfull').select('*');

    // Apply filters dynamically
    filters.forEach(({ field, value }) => {
      if (value) {
        query = query.ilike(field, `%${value}%`);
      }
    });

    console.log('Executing query with filters:', filters);
    const { data: associationsfull, error } = await query;

    if (error) {
      console.error('Error fetching associations:', error);
      throw new Error('Failed to fetch associations data');
    }

    if (!associationsfull || associationsfull.length === 0) {
      console.warn('No associations found');
      return [];
    }

    const processedAssociations = associationsfull.map((assoc) => ({
      ...assoc,
      leagues: assoc.leagues.map((league) => JSON.parse(league)),
      teams: assoc.teams.map((team) => JSON.parse(team)),
    }));

    return processedAssociations as AssociationFull[];
  }

  async getAssociationsByState(state: string): Promise<AssociationFull[]> {
    let { data: associationsfull, error } = await supabase
      .from('associationsfull')
      .select('*')
      .ilike('state', `%${state}%`);
    if (error) {
      console.error('Error fetching associations:', error);
      throw new Error('Failed to fetch associations data');
    }
    if (!associationsfull || associationsfull.length === 0) {
      console.warn('No associations found');
      return [];
    }

    associationsfull = associationsfull.map((assoc) => ({
      ...assoc,
      leagues: assoc.leagues.map((league) => JSON.parse(league)),
      teams: assoc.teams.map((team) => JSON.parse(team)),
    }));

    return associationsfull as AssociationFull[];
  }

  async getAssociationAdminData(associationId: string) {
    // Single query to get association with subscription, members, and invitations
    // Note: subscriptions references associations via 'association' column (reverse FK)
    const { data: association, error } = await supabase
      .from('associations')
      .select(
        `
        id,
        name,
        subscriptions:subscriptions!association(
          id,
          status,
          total_seats,
          seats_in_use,
          current_period_end,
          billing_email,
          association
        ),
        association_members(
          id,
          user_id,
          association,
          role,
          status,
          created_at,
          app_users!association_members_user_id_fkey(
            name,
            email,
            rankings!app_users_team_fkey(team_name)
          )
        ),
        invitations(
          id,
          association,
          invited_email,
          subscription_id,
          role,
          status,
          expires_at,
          created_at
        )
      `,
      )
      .eq('id', associationId)
      .single();

    if (error || !association) {
      console.error('Error fetching association admin data:', error);
      throw new Error('Association not found');
    }
    // Find active subscription
    const activeSubscription =
      (association.subscriptions || []).find(
        (sub: any) => sub.status === 'ACTIVE',
      ) || null;

    // Transform members to include user_name and user_email, filter out REMOVED
    const transformedMembers = (association.association_members || [])
      .filter((member: any) => member.status !== 'REMOVED')
      .map((member: any) => ({
        id: member.id,
        user_id: member.user_id,
        association: member.association,
        role: member.role,
        status: member.status,
        created_at: member.created_at,
        user_name: member.app_users?.name || null,
        user_email: member.app_users?.email || null,
        team_name: member.app_users?.rankings?.team_name || null,
      }));

    // Process invitations - filter for pending/expired and check expiry dates
    const now = new Date();
    const processedInvitations = (association.invitations || [])
      .filter((inv: any) => ['pending', 'expired'].includes(inv.status))
      .map((inv: any) => {
        if (inv.status === 'pending' && new Date(inv.expires_at) < now) {
          return { ...inv, status: 'expired' };
        }
        return inv;
      });

    return {
      associationId: association.id,
      associationName: association.name,
      subscription: activeSubscription,
      members: transformedMembers,
      invitations: processedInvitations,
    };
  }

  async getAssociationMembers(associationId: string) {
    const { data: members, error } = await supabase
      .from('association_members')
      .select(
        `
        id,
        user_id,
        association,
        role,
        status,
        created_at,
        users!inner(name, email)
      `,
      )
      .eq('association', associationId)
      .neq('status', 'REMOVED');

    if (error) {
      console.error('Error fetching members:', error);
      throw new Error('Failed to fetch association members');
    }

    return (members || []).map((member: any) => ({
      id: member.id,
      user_id: member.user_id,
      association: member.association,
      role: member.role,
      status: member.status,
      created_at: member.created_at,
      user_name: member.users?.name || null,
      user_email: member.users?.email || null,
    }));
  }

  async getAssociationInvitations(associationId: string) {
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select(
        'id, subscription_id, association, email, role, status, expires_at, created_at',
      )
      .eq('association', associationId);

    if (error) {
      console.error('Error fetching invitations:', error);
      throw new Error('Failed to fetch invitations');
    }

    return invitations || [];
  }
}
