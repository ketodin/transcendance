import { Scene, GameObjects } from 'phaser';
import { COLOR_STRINGS } from '../colors';

export default class FpsText extends GameObjects.Text {
	constructor(scene: Scene) {
		super(scene, 10, 10, '', { color: COLOR_STRINGS.black, fontSize: '28px' });
		scene.add.existing(this);
		this.setOrigin(0);
	}

	public update() {
		this.setText(`fps: ${Math.floor(this.scene.game.loop.actualFps)}`);
	}
}
