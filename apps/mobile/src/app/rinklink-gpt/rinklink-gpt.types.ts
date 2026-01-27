// Re-export shared types and utilities from shared-utilities
export type { DisplayMessage } from '@hockey-team-scheduler/shared-utilities';
export {
  CHAT_SUGGESTIONS,
  getWelcomeFeatures,
} from '@hockey-team-scheduler/shared-utilities';

// Platform-specific welcome features for mobile (using Ionicons)
import { getWelcomeFeatures as getFeatures } from '@hockey-team-scheduler/shared-utilities';
export const WELCOME_FEATURES = getFeatures('mobile');
