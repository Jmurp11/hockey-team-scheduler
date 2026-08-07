/**
 * Framework-free domain logic, shared by the Angular clients and the NestJS API.
 *
 * Nothing in this library may import Angular, RxJS, Ionic, or any other
 * framework. `shared-utilities` re-exports everything here, so existing client
 * imports keep working; the API imports this package directly, which is the
 * whole point — its barrel would otherwise drag `@angular/forms` into a Node
 * build.
 */

// Types
export * from './lib/types/game.type';
export * from './lib/types/schedule-risk.type';
export * from './lib/types/select-option.type';

// Utilities
export * from './lib/utilities/schedule-risk.utility';
export * from './lib/utilities/time.utility';
