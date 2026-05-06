import type { PageServerLoad, Actions } from './$types';
import db from "$lib/server/db";
import z from "zod";


export const load: PageServerLoad = (async () => {
	const profiles = await db.profile.findMany();
	console.log("load", profiles);
	return { profiles };
});


function formDataToObject(formData: FormData) {
	return Object.fromEntries(formData.entries());
}

const Profile = z.strictObject({
	username: z.string().min(3).max(32)
		.regex(/^\S+$/, {message: "Spaces are not allowed"}),
	email: z.email(),
	bio: z.nullable(z.string()),
})


export const actions: Actions = {
	default: async ({ request }) => {
		const data = formDataToObject(await request.formData())
		console.log(data)
		const user = await db.profile.create({
			data: Profile.parse(data)
		})
		console.log(user);
		return user;
	}
};

