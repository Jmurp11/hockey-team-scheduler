import { getAddGameFormFields } from '@hockey-team-scheduler/shared-utilities';

export function getFormFields(teams: any[], rinks: any[]) {
  return getAddGameFormFields(teams, rinks);
}
