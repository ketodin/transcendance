import { colyseusClient } from '$lib/colyseusClient';
import { MatchMakeError } from '@colyseus/sdk';
import { applyAction } from '$app/forms';
import { m } from '$lib/paraglide/messages';
import type { Room } from '@colyseus/sdk';
import type { GameRoomState } from '$lib/game/colyseus/schema/GameRoomState';

const reconnectRoom = async (roomId?: string) => {
	const reconnectionToken = localStorage.getItem('reconnectionToken');
	if (!reconnectionToken) return null;
	try {
		const newRoom = await colyseusClient!.reconnect(reconnectionToken);
		if (roomId && roomId !== newRoom.roomId) {
			await newRoom.leave();
			return null;
		}
		return newRoom as Room<GameRoomState>;
	} catch {
		localStorage.removeItem('reconnectionToken');
		return null;
	}
};

const handleMatchMakeError = (err: MatchMakeError) => {
	let message: string;
	if (err.message.match(/room ".*" not found/)) {
		message = m.error_room_not_exist();
	} else if (err.message === 'ALREADY_IN_A_GAME') {
		message = m.error_already_game();
	} else if (err.message === 'UNAUTHORIZED') {
		message = m.error_not_auth();
	} else {
		message = err.message;
	}
	return { status: err.code, error: { message: message } };
};

export const connectToRoom = async (roomId?: string) => {
	try {
		const room =
			(await reconnectRoom(roomId)) ??
			(roomId
				? await colyseusClient!.joinById(roomId, {})
				: await colyseusClient!.joinOrCreate('tank_room', {}));
		localStorage.setItem('reconnectionToken', room.reconnectionToken);
		return room;
	} catch (err) {
		const msg =
			err instanceof MatchMakeError
				? handleMatchMakeError(err)
				: { status: 400, error: { message: err instanceof Error ? err.message : String(err) } };
		await applyAction({ type: 'error', ...msg });
		return null;
	}
};
