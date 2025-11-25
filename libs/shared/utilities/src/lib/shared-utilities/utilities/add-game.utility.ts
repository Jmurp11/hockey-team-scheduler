import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Game } from '../types/game.type';
import { setSelect } from './select.utility';

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
 * Initialize the add game form with optional game data for editing
 */
export function initAddGameForm(gameData: Game | null = null): FormGroup {
  return new FormGroup({
    opponent: new FormControl(gameData?.opponent || null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    rink: new FormControl(gameData?.rink || null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    city: new FormControl(gameData?.city || null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    state: new FormControl(gameData?.state || null, {
      validators: [Validators.required, Validators.minLength(6)],
    }),
    date: new FormControl(gameData?.date || null, {
      validators: [Validators.required],
    }),
    gameType: new FormControl(gameData?.gameType || null, {
      validators: [Validators.required],
    }),
    isHome: new FormControl(gameData?.isHome || null, {
      validators: [Validators.required],
    }),
  });
}

/**
 * Transform form data into API input format
 */
export function transformAddGameFormData(
  formValue: Record<string, unknown>,
  userId: string
): Record<string, unknown>[] {
  const dateValue = formValue['date'];
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue as string);

  const state = formValue['state'] as FormValueWithValue | string;
  const opponent = formValue['opponent'] as FormValueWithValue | string;

  return [
    {
      ...formValue,
      state: typeof state === 'object' ? state.value : state,
      opponent: [typeof opponent === 'object' ? opponent.value : opponent],
      isHome: formValue['isHome'] === 'home',
      user: userId,
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
      time: date.toTimeString().split(' ')[0],
    },
  ];
}
