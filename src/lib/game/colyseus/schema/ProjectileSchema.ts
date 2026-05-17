import { Schema, type } from '@colyseus/schema';

export class ProjectileSchema extends Schema {
	@type('boolean') active: boolean = false;
	@type('float32') x: number = 0;
	@type('float32') y: number = 0;
	@type('float32') vx: number = 0;
	@type('float32') vy: number = 0;
	@type('uint8') typeIndex: number = 0;
	@type('uint8') bouncesLeft: number = 0;
}
