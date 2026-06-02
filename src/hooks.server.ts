import { type Handle, redirect } from '@sveltejs/kit';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';
import type { User } from '$lib/server/prisma/browser';
import { type Server as ColyseusServer, matchMaker } from 'colyseus';
import { TankRoom } from '$lib/game/colyseus/TankRoom';
import { StatusRoom } from '$lib/game/colyseus/StatusRoom';

let gameServer: ColyseusServer | null = null;
const PUBLIC_ROUTES = ['/login', '/register', '/legal/terms', '/legal/privacy', 'favicon.png'];

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale))
		});
	});

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user as User;
	} else {
		event.locals.session = null;
		event.locals.user = null;
	}
	return svelteKitHandler({ event, resolve, auth, building });
};

export const handleColyseus: Handle = async ({ event, resolve }) => {
	if (!gameServer) {
		gameServer = globalThis.gameServer;
		matchMaker.defineRoomType('tank_room', TankRoom);
		matchMaker.defineRoomType('status', StatusRoom);
	}
	return resolve(event);
};

export const handleRouteProtection: Handle = async ({ event, resolve }) => {
	let { pathname } = event.url;
	const isPublic = PUBLIC_ROUTES.some((route) => pathname === route);
	if (!isPublic && !event.locals.user) {
		if (pathname.startsWith('/')) pathname = pathname.slice(1);
		if (pathname === '') return redirect(303, `/login`);
		const redirectTo = encodeURIComponent(pathname);
		return redirect(303, `/login?redirectTo=${redirectTo}`);
	}
	return resolve(event);
};

export const handle: Handle = sequence(
	handleColyseus,
	handleParaglide,
	handleBetterAuth,
	handleRouteProtection
);
