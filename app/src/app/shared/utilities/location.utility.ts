export function formatLocation(
  city: string,
  state: string,
  country: string
): string {
  return `${city}, ${state}${country !== 'USA' ? `, ${country}` : ''}`;
}
