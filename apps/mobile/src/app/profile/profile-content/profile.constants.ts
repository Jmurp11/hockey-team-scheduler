import { getProfileFormFields } from '@hockey-team-scheduler/shared-utilities';

// Mobile uses the base form fields as-is (with 'select' controlType)
export function getFormFields() {
  return getProfileFormFields();
}
