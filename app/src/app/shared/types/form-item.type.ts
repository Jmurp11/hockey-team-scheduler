export interface BaseFormFieldParams {
    placeholder?: string;
    errorMessage: string;
}

export interface SelectParams<T> extends BaseFormFieldParams {
    listItems: T[];
    itemLabel: string;
    isAutoComplete: boolean;
    emptyMessage: string;
}

export interface MultiSelectParams<T> extends SelectParams<T> {
    maxSelectedLabels?: number;
    fluid?: boolean;
}
