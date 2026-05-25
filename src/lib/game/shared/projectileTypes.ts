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
	splitCount?: number;
	airstrikeCount?: number;
	selectable?: boolean;
}

export const PROJECTILE_TYPES: ProjectileType[] = [
	// indices: 0=Shell 1=Heavy 2=Bouncer 3=Split 4=Airstrike 5=StrikeBomb
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
	},
	{
		name: 'Split',
		color: COLORS.shell,
		glowColor: COLORS.shellGlow,
		trailColor: COLORS.shellTrail,
		size: 6,
		speedFactor: 6,
		gravity: 380,
		craterRadius: 30,
		blastRadius: 60,
		maxDamage: 30,
		bounces: 0,
		splitCount: 3
	},
	{
		name: 'Airstrike',
		color: 0xffee44,
		glowColor: 0xffaa00,
		trailColor: 0xffaa00,
		size: 5,
		speedFactor: 7,
		gravity: 300,
		craterRadius: 0,
		blastRadius: 0,
		maxDamage: 0,
		bounces: 0,
		airstrikeCount: 5
	},
	{
		name: 'Strike Bomb',
		color: 0xff6600,
		glowColor: 0xff3300,
		trailColor: 0xff8800,
		size: 4,
		speedFactor: 0,
		gravity: 400,
		craterRadius: 35,
		blastRadius: 70,
		maxDamage: 30,
		bounces: 0,
		selectable: false
	}
];

export const AIRSTRIKE_TYPE_INDEX = PROJECTILE_TYPES.findIndex((t) => t.name === 'Airstrike');
export const STRIKE_BOMB_TYPE_INDEX = PROJECTILE_TYPES.findIndex((t) => t.name === 'Strike Bomb');
