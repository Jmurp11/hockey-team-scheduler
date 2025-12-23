import { SelectOption } from "../types/select-option.type";

export function setSelect<T>(label: string, value: T): SelectOption<T> {
  return { label, value };
}
