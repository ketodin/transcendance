import { type TankState } from '../../shared/state/TankState';
import { type TerrainState } from '../../shared/state/TerrainState';
import { getHeightAt } from '../../shared/logic/terrain';
import { GameObjects, Scene } from 'phaser';
import { COLORS, COLOR_STRINGS } from '../../phaser/colors';

const HULL_H = 17; // height from terrain contact to hull top

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
			.text(state.x, state.y - 48, state.name, {
				fontSize: '12px',
				color: COLOR_STRINGS.white,
				stroke: COLOR_STRINGS.black,
				strokeThickness: 3
			})
			.setOrigin(0.5);
		this.sync(state, null);
	}

	sync(state: TankState, terrain: TerrainState | null): void {
		const { x, y, color, turretAngle, health, facing } = state;

		let slope = 0;
		if (terrain) {
			const ly = getHeightAt(terrain, x - 15);
			const ry = getHeightAt(terrain, x + 15);
			slope = Math.atan2(ry - ly, 30);
		}

		// Hull-top world position after rotation (for barrel pivot + UI)
		const hx = x + HULL_H * Math.sin(slope);
		const hy = y - HULL_H * Math.cos(slope);

		this.nameLabel.setPosition(hx, hy - 31);
		this.drawBody(x, y, color, facing, slope);
		this.drawBarrel(hx, hy, color, turretAngle);
		this.drawHealth(hx, hy, health);
	}

	private static shade(c: number, f: number): number {
		const r = Math.min(255, Math.floor(((c >> 16) & 0xff) * f));
		const g = Math.min(255, Math.floor(((c >> 8) & 0xff) * f));
		const b = Math.min(255, Math.floor((c & 0xff) * f));
		return (r << 16) | (g << 8) | b;
	}

	// Hull + turret body drawn at local origin, rotated with terrain slope
	private drawBody(x: number, y: number, color: number, facing: 1 | -1, slope: number): void {
		this.bodyGfx.clear();
		this.bodyGfx.setPosition(x, y);
		this.bodyGfx.setRotation(slope);

		const f = facing;
		const dark = TankSprite.shade(color, 0.45);
		const mid = TankSprite.shade(color, 0.68);

		// === TRACKS ===
		this.bodyGfx.fillStyle(0x141414);
		this.bodyGfx.fillRoundedRect(-28, -9, 56, 11, 3);

		this.bodyGfx.fillStyle(0x242424);
		for (let i = -26; i <= 26; i += 5) {
			this.bodyGfx.fillRect(i - 1, -9, 3, 2);
			this.bodyGfx.fillRect(i - 1, 0, 3, 2);
		}

		for (const wx of [-20, -12, -4, 4, 12, 20]) {
			this.bodyGfx.fillStyle(0x303030);
			this.bodyGfx.fillCircle(wx, -2, 4.5);
			this.bodyGfx.fillStyle(0x585858);
			this.bodyGfx.fillCircle(wx, -2, 2);
			this.bodyGfx.fillStyle(0x888888);
			this.bodyGfx.fillCircle(wx, -2, 0.8);
		}

		this.bodyGfx.fillStyle(0x3a3a3a);
		this.bodyGfx.fillCircle(f * 26, -2, 5.5);
		this.bodyGfx.fillStyle(0x181818);
		this.bodyGfx.fillCircle(f * 26, -2, 2.5);
		for (let i = 0; i < 6; i++) {
			const a = (i / 6) * Math.PI * 2;
			this.bodyGfx.fillStyle(0x484848);
			this.bodyGfx.fillRect(f * 26 + Math.cos(a) * 3.5 - 1, -2 + Math.sin(a) * 3.5 - 1, 2, 2);
		}

		this.bodyGfx.fillStyle(0x2e2e2e);
		this.bodyGfx.fillCircle(-f * 26, -2, 4.5);
		this.bodyGfx.fillStyle(0x4e4e4e);
		this.bodyGfx.fillCircle(-f * 26, -2, 2);

		// === HULL ===
		this.bodyGfx.fillStyle(dark);
		this.bodyGfx.fillRect(-25, -13, 50, 4);

		this.bodyGfx.fillStyle(color);
		this.bodyGfx.fillRect(-23, -HULL_H, 46, 4);

		this.bodyGfx.fillStyle(mid);
		this.bodyGfx.fillTriangle(f * 23, -HULL_H, f * 23, -11, f * 28, -12);

		this.bodyGfx.fillStyle(dark);
		this.bodyGfx.fillRect(f > 0 ? -28 : 23, -16, 5, 5);

		this.bodyGfx.fillStyle(0xffffff, 0.07);
		this.bodyGfx.fillRect(-23, -HULL_H, 46, 1);

		// === TURRET BODY (local coords: turret base at (0, -HULL_H)) ===
		const lty = -HULL_H; // turret base in local space

		// Turret ring
		this.bodyGfx.fillStyle(dark);
		this.bodyGfx.fillRect(-15, lty - 1, 30, 2);

		// Hexagonal turret body
		this.bodyGfx.fillStyle(color);
		this.bodyGfx.beginPath();
		this.bodyGfx.moveTo(-15, lty);
		this.bodyGfx.lineTo(-18, lty - 9);
		this.bodyGfx.lineTo(-13, lty - 16);
		this.bodyGfx.lineTo(13, lty - 16);
		this.bodyGfx.lineTo(18, lty - 9);
		this.bodyGfx.lineTo(15, lty);
		this.bodyGfx.closePath();
		this.bodyGfx.fillPath();

		// Lower band shading
		this.bodyGfx.fillStyle(mid);
		this.bodyGfx.beginPath();
		this.bodyGfx.moveTo(-15, lty);
		this.bodyGfx.lineTo(-18, lty - 9);
		this.bodyGfx.lineTo(18, lty - 9);
		this.bodyGfx.lineTo(15, lty);
		this.bodyGfx.closePath();
		this.bodyGfx.fillPath();

		// Rear ammo bustle
		const bustleX = f > 0 ? -22 : 17;
		this.bodyGfx.fillStyle(dark);
		this.bodyGfx.fillRect(bustleX, lty - 14, 5, 12);
		this.bodyGfx.lineStyle(0.5, TankSprite.shade(color, 0.35), 1);
		this.bodyGfx.strokeRect(bustleX, lty - 14, 5, 12);
		for (let i = 1; i < 4; i++) {
			this.bodyGfx.beginPath();
			this.bodyGfx.moveTo(bustleX, lty - 14 + i * 3);
			this.bodyGfx.lineTo(bustleX + 5, lty - 14 + i * 3);
			this.bodyGfx.strokePath();
		}

		// Smoke dischargers (front of turret)
		for (let i = 0; i < 3; i++) {
			const sx = f > 0 ? 17 + i * 3 : -(17 + i * 3);
			this.bodyGfx.fillStyle(0x2a2a2a);
			this.bodyGfx.fillCircle(sx, lty - 5 - i * 0.5, 2);
			this.bodyGfx.fillStyle(0x444444);
			this.bodyGfx.fillCircle(sx, lty - 5 - i * 0.5, 1);
		}

		// Commander's cupola
		const cupolaX = f > 0 ? -7 : -4;
		this.bodyGfx.fillStyle(mid);
		this.bodyGfx.fillRect(cupolaX, lty - 20, 11, 5);
		this.bodyGfx.lineStyle(1, dark, 1);
		this.bodyGfx.strokeRect(cupolaX, lty - 20, 11, 5);
		this.bodyGfx.fillStyle(0x1a2a3a);
		this.bodyGfx.fillRect(cupolaX + 2, lty - 19, 7, 2);

		// Top highlight
		this.bodyGfx.fillStyle(0xffffff, 0.07);
		this.bodyGfx.beginPath();
		this.bodyGfx.moveTo(-13, lty - 16);
		this.bodyGfx.lineTo(-16, lty - 11);
		this.bodyGfx.lineTo(16, lty - 11);
		this.bodyGfx.lineTo(13, lty - 16);
		this.bodyGfx.closePath();
		this.bodyGfx.fillPath();
	}

	// Barrel only — drawn in world space, always upright
	private drawBarrel(hx: number, hy: number, color: number, turretAngle: number): void {
		this.turretGfx.clear();
		const dark = TankSprite.shade(color, 0.45);
		const mid = TankSprite.shade(color, 0.68);

		const rad = (turretAngle * Math.PI) / 180;
		const bx = hx;
		const by = hy - 7;

		// Mantlet
		this.turretGfx.fillStyle(dark);
		this.turretGfx.fillEllipse(bx + Math.cos(rad) * 13, by - Math.sin(rad) * 13, 14, 11);

		// Barrel base
		this.turretGfx.lineStyle(5, mid);
		this.turretGfx.beginPath();
		this.turretGfx.moveTo(bx + Math.cos(rad) * 11, by - Math.sin(rad) * 11);
		this.turretGfx.lineTo(bx + Math.cos(rad) * 21, by - Math.sin(rad) * 21);
		this.turretGfx.strokePath();

		// Thermal sleeve
		this.turretGfx.lineStyle(4, TankSprite.shade(color, 0.58));
		this.turretGfx.beginPath();
		this.turretGfx.moveTo(bx + Math.cos(rad) * 21, by - Math.sin(rad) * 21);
		this.turretGfx.lineTo(bx + Math.cos(rad) * 32, by - Math.sin(rad) * 32);
		this.turretGfx.strokePath();

		// Barrel tip
		this.turretGfx.lineStyle(2, TankSprite.shade(color, 0.5));
		this.turretGfx.beginPath();
		this.turretGfx.moveTo(bx + Math.cos(rad) * 32, by - Math.sin(rad) * 32);
		this.turretGfx.lineTo(bx + Math.cos(rad) * 40, by - Math.sin(rad) * 40);
		this.turretGfx.strokePath();
	}

	private drawHealth(hx: number, hy: number, health: number): void {
		this.healthGfx.clear();
		const w = 44,
			h = 5;
		const bx = hx - w / 2,
			by = hy - 22;
		this.healthGfx.fillStyle(COLORS.black, 0.6);
		this.healthGfx.fillRect(bx - 1, by - 1, w + 2, h + 2);
		const pct = health / 100;
		const color = pct > 0.5 ? COLORS.barHigh : pct > 0.25 ? COLORS.barMid : COLORS.barLow;
		this.healthGfx.fillStyle(color);
		this.healthGfx.fillRect(bx, by, w * pct, h);
	}

	explodeAndDestroy(state: TankState): void {
		this.bodyGfx.setVisible(false);
		this.turretGfx.setVisible(false);
		this.healthGfx.setVisible(false);
		this.nameLabel.setVisible(false);

		const flash = this.scene.add.graphics().setDepth(15);
		flash.fillStyle(COLORS.white);
		flash.fillCircle(0, 0, 32);
		flash.setPosition(state.x, state.y - 14);
		this.scene.tweens.add({
			targets: flash,
			alpha: 0,
			scaleX: 3,
			scaleY: 3,
			duration: 350,
			ease: 'Quad.Out',
			onComplete: () => flash.destroy()
		});

		const pieces: { gfx: GameObjects.Graphics; vx: number; vy: number }[] = [];
		const colors = [
			state.color,
			TankSprite.shade(state.color, 0.5),
			0x141414,
			0x404040,
			COLORS.craterOuter,
			state.color
		];
		for (let i = 0; i < 14; i++) {
			const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.5;
			const speed = 70 + Math.random() * 170;
			const size = 2 + Math.random() * 7;
			const gfx = this.scene.add.graphics().setDepth(14);
			gfx.fillStyle(colors[i % colors.length]);
			gfx.fillRect(-size / 2, -size / 2, size, size);
			gfx.setPosition(state.x, state.y - 14);
			pieces.push({ gfx, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 90 });
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
