import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import db from '$lib/server/db';

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
	console.log('fr1');
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
	console.log('fr2');
	if (friendship2) return true;
	console.log('fr3');
	return false;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) return redirect(303, '/login');
	const user = await db.user.findUnique({
		where: { id: params.id }
	});
	if (!user) return error(404, 'User not found'); // maybe redirect instead

	const userType: UserType =
		locals.user.id === user.id
			? 'self'
			: (await isFriend(locals.user.id, user.id))
				? 'friend'
				: 'someone';

	return { user, userType };
};
