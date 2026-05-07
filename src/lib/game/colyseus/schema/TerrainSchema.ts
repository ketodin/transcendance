import { Schema, ArraySchema, defineTypes } from '@colyseus/schema';

export class TerrainSchema extends Schema {
	heights: ArraySchema<number> = new ArraySchema<number>();
	cols: number = 0;
	floorY: number = 0;
	sceneWidth: number = 0;
	sceneHeight: number = 0;
}

defineTypes(TerrainSchema, {
	heights: ['float32'],
	cols: 'uint32',
	floorY: 'float32',
	sceneWidth: 'float32',
	sceneHeight: 'float32'
});
