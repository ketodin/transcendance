import { type TerrainState } from '../../shared/state/TerrainState';
import { GameObjects, Scene } from 'phaser';

const RESOLUTION = 3;

export class TerrainView {
	private graphics: GameObjects.Graphics;

	constructor(scene: Scene) {
		this.graphics = scene.add.graphics();
	}

	sync(terrain: TerrainState): void {
		const { heights, cols, floorY, sceneWidth, sceneHeight } = terrain;
		this.graphics.clear();

		this.graphics.fillStyle(0x3d7a52);
		this.graphics.beginPath();
		this.graphics.moveTo(0, heights[0]);
		for (let i = 1; i < cols; i++) {
			this.graphics.lineTo(i * RESOLUTION, heights[i]);
		}
		this.graphics.lineTo(sceneWidth, floorY);
		this.graphics.lineTo(0, floorY);
		this.graphics.closePath();
		this.graphics.fillPath();

		for (const [lw, col, al] of [
			[8, 0x4cff80, 0.1],
			[5, 0x88e8a0, 0.25],
			[3, 0x88e8a0, 0.7],
			[2, 0x88e8a0, 1.0]
		] as [number, number, number][]) {
			this.graphics.lineStyle(lw, col, al);
			this.graphics.beginPath();
			this.graphics.moveTo(0, heights[0]);
			for (let i = 1; i < cols; i++) {
				this.graphics.lineTo(i * RESOLUTION, heights[i]);
			}
			this.graphics.strokePath();
		}

		this.graphics.fillStyle(0x1e3d2a);
		this.graphics.fillRect(0, floorY, sceneWidth, sceneHeight - floorY);
		this.graphics.lineStyle(2, 0x88e8a0, 0.6);
		this.graphics.beginPath();
		this.graphics.moveTo(0, floorY);
		this.graphics.lineTo(sceneWidth, floorY);
		this.graphics.strokePath();
	}
}
