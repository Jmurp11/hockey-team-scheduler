import { SortDirection } from "../types/sort.type";

export function sort(
  items: any[],
  sort: { field: string; sortDirection: SortDirection }
) {
  return items.sort((a, b) => {
    const fieldA = a[sort.field];
    const fieldB = b[sort.field];

    if (fieldA < fieldB) return sort.sortDirection === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sort.sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}
