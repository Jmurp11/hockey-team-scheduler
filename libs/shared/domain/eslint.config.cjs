const baseConfig = require('../../../eslint.config.js');

// Intentionally does NOT extend the Angular configs. This library must remain
// framework-free so the NestJS API can consume it.
module.exports = [...baseConfig];
