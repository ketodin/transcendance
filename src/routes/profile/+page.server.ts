import type { PageServerLoad, Actions } from './$types';
import db from "$lib/server/db";
import z from "zod";


export const load: PageServerLoad = (async () => {
	return { profiles: [ { id: "abc", username: "www", createdAt: Date.now() } ] };
});


function formDataToObject(formData: FormData) {
	return Object.fromEntries(formData.entries());
}

const Profile = z.strictObject({
	username: z.string().min(3).max(32),
	email: z.email(),
	bio: z.nullable(z.string()),
})


export const actions: Actions = {
	default: async ({ request }) => {
		const data = formDataToObject(await request.formData())
		console.log(data)
		const user = db.profile.create({
			data: Profile.parse(data)
		})
		console.log(user);
		return user;
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



