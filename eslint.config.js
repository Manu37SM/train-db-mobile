const reactNativeFlat = require('@react-native/eslint-config/flat');

module.exports = [
  { ignores: ['node_modules/**', 'android/**', 'ios/**'] },
  ...reactNativeFlat,
  {
    rules: {
      'react-native/no-inline-styles': 'off',
    },
  },
  {
    files: ['**/*.{js,jsx,cjs,mjs}'],
    rules: {
      'ft-flow/define-flow-type': 'off',
      'ft-flow/use-flow-type': 'off',
    },
  },
];
