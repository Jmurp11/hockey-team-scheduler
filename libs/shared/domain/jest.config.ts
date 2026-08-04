/* eslint-disable */
export default {
  displayName: 'shared-domain',
  preset: '../../../jest.preset.js',
  // Node, not jsdom: this library must stay free of any browser or framework
  // dependency so the NestJS API can import it.
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: '../../../coverage/libs/shared/domain',
};
