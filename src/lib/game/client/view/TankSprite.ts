import { type TankState } from '../../shared/state/TankState';
import { GameObjects, Scene } from 'phaser';

export class TankSprite {
	private scene: Scene;
	private bodyGfx: GameObjects.Graphics;
	private turretGfx: GameObjects.Graphics;
	private healthGfx: GameObjects.Graphics;
	private nameLabel: GameObjects.Text;

	constructor(scene: Scene, state: TankState) {
		this.scene = scene;
		this.bodyGfx = scene.add.graphics();
		this.turretGfx = scene.add.graphics();
		this.healthGfx = scene.add.graphics();
		this.nameLabel = scene.add
			.text(state.x, state.y - 40, state.name, {
				fontSize: '14px',
				color: '#ffffff',
				stroke: '#000000',
				strokeThickness: 3
			})
			.setOrigin(0.5);
		this.sync(state);
	}

	sync(state: TankState): void {
		const { x, y, color, turretAngle, health } = state;
		this.nameLabel.setPosition(x, y - 40);
		this.drawBody(x, y, color);
		this.drawTurret(x, y, color, turretAngle);
		this.drawHealth(x, y, health);
	}

	private drawBody(x: number, y: number, color: number): void {
		this.bodyGfx.clear();
		this.bodyGfx.fillStyle(0x222222);
		this.bodyGfx.fillRect(x - 26, y - 3, 51, 10);
		for (let i = -18; i <= 18; i += 9) {
			this.bodyGfx.fillStyle(0x555555);
			this.bodyGfx.fillCircle(x + i, y + 4, 5);
		}
		this.bodyGfx.fillStyle(color);
		this.bodyGfx.fillRoundedRect(x - 21, y - 16, 42, 18, 3);
	}

	private drawTurret(x: number, y: number, color: number, turretAngle: number): void {
		this.turretGfx.clear();
		const rad = (turretAngle * Math.PI) / 180;
		const ex = x + Math.cos(rad) * 29;
		const ey = y - 10 - Math.sin(rad) * 29;
		this.turretGfx.lineStyle(6, color);
		this.turretGfx.beginPath();
		this.turretGfx.moveTo(x, y - 10);
		this.turretGfx.lineTo(ex, ey);
		this.turretGfx.strokePath();
		this.turretGfx.fillStyle(color);
		this.turretGfx.fillCircle(x, y - 10, 10);
	}

	private drawHealth(x: number, y: number, health: number): void {
		this.healthGfx.clear();
		const w = 42,
			h = 5;
		const bx = x - w / 2,
			by = y - 29;
		this.healthGfx.fillStyle(0x000000, 0.6);
		this.healthGfx.fillRect(bx - 1, by - 1, w + 2, h + 2);
		const pct = health / 100;
		const color = pct > 0.5 ? 0x00ff44 : pct > 0.25 ? 0xffdd00 : 0xff3333;
		this.healthGfx.fillStyle(color);
		this.healthGfx.fillRect(bx, by, w * pct, h);
	}

	explodeAndDestroy(state: TankState): void {
		this.bodyGfx.setVisible(false);
		this.turretGfx.setVisible(false);
		this.healthGfx.setVisible(false);
		this.nameLabel.setVisible(false);

		const flash = this.scene.add.graphics().setDepth(15);
		flash.fillStyle(0xffffff);
		flash.fillCircle(0, 0, 28);
		flash.setPosition(state.x, state.y - 8);
		this.scene.tweens.add({
			targets: flash,
			alpha: 0,
			scaleX: 2.5,
			scaleY: 2.5,
			duration: 350,
			ease: 'Quad.Out',
			onComplete: () => flash.destroy()
		});

		const pieces: { gfx: GameObjects.Graphics; vx: number; vy: number }[] = [];
		const colors = [state.color, 0x333333, 0x555555, 0xff6600, state.color];
		for (let i = 0; i < 12; i++) {
			const angle = (Math.PI * 2 * i) / 12 + (Math.random() - 0.5) * 0.6;
			const speed = 60 + Math.random() * 140;
			const size = 2 + Math.random() * 6;
			const gfx = this.scene.add.graphics().setDepth(14);
			gfx.fillStyle(colors[i % colors.length]);
			gfx.fillRect(-size / 2, -size / 2, size, size);
			gfx.setPosition(state.x, state.y - 8);
			pieces.push({ gfx, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 80 });
		}

		const DURATION = 1300;
		let elapsed = 0;
		const event = this.scene.time.addEvent({
			delay: 16,
			loop: true,
			callback: () => {
				elapsed += 16;
				const progress = Math.min(1, elapsed / DURATION);
				for (const p of pieces) {
					p.vy += 350 * 0.016;
					p.gfx.x += p.vx * 0.016;
					p.gfx.y += p.vy * 0.016;
					p.gfx.setAlpha(1 - progress);
				}
				if (progress >= 1) {
					for (const p of pieces) p.gfx.destroy();
					event.destroy();
				}
			}
		});
	}

	destroy(): void {
		this.bodyGfx.destroy();
		this.turretGfx.destroy();
		this.healthGfx.destroy();
		this.nameLabel.destroy();
	}
}
