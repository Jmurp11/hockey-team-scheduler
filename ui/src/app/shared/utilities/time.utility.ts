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
  timeString?: string
): Date {
  if (!timeString) return new Date(dateString);
  const cleanTimeString = timeString.replace(/([+-]\d{2})$/, '');

  const date = new Date(dateString); // base date (handles timezone on the input date)
  const [h, m, s = '00'] = cleanTimeString.split(':');

  const hours = Number(h);
  const minutes = Number(m);
  const seconds = Number(s);

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    seconds
  );
}
