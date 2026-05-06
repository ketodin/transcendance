import type { PageServerLoad, Actions } from './$types';
import db from "$lib/server/db";

export const load: PageServerLoad = (async ({ params }) => {
	const profile = await db.profile.findUnique({
		where: { id: params.id }
	});
	console.log("load", profile);
	return { profile };
});


export const actions: Actions = {
	levelup: async ({ params }) => {
		console.log("Level Up", params);
		await db.profile.update({
			where: { id: params.id },
			data: { xp: { increment: 1 } }
		});
	},
	delete: async ({ params }) => {
		console.log("delete", params);
		await db.profile.delete({
			where: { id: params.id }
		});
	},
};

