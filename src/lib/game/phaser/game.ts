import GameScene from './scenes/gameScene/GameScene';
import { Game } from 'phaser';
import type { Room } from '@colyseus/sdk';
import type { GameRoomState } from '$lib/game/colyseus/schema/GameRoomState';
import { commonGameConfig } from './commonGameConfig';

const StartGame = (parent: string, room: Room<GameRoomState>) => {
	return new Game({
		...commonGameConfig,
		scene: [new GameScene({ room: room })],
		parent
	});
};

export default StartGame;
