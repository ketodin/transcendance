import type { PageServerLoad, Actions } from './$types';
import { setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from "sveltekit-superforms/adapters";
import { formSchema } from "./schema";
import { fail } from "@sveltejs/kit";
import db from "$lib/server/db";
import { Prisma } from '$lib/server/prisma/client';


export const load: PageServerLoad = (async () => {
	const profiles = await db.profile.findMany();
	const form = await superValidate(zod4(formSchema));
	return { profiles, form };
});

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod4(formSchema));
		if (!form.valid) {
			return fail(400, { form });
		}
		try {
			const profile = await db.profile.create({ data: form.data });
			return { form, profile };
		}
		catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				return setError(form, 'email', 'This email is already used');
			}
			throw error;
		}
	}
};
