import { type ProjectileType } from './projectileTypes';
import { Scene, GameObjects, Math as PhaserMath } from 'phaser';

const TRAIL_LENGTH = 35;

export class Projectile {
	x: number;
	y: number;
	prevX: number;
	prevY: number;

	private scene: Scene;
	private gfx: GameObjects.Graphics;
	private vx: number;
	private vy: number;
	private trail: { x: number; y: number }[] = [];
	private type: ProjectileType;
	private bouncesLeft: number;

	constructor(
		scene: Scene,
		x: number,
		y: number,
		angleDeg: number,
		power: number,
		type: ProjectileType
	) {
		this.scene = scene;
		this.x = x;
		this.y = y;
		this.prevX = x;
		this.prevY = y;
		this.type = type;
		this.bouncesLeft = type.bounces;

		const rad = PhaserMath.DegToRad(angleDeg);
		const speed = power * type.speedFactor;
		this.vx = Math.cos(rad) * speed;
		this.vy = -Math.sin(rad) * speed;

		this.gfx = scene.add.graphics();
	}

	update(delta: number) {
		this.prevX = this.x;
		this.prevY = this.y;
		const dt = delta / 1000;
		this.vy += this.type.gravity * dt;
		this.x += this.vx * dt;
		this.y += this.vy * dt;

		this.trail.push({ x: this.x, y: this.y });
		if (this.trail.length > TRAIL_LENGTH) this.trail.shift();

		this.draw();
	}

	// Returns true if bounced, false if should explode
	bounce(impactX: number, impactY: number, normalX: number, normalY: number): boolean {
		if (this.bouncesLeft <= 0) return false;
		this.bouncesLeft--;
		this.x = impactX + normalX * 3;
		this.y = impactY - 2;
		if (this.trail.length > 0) {
			this.trail[this.trail.length - 1] = { x: this.x, y: this.y };
		}
		const dot = this.vx * normalX + this.vy * normalY;
		this.vx = (this.vx - 2 * dot * normalX) * 0.65;
		this.vy = (this.vy - 2 * dot * normalY) * 0.65;
		this.draw();
		return true;
	}

	private draw() {
		this.gfx.clear();
		const { color, glowColor, trailColor, size } = this.type;

		for (let i = 1; i < this.trail.length; i++) {
			const alpha = i / this.trail.length;
			this.gfx.lineStyle(2, trailColor, alpha * 0.7);
			this.gfx.beginPath();
			this.gfx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
			this.gfx.lineTo(this.trail[i].x, this.trail[i].y);
			this.gfx.strokePath();
		}

		this.gfx.fillStyle(glowColor, 0.25);
		this.gfx.fillCircle(this.x, this.y, size * 2.2);
		this.gfx.fillStyle(glowColor, 0.5);
		this.gfx.fillCircle(this.x, this.y, size * 1.4);
		this.gfx.fillStyle(color);
		this.gfx.fillCircle(this.x, this.y, size);
	}

	isOutOfBounds() {
		const { width, height } = this.scene.scale;
		return this.x < -50 || this.x > width + 50 || this.y > height + 50;
	}

	destroy() {
		this.gfx.destroy();
	}
}
