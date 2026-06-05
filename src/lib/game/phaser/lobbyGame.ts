import DemoScene from './scenes/demoScene';
import { AUTO, Scale, Game, type Types } from 'phaser';

const config: Types.Core.GameConfig = {
	type: AUTO,
	scale: {
		mode: Scale.FIT,
		autoCenter: Scale.CENTER_BOTH,
		width: 1920,
		height: 1080
	},
	scene: [DemoScene]
};

const StartLobbyGame = (parent: string) => {
	return new Game({ ...config, transparent: true, parent });
};

export default StartLobbyGame;
