const { nxPreset } = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  testMatch: [
    '<rootDir>/apps/**/*.(test|spec).{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    '<rootDir>/libs/**/*.(test|spec).{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    '<rootDir>/tournament-etl/**/*.(test|spec).{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
  ],
};