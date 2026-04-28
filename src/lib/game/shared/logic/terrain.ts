import { type TerrainState } from '../state/TerrainState';

const RESOLUTION = 3;
const FLOOR_MARGIN = 40;

export function generateTerrain(sceneWidth: number, sceneHeight: number): TerrainState {
	const cols = Math.ceil(sceneWidth / RESOLUTION);
	const floorY = sceneHeight - FLOOR_MARGIN;
	const heights = new Array<number>(cols);
	const baseY = sceneHeight * 0.68;

	const p1 = Math.random() * Math.PI * 2;
	const p2 = Math.random() * Math.PI * 2;
	const p3 = Math.random() * Math.PI * 2;
	const a1 = 55 + Math.random() * 45;
	const a2 = 25 + Math.random() * 30;
	const a3 = 10 + Math.random() * 15;

	for (let i = 0; i < cols; i++) {
		const x = (i / cols) * sceneWidth;
		heights[i] =
			baseY +
			Math.sin(x * 0.005 + p1) * a1 +
			Math.sin(x * 0.013 + p2) * a2 +
			Math.sin(x * 0.027 + p3) * a3;
	}

	return { heights, cols, floorY, sceneWidth, sceneHeight };
}

export function getHeightAt(terrain: TerrainState, x: number): number {
	const i = Math.max(0, Math.min(terrain.cols - 1, Math.round(x / RESOLUTION)));
	return terrain.heights[i];
}

export function applyCrater(terrain: TerrainState, cx: number, cy: number, radius: number): void {
	const { heights, cols, floorY } = terrain;

	for (let i = 0; i < cols; i++) {
		const x = i * RESOLUTION;
		const dx = x - cx;
		if (Math.abs(dx) >= radius) continue;
		const bottom = cy + Math.sqrt(radius * radius - dx * dx);
		if (bottom > heights[i]) {
			heights[i] = Math.min(bottom, floorY);
		}
	}

	const centerCol = Math.round(cx / RESOLUTION);
	const smoothCols = Math.ceil((radius * 2.5) / RESOLUTION);
	const start = Math.max(1, centerCol - smoothCols);
	const end = Math.min(cols - 2, centerCol + smoothCols);
	for (let pass = 0; pass < 6; pass++) {
		for (let i = start; i <= end; i++) {
			heights[i] = (heights[i - 1] + heights[i] * 2 + heights[i + 1]) / 4;
		}
	}
}
