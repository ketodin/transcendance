import GameScene from './scenes/gameScene/GameScene';
import { AUTO, Scale, Game } from 'phaser';
import type { Room } from '@colyseus/sdk';
import type { GameRoomState } from '$lib/game/colyseus/schema/GameRoomState';

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;

const StartGame = (parent: string, room: Room<GameRoomState>) => {

	return new Game({
		type: AUTO,
		scale: {
			mode: Scale.FIT,
			autoCenter: Scale.CENTER_BOTH,
			width: DEFAULT_WIDTH,
			height: DEFAULT_HEIGHT
		},
		scene: [new GameScene({room: room})],
		transparent: true,
		parent
	});
};

export default StartGame;
