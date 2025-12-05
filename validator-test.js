// Quick test of the validator logic
import { gameTimeConflictValidator } from './libs/shared/utilities/src/lib/shared-utilities/utilities/game-time-conflict.validator';
import { FormControl } from '@angular/forms';

const existingGame = {
  id: 'test-1',
  created_at: '2024-01-01T00:00:00Z',
  date: new Date('2024-12-05'),
  time: '14:00:00', // 2:00 PM
  originalTime: '14:00:00',
  game_type: 'league',
  city: 'Test',
  state: 'Test',
  country: 'Test',
  rink: 'Test',
  opponent: { label: 'Test', value: 1 },
  user: 1,
  isHome: true
};

console.log('Testing validator with existing game at 2:00 PM (14:00)');
console.log('Existing game:', existingGame.time);

// Test 1: Add game 2 hours BEFORE existing game (12:00 PM -> should conflict)
const validator1 = gameTimeConflictValidator([existingGame]);
const control1 = new FormControl(new Date('2024-12-05T12:00:00')); // 12:00 PM
const result1 = validator1(control1);
console.log('\nTest 1 - 12:00 PM (2 hours before):');
console.log('Result:', result1 ? 'CONFLICT' : 'NO CONFLICT');
if (result1) console.log('Message:', result1.gameTimeConflict.message);

// Test 2: Add game 2 hours AFTER existing game (4:00 PM -> should conflict) 
const validator2 = gameTimeConflictValidator([existingGame]);
const control2 = new FormControl(new Date('2024-12-05T16:00:00')); // 4:00 PM
const result2 = validator2(control2);
console.log('\nTest 2 - 4:00 PM (2 hours after):');
console.log('Result:', result2 ? 'CONFLICT' : 'NO CONFLICT');
if (result2) console.log('Message:', result2.gameTimeConflict.message);

// Test 3: Add game 5 hours BEFORE existing game (9:00 AM -> should NOT conflict)
const validator3 = gameTimeConflictValidator([existingGame]);
const control3 = new FormControl(new Date('2024-12-05T09:00:00')); // 9:00 AM
const result3 = validator3(control3);
console.log('\nTest 3 - 9:00 AM (5 hours before):');
console.log('Result:', result3 ? 'CONFLICT' : 'NO CONFLICT');
if (result3) console.log('Message:', result3.gameTimeConflict.message);