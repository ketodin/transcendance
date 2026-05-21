import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
	docs: [
		{ type: 'doc', id: 'docs/runbook', label: 'How to Run' },
		{ type: 'doc', id: 'docs/engineering-guidelines', label: 'Engineering Guidelines' },
		{ type: 'doc', id: 'docs/architecture', label: 'Architecture Overview' },
		{
			type: 'category',
			label: 'Architecture Decision Records',
			collapsed: true,
			items: [
				{
					type: 'doc',
					id: 'docs/adr/adr-001-sveltekit-as-fullstack-framework',
					label: 'ADR-001 — SvelteKit as Full-Stack Framework'
				},
				{
					type: 'doc',
					id: 'docs/adr/adr-002-phaser-4-game',
					label: 'ADR-002 — Phaser 4 as Game Engine'
				},
				{
					type: 'doc',
					id: 'docs/adr/adr-003-prisma-orm',
					label: 'ADR-003 — Prisma as ORM'
				},
				{
					type: 'doc',
					id: 'docs/adr/adr-004-sqlite-database-and-better-sqlite3',
					label: 'ADR-004 — SQLite as Database'
				},
				{
					type: 'doc',
					id: 'docs/adr/adr-005-paraglidejs-for-internationalization',
					label: 'ADR-005 — ParaglideJS for i18n'
				},
				{
					type: 'doc',
					id: 'docs/adr/adr-006-colyseus-for-real-time-multiplayer',
					label: 'ADR-006 — Colyseus for Multiplayer'
				},
				{
					type: 'doc',
					id: 'docs/adr/adr-007-better-auth-for-authentication',
					label: 'ADR-007 — Better-Auth for Auth'
				},
				{
					type: 'doc',
					id: 'docs/adr/adr-008-shared-lib-game-modules-across-client-and-server',
					label: 'ADR-008 — Shared lib/game Architecture'
				},
				{
					type: 'doc',
					id: 'docs/adr/adr-009-docker-compose-for-deployment',
					label: 'ADR-009 — Docker & Compose'
				}
			]
		}
	]
};

export default sidebars;
