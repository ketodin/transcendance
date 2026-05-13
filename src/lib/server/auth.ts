import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import db from '$lib/server/db';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';

export const auth = betterAuth({
	database: prismaAdapter(db, {
		provider: 'sqlite'
	}),
	experimental: { joins: true },
	emailAndPassword: { enabled: true },
	plugins: [sveltekitCookies(getRequestEvent)]
});
