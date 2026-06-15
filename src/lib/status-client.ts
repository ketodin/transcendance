import { Callbacks } from '@colyseus/sdk';
import { writable } from 'svelte/store';
import { colyseusClient } from '$lib/colyseusClient';
import type { FriendStatus, StatusState } from './game/colyseus/schema/StatusRoomState';
import { browser } from '$app/environment';
import { attachNotificationListeners } from './notification-client';

export const presenceById = writable<Record<string, boolean>>({});

let connected = false;
let roomLeave: (() => Promise<void> | void) | null = null;
let disconnecting = false;

export async function connectStatusRoom() {
	if (!browser) return () => {};
	if (disconnecting) return () => {};
	if (connected) return roomLeave;

	const room = await colyseusClient!.joinOrCreate<StatusState>('status');
	connected = true;
	attachNotificationListeners(room);
	const cb = Callbacks.get(room);
	const stops = new Map<string, () => void>();

	cb.onAdd('friends', (friend: FriendStatus, id: string) => {
		presenceById.update((v) => ({ ...v, [id]: friend.online }));

		const stop = cb.listen(friend, 'online', (online) => {
			presenceById.update((v) => ({ ...v, [id]: online }));
		});

		stops.set(id, stop);
	});

	cb.onRemove('friends', (_friend: FriendStatus, id: string) => {
		stops.get(id)?.();
		stops.delete(id);

		presenceById.update((v) => {
			const copy = { ...v };
			delete copy[id];
			return copy;
		});
	});

	roomLeave = async () => {
		connected = false;
		for (const stop of stops.values()) stop();
		stops.clear();
		presenceById.set({});
		await room.leave();
		roomLeave = null;
	};

	return roomLeave;
}

export function disconnectStatusRoom() {
	disconnecting = true;
	return roomLeave?.();
}
