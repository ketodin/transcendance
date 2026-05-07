import PreloadScene from './scenes/preloadScene';
import GameScene from './scenes/gameScene';
import { AUTO, Scale, Game, type Types } from 'phaser';

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 720;

// const DEFAULT_WIDTH = 3640
// const DEFAULT_HEIGHT = 2160

const config: Types.Core.GameConfig = {
	type: AUTO,
	backgroundColor: '#060612',
	scale: {
		mode: Scale.FIT,
		autoCenter: Scale.CENTER_BOTH,
		width: DEFAULT_WIDTH,
		height: DEFAULT_HEIGHT
	},
	scene: [PreloadScene, GameScene]
};

const StartGame = (parent: string) => {
	return new Game({ ...config, parent });
};

export default StartGame;
