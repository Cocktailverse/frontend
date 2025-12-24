import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  // Ignora archivos
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.min.js',
    ],
  },

  // Configuración base
  js.configs.recommended,

  // Configuración para archivos JavaScript/JSX
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React básico
      'react/react-in-jsx-scope': 'off', // No necesario en React 17+
      'react/prop-types': 'off', // Opcional si usas TypeScript o PropTypes
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      
      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // React Refresh (Vite)
      'react-refresh/only-export-components': ['warn', { 
        allowConstantExport: true, 
      }],
      
      // Console
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      
      // Variables
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_', 
      }],
      'prefer-const': 'error',
      'no-var': 'error',
      
      // Best Practices
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'curly': ['error', 'all'],
      'no-multi-spaces': 'error',
      
      // Code Style
      'indent': ['error', 2, { 
        'SwitchCase': 1,
        'ignoredNodes': ['ConditionalExpression'], 
      }],
      'quotes': ['error', 'single', { 
        'avoidEscape': true,
        'allowTemplateLiterals': true, 
      }],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'arrow-spacing': 'error',
      'key-spacing': ['error', { 'beforeColon': false, 'afterColon': true }],
      
      // ES6+
      'arrow-parens': ['error', 'always'],
      'no-duplicate-imports': 'error',
      'prefer-template': 'warn',
      'template-curly-spacing': 'error',
      
      // JSX específico
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-pascal-case': 'error',
      'react/no-deprecated': 'warn',
      'react/no-direct-mutation-state': 'error',
      'react/no-unescaped-entities': 'warn',
      'react/require-render-return': 'error',
      'react/self-closing-comp': 'error',
    },
  },
];
