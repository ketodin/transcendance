import type { Room, Client } from 'colyseus';
import { CHAT_BUBBLE_DURATION } from '$lib/game/shared/chatConfig';
import { ChatSchema } from '$lib/game/colyseus/messageSchemas';
import { validated } from '$lib/game/colyseus/validateMessage';

export function registerChatHandler(
	room: Room,
	getPlayerIndex: (client: Client) => number | undefined
) {
	const lastMessage = new Map<string, number>(); // anti-spam

	room.onMessage(
		'chat',
		validated(ChatSchema, (client, data) => {
			const playerIndex = getPlayerIndex(client);
			if (playerIndex === undefined) return;

			const now = Date.now();
			const last = lastMessage.get(client.sessionId) ?? 0;
			if (now - last < CHAT_BUBBLE_DURATION) return;

			lastMessage.set(client.sessionId, now);

			room.broadcast('chat', { playerIndex, text: data.text });
		})
	);
}
