import { PROJECTILE_TYPES } from '../../shared/projectileTypes';
import { getHeightAt } from '../../shared/logic/terrain';
import { getTurretTip } from '../../shared/logic/physics';
import type { TankState } from '../../shared/state/TankState';
import type { TerrainState } from '../../shared/state/TerrainState';
import { TankSprite } from '../../client/view/TankSprite';
import { TerrainView } from '../../client/view/TerrainView';
import { ProjectileView } from '../../client/view/ProjectileView';
import { Scene, GameObjects, Input } from 'phaser';
import { Client, Room } from '@colyseus/sdk';
import type { GameRoomState } from '../../colyseus/schema/GameRoomState';
import { COLORS, COLOR_STRINGS } from '../colors';
import { EventBus } from '../EventBus';
// Chat input and bubble component
import { SpeechBubble } from '../../client/view/speechBubble';
import { ChatInput } from '../../client/view/ChatInput';
import { CHAT_BUBBLE_DURATION } from '$lib/game/shared/chatConfig';

const PLAYER_NAMES = ['Player 1', 'Player 2'];
const COLYSEUS_URL =
	typeof window !== 'undefined' && window.location.hostname !== 'localhost'
		? `wss://${window.location.host}`
		: 'ws://localhost:2567';

type InputSnapshot = {
	moveLeft: boolean;
	moveRight: boolean;
	aimUp: boolean;
	aimDown: boolean;
};

type ProjectileSnapshot = {
	active: boolean;
	x: number;
	y: number;
	typeIndex: number;
	bouncesLeft: number;
};

type FragmentSnapshot = { x: number; y: number; typeIndex: number };

type GameUpdateData = {
	tanks: [TankState, TankState];
	projectile: ProjectileSnapshot;
	fragments?: FragmentSnapshot[];
	turnTimeLeft: number;
	power: number;
	powerIncreasing: boolean;
	fuel: number;
	weaponIndex: number;
};

export default class GameScene extends Scene {
	private room: Room<GameRoomState> | null = null;
	private returningToLobby = false;
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
	private fragmentViews: ProjectileView[] = [];
	private fragmentTrails: Array<Array<{ x: number; y: number }>> = [];
	private selectableWeaponIndices: number[] = [];

	private lastInput: InputSnapshot = {
		moveLeft: false,
		moveRight: false,
		aimUp: false,
		aimDown: false
	};

	private turnText!: GameObjects.Text;
	private timerText!: GameObjects.Text;
	private powerBg!: GameObjects.Graphics;
	private powerFill!: GameObjects.Graphics;
	private powerLabel!: GameObjects.Text;
	private fuelBg!: GameObjects.Graphics;
	private fuelFill!: GameObjects.Graphics;
	private fuelIcon!: GameObjects.Text;
	private healthBg!: GameObjects.Graphics;
	private healthFill!: GameObjects.Graphics;
	private healthIcon!: GameObjects.Text;
	private controlsBg!: GameObjects.Graphics;
	private controlsText!: GameObjects.Text;
	private trajectoryGfx!: GameObjects.Graphics;
	private weaponTexts: GameObjects.Text[] = [];
	private statusText!: GameObjects.Text;

	private sh(n: number) {
		return (n * this.scale.height) / 720;
	}
	private sw(n: number) {
		return (n * this.scale.width) / 1280;
	}

	private get barW() {
		return this.sw(400);
	}
	private get barH() {
		return this.sh(18);
	}
	private get fuelBarX() {
		return this.sw(35);
	}
	private get fuelBarW() {
		return this.sw(200);
	}
	private get fuelBarH() {
		return this.sh(18);
	}

	private get barX() {
		return this.scale.width / 2 - this.barW / 2;
	}
	private get barY() {
		return this.scale.height - this.sh(32);
	}
	private get fuelBarY() {
		return this.scale.height - this.sh(42);
	}
	private get healthBarW() {
		return this.fuelBarW;
	}
	private get healthBarH() {
		return this.sh(18);
	}
	private get healthBarX() {
		return this.fuelBarX;
	}
	private get healthBarY() {
		return this.fuelBarY - this.sh(20) - this.sh(18);
	}

	// bubble chat
	private speechBubbles!: [SpeechBubble, SpeechBubble];
	// chat input
	private chatInput!: ChatInput;
	private chatKey!: Input.Keyboard.Key;

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

	private readonly onThemeChanged = () => {
		if (this.terrainView && this.localTerrain) this.terrainView.sync(this.localTerrain);
	};

	create() {
		this.createBackground();
		this.setupUI();
		this.setupKeys();
		void this.connectToServer();
		EventBus.on('theme-changed', this.onThemeChanged);
	}

	shutdown() {
		EventBus.off('theme-changed', this.onThemeChanged);
		//Chat cleanup
		this.chatInput?.destroy();
	}

	private createBackground() {
		const { width, height } = this.scale;
		const stars = this.add.graphics().setDepth(-1);
		for (let i = 0; i < 80; i++) {
			const sx = Math.random() * width;
			const sy = Math.random() * height * 0.65;
			stars.fillStyle(COLORS.white, Math.random() * 0.4 + 0.2);
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
		//Chat key
		this.chatKey = kb.addKey(Input.Keyboard.KeyCodes.T);
	}

	private setupUI() {
		this.statusText = this.add
			.text(this.scale.width / 2, this.scale.height / 2, 'Connecting...', {
				fontSize: `${Math.round(this.sh(28))}px`,
				color: COLOR_STRINGS.neonGlow,
				stroke: COLOR_STRINGS.navy,
				strokeThickness: 5
			})
			.setOrigin(0.5)
			.setDepth(20);

		this.turnText = this.add
			.text(this.scale.width / 2, this.sh(18), '', {
				fontSize: `${Math.round(this.sh(22))}px`,
				color: COLOR_STRINGS.neonGlow,
				stroke: COLOR_STRINGS.navy,
				strokeThickness: 4
			})
			.setOrigin(0.5, 0)
			.setDepth(10)
			.setVisible(false);

		this.timerText = this.add
			.text(this.scale.width / 2, this.sh(46), '', {
				fontSize: `${Math.round(this.sh(18))}px`,
				color: COLOR_STRINGS.neonGlow,
				stroke: COLOR_STRINGS.navy,
				strokeThickness: 3
			})
			.setOrigin(0.5, 0)
			.setDepth(10)
			.setVisible(false);

		this.powerBg = this.add.graphics().setDepth(10);
		this.powerBg.fillStyle(COLORS.navy, 0.92);
		this.powerBg.fillRect(this.barX - 1, this.barY - 1, this.barW + 2, this.barH + 2);
		this.powerBg.setVisible(false);

		this.powerFill = this.add.graphics().setDepth(10);
		this.powerFill.setVisible(false);

		this.powerLabel = this.add
			.text(this.scale.width / 2, this.barY - this.sh(22), 'POWER — release to fire', {
				fontSize: `${Math.round(this.sh(13))}px`,
				color: COLOR_STRINGS.neonGlow,
				stroke: COLOR_STRINGS.navy,
				strokeThickness: 3
			})
			.setOrigin(0.5, 0)
			.setDepth(10)
			.setVisible(false);



		this.fuelBg = this.add.graphics().setDepth(10);
		this.fuelBg.fillStyle(COLORS.navy, 0.92);
		this.fuelBg.fillRect(
			this.fuelBarX - 1,
			this.fuelBarY - 1,
			this.fuelBarW + 2,
			this.fuelBarH + 2
		);
		this.fuelBg.setVisible(false);

		this.fuelFill = this.add.graphics().setDepth(10);

		this.fuelIcon = this.add
			.text(this.fuelBarX - this.sw(14), this.fuelBarY + this.fuelBarH / 2, '⛽', {
				fontSize: `${Math.round(this.sh(14))}px`
			})
			.setOrigin(0.5)
			.setDepth(10)
			.setVisible(false);

		this.add
			.text(this.fuelBarX + this.fuelBarW / 2, this.fuelBarY - this.sh(18), 'FUEL', {
				fontSize: `${Math.round(this.sh(13))}px`,
				color: COLOR_STRINGS.fuelHigh,
				stroke: COLOR_STRINGS.navy,
				strokeThickness: 3
			})
			.setOrigin(0.5, 0)
			.setDepth(10)
			.setVisible(false);

		this.healthBg = this.add.graphics().setDepth(10);
		this.healthBg.fillStyle(COLORS.navy, 0.92);
		this.healthBg.fillRect(
			this.healthBarX - 1,
			this.healthBarY - 1,
			this.healthBarW + 2,
			this.healthBarH + 2
		);
		this.healthBg.setVisible(false);

		this.healthFill = this.add.graphics().setDepth(10);

		this.healthIcon = this.add
			.text(this.healthBarX - this.sw(14), this.healthBarY + this.healthBarH / 2, '♥', {
				fontSize: `${Math.round(this.sh(26))}px`,
				color: '#ff4444'
			})
			.setOrigin(0.5)
			.setDepth(10)
			.setVisible(false);

		this.trajectoryGfx = this.add.graphics().setDepth(8);

		this.selectableWeaponIndices = PROJECTILE_TYPES
			.map((t, i) => (t.selectable !== false ? i : -1))
			.filter((i) => i !== -1);
		const weaponStartX = this.fuelBarX + this.fuelBarW + this.sw(80);
		const weaponRow1Y = this.scale.height - this.sh(74);
		const weaponRow2Y = this.scale.height - this.sh(46);
		this.weaponTexts = this.selectableWeaponIndices.map((typeIdx, si) => {
			const row = si < 3 ? 0 : 1;
			const col = si < 3 ? si : si - 3;
			const x = weaponStartX + col * this.sw(105);
			const y = row === 0 ? weaponRow1Y : weaponRow2Y;
			return this.add
				.text(x, y, PROJECTILE_TYPES[typeIdx].name, {
					fontSize: `${Math.round(this.sh(12))}px`,
					color: COLOR_STRINGS.white,
					stroke: COLOR_STRINGS.navy,
					strokeThickness: 2
				})
				.setOrigin(0.5)
				.setDepth(10)
				.setVisible(false);
		});

		const boxW = this.sw(190);
		const boxH = this.sh(100);
		const boxX = this.scale.width - this.sw(0) - boxW;
		const boxY = this.scale.height - this.sh(0) - boxH;
		this.controlsBg = this.add.graphics().setDepth(10);
		this.controlsBg.fillStyle(COLORS.navy, 0.82);
		this.controlsBg.fillRect(boxX, boxY, boxW, boxH);
		this.controlsBg.lineStyle(1, COLORS.neonGlow, 0.3);
		this.controlsBg.strokeRect(boxX, boxY, boxW, boxH);
		this.controlsBg.setVisible(false);

		this.controlsText = this.add
			.text(boxX + this.sw(8), boxY + this.sh(18), '', {
				fontSize: `${Math.round(this.sh(11))}px`,
				color: COLOR_STRINGS.white,
				stroke: COLOR_STRINGS.navy,
				strokeThickness: 2,
				lineSpacing: this.sh(4)
			})
			.setOrigin(0, 0)
			.setDepth(10)
			.setVisible(false);
	}

	private async connectToServer() {
		this.roomReady = false;
		this.myPlayerIndexSet = false;
		this.returningToLobby = false;
		this.room = null;
		this.tankSprites = null;
		this.terrainView = null;
		this.projView = null;
		this.localGameData = null;
		this.localTerrain = null;
		this.clientTrail = [];
		this.lastProjActive = false;
		this.localPhase = '';
		this.localCurrentPlayer = 0;
		this.localWinner = -1;

		try {
			const client = new Client(COLYSEUS_URL);
			const room = (await client.joinOrCreate('tank_room')) as unknown as Room<GameRoomState>;
			this.room = room;

			room.onMessage(
				'game_start',
				(data: {
					player0Id: string;
					player1Id: string;
					currentPlayer: number;
					terrain: TerrainState;
					tanks: [TankState, TankState];
					fuel: number;
					weaponIndex: number;
					turnTimeLeft: number;
					power: number;
				}) => {
					this.myPlayerIndexSet = true;
					this.myPlayerIndex = data.player0Id === room.sessionId ? 0 : 1;
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
					this.roomReady = true;
					this.statusText.setVisible(false);
					this.initViews();
					this.showGameUI();
				}
			);

			room.onMessage('game_update', (data: GameUpdateData) => {
				this.localGameData = data;
			});

			room.onMessage(
				'phase_change',
				(data: { phase: string; currentPlayer: number; winner?: number }) => {
					this.localPhase = data.phase;
					this.localCurrentPlayer = data.currentPlayer;
					if (data.winner !== undefined) this.localWinner = data.winner;
					if (data.phase === 'OVER') this.showGameOver(this.localWinner as 0 | 1);
				}
			);

			room.onMessage(
				'explosion',
				(data: {
					x: number;
					y: number;
					craterRadius: number;
					blastRadius: number;
					terrainHeights: number[];
					tanks: [TankState, TankState];
				}) => {
					this.handleExplosionFx(data.x, data.y, data.craterRadius, data.blastRadius);
					if (this.localTerrain) {
						this.localTerrain.heights = data.terrainHeights;
						this.terrainView?.sync(this.localTerrain);
					}
					if (this.localGameData) {
						this.localGameData.tanks = data.tanks;
					}
				}
			);

			room.onMessage('airstrike_incoming', (data: { x: number }) => {
				this.showAirstrikeZone(data.x);
			});

			room.onLeave.once(() => {
				if (this.returningToLobby) {
					this.returningToLobby = false;
					this.scene.restart();
				} else {
					this.statusText.setText('Disconnected').setVisible(true);
				}
			});

			this.statusText.setText('Waiting for Player 2...');
			//Chat server handler
			room.onMessage('chat', (data: { playerIndex: number; text: string }) => {
				const tank = this.localGameData!.tanks[data.playerIndex];
				this.speechBubbles[data.playerIndex].setText(data.text, tank);
			});
		} catch (err) {
			this.statusText.setText('Connection failed.\nCheck the game server is running.');
			console.error(err);
		}
	}

	private initViews() {
		this.terrainView?.destroy();
		this.tankSprites?.[0].destroy();
		this.tankSprites?.[1].destroy();
		this.projView?.destroy();
		for (const fv of this.fragmentViews) fv.destroy();
		this.fragmentViews = [];
		this.fragmentTrails = [];

		this.terrainView = new TerrainView(this);
		this.terrainView.sync(this.localTerrain!);

		this.tankSprites = [
			new TankSprite(this, this.localGameData!.tanks[0]),
			new TankSprite(this, this.localGameData!.tanks[1])
		];
		//Bubble init
		this.speechBubbles = [new SpeechBubble(this), new SpeechBubble(this)];
		// chat init
		this.chatInput?.destroy();
		this.chatInput = new ChatInput(this, (text) => {
			this.room!.send('chat', { text });
			this.chatInput.block(CHAT_BUBBLE_DURATION);
		});
		this.projView = new ProjectileView(this);
	}

	private showGameUI() {
		this.turnText.setVisible(true);
		this.timerText.setVisible(true);
		this.fuelBg.setVisible(true);
		this.fuelIcon.setVisible(true);
		this.healthBg.setVisible(true);
		this.healthIcon.setVisible(true);
		this.weaponTexts.forEach((t) => t.setVisible(true));
		const move = this.myPlayerIndex === 0 ? 'A / D' : '← / →';
		const aim  = this.myPlayerIndex === 0 ? 'W / S' : '↑ / ↓';
		const fire = this.myPlayerIndex === 0 ? 'SPACE' : 'ENTER';
		this.controlsText.setText(
			`${move.padEnd(7)}  Move\n` +
			`${aim.padEnd(7)}  Aim\n` +
			`Q        Switch weapon\n` +
			`${fire.padEnd(7)}  Charge / Fire`
		);
		this.controlsBg.setVisible(true);
		this.controlsText.setVisible(true);
	}

	update() {
		if (!this.roomReady || !this.tankSprites || !this.localGameData) return;

		const data = this.localGameData;
		const phase = this.localPhase;
		const currentPlayer = this.localCurrentPlayer;

		// Sync tank sprites
		this.tankSprites[0].sync(data.tanks[0]);
		this.tankSprites[1].sync(data.tanks[1]);
		// Bubble chat
		this.speechBubbles[0].sync(data.tanks[0]);
		this.speechBubbles[1].sync(data.tanks[1]);
		// chat
		if (Input.Keyboard.JustDown(this.chatKey)) {
			this.chatInput?.open();
		}
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
				x: proj.x,
				y: proj.y,
				prevX: 0,
				prevY: 0,
				vx: 0,
				vy: 0,
				trail: this.clientTrail,
				typeIndex: proj.typeIndex,
				bouncesLeft: proj.bouncesLeft
			});
		} else if (this.lastProjActive) {
			this.lastProjActive = false;
			this.clientTrail = [];
			this.projView!.sync(undefined);
		}

		// Sync fragment views
		const frags = data.fragments ?? [];
		while (this.fragmentViews.length > frags.length) {
			this.fragmentViews.pop()!.destroy();
			this.fragmentTrails.pop();
		}
		while (this.fragmentViews.length < frags.length) {
			this.fragmentViews.push(new ProjectileView(this));
			this.fragmentTrails.push([]);
		}
		for (let i = 0; i < frags.length; i++) {
			const f = frags[i];
			const trail = this.fragmentTrails[i];
			if (trail.length > 0) {
				const last = trail[trail.length - 1];
				if (Math.abs(f.x - last.x) + Math.abs(f.y - last.y) > 80) trail.length = 0;
			}
			trail.push({ x: f.x, y: f.y });
			if (trail.length > 20) trail.shift();
			this.fragmentViews[i].sync({
				x: f.x, y: f.y, prevX: 0, prevY: 0, vx: 0, vy: 0,
				trail, typeIndex: f.typeIndex, bouncesLeft: 0
			});
		}

		// UI updates
		if (phase === 'AIMING' || phase === 'CHARGING') {
			const secs = Math.ceil(data.turnTimeLeft);
			const color =
				secs > 10 ? COLOR_STRINGS.neonGlow : secs > 5 ? COLOR_STRINGS.yellow : COLOR_STRINGS.red;
			this.timerText.setText(`${secs}s`).setColor(color);
			this.turnText.setText(`${PLAYER_NAMES[currentPlayer]}'s Turn`);
		}

		this.updateFuelBar(data.fuel);
		this.updateHealthBar(data.tanks[this.myPlayerIndex].health);
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

		// Controls box
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
			if (y >= getHeightAt(this.localTerrain, x)) break;
			if (i % DOT_INTERVAL === DOT_INTERVAL - 1) {
				const alpha = 0.8 * (1 - dotsDrawn / MAX_DOTS);
				this.trajectoryGfx.fillStyle(COLORS.white, alpha);
				this.trajectoryGfx.fillCircle(x, y, 2.5);
				dotsDrawn++;
			}
		}
	}

	private showAirstrikeZone(x: number) {
		const SPREAD = 150;
		const h = this.scale.height;
		const gfx = this.add.graphics().setDepth(7);

		gfx.fillStyle(0xff9900, 0.07);
		gfx.fillRect(x - SPREAD, 0, SPREAD * 2, h);

		gfx.lineStyle(2, 0xffee44, 0.9);
		gfx.beginPath();
		gfx.moveTo(x, 0);
		gfx.lineTo(x, h);
		gfx.strokePath();

		gfx.lineStyle(1, 0xff9900, 0.5);
		gfx.beginPath();
		gfx.moveTo(x - SPREAD, 0);
		gfx.lineTo(x - SPREAD, h);
		gfx.moveTo(x + SPREAD, 0);
		gfx.lineTo(x + SPREAD, h);
		gfx.strokePath();

		this.tweens.add({ targets: gfx, alpha: 0, duration: 500, delay: 300, onComplete: () => gfx.destroy() });
	}

	private handleExplosionFx(x: number, y: number, craterRadius: number, blastRadius: number) {
		this.cameras.main.shake(350, blastRadius * 0.00018);

		const gfx = this.add.graphics().setDepth(5);
		gfx.fillStyle(COLORS.craterOuter).fillCircle(x, y, craterRadius * 0.93);
		gfx.fillStyle(COLORS.craterMid).fillCircle(x, y, craterRadius * 0.57);
		gfx.fillStyle(COLORS.white).fillCircle(x, y, craterRadius * 0.26);
		this.time.delayedCall(450, () => gfx.destroy());

		this.spawnCraterDust(x, y, craterRadius);
	}

	private spawnCraterDust(x: number, y: number, radius: number) {
		const count = Math.floor(radius * 1.2);
		const colors = [
			COLORS.terrain,
			COLORS.terrainDark,
			COLORS.neonGlow,
			COLORS.craterStone,
			COLORS.craterGrey
		];
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
		this.selectableWeaponIndices.forEach((typeIdx, si) => {
			const type = PROJECTILE_TYPES[typeIdx];
			const active = typeIdx === activeIndex;
			this.weaponTexts[si]
				.setText(active ? `[ ${type.name} ]` : type.name)
				.setColor(active ? COLOR_STRINGS.yellow : COLOR_STRINGS.weaponInactive)
				.setFontSize(Math.round(this.sh(12)));
		});
	}

	private updatePowerBar(power: number) {
		this.powerFill.clear();
		const pct = power / 100;
		const color = pct < 0.4 ? COLORS.barHigh : pct < 0.7 ? COLORS.barMid : COLORS.barLow;
		this.powerFill.fillStyle(color);
		this.powerFill.fillRect(this.barX, this.barY, this.barW * pct, this.barH);
	}

	private updateFuelBar(fuel: number) {
		this.fuelFill.clear();
		const pct = fuel / 100;
		const color = pct > 0.5 ? COLORS.fuelHigh : pct > 0.25 ? COLORS.fuelMid : COLORS.fuelLow;
		this.fuelFill.fillStyle(color);
		this.fuelFill.fillRect(this.fuelBarX, this.fuelBarY, this.fuelBarW * pct, this.fuelBarH);
	}

	private updateHealthBar(health: number) {
		this.healthFill.clear();
		const pct = health / 100;
		const color = pct > 0.5 ? COLORS.barHigh : pct > 0.25 ? COLORS.barMid : COLORS.barLow;
		this.healthFill.fillStyle(color);
		this.healthFill.fillRect(this.healthBarX, this.healthBarY, this.healthBarW * pct, this.healthBarH);
	}

	private showGameOver(winner: 0 | 1) {
		this.add
			.graphics()
			.setDepth(20)
			.fillStyle(COLORS.navy, 0.88)
			.fillRect(
				this.scale.width / 2 - this.sw(350),
				this.scale.height / 2 - this.sh(110),
				this.sw(700),
				this.sh(220)
			);

		this.add
			.text(
				this.scale.width / 2,
				this.scale.height / 2 - this.sh(70),
				`${PLAYER_NAMES[winner]} Wins!`,
				{
					fontSize: `${Math.round(this.sh(52))}px`,
					color: COLOR_STRINGS.gold,
					stroke: COLOR_STRINGS.navy,
					strokeThickness: 6
				}
			)
			.setOrigin(0.5)
			.setDepth(21);

		this.add
			.text(this.scale.width / 2, this.scale.height / 2 + this.sh(20), 'Press R to play again', {
				fontSize: `${Math.round(this.sh(22))}px`,
				color: COLOR_STRINGS.neonGlow,
				stroke: COLOR_STRINGS.navy,
				strokeThickness: 4
			})
			.setOrigin(0.5)
			.setDepth(21);

		this.input.keyboard!.once('keydown-R', () => {
			this.returningToLobby = true;
			void this.room?.leave();
		});
	}
}
