const expo = require('eslint-config-expo/flat');
module.exports = [{ ignores: ['dist/**', 'web-build/**', '.expo/**', 'tmp/**', '.tmp-check/**'] }, ...expo, {
  files: ['**/*.cjs', 'scripts/*.js', '*.config.js'],
  languageOptions: { sourceType: 'commonjs', globals: { __dirname: 'readonly', __filename: 'readonly', module: 'readonly', require: 'readonly', process: 'readonly', Buffer: 'readonly' } },
}, {
  // Existing route/form synchronization is kept; database loading also follows the lab's effect-based pattern.
  rules: { 'react-hooks/set-state-in-effect': 'warn' },
}];
