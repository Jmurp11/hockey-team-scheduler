import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Game } from '../types/game.type';
import {
  convert24HourToMinutes,
  convertTo24HourFormat,
  formatTimeFromMinutes,
  removeTimeZoneInfo,
} from './time.utility';

/**
 * Validator to check for time conflicts between games
 * Prevents scheduling games within 4 hours of each other on the same date
 *
 * @param existingGames Array of existing games to check against
 * @param currentGameId Optional ID of the current game being edited (to exclude from conflict check)
 * @returns ValidatorFn that checks for time conflicts
 */
export function gameTimeConflictValidator(
  existingGames: (Game & { originalTime?: string })[] | null,
  currentGameId?: string,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || !existingGames || existingGames.length === 0) {
      return null;
    }

    const { newGameDate, newGameTime } = formatNewGameDateData(control);

    for (const existingGame of existingGames) {
      if (currentGameId && existingGame.id === currentGameId) {
        continue;
      }

      const existingGameDate = extractGameDate(existingGame);

      if (existingGameDate === newGameDate) {
        const existingGameTime = extractGameTimeInMinutes(existingGame);

        if (existingGameTime) {
          const conflict = compareWithExistingGame(
            existingGameTime,
            newGameTime,
            existingGame,
          );
          if (conflict) {
            return conflict; // Only return if there's actually a conflict
          }
        }
      }
    }

    return null;
  };
}

function compareWithExistingGame(
  existingGameTime: number,
  newGameTime: number,
  existingGame: any,
) {
  const timeDifferenceMinutes = Math.abs(newGameTime - existingGameTime);

  console.log('Validator debug:', {
    newGameTime: newGameTime,
    existingGameTime: existingGameTime,
    timeDifferenceMinutes: timeDifferenceMinutes,
    isConflict: timeDifferenceMinutes < 240,
  });

  return validateTimeDifference(
    timeDifferenceMinutes,
    existingGameTime,
    existingGame,
  );
}
function formatNewGameDateData(control: AbstractControl) {
  const newGameDateTime =
    control.value instanceof Date ? control.value : new Date(control.value);

  const newGameDate = `${newGameDateTime.getFullYear()}-${(newGameDateTime.getMonth() + 1).toString().padStart(2, '0')}-${newGameDateTime.getDate().toString().padStart(2, '0')}`; // YYYY-MM-DD
  const newGameTime =
    newGameDateTime.getHours() * 60 + newGameDateTime.getMinutes(); // minutes since midnight
  return { newGameDate, newGameTime };
}

function validateTimeDifference(
  timeDifferenceMinutes: number,
  existingGameTime: number,
  existingGame: Game & { originalTime?: string },
) {
  if (timeDifferenceMinutes < 240) {
    const conflictingGameTime = formatTimeFromMinutes(existingGameTime);
    return {
      gameTimeConflict: {
        message: `Cannot schedule game within 4 hours of existing game at ${conflictingGameTime}`,
        conflictingTime: conflictingGameTime,
        conflictingGameId: existingGame.id,
      },
    };
  }
  return null;
}
/**
 * Extract the date from a game object in YYYY-MM-DD format
 */
function extractGameDate(game: Game & { originalTime?: string }): string {
  if (!game.date) return '';

  const date = game.date instanceof Date ? game.date : new Date(game.date);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

/**
 * Extract time from a game object and convert to minutes since midnight
 */
function extractGameTimeInMinutes(
  game: Game & { originalTime?: string },
): number | null {
  if (!game.time && !game.originalTime) return null;

  const timeStr = game.originalTime || game.time;

  if (!timeStr) return null;

  try {
    const time24h = handleStringType(timeStr);

    const timeResult = convert24HourToMinutes(time24h || '');

    if (!timeResult) return null;

    const { hours, minutes } = timeResult;

    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
      ? hours * 60 + minutes
      : null;
  } catch (error) {
    console.warn('Error parsing game time:', timeStr, error);
    return null;
  }
}

function handleStringType(timeStr: any): string | null {
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return convertTo24HourFormat(timeStr);
  } else if (timeStr.includes(':')) {
    return removeTimeZoneInfo(timeStr);
  } else {
    return null;
  }
}
