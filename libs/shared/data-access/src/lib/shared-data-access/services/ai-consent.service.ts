import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

const AI_CONSENT_KEY = 'ai_consent_accepted';

@Injectable({ providedIn: 'root' })
export class AiConsentService {
  hasConsented = signal(false);

  constructor() {
    this.checkConsent().then((consented) => this.hasConsented.set(consented));
  }

  async checkConsent(): Promise<boolean> {
    const { value } = await Preferences.get({ key: AI_CONSENT_KEY });
    return value === 'true';
  }

  async grantConsent(): Promise<void> {
    await Preferences.set({ key: AI_CONSENT_KEY, value: 'true' });
    this.hasConsented.set(true);
  }

  async revokeConsent(): Promise<void> {
    await Preferences.remove({ key: AI_CONSENT_KEY });
    this.hasConsented.set(false);
  }
}
