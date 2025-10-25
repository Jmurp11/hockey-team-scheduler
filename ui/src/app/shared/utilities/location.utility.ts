export function formatLocation(
  city: string,
  state: string,
  country: string
): string {
  return `${city}, ${state}${country !== 'USA' ? `, ${country}` : ''}`;
}

export function formatTournamentLocation(location: string): string {
  return `${location.split(',').join(', ')}`;
}