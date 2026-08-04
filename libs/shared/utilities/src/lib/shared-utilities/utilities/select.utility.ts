import { SelectOption } from '@hockey-team-scheduler/shared-domain';

export function setSelect<T>(label: string, value: T): SelectOption<T> {
  return { label, value };
}
