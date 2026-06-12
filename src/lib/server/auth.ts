import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import db from '$lib/server/db';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';
import { twoFactor } from 'better-auth/plugins';

export const auth = betterAuth({
	database: prismaAdapter(db, {
		provider: 'sqlite'
	}),
	trustedOrigins: (request) => {
		if (!request) return [];
		const origin = request.headers.get('origin');
		return origin ? [origin] : [];
	},
	experimental: { joins: true },
	emailAndPassword: { enabled: true },
	plugins: [
		twoFactor({
			issuer: 'ft_transcendence',
			TOTPOptions: { window: 1 },
			backupCodes: { count: 8, length: 10 }
		}),
		sveltekitCookies(getRequestEvent)
	],
	secret: building ? 'a' : env.BETTER_AUTH_SECRET,
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID!,
			clientSecret: env.GOOGLE_CLIENT_SECRET!
		}
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					let name = (user.name ?? user.email.split('@')[0]).replace(/\s+/g, '_');
					const existing = await db.user.findUnique({ where: { name } });
					if (existing) {
						const suffix = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
						name = `_tmp_${suffix}`;
					}
					return { data: { ...user, name, emailVerified: true } };
				}
			}
		}
	},
	user: {
		deleteUser: {
			enabled: true
		}
	}
});
