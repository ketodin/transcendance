import PhaserLogo from '../objects/phaserLogo';
import FpsText from '../objects/fpsText';
import { Scene, VERSION } from 'phaser';
import { COLOR_STRINGS } from '../colors';

export default class MainScene extends Scene {
	fpsText: FpsText | undefined;

	constructor() {
		super({ key: 'MainScene' });
	}

	create() {
		new PhaserLogo(this, this.cameras.main.width / 2, 0);
		this.fpsText = new FpsText(this);

		// display the Phaser.VERSION
		this.add
			.text(this.cameras.main.width - 15, 15, `Phaser v${VERSION}`, {
				color: COLOR_STRINGS.black,
				fontSize: '24px'
			})
			.setOrigin(1, 0);
	}

	update() {
		if (this.fpsText) {
			this.fpsText.update();
		}
	}
}
