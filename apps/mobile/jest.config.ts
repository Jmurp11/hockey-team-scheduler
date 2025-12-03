export default {
  displayName: 'mobile',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/mobile',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|@ionic|@stencil|ionicons)'],
  moduleNameMapper: {
    '^ionicons/(.*)$': '<rootDir>/../../node_modules/ionicons/$1',
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
