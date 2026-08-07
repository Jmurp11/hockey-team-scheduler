import { Injectable, Logger } from '@nestjs/common';
import { supabase } from '../../supabase';

export interface UserContext {
  userId: string;
  userDbId: string;
  teamId?: number;
  teamName?: string;
  age?: string;
  associationId?: number;
  associationName?: string;
  city?: string;
  state?: string;
  email?: string;
  phone?: string;
  userName?: string;
}

@Injectable()
export class UserContextService {
  private readonly logger = new Logger(UserContextService.name);

  async getUserContext(userId: string): Promise<UserContext> {
    try {
      const { data, error } = await supabase
        .from('user_profile_details')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        this.logger.warn(`Could not fetch user context for ${userId}:`, error);
        return {
          userId,
          userDbId: userId,
        };
      }

      this.logger.log(`User context loaded - user_id: ${data.user_id}, name: ${data.display_name}, team: ${data.team_name}`);

      return {
        userId,
        userDbId: data.user_id || userId,
        teamId: data.team_id,
        teamName: data.team_name,
        age: data.age,
        associationId: data.association_id,
        associationName: data.association_name,
        city: data.city,
        state: data.state,
        email: data.email,
        phone: data.phone,
        userName: data.display_name,
      };
    } catch (error) {
      this.logger.error('Error in getUserContext:', error);
      return {
        userId,
        userDbId: userId,
      };
    }
  }
}
