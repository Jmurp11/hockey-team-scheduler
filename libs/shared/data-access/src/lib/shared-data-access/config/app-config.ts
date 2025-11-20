import { InjectionToken } from '@angular/core';

export interface AppConfig {
  apiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');