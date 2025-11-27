const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'backend/node_modules/**',
      'dist/**',
      'build/**',
      'backend/dist/**',
      '.expo/**',
      'coverage/**',
      '*.config.js',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
      '.kiro/verify-and-scan.js',
      '.kiro/deep-cleanup.js',
      'test-bundle.js',
      '*.bundle.js',
      'android/app/build/**',
      'android/build/**',
      'ios/build/**',
      '**/intermediates/**'
    ]
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        __DEV__: 'readonly',
        console: 'readonly',
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      '@typescript-eslint/no-shadow': 'error',
      'no-shadow': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      'no-console': 'off'
    }
  }
];
