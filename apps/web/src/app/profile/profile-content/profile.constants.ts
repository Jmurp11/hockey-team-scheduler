import { getProfileFormFields } from '@hockey-team-scheduler/shared-utilities';

export function getFormFields() {
  const baseFields = getProfileFormFields();
  
  // Override controlType for web platform to use autocomplete
  return baseFields.map(field => {
    if (field.controlName === 'association' || field.controlName === 'team') {
      return { ...field, controlType: 'autocomplete' };
    }
    return field;
  });
}
