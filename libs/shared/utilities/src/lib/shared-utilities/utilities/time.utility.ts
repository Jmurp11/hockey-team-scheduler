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

/**
 * Convert 12-hour format time (e.g., "2:30 PM") to 24-hour format (e.g., "14:30")
 */
export function convertTo24HourFormat(time12h: string): string {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');

  if (hours === '12') {
    hours = '00';
  }

  if (modifier === 'PM') {
    hours = (parseInt(hours, 10) + 12).toString();
  }

  return `${hours.padStart(2, '0')}:${minutes}`;
}

/**
 * Convert 24-hour format time (e.g., "14:30") to 12-hour format (e.g., "2:30 PM")
 */
export function convertTo12HourFormat(time24h: string): string {
  const [hours, minutes] = time24h.split(':');
  const hour24 = parseInt(hours, 10);

  if (hour24 === 0) {
    return `12:${minutes} AM`;
  } else if (hour24 < 12) {
    return `${hour24}:${minutes} AM`;
  } else if (hour24 === 12) {
    return `12:${minutes} PM`;
  } else {
    return `${hour24 - 12}:${minutes} PM`;
  }
}

/**
 * Create a datetime-local compatible string from date and time
 */
export function createDateTimeLocalString(
  dateString: string,
  timeString: string,
): string {
  const time24h = convertTo24HourFormat(timeString);
  return `${dateString}T${time24h}`;
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

/**
 * Transform game data into a datetime string format
 * @param gameData - Object containing date and optional time properties
 * @returns Formatted datetime string or null if no valid date
 */
export function transformDateTime(
  gameData: { date?: string; time?: string } | null,
): string | null {
  console.log('Transforming game data:', gameData);
  // Return null if no game data or no date property
  if (!gameData?.date) {
    return null;
  }

  // If date already contains time (ISO format), return as-is
  if (gameData.date.includes('T')) {
    return gameData.date;
  }

  // If both date and time are provided, combine them
  if (gameData.date && gameData.time) {
    try {
      return createDateTimeLocalString(gameData.date.toString(), gameData.time);
    } catch (error) {
      console.warn('Failed to format date/time:', error);
      return gameData.date;
    }
  }

  // Return date only if no time is provided
  return gameData.date;
}

export function removeTimeZoneInfo(dateTimeString: string): string {
  const timePart = dateTimeString.split('+')[0].split('-')[0].split('Z')[0];
  const timeParts = timePart.split(':');

  if (timeParts.length >= 2) {
    const hours = timeParts[0].padStart(2, '0');
    const minutes = timeParts[1].padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  return timePart;
}

export function convert24HourToMinutes(
  time24h: string,
): { hours: number; minutes: number } | null {
  const [hoursStr, minutesStr] = time24h.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  return { hours, minutes };
}

export function formatTimeFromMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  // Convert to 12-hour format for display
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const period = hours >= 12 ? 'PM' : 'AM';

  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

export function getCurrentLocalDateTime() {
  const now = new Date();
  const localDate = now.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
  const localTime = now.toLocaleTimeString('en-US', { hour12: false });
  return { date: localDate, time: localTime };
}
