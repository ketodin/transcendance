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
	fixedDamage?: boolean;
}

export const PROJECTILE_TYPES: ProjectileType[] = [
	// indices: 0=Shell 1=Heavy 2=Bouncer 3=Split 4=Airstrike 5=StrikeBomb 6=Sniper
	{
		name: 'Shell',
		color: COLORS.shell,
		glowColor: COLORS.shellGlow,
		trailColor: COLORS.shellTrail,
		size: 5,
		speedFactor: 7,
		gravity: 350,
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
		speedFactor: 7,
		gravity: 400,
		craterRadius: 60,
		blastRadius: 110,
		maxDamage: 60,
		bounces: 0
	},
	{
		name: 'Bouncer',
		color: COLORS.bouncer,
		glowColor: COLORS.bouncerGlow,
		trailColor: COLORS.bouncerGlow,
		size: 4,
		speedFactor: 7,
		gravity: 280,
		craterRadius: 22,
		blastRadius: 50,
		maxDamage: 30,
		bounces: 2,
		fixedDamage: true
	},
	{
		name: 'Split',
		color: COLORS.split,
		glowColor: COLORS.splitGlow,
		trailColor: COLORS.splitTrail,
		size: 6,
		speedFactor: 7,
		gravity: 280,
		craterRadius: 30,
		blastRadius: 60,
		maxDamage: 30,
		bounces: 0,
		splitCount: 3
	},
	{
		name: 'Airstrike',
		color: COLORS.airstrike,
		glowColor: COLORS.airstrikeGlow,
		trailColor: COLORS.airstrikeTrail,
		size: 5,
		speedFactor: 7,
		gravity: 280,
		craterRadius: 0,
		blastRadius: 0,
		maxDamage: 0,
		bounces: 0,
		airstrikeCount: 5
	},
	{
		name: 'Strike Bomb',
		color: COLORS.strikeBomb,
		glowColor: COLORS.strikeBombGlow,
		trailColor: COLORS.strikeBombTrail,
		size: 4,
		speedFactor: 0,
		gravity: 400,
		craterRadius: 35,
		blastRadius: 70,
		maxDamage: 30,
		bounces: 0,
		selectable: false
	},
	{
		name: 'Sniper',
		color: COLORS.sniper,
		glowColor: COLORS.sniperGlow,
		trailColor: COLORS.sniperTrail,
		size: 4,
		speedFactor: 7,
		gravity: 280,
		craterRadius: 22,
		blastRadius: 40,
		maxDamage: 50,
		bounces: 0,
		fixedDamage: true
	}
];

export const AIRSTRIKE_TYPE_INDEX = PROJECTILE_TYPES.findIndex((t) => t.name === 'Airstrike');
export const STRIKE_BOMB_TYPE_INDEX = PROJECTILE_TYPES.findIndex((t) => t.name === 'Strike Bomb');
