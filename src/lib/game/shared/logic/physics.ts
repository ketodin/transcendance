import { type ProjectileState } from '../state/ProjectileState';
import { type TerrainState } from '../state/TerrainState';
import { type TankState } from '../state/TankState';
import { PROJECTILE_TYPES } from '../projectileTypes';
import { getHeightAt } from './terrain';

const TRAIL_LENGTH = 35;
const TANK_HIT_RADIUS = 30;

export type PhysicsResult =
	| { type: 'ok' }
	| { type: 'explode'; x: number; y: number }
	| { type: 'oob' };

export function getTurretTip(tank: TankState): { x: number; y: number } {
	const rad = (tank.turretAngle * Math.PI) / 180;
	return {
		x: tank.x + Math.cos(rad) * 34,
		y: tank.y - 10 - Math.sin(rad) * 34
	};
}

export function createProjectile(
	x: number,
	y: number,
	angleDeg: number,
	power: number,
	typeIndex: number
): ProjectileState {
	const type = PROJECTILE_TYPES[typeIndex];
	const rad = (angleDeg * Math.PI) / 180;
	const speed = power * type.speedFactor;
	return {
		x,
		y,
		prevX: x,
		prevY: y,
		vx: Math.cos(rad) * speed,
		vy: -Math.sin(rad) * speed,
		trail: [],
		typeIndex,
		bouncesLeft: type.bounces
	};
}

export function stepProjectile(
	proj: ProjectileState,
	terrain: TerrainState,
	tanks: [TankState, TankState],
	delta: number
): PhysicsResult {
	const type = PROJECTILE_TYPES[proj.typeIndex];
	const dt = delta / 1000;

	proj.prevX = proj.x;
	proj.prevY = proj.y;
	proj.vy += type.gravity * dt;
	proj.x += proj.vx * dt;
	proj.y += proj.vy * dt;

	proj.trail.push({ x: proj.x, y: proj.y });
	if (proj.trail.length > TRAIL_LENGTH) proj.trail.shift();

	if (proj.x < -50 || proj.x > terrain.sceneWidth + 50 || proj.y > terrain.sceneHeight + 50) {
		return { type: 'oob' };
	}

	for (const tank of tanks) {
		const dx = proj.x - tank.x;
		const dy = proj.y - tank.y;
		if (dx * dx + dy * dy < TANK_HIT_RADIUS * TANK_HIT_RADIUS) {
			return { type: 'explode', x: proj.x, y: proj.y };
		}
	}

	const terrainY = getHeightAt(terrain, proj.x);
	if (proj.y >= terrainY) {
		const prevTerrainY = getHeightAt(terrain, proj.prevX);
		let impactX = proj.x;
		let impactY = proj.y;
		if (proj.prevY < prevTerrainY) {
			const denom = proj.y - proj.prevY - (terrainY - prevTerrainY);
			if (Math.abs(denom) > 0.001) {
				const t = Math.max(0, Math.min(1, (prevTerrainY - proj.prevY) / denom));
				impactX = proj.prevX + t * (proj.x - proj.prevX);
				impactY = proj.prevY + t * (proj.y - proj.prevY);
			}
		}

		const slopeDx = 15;
		const hLeft = getHeightAt(terrain, impactX - slopeDx);
		const hRight = getHeightAt(terrain, impactX + slopeDx);
		const nx = hRight - hLeft;
		const ny = -2 * slopeDx;
		const len = Math.sqrt(nx * nx + ny * ny);
		const normalX = nx / len;
		const normalY = ny / len;

		if (proj.bouncesLeft > 0) {
			proj.bouncesLeft--;
			proj.x = impactX + normalX * 3;
			proj.y = impactY - 2;
			if (proj.trail.length > 0) {
				proj.trail[proj.trail.length - 1] = { x: proj.x, y: proj.y };
			}
			const dot = proj.vx * normalX + proj.vy * normalY;
			proj.vx = (proj.vx - 2 * dot * normalX) * 0.65;
			proj.vy = (proj.vy - 2 * dot * normalY) * 0.65;
			return { type: 'ok' };
		}

		return { type: 'explode', x: impactX, y: impactY };
	}

	return { type: 'ok' };
}
