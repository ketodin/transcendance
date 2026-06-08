import { getTurretTip } from '../../../shared/logic/physics';
import { COLORS } from '../../colors';
import type { TankState } from '../../../shared/state/TankState';
import type { TerrainState } from '../../../shared/state/TerrainState';
import { Scene, GameObjects } from 'phaser';

interface DrawCtx {
	sw(n: number): number;
}

export function drawLastShotTrail(
	gfx: GameObjects.Graphics,
	trail: Array<{ x: number; y: number }>,
	ctx: DrawCtx
) {
	gfx.clear();
	if (trail.length < 2) return;
	const step = Math.max(1, Math.floor(trail.length / 80));
	for (let i = 0; i < trail.length; i += step) {
		const alpha = 0.15 + 0.4 * (i / trail.length);
		gfx.fillStyle(COLORS.aiming, alpha);
		gfx.fillCircle(trail[i].x, trail[i].y, ctx.sw(1));
	}
}

export function drawTrajectory(
	gfx: GameObjects.Graphics,
	tank: TankState,
	terrain: TerrainState | undefined,
	power: number
) {
	gfx.clear();
	const tip = getTurretTip(tank, terrain);
	const rad = (tank.turretAngle * Math.PI) / 180;

	const maxLength = (80 + 100 * 2.33) * 0.75;
	const length = (80 + power * 2.33) * 0.75;
	const halfAngle = 5 * (Math.PI / 180);

	const tx = tip.x;
	const ty = tip.y;

	const pivotX = tx - Math.cos(rad) * 40;
	const pivotY = ty + Math.sin(rad) * 40;

	gfx.fillStyle(COLORS.aiming, 0.06);
	gfx.fillCircle(pivotX, pivotY, maxLength + 40);

	const lx = tx + Math.cos(rad + halfAngle) * length;
	const ly = ty - Math.sin(rad + halfAngle) * length;
	const rx = tx + Math.cos(rad - halfAngle) * length;
	const ry = ty - Math.sin(rad - halfAngle) * length;
	gfx.fillStyle(COLORS.aiming, 0.07);
	gfx.fillTriangle(tx, ty, lx, ly, rx, ry);

	const innerHalf = halfAngle * 0.35;
	const ilx = tx + Math.cos(rad + innerHalf) * length;
	const ily = ty - Math.sin(rad + innerHalf) * length;
	const irx = tx + Math.cos(rad - innerHalf) * length;
	const iry = ty - Math.sin(rad - innerHalf) * length;
	gfx.fillStyle(COLORS.aiming, 0.18);
	gfx.fillTriangle(tx, ty, ilx, ily, irx, iry);

	gfx.lineStyle(1, COLORS.aiming, 0.22);
	gfx.beginPath();
	gfx.moveTo(tx, ty);
	gfx.lineTo(tx + Math.cos(rad) * length, ty - Math.sin(rad) * length);
	gfx.strokePath();
}

export function showAirstrikeZone(scene: Scene, x: number) {
	const SPREAD = 150;
	const h = scene.scale.height;
	const gfx = scene.add.graphics().setDepth(7);

	gfx.fillStyle(0xff9900, 0.07);
	gfx.fillRect(x - SPREAD, 0, SPREAD * 2, h);

	gfx.lineStyle(2, 0xffee44, 0.9);
	gfx.beginPath();
	gfx.moveTo(x, 0);
	gfx.lineTo(x, h);
	gfx.strokePath();

	gfx.lineStyle(1, 0xff9900, 0.5);
	gfx.beginPath();
	gfx.moveTo(x - SPREAD, 0);
	gfx.lineTo(x - SPREAD, h);
	gfx.moveTo(x + SPREAD, 0);
	gfx.lineTo(x + SPREAD, h);
	gfx.strokePath();

	scene.tweens.add({
		targets: gfx,
		alpha: 0,
		duration: 500,
		delay: 300,
		onComplete: () => gfx.destroy()
	});
}

export function handleExplosionFx(
	scene: Scene,
	x: number,
	y: number,
	craterRadius: number,
	blastRadius: number
) {
	scene.cameras.main.shake(350, blastRadius * 0.00018);

	const gfx = scene.add.graphics().setDepth(5);
	gfx.fillStyle(COLORS.craterOuter).fillCircle(x, y, craterRadius * 0.93);
	gfx.fillStyle(COLORS.craterMid).fillCircle(x, y, craterRadius * 0.57);
	gfx.fillStyle(COLORS.white).fillCircle(x, y, craterRadius * 0.26);
	scene.time.delayedCall(450, () => gfx.destroy());

	spawnCraterDust(scene, x, y, craterRadius);
}

function spawnCraterDust(scene: Scene, x: number, y: number, radius: number) {
	const count = Math.floor(radius * 1.2);
	const colors = [
		COLORS.terrain,
		COLORS.terrainDark,
		COLORS.neonGlow,
		COLORS.craterStone,
		COLORS.craterGrey
	];
	const pieces: { gfx: GameObjects.Graphics; vx: number; vy: number }[] = [];

	for (let i = 0; i < count; i++) {
		const angle = Math.PI + (Math.random() - 0.5) * Math.PI;
		const speed = radius * 1.5 + Math.random() * radius * 2;
		const size = 2 + Math.random() * 4;
		const spawnAngle = Math.random() * Math.PI * 2;
		const spawnDist = radius * (0.5 + Math.random() * 0.6);
		const gfx = scene.add.graphics().setDepth(6);
		gfx.fillStyle(colors[Math.floor(Math.random() * colors.length)]);
		gfx.fillCircle(0, 0, size);
		gfx.setPosition(x + Math.cos(spawnAngle) * spawnDist, y + Math.sin(spawnAngle) * spawnDist);
		pieces.push({ gfx, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - speed * 0.8 });
	}

	const DURATION = 900;
	let elapsed = 0;
	const event = scene.time.addEvent({
		delay: 16,
		loop: true,
		callback: () => {
			elapsed += 16;
			const progress = Math.min(1, elapsed / DURATION);
			for (const p of pieces) {
				p.vy += 400 * 0.016;
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
