import { Scene, GameObjects, Math as PhaserMath } from 'phaser';

const RESOLUTION = 3; // pixels per heightmap column
const FLOOR_MARGIN = 40; // indestructible base height in pixels

export class Terrain {
	private scene: Scene;
	private graphics: GameObjects.Graphics;
	private heights: number[];
	private readonly cols: number;
	readonly floorY: number;

	constructor(scene: Scene) {
		this.scene = scene;
		this.cols = Math.ceil(scene.scale.width / RESOLUTION);
		this.heights = new Array(this.cols);
		this.floorY = scene.scale.height - FLOOR_MARGIN;
		this.generate();
		this.graphics = scene.add.graphics();
		this.draw();
	}

	private generate() {
		const { width } = this.scene.scale;
		const baseY = this.scene.scale.height * 0.68;

		const p1 = Math.random() * Math.PI * 2;
		const p2 = Math.random() * Math.PI * 2;
		const p3 = Math.random() * Math.PI * 2;
		const a1 = 55 + Math.random() * 45;
		const a2 = 25 + Math.random() * 30;
		const a3 = 10 + Math.random() * 15;

		for (let i = 0; i < this.cols; i++) {
			const x = (i / this.cols) * width;
			this.heights[i] =
				baseY +
				Math.sin(x * 0.005 + p1) * a1 +
				Math.sin(x * 0.013 + p2) * a2 +
				Math.sin(x * 0.027 + p3) * a3;
		}
	}

	private draw() {
		const { width, height } = this.scene.scale;
		this.graphics.clear();

		// Destructible ground fill
		this.graphics.fillStyle(0x3d7a52);
		this.graphics.beginPath();
		this.graphics.moveTo(0, this.heights[0]);
		for (let i = 1; i < this.cols; i++) {
			this.graphics.lineTo(i * RESOLUTION, this.heights[i]);
		}
		this.graphics.lineTo(width, this.floorY);
		this.graphics.lineTo(0, this.floorY);
		this.graphics.closePath();
		this.graphics.fillPath();

		// Surface neon glow (multiple passes)
		for (const [lw, col, al] of [
			[8, 0x4cff80, 0.1],
			[5, 0x88e8a0, 0.25],
			[3, 0x88e8a0, 0.7],
			[2, 0x88e8a0, 1.0]
		] as [number, number, number][]) {
			this.graphics.lineStyle(lw, col, al);
			this.graphics.beginPath();
			this.graphics.moveTo(0, this.heights[0]);
			for (let i = 1; i < this.cols; i++) {
				this.graphics.lineTo(i * RESOLUTION, this.heights[i]);
			}
			this.graphics.strokePath();
		}

		// Indestructible rock base
		this.graphics.fillStyle(0x1e3d2a);
		this.graphics.fillRect(0, this.floorY, width, height - this.floorY);
		this.graphics.lineStyle(2, 0x88e8a0, 0.6);
		this.graphics.beginPath();
		this.graphics.moveTo(0, this.floorY);
		this.graphics.lineTo(width, this.floorY);
		this.graphics.strokePath();
	}

	getHeightAt(x: number): number {
		const i = PhaserMath.Clamp(Math.round(x / RESOLUTION), 0, this.cols - 1);
		return this.heights[i];
	}

	crater(cx: number, cy: number, radius: number) {
		for (let i = 0; i < this.cols; i++) {
			const x = i * RESOLUTION;
			const dx = x - cx;
			if (Math.abs(dx) >= radius) continue;
			const bottom = cy + Math.sqrt(radius * radius - dx * dx);
			if (bottom > this.heights[i]) {
				this.heights[i] = Math.min(bottom, this.floorY);
			}
		}

		const centerCol = Math.round(cx / RESOLUTION);
		const smoothCols = Math.ceil((radius * 2.5) / RESOLUTION);
		const start = Math.max(1, centerCol - smoothCols);
		const end = Math.min(this.cols - 2, centerCol + smoothCols);
		for (let pass = 0; pass < 6; pass++) {
			for (let i = start; i <= end; i++) {
				this.heights[i] = (this.heights[i - 1] + this.heights[i] * 2 + this.heights[i + 1]) / 4;
			}
		}

		this.draw();
	}
}
