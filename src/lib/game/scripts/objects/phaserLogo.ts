import { Scene, Physics } from 'phaser';

export default class PhaserLogo extends Physics.Arcade.Sprite {
	constructor(scene: Scene, x: number, y: number) {
		super(scene, x, y, 'phaser-logo');
		scene.add.existing(this);
		scene.physics.add.existing(this);

		this.setCollideWorldBounds(true)
			.setBounce(0.6)
			.setInteractive()
			.on('pointerdown', () => {
				this.setVelocityY(-400);
			});
	}
}
