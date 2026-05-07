import prettier from 'eslint-config-prettier';
import path from 'node:path';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	{
		ignores: [
			'.github/',
			'src/lib/components/ui/',
			'src/lib/paraglide/',
			'*.config.js',
			'*.config.ts'
		]
	},
	js.configs.recommended,
	ts.configs.recommendedTypeChecked,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parserOptions: {
				projectService: {
					allowDefaultProject: ['*.config.js', '*.config.ts'],
					defaultProject: 'tsconfig.json'
				},
				tsconfigRootDir: import.meta.dirname
			}
		},
		linterOptions: { reportUnusedDisableDirectives: true },
		// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
		// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
		rules: { 'no-undef': 'off' }
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		// no-unsafe-call disabled for layout.svelte: ModeWatcher is imported from an external
		// .svelte file and typescript-eslint cannot resolve types across that boundary.
		// Tracked upstream: https://github.com/sveltejs/svelte/issues/16264
		files: ['src/routes/+layout.svelte'],
		rules: {
			'@typescript-eslint/no-unsafe-call': 'off'
		}
	},
	{
		// no-unsafe-* disabled for hooks.server.ts: paraglideMiddleware types from
		// @inlang/paraglide-js are not fully resolved by typescript-eslint's projectService.
		files: ['src/hooks.server.ts'],
		rules: {
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off'
		}
	},
	{
		// Override or add rule settings here, such as:
		// 'svelte/button-has-type': 'error'
		rules: {}
	}
);
