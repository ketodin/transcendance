import { Schema, type } from '@colyseus/schema';
import { TankSchema } from './TankSchema.js';
import { TerrainSchema } from './TerrainSchema.js';
import { ProjectileSchema } from './ProjectileSchema.js';

export class GameRoomState extends Schema {
	@type("string") phase: string = 'WAITING';
	@type("uint8") currentPlayer: number = 0;
	@type(TankSchema) tank0: TankSchema = new TankSchema();
	@type(TankSchema) tank1: TankSchema = new TankSchema();
	@type(TerrainSchema) terrain: TerrainSchema = new TerrainSchema();
	@type(ProjectileSchema) projectile: ProjectileSchema = new ProjectileSchema();
	@type("float32") power: number = 0;
	@type("boolean") powerIncreasing: boolean = true;
	@type("uint8") weaponIndex: number = 0;
	@type("float32") fuel: number = 100;
	@type("float32") turnTimeLeft: number = 30;
	@type("int8") winner: number = -1;
	@type("string") player0Id: string = '';
	@type("string") player1Id: string = '';
}
