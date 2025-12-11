// Simple integration test to verify time conflict validation works
// Run this with: npx ts-node integration-test.ts

import { FormControl, FormGroup } from '@angular/forms';
import { gameTimeConflictValidator } from './libs/shared/utilities/src/lib/shared-utilities/utilities/game-time-conflict.validator';
import { Game } from './libs/shared/utilities/src/lib/shared-utilities/types/game.type';

// Mock existing games
const existingGames: (Game & { originalTime?: string })[] = [
  {
    id: 'game-1',
    created_at: '2024-01-01T00:00:00Z',
    date: new Date('2024-12-04'),
    time: '14:00:00',
    originalTime: '14:00:00',
    game_type: 'league',
    city: 'Toronto',
    state: 'ON',
    country: 'Canada',
    rink: 'Scotiabank Arena',
    opponent: { label: 'Team B', value: 2 },
    user: 1,
    isHome: true
  }
];

// Test case 1: Conflict within 4 hours (should fail validation)
console.log('\n=== Test 1: Scheduling game 2 hours after existing game ===');
const validator1 = gameTimeConflictValidator(existingGames);
const control1 = new FormControl(new Date('2024-12-04T16:00:00')); // 4:00 PM, 2 hours after existing 2:00 PM game
const result1 = validator1(control1);
console.log('Result:', result1);
console.log('Expected: Should show conflict error');

// Test case 2: No conflict - more than 4 hours apart (should pass validation)
console.log('\n=== Test 2: Scheduling game 6 hours after existing game ===');
const validator2 = gameTimeConflictValidator(existingGames);
const control2 = new FormControl(new Date('2024-12-04T20:00:00')); // 8:00 PM, 6 hours after existing 2:00 PM game
const result2 = validator2(control2);
console.log('Result:', result2);
console.log('Expected: Should be null (no conflict)');

// Test case 3: Different date (should pass validation)
console.log('\n=== Test 3: Scheduling game on different date ===');
const validator3 = gameTimeConflictValidator(existingGames);
const control3 = new FormControl(new Date('2024-12-05T14:00:00')); // Same time but different date
const result3 = validator3(control3);
console.log('Result:', result3);
console.log('Expected: Should be null (no conflict)');

console.log('\n=== Integration test complete ===');