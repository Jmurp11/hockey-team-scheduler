/**
 * Gets initials from a full name
 * @param name Full name string
 * @returns Initials in uppercase (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  if (!name) return '';
  const names = name.split(' ');
  const initials = names.map((n) => n.charAt(0).toUpperCase());
  return initials.join('');
}

export function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase(),
  );
}
