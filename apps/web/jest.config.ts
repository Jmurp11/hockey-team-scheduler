 
export default {
  displayName: 'web',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/web',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  moduleNameMapper: {
    '^@hockey-team-scheduler/shared-utilities$': '<rootDir>/../../libs/shared/utilities/src/index.ts',
    '^@hockey-team-scheduler/shared-data-access$': '<rootDir>/../../libs/shared/data-access/src/index.ts',
    '^@hockey-team-scheduler/shared-ui$': '<rootDir>/../../libs/shared/ui/src/index.ts',
    '^@hockey-team-scheduler/shared-test$': '<rootDir>/../../libs/shared/test/src/index.ts',
  },
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};