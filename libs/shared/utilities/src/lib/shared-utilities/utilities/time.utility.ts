export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function combineDateAndTime(
  dateString: string,
  timeString?: string,
): Date {
  // Parse date components directly to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);

  if (!timeString) {
    return new Date(year, month - 1, day);
  }

  const cleanTimeString = timeString.replace(/([+-]\d{2})$/, '');
  const [h, m, s = '00'] = cleanTimeString.split(':');

  const hours = Number(h);
  const minutes = Number(m);
  const seconds = Number(s);

  return new Date(
    year,
    month - 1, // Month is 0-indexed
    day,
    hours,
    minutes,
    seconds,
  );
}
