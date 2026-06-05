import type { Room } from '@colyseus/sdk';
import { writable } from 'svelte/store';
import type { GameRoomState } from '$lib/game/colyseus/schema/GameRoomState';
import type { TankState } from '$lib/game/shared/state/TankState';
import type { TerrainState } from '$lib/game/shared/state/TerrainState';

export type GameStartData = {
	player0Id: string;
	player1Id: string;
	currentPlayer: number;
	terrain: TerrainState;
	tanks: [TankState, TankState];
	fuel: number;
	weaponIndex: number;
	turnTimeLeft: number;
	power: number;
	weaponCooldowns?: [boolean[], boolean[]];
};

export type PendingGameRoom = {
	room: Room<GameRoomState>;
	gameStartData: GameStartData;
};

export const pendingGameRoom = writable<PendingGameRoom | null>(null);

// Persiste la room de matchmaking à travers les remounts (ex: changement de langue)
export const searchingRoom = writable<Room<GameRoomState> | null>(null);
