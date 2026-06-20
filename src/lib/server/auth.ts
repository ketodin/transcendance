import { prismaAdapter } from 'better-auth/adapters/prisma';
import { betterAuth } from 'better-auth';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import db from '$lib/server/db';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';
import { twoFactor } from 'better-auth/plugins';

const NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

function validateName(name: string) {
	if (!name || name.length < 3 || name.length > 32 || !NAME_REGEX.test(name)) {
		throw new APIError('BAD_REQUEST', {
			message: 'Invalid name: must be 3-32 characters, only letters, numbers, _ and -'
		});
	}
}

export const auth = betterAuth({
	database: prismaAdapter(db, {
		provider: 'sqlite'
	}),
	rateLimit: {
		enabled: true,
		window: 60,
		max: 100
	},
	experimental: { joins: true },
	emailAndPassword: { enabled: true },
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			const isSignUp = ctx.path === '/sign-up/email';
			const isUpdate = ctx.path === '/update-user';

			if (!isSignUp && !isUpdate) return;

			const body = ctx.body as Record<string, unknown> | undefined;
			const name = body?.name;
			if (typeof name === 'string') {
				validateName(name);
			}
			return Promise.resolve();
		})
	},
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
