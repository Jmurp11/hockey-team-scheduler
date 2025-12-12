import { Injectable } from '@nestjs/common';
import { ApiKey } from './api-key.entity';
import { randomBytes } from 'crypto';
import { supabase } from '../supabase';

@Injectable()
export class ApiKeyService {
  async generate(email: string, stripe_customer_id: string): Promise<ApiKey> {
    try {
      const key = randomBytes(32).toString('hex');

      // TODO: create front end to collect this info and submit to api_users table
      const apiKey: Partial<ApiKey> = {
        api_key: key,
        email,
        is_active: true,
        stripe_customer_id,
      };

      const { data, error } = await supabase
        .from('api_users')
        .insert([apiKey])
        .select();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      return data[0] as ApiKey;
    } catch (error) {
      console.error('Unexpected error generating API key:', error);
      throw error;
    }
  }

  async validate(key: string): Promise<boolean> {
    try {
      const apiKeys = await this.getApiKeys();

      return apiKeys.some(
        (apiKey) => apiKey.api_key === key && apiKey.is_active,
      );
    } catch (error) {
      console.error('Unexpected error during API key validation:', error);
      return false;
    }
  }

  async revoke(key: string): Promise<boolean> {
    const apiKeys = await this.getApiKeys();
    const apiKey = apiKeys.find((apiKey) => apiKey.api_key === key);
    if (apiKey) {
      apiKey.is_active = false;
      return true;
    }
    return false;
  }

  async getApiKeys(): Promise<ApiKey[]> {
    try {
      const { data: apiKeys, error } = await supabase
        .from('api_users')
        .select('*');

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return apiKeys;
    } catch (error) {
      console.error('Unexpected error fetching API keys:', error);
      return [];
    }
  }
}
