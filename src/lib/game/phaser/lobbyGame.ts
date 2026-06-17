import './patchTextShadow';
import DemoScene from './scenes/demoScene';
import { commonGameConfig } from './commonGameConfig';
import { Game } from 'phaser';

const StartLobbyGame = (parent: string) => {
	return new Game({ ...commonGameConfig, scene: [DemoScene], parent });
};

export default StartLobbyGame;
