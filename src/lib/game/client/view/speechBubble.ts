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
				align: 'center'
			})
			.setOrigin(0.5, 0.5)
			.setDepth(51)
			.setVisible(false);
		this.bg = scene.add.graphics().setDepth(50);
	}

	setText(text: string, tank: TankState): void {
		this.label.setVisible(true);
		this.label.setText(text);
		this.sync(tank);

		// Reset timer if message are display
		if (this.timer) this.timer.destroy();

		this.timer = this.scene.time.addEvent({
			delay: CHAT_BUBBLE_DURATION,
			callback: () => {
				this.label.setText('');
				this.label.setVisible(false);
				this.bg.clear();
			}
		});
	}

	sync(tank: TankState): void {
		const bx = tank.x;
		const by = tank.y - 80;

		this.bg.clear();

		if (!this.label.text) return;

		const pad = 5;
		const w = Math.max(this.label.width + pad * 2, 70);
		const h = this.label.height + pad * 2;
		const tailH = 10;

		this.bg.fillStyle(COLORS.white, 0.88); // Background
		this.bg.fillRoundedRect(bx - w / 2, by - h / 2, w, h, 8);
		this.bg.lineStyle(1.5, COLORS.black, 1); // Stroke chatbox
		this.bg.strokeRoundedRect(bx - w / 2, by - h / 2, w, h, 8);
		this.bg.fillStyle(COLORS.white, 0.88); // Arrow background
		this.bg.fillTriangle(bx - 7, by + h / 2, bx + 7, by + h / 2, bx, by + h / 2 + tailH);

		// Text center
		this.label.setPosition(bx, by);
	}
	destroy(): void {
		this.bg.destroy();
		this.label.destroy();
	}
}
