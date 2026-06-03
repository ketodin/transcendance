import PreloadScene from './scenes/preloadScene';
import GameScene from './scenes/gameScene/GameScene';
import { AUTO, Scale, Game, type Types } from 'phaser';

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;

const config: Types.Core.GameConfig = {
	type: AUTO,
	scale: {
		mode: Scale.FIT,
		autoCenter: Scale.CENTER_BOTH,
		width: DEFAULT_WIDTH,
		height: DEFAULT_HEIGHT
	},
	scene: [PreloadScene, GameScene]
};

const StartGame = (parent: string) => {
	return new Game({ ...config, transparent: true, parent });
};

export default StartGame;
