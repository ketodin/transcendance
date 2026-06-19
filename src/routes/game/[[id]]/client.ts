import { colyseusClient } from '$lib/colyseusClient';
import { MatchMakeError } from '@colyseus/sdk';
import { applyAction } from '$app/forms';
import { m } from '$lib/paraglide/messages';
import type { Room } from '@colyseus/sdk';
import type { GameRoomState } from '$lib/game/colyseus/schema/GameRoomState';

const reconnectRoom = async (roomId?: string) => {
	const paramsId = localStorage.getItem('reconnectionTokenParamsId');
	const reconnectionToken = localStorage.getItem('reconnectionToken');
	if (paramsId == null || reconnectionToken == null) {
		localStorage.removeItem('reconnectionToken');
		localStorage.removeItem('reconnectionTokenParamsId');
		return null;
	}
	if (paramsId !== (roomId ?? '')) {
		localStorage.removeItem('reconnectionToken');
		localStorage.removeItem('reconnectionTokenParamsId');
		return null;
	}
	const exist = await checkRoomReconnectExists(reconnectionToken.split(':')[0]);
	if (!exist) {
		localStorage.removeItem('reconnectionToken');
		localStorage.removeItem('reconnectionTokenParamsId');
		return null;
	}
	try {
		return (await colyseusClient!.reconnect(reconnectionToken)) as Room<GameRoomState>;
	} catch {
		localStorage.removeItem('reconnectionToken');
		localStorage.removeItem('reconnectionTokenParamsId');
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
	return { status: 404, error: { message } };
};

const checkRoomExists = async (roomId: string): Promise<boolean> => {
	try {
		const res = await fetch(`/game/check-room?id=${encodeURIComponent(roomId)}`);
		const data = (await res.json()) as { exists: boolean };
		return data.exists;
	} catch {
		return false;
	}
};

const checkRoomReconnectExists = async (roomId: string): Promise<boolean> => {
	try {
		const res = await fetch(`/game/check-room-reconnect?id=${encodeURIComponent(roomId)}`);
		const data = (await res.json()) as { exists: boolean };
		return data.exists;
	} catch {
		return false;
	}
};

export const connectToRoom = async (roomId?: string) => {
	const originalWarn = console.warn;
	console.warn = () => {};
	try {
		const room = await reconnectRoom(roomId);
		if (room) {
			localStorage.setItem('reconnectionToken', room.reconnectionToken);
			localStorage.setItem('reconnectionTokenParamsId', roomId ?? '');
			return room;
		}
		if (roomId) {
			const exists = await checkRoomExists(roomId);
			if (!exists) {
				await applyAction({
					type: 'error',
					status: 404,
					error: { message: m.error_room_not_exist() }
				});
				return null;
			}
		}
		const newRoom = roomId
			? await colyseusClient!.joinById(roomId, {})
			: await colyseusClient!.joinOrCreate('tank_room', {});

		localStorage.setItem('reconnectionToken', newRoom.reconnectionToken);
		localStorage.setItem('reconnectionTokenParamsId', roomId ?? '');
		return newRoom;
	} catch (err) {
		const msg =
			err instanceof MatchMakeError
				? handleMatchMakeError(err)
				: { status: 400, error: { message: err instanceof Error ? err.message : String(err) } };
		await applyAction({ type: 'error', ...msg });
		return null;
	} finally {
		console.warn = originalWarn;
	}
};
