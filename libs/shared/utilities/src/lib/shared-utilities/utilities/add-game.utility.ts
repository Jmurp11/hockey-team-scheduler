import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Game } from '../types/game.type';
import { setSelect } from './select.utility';
import { transformDateTime, getCurrentLocalDateTime } from './time.utility';
import { gameTimeConflictValidator } from './game-time-conflict.validator';
import { opponentValidator } from './form.validators';

interface FormValueWithValue {
  value?: unknown;
}

/**
 * Game type options for select inputs
 */
export const GAME_TYPE_OPTIONS = [
  setSelect('League', 'league'),
  setSelect('Playoff', 'playoff'),
  setSelect('Tournament', 'tournament'),
  setSelect('Exhibition', 'exhibition'),
];

/**
 * Home/Away options for select inputs
 */
export const IS_HOME_OPTIONS = [
  setSelect('Home', 'home'),
  setSelect('Away', 'away'),
];

/**
 * Extract and normalize game type value from game data
 */
function extractGameType(gameData: Game | null): string | null {
  if (!gameData) {
    return null;
  }

  // Handle game type mapping (API uses game_type, form uses gameType)
  let gameTypeValue = (gameData as any)?.game_type || null;

  // Convert API capitalized values to lowercase form values
  if (gameTypeValue && typeof gameTypeValue === 'string') {
    gameTypeValue = gameTypeValue.toLowerCase();
  }

  return gameTypeValue;
}

/**
 * Convert isHome value to form-compatible string
 */
function convertIsHomeValue(gameData: Game | null): string {
  if (
    !gameData ||
    gameData?.isHome === undefined ||
    gameData?.isHome === null
  ) {
    return 'home';
  }

  // Handle both boolean and string values from API
  const isHomeData = gameData.isHome;
  if (typeof isHomeData === 'boolean') {
    return isHomeData ? 'home' : 'away';
  } else {
    return isHomeData === 'true' ? 'home' : 'away';
  }
}

/**
 * Initialize the add game form with optional game data for editing
 * @param gameData Optional game data for editing mode
 * @param existingGames Optional array of existing games for time conflict validation
 */
export function initAddGameForm(
  gameData: any | null = null,
  existingGames: (Game & { originalTime?: string })[] | null = null,
): FormGroup {
  const gameTypeValue = extractGameType(gameData);
  const isHomeValue = convertIsHomeValue(gameData);

  const currentLocalDateTime = getCurrentLocalDateTime();

  let dateValue =
    gameData && gameData.date
      ? transformDateTime({ date: gameData.date, time: gameData.time })
      : transformDateTime(currentLocalDateTime);
  return new FormGroup({
    opponent: new FormControl(gameData?.opponent || null, {
      validators: [Validators.required, opponentValidator()],
    }),
    rink: new FormControl(gameData?.rink || null, {
      validators: [Validators.required, Validators.minLength(3)],
    }),
    city: new FormControl(gameData?.city || null, {
      validators: [Validators.required, Validators.minLength(2)],
    }),
    country: new FormControl(gameData?.country || null, {
      validators: [Validators.required],
    }),
    state: new FormControl(gameData?.state || null, {
      validators: [Validators.required, Validators.minLength(2)],
    }),
    date: new FormControl(dateValue, {
      validators: [
        Validators.required,
        gameTimeConflictValidator(existingGames, gameData?.id),
      ],
    }),
    game_type: new FormControl(gameTypeValue, {
      validators: [Validators.required],
    }),
    isHome: new FormControl(isHomeValue, {
      validators: [Validators.required],
    }),
  });
}

/**
 * Transform form data into API input format
 */
export function transformAddGameFormData(
  formValue: Record<string, unknown>,
  userId: string,
): Record<string, unknown>[] {
  const dateValue = formValue['date'];
  const date =
    dateValue instanceof Date ? dateValue : new Date(dateValue as string);

  const state = formValue['state'] as FormValueWithValue | string;
  const opponent = formValue['opponent'] as FormValueWithValue | string;

  let apiGameType = formValue['game_type'] as string;
  if (apiGameType && typeof apiGameType === 'string') {
    apiGameType = apiGameType.charAt(0).toUpperCase() + apiGameType.slice(1);
  }

  const submission = {
    rink: formValue['rink'],
    city: formValue['city'],
    country:
      typeof formValue['country'] === 'object'
        ? (formValue['country'] as FormValueWithValue).value
        : formValue['country'],
    game_type: apiGameType,
    state: typeof state === 'object' ? state.value : state,
    opponent: [handleOpponent(opponent)],
    isHome: formValue['isHome'] === 'home',
    user: userId,
    date: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`, // YYYY-MM-DD using local date
    time: date.toTimeString().split(' ')[0],
  };

  return [submission];
}

export function handleOpponent(opponent: any) {
  if (typeof opponent === 'object') {
    if (opponent.value) {
      return opponent.value;
    } else {
      return opponent;
    }
  } else {
    return opponent;
  }
}

/**
 * Update the time conflict validator on an existing form
 * @param form The FormGroup to update
 * @param existingGames Array of existing games for conflict checking
 * @param currentGameId Optional ID of current game being edited
 */
export function updateGameTimeConflictValidator(
  form: FormGroup,
  existingGames: (Game & { originalTime?: string })[] | null,
  currentGameId?: string,
): void {
  const dateControl = form.get('date');
  if (dateControl) {
    const currentValidators = [Validators.required];

    // Add the time conflict validator
    if (existingGames && existingGames.length > 0) {
      currentValidators.push(
        gameTimeConflictValidator(existingGames, currentGameId),
      );
    }

    // Update validators and revalidate
    dateControl.setValidators(currentValidators);
    dateControl.updateValueAndValidity();
  }
}
