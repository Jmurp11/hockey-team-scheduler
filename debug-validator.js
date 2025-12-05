import { FormControl } from '@angular/forms';
import { gameTimeConflictValidator } from './game-time-conflict.validator';

// Simple debug test
const testGame = {
  id: 'test-game-1',
  created_at: '2024-01-01T00:00:00Z',
  date: new Date('2024-01-01T00:00:00Z'),
  time: '20:00:00',
  originalTime: '20:00:00',
  opponent: { label: 'Test Opponent', value: 1 },
  rink: 'Test Rink',
  city: 'Test City',
  state: 'Test State',
  country: 'Test Country',
  game_type: 'league',
  isHome: true,
  user: 1
};

console.log('Test game date:', testGame.date.toISOString().split('T')[0]);
console.log('Test game time:', testGame.time);
console.log('Test game originalTime:', testGame.originalTime);

const validator = gameTimeConflictValidator([testGame]);
const control = new FormControl(new Date('2024-01-01T19:00:00')); // 1 hour before

console.log('New game date:', control.value.toISOString().split('T')[0]);
console.log('New game time in minutes:', control.value.getHours() * 60 + control.value.getMinutes());

const result = validator(control);
console.log('Validation result:', result);