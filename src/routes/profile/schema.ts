import z from "zod";

export const formSchema = z.strictObject({
	username: z.string().min(3).max(32)
		.regex(/^\S+$/, {message: "Spaces are not allowed"}),
	email: z.email(),
	bio: z.string().nullish()
		.transform((val) => (val === "" ? null : val ?? null)),
})

export type FormSchema = typeof formSchema;
