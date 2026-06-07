import { Schema, type } from '@colyseus/schema';
import { ProjectileSchema } from './ProjectileSchema.js';

export class GameRoomState extends Schema {
	@type('string') phase: string = 'WAITING';
	@type('uint8') currentPlayer: number = 0;
	@type(ProjectileSchema) projectile: ProjectileSchema = new ProjectileSchema();
	@type('float32') power: number = 0;
	@type('uint8') weaponIndex: number = 0;
	@type('float32') fuel: number = 100;
	@type('float32') turnTimeLeft: number = 30;
	@type('int8') winner: number = -1;
	@type('string') player0Id: string = '';
	@type('string') player1Id: string = '';
}
