import { inject, Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '../config/app-config';
import { capacitorStorageAdapter } from './capacitor-storage.adapter';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private config = inject(APP_CONFIG);
  private client: SupabaseClient | null = null;
  private initializing = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Initialize immediately in constructor to avoid race conditions
    this.initializeClient();
  }

  private initializeClient(): Promise<void> {
    // If already initialized, return immediately
    if (this.client) {
      return Promise.resolve();
    }

    // If currently initializing, return the existing promise
    if (this.initializing && this.initPromise) {
      return this.initPromise;
    }

    // Start initialization
    this.initializing = true;
    this.initPromise = new Promise<void>(async (resolve) => {
      try {
        if (this.config.supabaseUrl && this.config.supabaseAnonKey) {
          // Determine storage key based on app type
          // This allows web and mobile to run simultaneously without conflicts
          const storageKey = this.config.appName || 'supabase.auth.token';
          const isMobile = this.config.appName === 'mobile';
          
          // Use Capacitor Preferences for mobile (iOS/Android) to prevent OS eviction
          // Use localStorage for web (browser)
          const storage = isMobile ? capacitorStorageAdapter : window.localStorage;
          
          this.client = createClient(
            this.config.supabaseUrl,
            this.config.supabaseAnonKey,
            {
              auth: {
                autoRefreshToken: true,
                persistSession: true, // Enable session persistence
                detectSessionInUrl: true,
                flowType: 'pkce',
                storageKey: storageKey,
                storage: storage, // Use appropriate storage for platform
              },
            }
          );
        }
      } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
      } finally {
        this.initializing = false;
        resolve();
      }
    });

    return this.initPromise;
  }

  getSupabaseClient(): SupabaseClient | undefined {
    // Client should already be initialized from constructor
    // But just in case, we don't re-initialize here
    return this.client ?? undefined;
  }
}
