import { PROJECTILE_TYPES } from '../../shared/projectileTypes';
import { getHeightAt } from '../../shared/logic/terrain';
import { getTurretTip } from '../../shared/logic/physics';
import type { TankState } from '../../shared/state/TankState';
import type { TerrainState } from '../../shared/state/TerrainState';
import { TankSprite } from '../../client/view/TankSprite';
import { TerrainView } from '../../client/view/TerrainView';
import { ProjectileView } from '../../client/view/ProjectileView';
import { Scene, GameObjects, Input } from 'phaser';
import { Client, Room } from 'colyseus.js';
import type { GameRoomState } from '../../colyseus/schema/GameRoomState';

const PLAYER_NAMES = ['Player 1', 'Player 2'];
const COLYSEUS_URL = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
	? `wss://${window.location.host}`
	: 'ws://localhost:2567';

type InputSnapshot = {
	moveLeft: boolean;
	moveRight: boolean;
	aimUp: boolean;
	aimDown: boolean;
};

type ProjectileSnapshot = {
	active: boolean; x: number; y: number; typeIndex: number; bouncesLeft: number;
};

type GameUpdateData = {
	tanks: [TankState, TankState];
	projectile: ProjectileSnapshot;
	turnTimeLeft: number;
	power: number;
	powerIncreasing: boolean;
	fuel: number;
	weaponIndex: number;
};

export default class GameScene extends Scene {
	private room: Room<GameRoomState> | null = null;
	private myPlayerIndex: 0 | 1 = 0;
	private myPlayerIndexSet = false;
	private roomReady = false;
	private localPhase = '';
	private localCurrentPlayer = 0;
	private localWinner = -1;
	private localTerrain: TerrainState | null = null;
	private localGameData: GameUpdateData | null = null;

	private tankSprites: [TankSprite, TankSprite] | null = null;
	private terrainView: TerrainView | null = null;
	private projView: ProjectileView | null = null;

	private clientTrail: Array<{ x: number; y: number }> = [];
	private lastProjActive = false;
	private lastProjX = -Infinity;

	private lastInput: InputSnapshot = { moveLeft: false, moveRight: false, aimUp: false, aimDown: false };

	private turnText!: GameObjects.Text;
	private timerText!: GameObjects.Text;
	private powerBg!: GameObjects.Graphics;
	private powerFill!: GameObjects.Graphics;
	private powerLabel!: GameObjects.Text;
	private fuelBg!: GameObjects.Graphics;
	private fuelFill!: GameObjects.Graphics;
	private hintText!: GameObjects.Text;
	private trajectoryGfx!: GameObjects.Graphics;
	private weaponTexts: GameObjects.Text[] = [];
	private statusText!: GameObjects.Text;

	private readonly barX = 440;
	private readonly barY = 688;
	private readonly barW = 400;
	private readonly barH = 18;
	private readonly fuelBarX = 20;
	private readonly fuelBarY = 688;
	private readonly fuelBarW = 200;
	private readonly fuelBarH = 18;

	private keys!: {
		p1Left: Input.Keyboard.Key;
		p1Right: Input.Keyboard.Key;
		p1AimUp: Input.Keyboard.Key;
		p1AimDown: Input.Keyboard.Key;
		p1Shoot: Input.Keyboard.Key;
		p2Left: Input.Keyboard.Key;
		p2Right: Input.Keyboard.Key;
		p2AimUp: Input.Keyboard.Key;
		p2AimDown: Input.Keyboard.Key;
		p2Shoot: Input.Keyboard.Key;
		weaponKey: Input.Keyboard.Key;
	};

	constructor() {
		super({ key: 'GameScene' });
	}

	create() {
		this.createBackground();
		this.setupUI();
		this.setupKeys();
		this.connectToServer();
	}

	private createBackground() {
		const { width, height } = this.scale;
		const sky = this.add.graphics().setDepth(-2);
		sky.fillGradientStyle(0x060612, 0x060612, 0x111130, 0x111130, 1);
		sky.fillRect(0, 0, width, height);

		const stars = this.add.graphics().setDepth(-1);
		for (let i = 0; i < 80; i++) {
			const sx = Math.random() * width;
			const sy = Math.random() * height * 0.65;
			stars.fillStyle(0xffffff, Math.random() * 0.4 + 0.2);
			stars.fillCircle(sx, sy, Math.random() * 1.2 + 0.3);
		}
	}

	private setupKeys() {
		const kb = this.input.keyboard!;
		this.keys = {
			p1Right: kb.addKey(Input.Keyboard.KeyCodes.D),
			p1Left: kb.addKey(Input.Keyboard.KeyCodes.A),
			p1AimUp: kb.addKey(Input.Keyboard.KeyCodes.W),
			p1AimDown: kb.addKey(Input.Keyboard.KeyCodes.S),
			p1Shoot: kb.addKey(Input.Keyboard.KeyCodes.SPACE),
			p2Left: kb.addKey(Input.Keyboard.KeyCodes.LEFT),
			p2Right: kb.addKey(Input.Keyboard.KeyCodes.RIGHT),
			p2AimUp: kb.addKey(Input.Keyboard.KeyCodes.UP),
			p2AimDown: kb.addKey(Input.Keyboard.KeyCodes.DOWN),
			p2Shoot: kb.addKey(Input.Keyboard.KeyCodes.ENTER),
			weaponKey: kb.addKey(Input.Keyboard.KeyCodes.Q)
		};
	}

	private setupUI() {
		this.statusText = this.add
			.text(640, 340, 'Connecting...', {
				fontSize: '28px',
				color: '#88e8a0',
				stroke: '#0e0e24',
				strokeThickness: 5
			})
			.setOrigin(0.5)
			.setDepth(20);

		this.turnText = this.add
			.text(640, 18, '', { fontSize: '22px', color: '#88e8a0', stroke: '#0e0e24', strokeThickness: 4 })
			.setOrigin(0.5, 0)
			.setDepth(10)
			.setVisible(false);

		this.timerText = this.add
			.text(640, 46, '', { fontSize: '18px', color: '#88e8a0', stroke: '#0e0e24', strokeThickness: 3 })
			.setOrigin(0.5, 0)
			.setDepth(10)
			.setVisible(false);

		this.powerBg = this.add.graphics().setDepth(10);
		this.powerBg.fillStyle(0x0e0e24, 0.92);
		this.powerBg.fillRect(this.barX - 1, this.barY - 1, this.barW + 2, this.barH + 2);
		this.powerBg.setVisible(false);

		this.powerFill = this.add.graphics().setDepth(10);
		this.powerFill.setVisible(false);

		this.powerLabel = this.add
			.text(640, this.barY - 22, 'POWER — release to fire', {
				fontSize: '13px', color: '#88e8a0', stroke: '#0e0e24', strokeThickness: 3
			})
			.setOrigin(0.5, 0)
			.setDepth(10)
			.setVisible(false);

		this.hintText = this.add
			.text(640, 700, '', { fontSize: '11px', color: 'rgba(255,255,255,0.5)', stroke: '#0e0e24', strokeThickness: 2 })
			.setOrigin(0.5, 0)
			.setDepth(10);

		this.fuelBg = this.add.graphics().setDepth(10);
		this.fuelBg.fillStyle(0x0e0e24, 0.92);
		this.fuelBg.fillRect(this.fuelBarX - 1, this.fuelBarY - 1, this.fuelBarW + 2, this.fuelBarH + 2);
		this.fuelBg.setVisible(false);

		this.fuelFill = this.add.graphics().setDepth(10);

		this.add
			.text(this.fuelBarX + this.fuelBarW / 2, this.fuelBarY - 18, 'FUEL', {
				fontSize: '13px', color: '#00ccff', stroke: '#0e0e24', strokeThickness: 3
			})
			.setOrigin(0.5, 0)
			.setDepth(10)
			.setVisible(false);

		this.trajectoryGfx = this.add.graphics().setDepth(8);

		const weaponXPositions = [490, 640, 790];
		this.weaponTexts = PROJECTILE_TYPES.map((type, i) =>
			this.add
				.text(weaponXPositions[i], 50, type.name, {
					fontSize: '14px', color: '#ffffff', stroke: '#0e0e24', strokeThickness: 3
				})
				.setOrigin(0.5)
				.setDepth(10)
				.setVisible(false)
		);
	}

	private async connectToServer() {
		try {
			const client = new Client(COLYSEUS_URL);
			const room = await client.joinOrCreate('tank_room') as unknown as Room<GameRoomState>;
			this.room = room;

			room.onMessage('game_start', (data: {
				player0Id: string; player1Id: string; currentPlayer: number;
				terrain: TerrainState; tanks: [TankState, TankState];
				fuel: number; weaponIndex: number; turnTimeLeft: number; power: number;
			}) => {
				if (!this.myPlayerIndexSet) {
					this.myPlayerIndexSet = true;
					this.myPlayerIndex = data.player0Id === room.sessionId ? 0 : 1;
				}
				this.localCurrentPlayer = data.currentPlayer;
				this.localPhase = 'AIMING';
				this.localTerrain = data.terrain;
				this.localGameData = {
					tanks: data.tanks,
					projectile: { active: false, x: 0, y: 0, typeIndex: 0, bouncesLeft: 0 },
					turnTimeLeft: data.turnTimeLeft,
					power: data.power,
					powerIncreasing: true,
					fuel: data.fuel,
					weaponIndex: data.weaponIndex
				};
				if (!this.roomReady) {
					this.roomReady = true;
					this.statusText.setVisible(false);
					this.initViews();
					this.showGameUI();
				}
			});

			room.onMessage('game_update', (data: GameUpdateData) => {
				this.localGameData = data;
			});

			room.onMessage('phase_change', (data: { phase: string; currentPlayer: number; winner?: number }) => {
				this.localPhase = data.phase;
				this.localCurrentPlayer = data.currentPlayer;
				if (data.winner !== undefined) this.localWinner = data.winner;
				if (data.phase === 'OVER') this.showGameOver(this.localWinner as 0 | 1);
			});

			room.onMessage('explosion', (data: {
				x: number; y: number; craterRadius: number; blastRadius: number;
				terrainHeights: number[]; tanks: [TankState, TankState];
			}) => {
				this.handleExplosionFx(data.x, data.y, data.craterRadius, data.blastRadius);
				if (this.localTerrain) {
					this.localTerrain.heights = data.terrainHeights;
					this.terrainView?.sync(this.localTerrain);
				}
				if (this.localGameData) {
					this.localGameData.tanks = data.tanks;
				}
			});

			room.onLeave.once(() => {
				this.statusText.setText('Disconnected').setVisible(true);
			});

			this.statusText.setText('Waiting for Player 2...');
		} catch (err) {
			this.statusText.setText('Connection failed.\nCheck the game server is running.');
			console.error(err);
		}
	}

	private initViews() {
		this.terrainView = new TerrainView(this);
		this.terrainView.sync(this.localTerrain!);

		this.tankSprites = [
			new TankSprite(this, this.localGameData!.tanks[0]),
			new TankSprite(this, this.localGameData!.tanks[1])
		];

		this.projView = new ProjectileView(this);
	}

	private showGameUI() {
		this.turnText.setVisible(true);
		this.timerText.setVisible(true);
		this.fuelBg.setVisible(true);
		this.weaponTexts.forEach((t) => t.setVisible(true));
	}

	update(_time: number) {
		if (!this.roomReady || !this.tankSprites || !this.localGameData) return;

		const data = this.localGameData;
		const phase = this.localPhase;
		const currentPlayer = this.localCurrentPlayer;

		// Sync tank sprites
		this.tankSprites[0].sync(data.tanks[0]);
		this.tankSprites[1].sync(data.tanks[1]);

		// Sync projectile with client-side trail
		const proj = data.projectile;
		if (proj.active) {
			if (!this.lastProjActive) {
				this.clientTrail = [];
				this.lastProjActive = true;
			}
			if (proj.x !== this.lastProjX) {
				this.lastProjX = proj.x;
				this.clientTrail.push({ x: proj.x, y: proj.y });
				if (this.clientTrail.length > 35) this.clientTrail.shift();
			}
			this.projView!.sync({
				x: proj.x, y: proj.y,
				prevX: 0, prevY: 0, vx: 0, vy: 0,
				trail: this.clientTrail,
				typeIndex: proj.typeIndex,
				bouncesLeft: proj.bouncesLeft
			});
		} else if (this.lastProjActive) {
			this.lastProjActive = false;
			this.clientTrail = [];
			this.projView!.sync(undefined);
		}

		// UI updates
		if (phase === 'AIMING' || phase === 'CHARGING') {
			const secs = Math.ceil(data.turnTimeLeft);
			const color = secs > 10 ? '#88e8a0' : secs > 5 ? '#ffdd55' : '#ff4444';
			this.timerText.setText(`${secs}s`).setColor(color);
			this.turnText.setText(`${PLAYER_NAMES[currentPlayer]}'s Turn`);
		}

		this.updateFuelBar(data.fuel);
		this.updateWeaponUI(data.weaponIndex);

		if (phase === 'CHARGING') {
			this.powerBg.setVisible(true);
			this.powerFill.setVisible(true);
			this.powerLabel.setVisible(true);
			this.updatePowerBar(data.power);
		} else {
			this.powerBg.setVisible(false);
			this.powerFill.setVisible(false);
			this.powerLabel.setVisible(false);
		}

		// Trajectory preview
		if (phase === 'AIMING' || phase === 'CHARGING') {
			this.drawTrajectory(data.tanks[currentPlayer], data.weaponIndex, data.power, phase);
		} else {
			this.trajectoryGfx.clear();
		}

		// Input handling
		if (phase !== 'OVER' && currentPlayer === this.myPlayerIndex) {
			this.handleInput(phase);
		}

		// Hint text
		if (phase === 'AIMING' || phase === 'CHARGING') {
			const p = this.myPlayerIndex;
			const hint =
				p === 0
					? 'A/D: move   W/S: aim   Q: weapon   SPACE: charge'
					: '←/→: move   ↑/↓: aim   Q: weapon   ENTER: charge';
			this.hintText.setText(currentPlayer === this.myPlayerIndex ? hint : 'Waiting for opponent...');
		}
	}

	private handleInput(phase: string) {
		const p = this.myPlayerIndex;
		const moveLeft = p === 0 ? this.keys.p1Left : this.keys.p2Left;
		const moveRight = p === 0 ? this.keys.p1Right : this.keys.p2Right;
		const aimUp = p === 0 ? this.keys.p1AimUp : this.keys.p2AimUp;
		const aimDown = p === 0 ? this.keys.p1AimDown : this.keys.p2AimDown;
		const shootKey = p === 0 ? this.keys.p1Shoot : this.keys.p2Shoot;

		// Continuous input: send only when state changes
		const snap: InputSnapshot = {
			moveLeft: moveLeft.isDown,
			moveRight: moveRight.isDown,
			aimUp: aimUp.isDown,
			aimDown: aimDown.isDown
		};
		if (
			snap.moveLeft !== this.lastInput.moveLeft ||
			snap.moveRight !== this.lastInput.moveRight ||
			snap.aimUp !== this.lastInput.aimUp ||
			snap.aimDown !== this.lastInput.aimDown
		) {
			this.lastInput = snap;
			this.room!.send('input', snap);
		}

		if (phase === 'AIMING') {
			if (Input.Keyboard.JustDown(this.keys.weaponKey)) {
				this.room!.send('cycle_weapon');
			}
			if (Input.Keyboard.JustDown(shootKey)) {
				this.room!.send('charge_start');
			}
		}

		if (phase === 'CHARGING' && Input.Keyboard.JustUp(shootKey)) {
			this.room!.send('fire');
		}
	}

	private drawTrajectory(tank: TankState, weaponIndex: number, power: number, phase: string) {
		this.trajectoryGfx.clear();
		if (!this.localTerrain) return;
		const tip = getTurretTip(tank);
		const previewPower = phase === 'CHARGING' ? power : 50;
		if (previewPower < 1) return;

		const weapon = PROJECTILE_TYPES[weaponIndex];
		const rad = (tank.turretAngle * Math.PI) / 180;
		const speed = previewPower * weapon.speedFactor;
		const vx = Math.cos(rad) * speed;
		let vy = -Math.sin(rad) * speed;
		let x = tip.x;
		let y = tip.y;
		const dt = 0.05;
		const MAX_DOTS = 5;
		const DOT_INTERVAL = 5;
		let dotsDrawn = 0;

		for (let i = 0; dotsDrawn < MAX_DOTS; i++) {
			vy += weapon.gravity * dt;
			x += vx * dt;
			y += vy * dt;
			if (x < 0 || x > this.scale.width || y > this.scale.height) break;
			if (y >= getHeightAt(this.localTerrain!, x)) break;
			if (i % DOT_INTERVAL === DOT_INTERVAL - 1) {
				const alpha = 0.8 * (1 - dotsDrawn / MAX_DOTS);
				this.trajectoryGfx.fillStyle(0xffffff, alpha);
				this.trajectoryGfx.fillCircle(x, y, 2.5);
				dotsDrawn++;
			}
		}
	}

	private handleExplosionFx(x: number, y: number, craterRadius: number, blastRadius: number) {
		this.cameras.main.shake(350, blastRadius * 0.00018);

		const gfx = this.add.graphics().setDepth(5);
		gfx.fillStyle(0xff6600).fillCircle(x, y, craterRadius * 0.93);
		gfx.fillStyle(0xffcc00).fillCircle(x, y, craterRadius * 0.57);
		gfx.fillStyle(0xffffff).fillCircle(x, y, craterRadius * 0.26);
		this.time.delayedCall(450, () => gfx.destroy());

		this.spawnCraterDust(x, y, craterRadius);
	}

	private spawnCraterDust(x: number, y: number, radius: number) {
		const count = Math.floor(radius * 1.2);
		const colors = [0x3d7a52, 0x2a5c3a, 0x88e8a0, 0x5a4a30, 0x888888];
		const pieces: { gfx: GameObjects.Graphics; vx: number; vy: number }[] = [];

		for (let i = 0; i < count; i++) {
			const angle = Math.PI + (Math.random() - 0.5) * Math.PI;
			const speed = radius * 1.5 + Math.random() * radius * 2;
			const size = 2 + Math.random() * 4;
			const spawnAngle = Math.random() * Math.PI * 2;
			const spawnDist = radius * (0.5 + Math.random() * 0.6);
			const gfx = this.add.graphics().setDepth(6);
			gfx.fillStyle(colors[Math.floor(Math.random() * colors.length)]);
			gfx.fillCircle(0, 0, size);
			gfx.setPosition(x + Math.cos(spawnAngle) * spawnDist, y + Math.sin(spawnAngle) * spawnDist);
			pieces.push({ gfx, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - speed * 0.8 });
		}

		const DURATION = 900;
		let elapsed = 0;
		const event = this.time.addEvent({
			delay: 16,
			loop: true,
			callback: () => {
				elapsed += 16;
				const progress = Math.min(1, elapsed / DURATION);
				for (const p of pieces) {
					p.vy += 400 * 0.016;
					p.gfx.x += p.vx * 0.016;
					p.gfx.y += p.vy * 0.016;
					p.gfx.setAlpha(1 - progress);
				}
				if (progress >= 1) {
					for (const p of pieces) p.gfx.destroy();
					event.destroy();
				}
			}
		});
	}

	private updateWeaponUI(activeIndex: number) {
		PROJECTILE_TYPES.forEach((type, i) => {
			const active = i === activeIndex;
			this.weaponTexts[i]
				.setText(active ? `[ ${type.name} ]` : type.name)
				.setColor(active ? '#ffdd55' : 'rgba(200,200,200,0.4)')
				.setFontSize(active ? 17 : 13);
		});
	}

	private updatePowerBar(power: number) {
		this.powerFill.clear();
		const pct = power / 100;
		const color = pct < 0.4 ? 0x00ff44 : pct < 0.7 ? 0xffdd00 : 0xff3333;
		this.powerFill.fillStyle(color);
		this.powerFill.fillRect(this.barX, this.barY, this.barW * pct, this.barH);
	}

	private updateFuelBar(fuel: number) {
		this.fuelFill.clear();
		const pct = fuel / 100;
		const color = pct > 0.5 ? 0x00ccff : pct > 0.25 ? 0xffaa00 : 0xff3333;
		this.fuelFill.fillStyle(color);
		this.fuelFill.fillRect(this.fuelBarX, this.fuelBarY, this.fuelBarW * pct, this.fuelBarH);
	}

	private showGameOver(winner: 0 | 1) {
		this.add.graphics().setDepth(20).fillStyle(0x0e0e24, 0.88).fillRect(290, 240, 700, 220);

		this.add
			.text(640, 280, `${PLAYER_NAMES[winner]} Wins!`, {
				fontSize: '52px', color: '#d4b832', stroke: '#0e0e24', strokeThickness: 6
			})
			.setOrigin(0.5)
			.setDepth(21);

		this.add
			.text(640, 370, 'Press R to play again', {
				fontSize: '22px', color: '#88e8a0', stroke: '#0e0e24', strokeThickness: 4
			})
			.setOrigin(0.5)
			.setDepth(21);

		this.input.keyboard!.once('keydown-R', () => {
			this.room?.send('restart');
			this.scene.restart();
		});
	}
}
