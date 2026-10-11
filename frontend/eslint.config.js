import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import vueTsConfig from '@vue/eslint-config-typescript'

export default defineConfig([
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,ts,tsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', 'fix_test.js', 'testing/**']),

  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  ...vueTsConfig(),
  skipFormatting,

  {
    name: 'legacy-js-compat',
    files: ['src/**/*.js', 'src/**/*.vue'],
    ignores: ['src/admin/**'],
    rules: {
      'vue/block-lang': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  {
    name: 'admin-ts-strict',
    files: ['src/admin/**/*.{ts,vue}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
])
