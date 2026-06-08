import type { TankState } from '../../../shared/state/TankState';

export type InputSnapshot = {
	moveLeft: boolean;
	moveRight: boolean;
};

export type ProjectileSnapshot = {
	active: boolean;
	x: number;
	y: number;
	typeIndex: number;
	bouncesLeft: number;
};

export type FragmentSnapshot = { x: number; y: number; typeIndex: number };

export type GameUpdateData = {
	tanks: [TankState, TankState];
	projectile: ProjectileSnapshot;
	fragments?: FragmentSnapshot[];
	turnTimeLeft: number;
	fuel: number;
	weaponIndex: number;
	weaponCooldowns?: [boolean[], boolean[]];
};
