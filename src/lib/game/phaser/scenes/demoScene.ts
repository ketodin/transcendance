import { Scene } from 'phaser';
import { generateTerrain, getHeightAt } from '../../shared/logic/terrain';
import { TerrainView } from '../../client/view/TerrainView';
import { TankSprite } from '../../client/view/TankSprite';
import { ProjectileView } from '../../client/view/ProjectileView';
import { syncFromCSS, COLORS } from '../colors';
import { EventBus } from '../EventBus';
import type { TerrainState } from '../../shared/state/TerrainState';
import type { TankState } from '../../shared/state/TankState';

const SCENE_WIDTH = 1920;
const SCENE_HEIGHT = 1080;
const TANK_X: [number, number] = [250, 1670];

export default class DemoScene extends Scene {
	private terrain!: TerrainState;
	private terrainView: TerrainView | null = null;
	private tankSprites: [TankSprite | null, TankSprite | null] = [null, null];
	private projView: ProjectileView | null = null;

	private tank0: TankState = {
		x: TANK_X[0],
		y: 0,
		turretAngle: 55,
		health: 100,
		color: 0xcc2222,
		name: 'Red',
		facing: 1
	};
	private tank1: TankState = {
		x: TANK_X[1],
		y: 0,
		turretAngle: 125,
		health: 100,
		color: 0x2255cc,
		name: 'Blue',
		facing: -1
	};

	private elapsed = 0;

	private projActive = false;
	private projT = 0;
	private projDuration = 2800;
	private projIdleTimer = 0;
	private projIdleInterval = 3500;
	private projDir: 0 | 1 = 0;
	private projTrail: { x: number; y: number }[] = [];

	constructor() {
		super({ key: 'DemoScene' });
	}

	create() {
		this.drawStars();

		this.terrain = generateTerrain(SCENE_WIDTH, SCENE_HEIGHT);
		this.tank0.y = getHeightAt(this.terrain, TANK_X[0]);
		this.tank1.y = getHeightAt(this.terrain, TANK_X[1]);

		this.terrainView = new TerrainView(this);
		this.terrainView.sync(this.terrain);

		this.tankSprites[0] = new TankSprite(this, this.tank0);
		this.tankSprites[1] = new TankSprite(this, this.tank1);

		this.projView = new ProjectileView(this);

		EventBus.emit('current-scene-ready', this);
		EventBus.on('theme-changed', this.onThemeChanged);
	}

	update(_time: number, delta: number) {
		this.elapsed += delta;

		this.tank0.turretAngle = 55 + Math.sin(this.elapsed / 2100) * 20;
		this.tank1.turretAngle = 125 + Math.sin(this.elapsed / 1900 + 0.8) * 20;

		this.tankSprites[0]?.sync(this.tank0, this.terrain);
		this.tankSprites[1]?.sync(this.tank1, this.terrain);

		if (!this.projActive) {
			this.projIdleTimer += delta;
			if (this.projIdleTimer >= this.projIdleInterval) {
				this.projIdleTimer = 0;
				this.projActive = true;
				this.projT = 0;
				this.projTrail = [];
			}
		} else {
			this.projT += delta / this.projDuration;
			if (this.projT >= 1) {
				this.projActive = false;
				this.projView?.sync(undefined);
				this.projTrail = [];
				this.projDir = (1 - this.projDir) as 0 | 1;
			} else {
				const from = this.projDir === 0 ? this.tank0 : this.tank1;
				const to = this.projDir === 0 ? this.tank1 : this.tank0;
				const t = this.projT;
				const x = from.x + (to.x - from.x) * t;
				const y = from.y + (to.y - from.y) * t - 380 * 4 * t * (1 - t);

				this.projTrail.push({ x, y });
				if (this.projTrail.length > 30) this.projTrail.shift();

				this.projView?.sync({
					x,
					y,
					prevX: x,
					prevY: y,
					vx: 0,
					vy: 0,
					trail: [...this.projTrail],
					typeIndex: 0,
					bouncesLeft: 0
				});
			}
		}
	}

	readonly onThemeChanged = () => {
		syncFromCSS();
		if (this.terrainView && this.terrain) this.terrainView.sync(this.terrain);
	};

	shutdown() {
		EventBus.off('theme-changed', this.onThemeChanged);
	}

	private drawStars() {
		const { width, height } = this.scale;
		const stars = this.add.graphics().setDepth(-1);
		for (let i = 0; i < 80; i++) {
			const sx = Math.random() * width;
			const sy = Math.random() * height * 0.65;
			stars.fillStyle(COLORS.white, Math.random() * 0.4 + 0.2);
			stars.fillCircle(sx, sy, Math.random() * 1.2 + 0.3);
		}
	}
}
