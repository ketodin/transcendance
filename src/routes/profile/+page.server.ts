import type { PageServerLoad, Actions } from './$types';
import db from "$lib/server/db";

export const load: PageServerLoad = (async () => {
	return { profiles: [ { id: "abc", username: "www", createdAt: Date.now() } ] };
});


export const actions: Actions = {
	default: async ({ request }) => {
		// TODO log the user in
	}
};

// export const actions = {
// 	newUser: async ({ request, cookies }) => {
// 		const data = await request.formData();
// 		console.log(data);

// 		const user = await prisma.user.create({
// 			data: {
// 				name: data.get('name') as string,
// 				email: data.get('email') as string,
// 				password: data.get('password') as string
// 			},
// 		});
// 		console.log("Created user:", user);
// 	},

// } satisfies Actions;



