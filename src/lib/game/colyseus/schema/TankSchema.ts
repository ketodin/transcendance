import { Schema, type } from '@colyseus/schema';

export class TankSchema extends Schema {
	@type("float32") x: number = 0;
	@type("float32") y: number = 0;
	@type("float32") turretAngle: number = 0;
	@type("float32") health: number = 100;
	@type("uint32") color: number = 0;
	@type("string") name: string = '';
	@type("int8") facing: number = 1;
}
