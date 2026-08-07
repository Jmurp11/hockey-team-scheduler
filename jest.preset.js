// `@nx/jest/preset` exports the preset both as `nxPreset` and as `default`.
// This previously read `require('@nx/jest/preset').default` and then
// destructured `nxPreset` off it — but `.default` *is* the preset and has no
// `nxPreset` key, so the spread produced `{}` and every project ran with no
// preset at all. The visible symptom was that Nx's `resolver`, which maps the
// `@hockey-team-scheduler/*` tsconfig paths, was never applied, so no test
// could import across workspace package boundaries.
const { nxPreset } = require('@nx/jest/preset');

module.exports = { ...nxPreset };