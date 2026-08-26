const path = require('path');
const { FlatCompat } = require('@eslint/eslintrc');
const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: path.dirname(require.resolve('@react-native/eslint-config/package.json')),
});

module.exports = [
  { ignores: ['node_modules/**', 'android/**', 'ios/**'] },
  ...compat.extends('@react-native'),
  {
    rules: {
      'react-native/no-inline-styles': 'off',
    },
  },
  {
    files: ['*.js'],
    rules: {
      'ft-flow/define-flow-type': 'off',
      'ft-flow/use-flow-type': 'off',
    },
  },
];
