import { COLORS } from '../phaser/colors';

export interface ProjectileType {
	name: string;
	color: number;
	glowColor: number;
	trailColor: number;
	size: number;
	speedFactor: number;
	gravity: number;
	craterRadius: number;
	blastRadius: number;
	maxDamage: number;
	bounces: number;
}

export const PROJECTILE_TYPES: ProjectileType[] = [
	{
		name: 'Shell',
		color: COLORS.shell,
		glowColor: COLORS.shellGlow,
		trailColor: COLORS.shellTrail,
		size: 5,
		speedFactor: 6,
		gravity: 400,
		craterRadius: 45,
		blastRadius: 80,
		maxDamage: 45,
		bounces: 0
	},
	{
		name: 'Heavy',
		color: COLORS.heavy,
		glowColor: COLORS.heavyGlow,
		trailColor: COLORS.heavyGlow,
		size: 9,
		speedFactor: 4,
		gravity: 520,
		craterRadius: 60,
		blastRadius: 110,
		maxDamage: 70,
		bounces: 0
	},
	{
		name: 'Bouncer',
		color: COLORS.bouncer,
		glowColor: COLORS.bouncerGlow,
		trailColor: COLORS.bouncerGlow,
		size: 4,
		speedFactor: 7,
		gravity: 350,
		craterRadius: 22,
		blastRadius: 50,
		maxDamage: 22,
		bounces: 2
	}
];
