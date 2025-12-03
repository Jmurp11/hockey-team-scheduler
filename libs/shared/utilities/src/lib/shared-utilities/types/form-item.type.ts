export interface BaseFormFieldParams {
  placeholder?: string;
  errorMessage: string;
}

export interface SelectParams<T> extends BaseFormFieldParams {
  listItems: T[];
  itemLabel: string;
  isAutoComplete: boolean;
  emptyMessage: string;
  showClear?: boolean;
}

export interface MultiSelectParams<T> extends SelectParams<T> {
  maxSelectedLabels?: number;
  fluid?: boolean;
}

export interface FormField {
  controlName: string;
  labelName: string;
  autocomplete: boolean;
  controlType: 'select' | 'input' | 'multi-select' | 'date-picker' | 'autocomplete';
  section: number;
  errorMessage?: string;
  items?: string[];
  type?: InputType;
  tooltip?: string;
}

export type InputType = 'password' | 'text' | 'email' | 'number';
