import { type TankState } from './TankState.js';
import { type TerrainState } from './TerrainState.js';
import { type ProjectileState } from './ProjectileState.js';

export type TurnPhase = 'AIMING' | 'CHARGING' | 'FLYING' | 'OVER';

export interface GameState {
	tanks: [TankState, TankState];
	terrain: TerrainState;
	projectile?: ProjectileState;
	fragments: ProjectileState[];
	currentPlayer: 0 | 1;
	phase: TurnPhase;
	power: number;
	powerIncreasing: boolean;
	weaponIndex: number;
	fuel: number;
	turnTimeLeft: number;
	winner?: 0 | 1;
}
