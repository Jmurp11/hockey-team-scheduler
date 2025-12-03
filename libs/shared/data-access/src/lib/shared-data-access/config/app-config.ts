import { InjectionToken } from '@angular/core';

export interface AppConfig {
  apiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  appName?: string; // Used to differentiate storage keys between apps
}

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');