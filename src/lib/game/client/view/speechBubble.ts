import { type TankState } from '$lib/game/shared/state/TankState';
import { GameObjects, Scene } from 'phaser';
import { COLORS, COLOR_STRINGS } from '$lib/game/phaser/colors';
import { CHAT_BUBBLE_DURATION } from '$lib/game/shared/chatConfig';

export class SpeechBubble {
	private bg: GameObjects.Graphics;
	private label: GameObjects.Text;
	private scene: Scene;
	private timer?: Phaser.Time.TimerEvent;

	constructor(scene: Scene) {
		this.scene = scene;
		this.label = scene.add
			.text(0, 0, '', {
				fontSize: '13px',
				color: COLOR_STRINGS.black,
				wordWrap: { width: 160 },
				align: 'center',
			})
			.setOrigin(0.5, 0.5)
			.setDepth(51)
			.setVisible(false);
		this.bg = scene.add.graphics().setDepth(50);
	}

	destroy(): void {
		this.bg.destroy();
		this.label.destroy();
	}
}