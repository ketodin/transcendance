import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
	title: 'Transcendence documentation',
	tagline: '',
	favicon: 'img/favicon.ico',

	// Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
	future: {
		v4: true // Improve compatibility with the upcoming Docusaurus v4
	},

	url: 'https://ketodin.github.io',
	baseUrl: '/transcendence/',
	organizationName: 'ketodin',
	projectName: 'transcendence',
	trailingSlash: false,
	onBrokenLinks: 'throw',

	// Even if you don't use internationalization, you can use this field to set
	// useful metadata like html lang. For example, if your site is Chinese, you
	// may want to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: 'en',
		locales: ['en']
	},

	markdown: {
		format: 'md'
	},

	presets: [
		[
			'classic',
			{
				docs: {
					path: '../',
					routeBasePath: '/',
					sidebarPath: './sidebars.ts',
					include: ['docs/**/*md'],
					exclude: ['docs/**/adr-template.md']
					// Please change this to your repo.
					// Remove this to remove the "edit this page" links.
					//editUrl:
					// 'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
				},
				blog: false,
				theme: {
					customCss: './src/css/custom.css'
				}
			} satisfies Preset.Options
		]
	],

	themeConfig: {
		// Replace with your project's social card
		image: 'img/docusaurus-social-card.jpg',
		colorMode: {
			respectPrefersColorScheme: true
		},
		navbar: {
			title: 'Transcendence docs',
			logo: {
				alt: 'My Site Logo',
				src: 'img/logo.svg'
			},
			items: [
				{
					type: 'docSidebar',
					sidebarId: 'docs',
					position: 'left',
					label: 'Documentation',
					to: '/docs/runbook'
				}
			]
		},
		footer: {
			style: 'dark',
			links: [
				{
					title: 'Docs',
					items: [
						{
							label: 'Documentation',
							to: '/docs/runbook'
						}
					]
				},
				{
					title: 'Community',
					items: [
						{
							label: 'Stack Overflow',
							href: 'https://stackoverflow.com/questions/tagged/docusaurus'
						}
					]
				},
				{
					title: 'More',
					items: [
						{
							label: 'GitHub',
							href: 'https://github.com/ketodin/transcendance'
						}
					]
				}
			],
			copyright: `${new Date().getFullYear()} Transcendence. Built with Docusaurus.`
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula
		}
	} satisfies Preset.ThemeConfig
};

export default config;
