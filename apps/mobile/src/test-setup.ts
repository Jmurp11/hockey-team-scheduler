import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});

// Global mock for shared-utilities
jest.mock('@hockey-team-scheduler/shared-utilities', () => ({
  getLastMessageTime: jest.fn((date: Date | string) => {
    if (typeof date === 'string') {
      return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }),
  initLoginForm: jest.fn(() => ({
    get: jest.fn((field: string) => ({
      value: null,
      setValue: jest.fn(),
      patchValue: jest.fn(),
    })),
    patchValue: jest.fn(),
    invalid: true,
    valid: false,
  })),
  getFormControl: jest.fn((form: any, field: string) => ({
    value: null,
    setValue: jest.fn(),
    patchValue: jest.fn(),
  })),
}));
