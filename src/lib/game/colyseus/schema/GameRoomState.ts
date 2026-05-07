import { Schema, defineTypes } from '@colyseus/schema';
import { TankSchema } from './TankSchema';
import { TerrainSchema } from './TerrainSchema';
import { ProjectileSchema } from './ProjectileSchema';

export class GameRoomState extends Schema {
	phase: string = 'WAITING';
	currentPlayer: number = 0;
	tank0: TankSchema = new TankSchema();
	tank1: TankSchema = new TankSchema();
	terrain: TerrainSchema = new TerrainSchema();
	projectile: ProjectileSchema = new ProjectileSchema();
	power: number = 0;
	powerIncreasing: boolean = true;
	weaponIndex: number = 0;
	fuel: number = 100;
	turnTimeLeft: number = 30;
	winner: number = -1;
	player0Id: string = '';
	player1Id: string = '';
}

defineTypes(GameRoomState, {
	phase: 'string',
	currentPlayer: 'uint8',
	tank0: TankSchema,
	tank1: TankSchema,
	terrain: TerrainSchema,
	projectile: ProjectileSchema,
	power: 'float32',
	powerIncreasing: 'boolean',
	weaponIndex: 'uint8',
	fuel: 'float32',
	turnTimeLeft: 'float32',
	winner: 'int8',
	player0Id: 'string',
	player1Id: 'string'
});
