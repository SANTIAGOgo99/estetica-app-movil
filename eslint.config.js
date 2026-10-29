const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  { ignores: ['dist/**', 'dist-test/**', 'dist-android/**', 'reports/**', 'tmp/**', 'output/**', '.planning/**'] },
  expoConfig,
]);
