import { Schema, ArraySchema, type } from '@colyseus/schema';

export class TerrainSchema extends Schema {
	@type(['float32']) heights: ArraySchema<number> = new ArraySchema<number>();
	@type('uint32') cols: number = 0;
	@type('float32') floorY: number = 0;
	@type('float32') sceneWidth: number = 0;
	@type('float32') sceneHeight: number = 0;
}
