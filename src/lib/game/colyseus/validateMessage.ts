import type { Client } from 'colyseus';
import type { z } from 'zod';

/**
 * Wraps a Colyseus message handler with Zod validation: invalid payloads
 * are logged and dropped before they can reach the handler logic, so every
 * message is rejected the same way.
 */
export function validated<S extends z.ZodType>(
	schema: S,
	handler: (client: Client, data: z.infer<S>) => void
): (client: Client, data: unknown) => void {
	return (client, data) => {
		const result = schema.safeParse(data);
		if (!result.success) {
			console.warn(
				`[validation] rejected message from ${client.sessionId}:`,
				result.error.issues[0]?.message ?? 'invalid payload'
			);
			return;
		}
		handler(client, result.data);
	};
}
