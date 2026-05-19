import type { Room, Client } from 'colyseus';
import { CHAT_BUBBLE_DURATION } from '$lib/game/shared/chatConfig';

export function registerChatHandler(
    room: Room,
    getPlayerIndex: (client: Client) => number | undefined
) {
    const lastMessage = new Map<string, number>(); // anti-spam

    room.onMessage('chat', (client: Client, data: { text: string }) => {
    try {
        const playerIndex = getPlayerIndex(client);
        if (playerIndex === undefined) return;

        const now = Date.now();
        const last = lastMessage.get(client.sessionId) ?? 0;
        if (now - last < CHAT_BUBBLE_DURATION) return;

        const text = String(data.text).trim().slice(0, 80);
        if (!text) return;

        lastMessage.set(client.sessionId, now);

        room.broadcast('chat', { playerIndex, text });
    } catch (err) {
        console.error('[chatHandler] error:', err);
    }
});
}