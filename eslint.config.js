import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'public', '*.d.ts'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['src/game/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use Mulberry32 in src/game/core instead of Math.random' },
        { object: 'Date', property: 'now', message: 'Use simulation tick time instead of Date.now' },
        { object: 'performance', property: 'now', message: 'Use simulation tick time instead of performance.now' },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'Do not access browser window in headless simulation core' },
        { name: 'document', message: 'Do not access DOM document in headless simulation core' },
      ],
    },
  }
);
