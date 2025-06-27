export interface TableOptions {
  paginator?: boolean;
  rows?: number;
  rowsPerPageOptions?: number[];
  sortField: string;
  sortOrder: number;
  loading?: boolean;
  globalFilterFields?: string[];
  datakey?: string;
  scrollable?: boolean;
  scrollHeight?: string;
  frozenValue?: any[];
  stateStorage: 'local' | 'session';
  stateKey?: string;
}
