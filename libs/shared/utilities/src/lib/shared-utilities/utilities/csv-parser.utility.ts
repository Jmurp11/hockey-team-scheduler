/**
 * CSV Parser Utility for Game Import
 * Handles parsing CSV files containing game schedule data
 */

import { convertTo24HourFormat } from './time.utility';

export interface CsvGameRow {
  date: string;
  time: string;
  rink: string;
  city: string;
  state: string;
  country: string;
  opponent?: string | null;
  game_type?: string | null;
}

export interface ParsedGameData {
  rink: string;
  city: string;
  state: string;
  country: string;
  opponent: null;
  game_type: null;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM:SS format
  isHome: boolean;
  user: string;
  team: number | null;
  association: number | null;
}

export interface CsvParseResult {
  success: boolean;
  data?: ParsedGameData[];
  errors?: string[];
}

/**
 * Parse CSV content and transform into game data format
 * @param csvContent Raw CSV file content as string
 * @param userId User ID to associate with games
 * @returns Parsed game data or errors
 */
export function parseCsvToGames(
  csvContent: string,
  userId: string,
): CsvParseResult {
  const errors: string[] = [];
  const games: ParsedGameData[] = [];

  try {
    // Split into lines and filter out empty lines
    const lines = csvContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return {
        success: false,
        errors: ['CSV file is empty'],
      };
    }

    // Parse header row
    const headers = parseCsvLine(lines[0]);
    const headerMap = createHeaderMap(headers);

    // Validate required headers
    const requiredHeaders = ['date', 'time', 'rink', 'city', 'state', 'country'];
    const missingHeaders = requiredHeaders.filter(
      (header) => headerMap[header] === -1,
    );

    if (missingHeaders.length > 0) {
      return {
        success: false,
        errors: [
          `Missing required columns: ${missingHeaders.join(', ')}. Required columns are: ${requiredHeaders.join(', ')}`,
        ],
      };
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;
      const values = parseCsvLine(lines[i]);

      try {
        const gameData = parseGameRow(values, headerMap, userId, rowNumber);
        if (gameData) {
          games.push(gameData);
        }
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${(error as Error).message}`);
      }
    }

    if (games.length === 0 && errors.length > 0) {
      return {
        success: false,
        errors,
      };
    }

    return {
      success: true,
      data: games,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    return {
      success: false,
      errors: [`Failed to parse CSV: ${(error as Error).message}`],
    };
  }
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Create a map of header names to column indices
 */
function createHeaderMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  const normalizedHeaders = [
    'date',
    'time',
    'rink',
    'city',
    'state',
    'country',
  ];

  normalizedHeaders.forEach((header) => {
    const index = headers.findIndex(
      (h) => h.toLowerCase().replace(/[_\s]/g, '') === header.replace(/[_\s]/g, ''),
    );
    map[header] = index;
  });

  return map;
}

/**
 * Parse a single game row from CSV values
 */
function parseGameRow(
  values: string[],
  headerMap: Record<string, number>,
  userId: string,
  rowNumber: number,
): ParsedGameData | null {
  // Extract values
  const date = values[headerMap['date']]?.trim();
  const time = values[headerMap['time']]?.trim();
  const rink = values[headerMap['rink']]?.trim();
  const city = values[headerMap['city']]?.trim();
  const state = values[headerMap['state']]?.trim();
  const country = values[headerMap['country']]?.trim();

  // Validate required fields
  if (!date || !time || !rink || !city || !state || !country) {
    throw new Error(
      `Missing required field(s). All fields are required: date, time, rink, city, state, country`,
    );
  }

  // Parse and validate date
  const parsedDate = parseDate(date);
  if (!parsedDate) {
    throw new Error(
      `Invalid date format: "${date}". Expected formats: YYYY-MM-DD, MM/DD/YYYY, or M/D/YYYY`,
    );
  }

  // Parse and validate time
  const parsedTime = parseTime(time);
  if (!parsedTime) {
    throw new Error(
      `Invalid time format: "${time}". Expected formats: HH:MM, HH:MM:SS, or 12-hour with AM/PM`,
    );
  }

  return {
    rink,
    city,
    state,
    country,
    opponent: null,
    game_type: null,
    date: parsedDate,
    time: parsedTime,
    isHome: true, // Default to home games
    user: userId,
    team: null as any, // Will be set by AddGameService from current user
    association: null as any, // Will be set by AddGameService from current user
  };
}

/**
 * Parse date string into YYYY-MM-DD format
 * Supports: YYYY-MM-DD, MM/DD/YYYY, M/D/YYYY
 */
function parseDate(dateStr: string): string | null {
  // Try YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Try MM/DD/YYYY or M/D/YYYY format
  const slashMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, '0');
    const day = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Parse time string into HH:MM:SS format
 * Supports: HH:MM, HH:MM:SS, 12-hour format with AM/PM
 */
function parseTime(timeStr: string): string | null {
  const cleaned = timeStr.trim();

  // Handle 12-hour format with AM/PM - reuse existing utility
  if (/\s*(AM|PM)$/i.test(cleaned)) {
    try {
      const time24h = convertTo24HourFormat(cleaned);
      // Add seconds if not present
      return time24h.includes(':') && time24h.split(':').length === 2
        ? `${time24h}:00`
        : time24h;
    } catch (error) {
      return null;
    }
  }

  // Handle 24-hour format (HH:MM or HH:MM:SS)
  const twentyFourHourMatch = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (twentyFourHourMatch) {
    const hours = twentyFourHourMatch[1].padStart(2, '0');
    const minutes = twentyFourHourMatch[2];
    const seconds = twentyFourHourMatch[3] || '00';
    return `${hours}:${minutes}:${seconds}`;
  }

  return null;
}

/**
 * Read file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
}
