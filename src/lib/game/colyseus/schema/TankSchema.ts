import { Schema, defineTypes } from '@colyseus/schema';

export class TankSchema extends Schema {
	x: number = 0;
	y: number = 0;
	turretAngle: number = 0;
	health: number = 100;
	color: number = 0;
	name: string = '';
	facing: number = 1;
}

defineTypes(TankSchema, {
	x: 'float32',
	y: 'float32',
	turretAngle: 'float32',
	health: 'float32',
	color: 'uint32',
	name: 'string',
	facing: 'int8'
});
