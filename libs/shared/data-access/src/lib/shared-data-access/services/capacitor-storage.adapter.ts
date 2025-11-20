import { Preferences } from '@capacitor/preferences';
import type { SupabaseClientOptions } from '@supabase/supabase-js';

/**
 * Type for the storage adapter required by Supabase
 */
type SupabaseStorage = Required<SupabaseClientOptions<'public'>>['auth']['storage'];

/**
 * Custom storage adapter for Supabase that uses Capacitor's Preferences API
 * This ensures session persistence works correctly in Capacitor mobile apps on iOS and Android
 * 
 * Unlike localStorage, Capacitor Preferences is NOT subject to OS eviction when storage is low,
 * making it suitable for storing authentication tokens and sessions.
 * 
 * @see https://capacitorjs.com/docs/guides/storage
 * @see https://capacitorjs.com/docs/apis/preferences
 */
export const capacitorStorageAdapter: SupabaseStorage = {
  async getItem(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  },
  async setItem(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  },
  async removeItem(key: string): Promise<void> {
    await Preferences.remove({ key });
  },
};
