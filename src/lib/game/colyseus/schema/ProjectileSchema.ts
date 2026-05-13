import { Schema, defineTypes } from '@colyseus/schema';

export class ProjectileSchema extends Schema {
	active: boolean = false;
	x: number = 0;
	y: number = 0;
	vx: number = 0;
	vy: number = 0;
	typeIndex: number = 0;
	bouncesLeft: number = 0;
}

defineTypes(ProjectileSchema, {
	active: 'boolean',
	x: 'float32',
	y: 'float32',
	vx: 'float32',
	vy: 'float32',
	typeIndex: 'uint8',
	bouncesLeft: 'uint8'
});
