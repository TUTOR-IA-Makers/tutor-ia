import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const layers = {
  routes: ['@/app', '@/app/*'],
  features: ['@/app', '@/app/*', '@/routes/*'],
  services: ['@/app', '@/app/*', '@/routes/*', '@/features/*', '@/components/*'],
  components: [
    '@/app',
    '@/app/*',
    '@/routes/*',
    '@/features/*',
    '@/services',
    '@/services/*',
    '@/domain',
    '@/domain/*',
  ],
  domain: [
    '@/app',
    '@/app/*',
    '@/routes/*',
    '@/features/*',
    '@/services',
    '@/services/*',
    '@/components/*',
  ],
  lib: [
    '@/app',
    '@/app/*',
    '@/routes/*',
    '@/features/*',
    '@/services',
    '@/services/*',
    '@/components/*',
    '@/domain',
    '@/domain/*',
  ],
}

const restrictLayer = (patterns) => ({
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group: patterns,
          message: 'Dependência entre camadas proibida. Veja frontend/README.md.',
        },
        {
          group: ['../../*'],
          message: 'Use o alias @/ em vez de caminhos relativos profundos.',
        },
      ],
    },
  ],
})

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'src/api'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      jsxA11y.flatConfigs.strict,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'off',
      '@typescript-eslint/no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-globals': [
        'error',
        {
          name: 'localStorage',
          message: 'Sessão e dados sensíveis não ficam no navegador.',
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'localStorage',
          message: 'Sessão e dados sensíveis não ficam no navegador.',
        },
        {
          object: 'document',
          property: 'cookie',
          message: 'A sessão é um cookie HttpOnly do backend.',
        },
        { object: 'document', property: 'write', message: 'Risco de XSS.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'Texto gerado por LLM nunca vira HTML cru.',
        },
        {
          selector: 'AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/]',
          message: 'Risco de XSS. Renderize via React.',
        },
        {
          selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
          message: 'Risco de XSS. Renderize via React.',
        },
      ],
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
      'jsx-a11y/no-noninteractive-tabindex': [
        'error',
        { tags: ['pre'], roles: ['tabpanel', 'region'] },
      ],
    },
  },
  ...Object.entries(layers).map(([layer, patterns]) => ({
    files: [`src/${layer}/**/*.{ts,tsx}`],
    rules: restrictLayer(patterns),
  })),
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['*.config.ts', 'tests/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  prettier,
)
