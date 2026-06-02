import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import db from '$lib/server/db';
import { m } from '$lib/paraglide/messages';

type UserType = 'self' | 'friend' | 'someone';

async function isFriend(meId: string, otherId: string): Promise<boolean> {
	const friendship1 = await db.friendRequest.findUnique({
		where: {
			senderId_receiverId: {
				senderId: meId,
				receiverId: otherId
			},
			status: 'ACCEPTED'
		}
	});
	if (friendship1) return true;
	const friendship2 = await db.friendRequest.findUnique({
		where: {
			senderId_receiverId: {
				senderId: otherId,
				receiverId: meId
			},
			status: 'ACCEPTED'
		}
	});
	if (friendship2) return true;
	return false;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = await db.user.findUnique({
		where: { id: params.id }
	});
	if (!user) return error(404, m.no_user());

	const userType: UserType =
		locals.user!.id === user.id
			? 'self'
			: (await isFriend(locals.user!.id, user.id))
				? 'friend'
				: 'someone';

	return { user, userType };
};
