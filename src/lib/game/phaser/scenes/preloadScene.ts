import { Scene } from 'phaser';

export default class PreloadScene extends Scene {
	constructor() {
		super({ key: 'PreloadScene' });
	}

	preload() {
		// assets will be loaded here when needed
	}

	create() {
		this.scene.start('GameScene');
	}
}
