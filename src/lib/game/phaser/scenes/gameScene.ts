import { PROJECTILE_TYPES } from '../../shared/projectileTypes';
import { getHeightAt } from '../../shared/logic/terrain';
import { getTurretTip } from '../../shared/logic/physics';
import type { TankState } from '../../shared/state/TankState';
import type { TerrainState } from '../../shared/state/TerrainState';
import { TankSprite } from '../../client/view/TankSprite';
import { TerrainView } from '../../client/view/TerrainView';
import { ProjectileView } from '../../client/view/ProjectileView';
import { Scene, GameObjects, Input } from 'phaser';
import { Room } from '@colyseus/sdk';
import type { GameRoomState } from '../../colyseus/schema/GameRoomState';
import { COLORS, COLOR_STRINGS } from '../colors';
import { EventBus } from '../EventBus';
// Chat input and bubble component
import { SpeechBubble } from '../../client/view/speechBubble';
import { ChatInput } from '../../client/view/ChatInput';
import { CHAT_BUBBLE_DURATION } from '$lib/game/shared/chatConfig';
import { colyseusClient } from '$lib/colyseusClient';

const PLAYER_NAMES = ['Player 1', 'Player 2'];

type InputSnapshot = {
	moveLeft: boolean;
	moveRight: boolean;
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
	weaponCooldowns?: [boolean[], boolean[]];
};

export default class GameScene extends Scene {
	private room: Room<GameRoomState> | null = null;
	private returningToLobby = false;
	private myPlayerIndex: 0 | 1 = 0;

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
	private lastShotTrail: Array<{ x: number; y: number }> = [];
	private lastShotGfx!: GameObjects.Graphics;
	private flyingProjectileIsMine = false;
	private fullFlightTrail: Array<{ x: number; y: number }> = [];
	private fragmentViews: ProjectileView[] = [];
	private fragmentTrails: Array<Array<{ x: number; y: number }>> = [];
	private selectableWeaponIndices: number[] = [];
	private weaponCooldowns: [boolean[], boolean[]] = [[], []];
	private hoveredWeaponTypeIdx = -1;

	private lastInput: InputSnapshot = { moveLeft: false, moveRight: false };
	private localTurretAngle = 90;
	private lastSentAngle = 90;
	private localPower = 0;
	private isGrabbing = false;

	private turnText!: GameObjects.Text;
	private timerText!: GameObjects.Text;
	private fireBtn!: GameObjects.Graphics;
	private fireBtnLabel!: GameObjects.Text;
	private fireBtnCx = 0;
	private fireBtnCy = 0;
	private fireBtnW = 0;
	private fireBtnH = 0;
	private fireBtnHovered = false;
	private fuelBg!: GameObjects.Graphics;
	private fuelFill!: GameObjects.Graphics;
	private fuelIcon!: GameObjects.Text;
	private healthBg!: GameObjects.Graphics;
	private healthFill!: GameObjects.Graphics;
	private healthIcon!: GameObjects.Text;
	private controlsBg!: GameObjects.Graphics;
	private controlsText!: GameObjects.Text;
	private trajectoryGfx!: GameObjects.Graphics;
	private weaponUiGfx!: GameObjects.Graphics;
	private weaponNameLabel!: GameObjects.Text;
	private statusText!: GameObjects.Text;

	private sh(n: number) {
		return (n * this.scale.height) / 720;
	}
	private sw(n: number) {
		return (n * this.scale.width) / 1280;
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
		left: Input.Keyboard.Key;
		right: Input.Keyboard.Key;
	};
	private moveLBtnDown = false;
	private moveRBtnDown = false;
	private moveLeftBtn!: GameObjects.Graphics;
	private moveRightBtn!: GameObjects.Graphics;
	private moveLeftBtnHovered = false;
	private moveRightBtnHovered = false;
	private moveBtnCx: [number, number] = [0, 0];
	private moveBtnCy = 0;
	private moveBtnW = 0;
	private moveBtnH = 0;

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

		this.input.on('pointerdown', (ptr: Input.Pointer, hitObjects: GameObjects.GameObject[]) => {
			if (hitObjects.length > 0) return;
			if (this.localPhase === 'AIMING' && this.localCurrentPlayer === this.myPlayerIndex) {
				const tank = this.localGameData?.tanks[this.myPlayerIndex];
				const terrain = this.localTerrain;
				if (!tank || !terrain) return;
				const ly = getHeightAt(terrain, tank.x - 15);
				const ry = getHeightAt(terrain, tank.x + 15);
				const slope = Math.atan2(ry - ly, 30);
				const pivotX = tank.x + 17 * Math.sin(slope);
				const pivotY = tank.y - 17 * Math.cos(slope) - 7;
				const maxRadius = (80 + 100 * 2.33) * 0.75 + 40;
				const dx = ptr.worldX - pivotX;
				const dy = ptr.worldY - pivotY;
				if (dx * dx + dy * dy > maxRadius * maxRadius) return;
				this.isGrabbing = true;
			}
		});
		this.input.on('pointerup', () => {
			this.isGrabbing = false;
		});
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
			right: kb.addKey(Input.Keyboard.KeyCodes.RIGHT),
			left: kb.addKey(Input.Keyboard.KeyCodes.LEFT)
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

		this.selectableWeaponIndices = PROJECTILE_TYPES.map((t, i) =>
			t.selectable !== false ? i : -1
		).filter((i) => i !== -1);

		const iSize = this.sw(42);
		const iGap = this.sw(8);
		const n = this.selectableWeaponIndices.length;
		const startX = (this.scale.width - (n * iSize + (n - 1) * iGap)) / 2;
		const iconY = this.scale.height - this.sh(66) + 6;
		this.selectableWeaponIndices.forEach((typeIdx, si) => {
			const cx = startX + si * (iSize + iGap) + iSize / 2;
			const zone = this.add
				.zone(cx, iconY, iSize, iSize)
				.setDepth(11)
				.setInteractive({ useHandCursor: true });
			zone.on('pointerover', () => {
				this.hoveredWeaponTypeIdx = typeIdx;
			});
			zone.on('pointerout', () => {
				this.hoveredWeaponTypeIdx = -1;
			});
			zone.on('pointerdown', () => {
				if (this.localCurrentPlayer !== this.myPlayerIndex) return;
				if (this.localPhase !== 'AIMING') return;
				this.room?.send('select_weapon', { index: typeIdx });
			});
		});

		// Move buttons — placed to the left of the weapon icon cluster
		const moveBtnW = this.sw(52);
		const moveBtnH = this.sw(42);
		const moveBtnGap = this.sw(6);
		const moveBtnY = iconY;
		const rightCx = startX - this.sw(80) - moveBtnGap - moveBtnW / 2;
		const leftCx = rightCx - moveBtnGap - moveBtnW;

		this.moveLeftBtn = this.add.graphics().setDepth(11).setVisible(false);
		this.moveRightBtn = this.add.graphics().setDepth(11).setVisible(false);

		this.moveBtnCx = [leftCx, rightCx];
		this.moveBtnCy = moveBtnY;
		this.moveBtnW = moveBtnW;
		this.moveBtnH = moveBtnH;

		const leftZone = this.add
			.zone(leftCx, moveBtnY, moveBtnW, moveBtnH)
			.setDepth(12)
			.setInteractive({ useHandCursor: true });
		leftZone.on('pointerover', () => {
			this.moveLeftBtnHovered = true;
		});
		leftZone.on('pointerout', () => {
			this.moveLeftBtnHovered = false;
			this.moveLBtnDown = false;
		});
		leftZone.on('pointerdown', () => {
			if (this.localCurrentPlayer === this.myPlayerIndex && this.localPhase === 'AIMING')
				this.moveLBtnDown = true;
		});
		leftZone.on('pointerup', () => {
			this.moveLBtnDown = false;
		});

		const rightZone = this.add
			.zone(rightCx, moveBtnY, moveBtnW, moveBtnH)
			.setDepth(12)
			.setInteractive({ useHandCursor: true });
		rightZone.on('pointerover', () => {
			this.moveRightBtnHovered = true;
		});
		rightZone.on('pointerout', () => {
			this.moveRightBtnHovered = false;
			this.moveRBtnDown = false;
		});
		rightZone.on('pointerdown', () => {
			if (this.localCurrentPlayer === this.myPlayerIndex && this.localPhase === 'AIMING')
				this.moveRBtnDown = true;
		});
		rightZone.on('pointerup', () => {
			this.moveRBtnDown = false;
		});

		// Fire button — placed to the right of the weapon icon cluster
		this.fireBtnW = this.sw(80);
		this.fireBtnH = this.sw(42);
		const iconsEndX = (this.scale.width + (n * iSize + (n - 1) * iGap)) / 2;
		this.fireBtnCx = iconsEndX + this.sw(20) + this.fireBtnW / 2;
		this.fireBtnCy = iconY;

		this.fireBtn = this.add.graphics().setDepth(11).setVisible(false);
		this.fireBtnLabel = this.add
			.text(this.fireBtnCx, this.fireBtnCy, 'FIRE', {
				fontSize: `${Math.round(this.sh(14))}px`,
				color: '#ffffff',
				fontStyle: 'bold',
				stroke: '#000000',
				strokeThickness: 2
			})
			.setOrigin(0.5)
			.setDepth(12)
			.setVisible(false);

		const fireBtnZone = this.add
			.zone(this.fireBtnCx, this.fireBtnCy, this.fireBtnW, this.fireBtnH)
			.setDepth(12)
			.setInteractive({ useHandCursor: true });

		fireBtnZone.on('pointerover', () => {
			this.fireBtnHovered = true;
		});
		fireBtnZone.on('pointerout', () => {
			this.fireBtnHovered = false;
		});
		fireBtnZone.on('pointerdown', () => {
			if (this.localPhase !== 'AIMING' || this.localCurrentPlayer !== this.myPlayerIndex) return;
			this.room?.send('fire_direct', { angle: this.localTurretAngle, power: this.localPower });
		});

		this.weaponUiGfx = this.add.graphics().setDepth(10).setVisible(false);
		this.weaponNameLabel = this.add
			.text(0, 0, '', {
				fontSize: `${Math.round(this.sh(11))}px`,
				color: COLOR_STRINGS.yellow,
				stroke: COLOR_STRINGS.navy,
				strokeThickness: 3
			})
			.setOrigin(0.5)
			.setDepth(10)
			.setVisible(false);

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
			const room = await colyseusClient!.joinOrCreate<GameRoomState>('tank_room');
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
					weaponCooldowns?: [boolean[], boolean[]];
				}) => {
					this.myPlayerIndex = data.player0Id === room.sessionId ? 0 : 1;
					this.localCurrentPlayer = data.currentPlayer;
					this.localPhase = 'AIMING';
					this.localTerrain = data.terrain;
					if (data.weaponCooldowns) this.weaponCooldowns = data.weaponCooldowns;
					this.localTurretAngle = data.tanks[this.myPlayerIndex].turretAngle;
					this.lastSentAngle = this.localTurretAngle;
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
				if (data.weaponCooldowns) this.weaponCooldowns = data.weaponCooldowns;
				this.localGameData = data;
			});

			room.onMessage(
				'phase_change',
				(data: { phase: string; currentPlayer: number; winner?: number }) => {
					this.localPhase = data.phase;
					this.localCurrentPlayer = data.currentPlayer;
					if (data.phase === 'AIMING') {
						this.isGrabbing = false;
					}
					if (data.phase === 'FLYING') {
						this.flyingProjectileIsMine = data.currentPlayer === this.myPlayerIndex;
						if (this.flyingProjectileIsMine) {
							this.fullFlightTrail = [];
							this.lastShotTrail = [];
							this.lastShotGfx?.clear();
						}
					}
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
		this.lastShotGfx = this.add.graphics().setDepth(7);
	}

	private showGameUI() {
		this.turnText.setVisible(true);
		this.timerText.setVisible(true);
		this.fuelBg.setVisible(true);
		this.fuelIcon.setVisible(true);
		this.healthBg.setVisible(true);
		this.healthIcon.setVisible(true);
		this.weaponUiGfx.setVisible(true);
		this.weaponNameLabel.setVisible(true);
		this.controlsText.setText(`${'← / →'.padEnd(7)}  Move\n` + `${'Mouse'.padEnd(7)}  Aim + Power`);
		this.controlsBg.setVisible(true);
		this.controlsText.setVisible(true);
		this.fireBtn.setVisible(true);
		this.fireBtnLabel.setVisible(true);
		this.moveLeftBtn.setVisible(true);
		this.moveRightBtn.setVisible(true);
	}

	update() {
		if (!this.roomReady || !this.tankSprites || !this.localGameData) return;

		const data = this.localGameData;
		const phase = this.localPhase;
		const currentPlayer = this.localCurrentPlayer;

		if (!this.isGrabbing) {
			this.localTurretAngle = data.tanks[this.myPlayerIndex].turretAngle;
		}

		// Sync tank sprites — use local angle for instant visual on own tank
		const tank0State =
			this.myPlayerIndex === 0
				? { ...data.tanks[0], turretAngle: this.localTurretAngle }
				: data.tanks[0];
		const tank1State =
			this.myPlayerIndex === 1
				? { ...data.tanks[1], turretAngle: this.localTurretAngle }
				: data.tanks[1];
		this.tankSprites[0].sync(tank0State, this.localTerrain);
		this.tankSprites[1].sync(tank1State, this.localTerrain);
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
				if (this.flyingProjectileIsMine) {
					this.fullFlightTrail.push({ x: proj.x, y: proj.y });
				}
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
			if (this.flyingProjectileIsMine && this.fullFlightTrail.length > 0) {
				this.lastShotTrail = [...this.fullFlightTrail];
				this.fullFlightTrail = [];
			}
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
				x: f.x,
				y: f.y,
				prevX: 0,
				prevY: 0,
				vx: 0,
				vy: 0,
				trail,
				typeIndex: f.typeIndex,
				bouncesLeft: 0
			});
		}

		// Last shot dotted trail (only visible to the player who fired)
		this.drawLastShotTrail();

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
		const isMyTurn = currentPlayer === this.myPlayerIndex && phase === 'AIMING';
		this.updateWeaponUI(data.weaponIndex, isMyTurn);
		this.drawFireButton(this.fireBtnHovered && isMyTurn, !isMyTurn);
		this.drawMoveButton(0, this.moveLeftBtnHovered && isMyTurn, !isMyTurn);
		this.drawMoveButton(1, this.moveRightBtnHovered && isMyTurn, !isMyTurn);

		// Trajectory preview — only visible to the active player, never to the opponent
		if (phase === 'AIMING' && currentPlayer === this.myPlayerIndex) {
			const tankForTraj = { ...data.tanks[currentPlayer], turretAngle: this.localTurretAngle };
			this.drawTrajectory(tankForTraj, data.weaponIndex, this.localPower);
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
		// Movement input — send only when state changes (keys or on-screen buttons)
		const snap: InputSnapshot = {
			moveLeft: this.keys.left.isDown || this.moveLBtnDown,
			moveRight: this.keys.right.isDown || this.moveRBtnDown
		};
		if (snap.moveLeft !== this.lastInput.moveLeft || snap.moveRight !== this.lastInput.moveRight) {
			this.lastInput = snap;
			this.room!.send('input', snap);
		}

		// Mouse aiming — only while left button is held
		if (phase === 'AIMING' && this.isGrabbing && this.localTerrain && this.localGameData) {
			const tank = this.localGameData.tanks[this.myPlayerIndex];
			const terrain = this.localTerrain;
			const ly = getHeightAt(terrain, tank.x - 15);
			const ry = getHeightAt(terrain, tank.x + 15);
			const slope = Math.atan2(ry - ly, 30);
			const pivotX = tank.x + 17 * Math.sin(slope);
			const pivotY = tank.y - 17 * Math.cos(slope) - 7;

			const mx = this.input.activePointer.worldX;
			const my = this.input.activePointer.worldY;

			// Direct aiming — turret angle follows the cursor position immediately
			const directAngle = Math.atan2(-(my - pivotY), mx - pivotX) * (180 / Math.PI);
			this.localTurretAngle = directAngle;
			if (Math.abs(directAngle - this.lastSentAngle) > 0.3) {
				this.lastSentAngle = directAngle;
				this.room!.send('set_turret_angle', { angle: directAngle });
			}

			// Power — invert the drawTrajectory formula so the cone tip lands exactly on the cursor.
			// drawTrajectory: length = (80 + power * 2.33) * 0.75, measured from barrel tip (40px from pivot).
			const dist = Math.sqrt((mx - pivotX) ** 2 + (my - pivotY) ** 2);
			const coneLength = dist - 40;
			this.localPower = Math.min(100, Math.max(0, (coneLength / 0.75 - 80) / 2.33));
		}
	}

	private drawFireButton(hovered: boolean, disabled = false) {
		const g = this.fireBtn;
		g.clear();
		const cx = this.fireBtnCx;
		const cy = this.fireBtnCy;
		const w = this.fireBtnW;
		const h = this.fireBtnH;
		const r = this.sw(6);

		if (disabled) {
			g.fillStyle(0x0a0a0a, 1);
			g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, r);
			g.lineStyle(this.sw(1), 0x2a1a1a, 1);
			g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, r);
			this.fireBtnLabel.setAlpha(0.25);
			return;
		}

		this.fireBtnLabel.setAlpha(1);

		// Outer glow on hover
		if (hovered) {
			g.lineStyle(this.sw(5), 0xff3322, 0.18);
			g.strokeRoundedRect(
				cx - w / 2 - this.sw(3),
				cy - h / 2 - this.sw(3),
				w + this.sw(6),
				h + this.sw(6),
				r + this.sw(2)
			);
		}

		// Background
		g.fillStyle(hovered ? 0x3a0a05 : 0x200505, 1);
		g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, r);

		// Border
		g.lineStyle(this.sw(1.5), hovered ? 0xff4433 : 0xaa2211, 1);
		g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, r);

		// Top bevel
		g.lineStyle(this.sw(1), 0xffffff, hovered ? 0.15 : 0.06);
		g.beginPath();
		g.moveTo(cx - w / 2 + r, cy - h / 2);
		g.lineTo(cx + w / 2 - r, cy - h / 2);
		g.strokePath();
	}

	private drawMoveButton(side: 0 | 1, hovered: boolean, disabled: boolean) {
		const g = side === 0 ? this.moveLeftBtn : this.moveRightBtn;
		g.clear();
		const cx = this.moveBtnCx[side];
		const cy = this.moveBtnCy;
		const w = this.moveBtnW;
		const h = this.moveBtnH;
		const r = this.sw(6);

		const bgColor = disabled ? 0x080808 : hovered ? 0x1c1c1c : 0x0e0e0e;
		const borderColor = disabled ? 0x1a1a1a : hovered ? 0xffffff : 0x2a3a4a;
		const borderAlpha = disabled ? 1 : hovered ? 0.5 : 0.7;
		const arrowColor = disabled ? 0x2a2a2a : hovered ? 0xffffff : 0x8899aa;
		const arrowAlpha = disabled ? 0.3 : 1;

		// Outer glow on hover
		if (hovered) {
			g.lineStyle(this.sw(5), 0xffffff, 0.1);
			g.strokeRoundedRect(
				cx - w / 2 - this.sw(3),
				cy - h / 2 - this.sw(3),
				w + this.sw(6),
				h + this.sw(6),
				r + this.sw(2)
			);
		}

		// Background
		g.fillStyle(bgColor, 1);
		g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, r);

		// Border
		g.lineStyle(this.sw(1.5), borderColor, borderAlpha);
		g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, r);

		// Top bevel
		g.lineStyle(this.sw(1), 0xffffff, hovered ? 0.2 : 0.06);
		g.beginPath();
		g.moveTo(cx - w / 2 + r, cy - h / 2);
		g.lineTo(cx + w / 2 - r, cy - h / 2);
		g.strokePath();

		// Arrow shape
		const dir = side === 0 ? -1 : 1;
		const aw = this.sw(14); // arrowhead half-width (along movement axis)
		const ah = this.sw(11); // arrowhead half-height
		const sw2 = this.sw(5); // shaft half-thickness
		const sl = this.sw(8); // shaft length

		// Arrow tip x
		const tipX = cx + dir * (aw + sl * 0.5);
		// Arrowhead base x
		const baseX = cx + dir * sl * 0.5;
		// Shaft back end x
		const shaftEndX = cx - dir * (sl * 0.5 + this.sw(1));

		g.fillStyle(arrowColor, arrowAlpha);

		// Arrowhead (triangle)
		g.fillTriangle(tipX, cy, baseX, cy - ah, baseX, cy + ah);

		// Shaft (rectangle)
		const shaftLeft = Math.min(baseX, shaftEndX);
		const shaftRight = Math.max(baseX, shaftEndX);
		g.fillRect(shaftLeft, cy - sw2, shaftRight - shaftLeft, sw2 * 2);
	}

	private drawLastShotTrail() {
		this.lastShotGfx.clear();
		const trail = this.lastShotTrail;
		if (trail.length < 2) return;
		const step = Math.max(1, Math.floor(trail.length / 80));
		for (let i = 0; i < trail.length; i += step) {
			const alpha = 0.15 + 0.4 * (i / trail.length);
			this.lastShotGfx.fillStyle(COLORS.aiming, alpha);
			this.lastShotGfx.fillCircle(trail[i].x, trail[i].y, this.sw(1));
		}
	}

	private drawTrajectory(tank: TankState, _weaponIndex: number, power: number) {
		this.trajectoryGfx.clear();
		const tip = getTurretTip(tank, this.localTerrain ?? undefined);
		const rad = (tank.turretAngle * Math.PI) / 180;

		const maxLength = (80 + 100 * 2.33) * 0.75;
		const length = (80 + power * 2.33) * 0.75;
		const halfAngle = 5 * (Math.PI / 180);

		const tx = tip.x;
		const ty = tip.y;

		// Barrel pivot (40px back from tip along barrel direction)
		const pivotX = tx - Math.cos(rad) * 40;
		const pivotY = ty + Math.sin(rad) * 40;

		// Range disk centered on barrel pivot, radius = maxLength + barrel length
		// so the cone tip at max power exactly touches the disk edge
		this.trajectoryGfx.fillStyle(COLORS.aiming, 0.06);
		this.trajectoryGfx.fillCircle(pivotX, pivotY, maxLength + 40);

		// Outer cone
		const lx = tx + Math.cos(rad + halfAngle) * length;
		const ly = ty - Math.sin(rad + halfAngle) * length;
		const rx = tx + Math.cos(rad - halfAngle) * length;
		const ry = ty - Math.sin(rad - halfAngle) * length;
		this.trajectoryGfx.fillStyle(COLORS.aiming, 0.07);
		this.trajectoryGfx.fillTriangle(tx, ty, lx, ly, rx, ry);

		// Inner cone highlight
		const innerHalf = halfAngle * 0.35;
		const ilx = tx + Math.cos(rad + innerHalf) * length;
		const ily = ty - Math.sin(rad + innerHalf) * length;
		const irx = tx + Math.cos(rad - innerHalf) * length;
		const iry = ty - Math.sin(rad - innerHalf) * length;
		this.trajectoryGfx.fillStyle(COLORS.aiming, 0.18);
		this.trajectoryGfx.fillTriangle(tx, ty, ilx, ily, irx, iry);

		// Center axis line
		this.trajectoryGfx.lineStyle(1, COLORS.aiming, 0.22);
		this.trajectoryGfx.beginPath();
		this.trajectoryGfx.moveTo(tx, ty);
		this.trajectoryGfx.lineTo(tx + Math.cos(rad) * length, ty - Math.sin(rad) * length);
		this.trajectoryGfx.strokePath();
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

		this.tweens.add({
			targets: gfx,
			alpha: 0,
			duration: 500,
			delay: 300,
			onComplete: () => gfx.destroy()
		});
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

	private updateWeaponUI(activeIndex: number, isMyTurn = true) {
		this.weaponUiGfx.clear();
		const iSize = this.sw(42);
		const iGap = this.sw(8);
		const n = this.selectableWeaponIndices.length;
		const startX = (this.scale.width - (n * iSize + (n - 1) * iGap)) / 2;
		const iconY = this.scale.height - this.sh(66) + 6;
		const r = this.sw(5);
		const half = iSize / 2;

		const myCooldowns = this.weaponCooldowns[this.myPlayerIndex] ?? [];

		this.selectableWeaponIndices.forEach((typeIdx, si) => {
			const cx = startX + si * (iSize + iGap) + half;
			const cy = iconY;
			const active = typeIdx === activeIndex;
			const hovered = typeIdx === this.hoveredWeaponTypeIdx && !active && isMyTurn;
			const onCooldown = myCooldowns[typeIdx] === true;
			const type = PROJECTILE_TYPES[typeIdx];

			// Hover highlight
			if (hovered && !onCooldown) {
				this.weaponUiGfx.lineStyle(this.sw(4), 0xffffff, 0.5);
				this.weaponUiGfx.strokeRoundedRect(
					cx - half - this.sw(2),
					cy - half - this.sw(2),
					iSize + this.sw(4),
					iSize + this.sw(4),
					r + this.sw(1)
				);
			}

			// Outer glow for active icon
			if (active && !onCooldown) {
				this.weaponUiGfx.lineStyle(this.sw(6), type.glowColor, 0.12);
				this.weaponUiGfx.strokeRoundedRect(
					cx - half - this.sw(3),
					cy - half - this.sw(3),
					iSize + this.sw(6),
					iSize + this.sw(6),
					r + this.sw(2)
				);
				this.weaponUiGfx.lineStyle(this.sw(2), type.glowColor, 0.3);
				this.weaponUiGfx.strokeRoundedRect(
					cx - half - this.sw(1),
					cy - half - this.sw(1),
					iSize + this.sw(2),
					iSize + this.sw(2),
					r + this.sw(1)
				);
			}

			// Background
			this.weaponUiGfx.fillStyle(onCooldown ? 0x080c10 : 0x0c1520, active ? 1 : 0.82);
			this.weaponUiGfx.fillRoundedRect(cx - half, cy - half, iSize, iSize, r);
			// Subtle top-half lighter panel
			this.weaponUiGfx.fillStyle(0xffffff, onCooldown ? 0.01 : 0.03);
			this.weaponUiGfx.fillRect(cx - half, cy - half, iSize, half);

			// Border
			this.weaponUiGfx.lineStyle(
				active ? this.sw(1.5) : this.sw(1),
				onCooldown ? 0x1a2028 : active ? type.color : 0x2a3a4a,
				active && !onCooldown ? 1 : 0.8
			);
			this.weaponUiGfx.strokeRoundedRect(cx - half, cy - half, iSize, iSize, r);
			// Metallic top-edge bevel
			this.weaponUiGfx.lineStyle(this.sw(1), 0xffffff, active ? 0.18 : 0.06);
			this.weaponUiGfx.beginPath();
			this.weaponUiGfx.moveTo(cx - half + r, cy - half);
			this.weaponUiGfx.lineTo(cx + half - r, cy - half);
			this.weaponUiGfx.strokePath();

			this.drawWeaponIconShape(cx, cy, typeIdx, active && !onCooldown);

			// Cooldown overlay
			if (onCooldown) {
				this.weaponUiGfx.fillStyle(0x000000, 0.55);
				this.weaponUiGfx.fillRoundedRect(cx - half, cy - half, iSize, iSize, r);
				// X mark
				const m = this.sw(8);
				this.weaponUiGfx.lineStyle(this.sw(2), 0x556070, 0.9);
				this.weaponUiGfx.beginPath();
				this.weaponUiGfx.moveTo(cx - m, cy - m);
				this.weaponUiGfx.lineTo(cx + m, cy + m);
				this.weaponUiGfx.moveTo(cx + m, cy - m);
				this.weaponUiGfx.lineTo(cx - m, cy + m);
				this.weaponUiGfx.strokePath();
			}

			if (active) {
				this.weaponNameLabel
					.setPosition(cx, cy - half - this.sh(10))
					.setText(onCooldown ? `${type.name.toUpperCase()} (USED)` : type.name.toUpperCase())
					.setFontSize(Math.round(this.sh(11)));
			}

			// Opponent's turn — dim the icon
			if (!isMyTurn) {
				this.weaponUiGfx.fillStyle(0x000000, 0.55);
				this.weaponUiGfx.fillRoundedRect(cx - half, cy - half, iSize, iSize, r);
			}
		});
	}

	private drawWeaponIconShape(cx: number, cy: number, typeIdx: number, active: boolean): void {
		const g = this.weaponUiGfx;
		const type = PROJECTILE_TYPES[typeIdx];
		const s = this.sw(1);
		const c = type.color;
		const a = active ? 1 : 0.55;
		const shade = (col: number, f: number) => {
			const r = Math.min(255, Math.floor(((col >> 16) & 0xff) * f));
			const gr = Math.min(255, Math.floor(((col >> 8) & 0xff) * f));
			const b = Math.min(255, Math.floor((col & 0xff) * f));
			return (r << 16) | (gr << 8) | b;
		};

		switch (type.name) {
			case 'Shell': {
				// Tail fins
				g.fillStyle(shade(c, 0.5), a);
				g.fillTriangle(
					cx - s * 10,
					cy - s * 4.5,
					cx - s * 13,
					cy - s * 9,
					cx - s * 6,
					cy - s * 4.5
				);
				g.fillTriangle(
					cx - s * 10,
					cy + s * 4.5,
					cx - s * 13,
					cy + s * 9,
					cx - s * 6,
					cy + s * 4.5
				);
				// Body
				g.fillStyle(c, a);
				g.fillRoundedRect(cx - s * 11, cy - s * 4.5, s * 19, s * 9, s * 2.5);
				// Nose cone
				g.beginPath();
				g.moveTo(cx + s * 8, cy - s * 4.5);
				g.lineTo(cx + s * 8, cy + s * 4.5);
				g.lineTo(cx + s * 15, cy);
				g.closePath();
				g.fillPath();
				// Rotating band
				g.fillStyle(shade(c, 0.5), a);
				g.fillRect(cx + s * 1, cy - s * 4.5, s * 2.5, s * 9);
				// Top highlight
				g.fillStyle(0xffffff, 0.22 * a);
				g.fillRect(cx - s * 9, cy - s * 3.5, s * 17, s * 1.5);
				// Nose tip glint
				g.fillStyle(0xffffff, 0.15 * a);
				g.fillTriangle(cx + s * 8, cy - s * 4.5, cx + s * 15, cy, cx + s * 11, cy - s * 2.5);
				break;
			}
			case 'Heavy': {
				// Tail fins (bigger)
				g.fillStyle(shade(c, 0.45), a);
				g.fillTriangle(cx - s * 11, cy - s * 5, cx - s * 15, cy - s * 11, cx - s * 5, cy - s * 5);
				g.fillTriangle(cx - s * 11, cy + s * 5, cx - s * 15, cy + s * 11, cx - s * 5, cy + s * 5);
				// Thick body
				g.fillStyle(c, a);
				g.fillRoundedRect(cx - s * 12, cy - s * 6, s * 23, s * 12, s * 4);
				// Nose cone
				g.beginPath();
				g.moveTo(cx + s * 11, cy - s * 6);
				g.lineTo(cx + s * 11, cy + s * 6);
				g.lineTo(cx + s * 18, cy);
				g.closePath();
				g.fillPath();
				// Double body bands
				g.fillStyle(shade(c, 0.45), a);
				g.fillRect(cx - s * 2, cy - s * 6, s * 3, s * 12);
				g.fillRect(cx + s * 3.5, cy - s * 6, s * 2, s * 12);
				// Warning stripe (yellow)
				g.fillStyle(0xffcc00, 0.55 * a);
				g.fillRect(cx - s * 8, cy - s * 2, s * 11, s * 1.5);
				// Top highlight
				g.fillStyle(0xffffff, 0.2 * a);
				g.fillRect(cx - s * 10, cy - s * 5, s * 20, s * 2);
				break;
			}
			case 'Bouncer': {
				// Outer energy ring
				g.lineStyle(s * 1.5, type.glowColor, 0.45 * a);
				g.strokeCircle(cx, cy - s * 2, s * 11);
				// Ball
				g.fillStyle(c, a);
				g.fillCircle(cx, cy - s * 2, s * 8);
				// Sheen
				g.fillStyle(0xffffff, 0.35 * a);
				g.fillEllipse(cx - s * 2, cy - s * 6, s * 7, s * 4);
				g.fillStyle(0xffffff, 0.12 * a);
				g.fillEllipse(cx - s * 1, cy - s * 4.5, s * 4, s * 2.5);
				// Bounce zigzag below ball
				g.lineStyle(s * 1.5, type.glowColor, 0.7 * a);
				g.beginPath();
				g.moveTo(cx - s * 11, cy + s * 11);
				g.lineTo(cx - s * 6, cy + s * 7);
				g.lineTo(cx - s * 1, cy + s * 11);
				g.lineTo(cx + s * 4, cy + s * 7);
				g.lineTo(cx + s * 9, cy + s * 11);
				g.strokePath();
				// Impact dots on zigzag peaks
				g.fillStyle(type.glowColor, 0.5 * a);
				g.fillCircle(cx - s * 6, cy + s * 7, s * 1.5);
				g.fillCircle(cx + s * 4, cy + s * 7, s * 1.5);
				break;
			}
			case 'Split': {
				// Three sub-projectiles fanning right
				const subAngles = [-38, 0, 38];
				for (const deg of subAngles) {
					const rad = (deg * Math.PI) / 180;
					const ex = cx + Math.cos(rad) * s * 11;
					const ey = cy + Math.sin(rad) * s * 11;
					// Trail
					g.lineStyle(s * 1.5, shade(c, 0.55), 0.45 * a);
					g.beginPath();
					g.moveTo(cx, cy);
					g.lineTo(ex, ey);
					g.strokePath();
					// Sub-projectile
					g.fillStyle(c, a);
					g.fillCircle(ex, ey, s * 3.5);
					// Shine
					g.fillStyle(0xffffff, 0.3 * a);
					g.fillCircle(ex - s * 1, ey - s * 1, s * 1.5);
				}
				// Central burst
				g.fillStyle(type.glowColor, 0.9 * a);
				g.fillCircle(cx, cy, s * 4.5);
				g.fillStyle(0xffffff, 0.5 * a);
				g.fillCircle(cx, cy, s * 2);
				break;
			}
			case 'Airstrike': {
				// Swept wings
				g.fillStyle(shade(c, 0.72), a);
				g.fillTriangle(cx, cy - s * 2, cx - s * 4, cy - s * 14, cx - s * 11, cy - s * 2);
				g.fillTriangle(cx, cy + s * 2, cx - s * 4, cy + s * 14, cx - s * 11, cy + s * 2);
				// Fuselage
				g.fillStyle(c, a);
				g.beginPath();
				g.moveTo(cx + s * 14, cy);
				g.lineTo(cx + s * 8, cy - s * 2);
				g.lineTo(cx - s * 11, cy - s * 1.5);
				g.lineTo(cx - s * 14, cy);
				g.lineTo(cx - s * 11, cy + s * 1.5);
				g.lineTo(cx + s * 8, cy + s * 2);
				g.closePath();
				g.fillPath();
				// Tail fins
				g.fillStyle(shade(c, 0.55), a);
				g.fillTriangle(cx - s * 9, cy - s * 1.5, cx - s * 7, cy - s * 6, cx - s * 13, cy - s * 1.5);
				g.fillTriangle(cx - s * 9, cy + s * 1.5, cx - s * 7, cy + s * 6, cx - s * 13, cy + s * 1.5);
				// Cockpit
				g.fillStyle(0x88ccff, 0.85 * a);
				g.fillEllipse(cx + s * 9, cy, s * 6, s * 3);
				// Afterburner flame
				g.fillStyle(0xff6600, 0.75 * a);
				g.fillTriangle(cx - s * 14, cy - s * 1, cx - s * 14, cy + s * 1, cx - s * 19, cy);
				g.fillStyle(0xffdd00, 0.55 * a);
				g.fillTriangle(cx - s * 14, cy - s * 0.5, cx - s * 14, cy + s * 0.5, cx - s * 17, cy);
				break;
			}
			case 'Sniper': {
				// Casing
				g.fillStyle(shade(c, 0.6), a);
				g.fillRoundedRect(cx - s * 13, cy + s * 0.5, s * 16, s * 7, s * 2);
				// Bullet head
				g.fillStyle(c, a);
				g.beginPath();
				g.moveTo(cx + s * 3, cy + s * 0.5);
				g.lineTo(cx + s * 3, cy + s * 7.5);
				g.lineTo(cx + s * 14, cy + s * 4);
				g.closePath();
				g.fillPath();
				// Tip glint
				g.fillStyle(0xffffff, 0.28 * a);
				g.fillTriangle(cx + s * 3, cy + s * 0.5, cx + s * 14, cy + s * 4, cx + s * 8, cy + s * 1.5);
				// Scope body
				g.fillStyle(0x111a11, 0.95);
				g.fillRoundedRect(cx - s * 4, cy - s * 10, s * 12, s * 6, s * 1.5);
				g.lineStyle(s, type.glowColor, 0.8 * a);
				g.strokeRoundedRect(cx - s * 4, cy - s * 10, s * 12, s * 6, s * 1.5);
				// Scope lens
				g.fillStyle(0x112211, 1);
				g.fillCircle(cx + s * 2, cy - s * 7, s * 2.5);
				g.lineStyle(s * 0.8, type.glowColor, 0.6 * a);
				g.strokeCircle(cx + s * 2, cy - s * 7, s * 2.5);
				// Crosshair inside lens
				g.lineStyle(s * 0.7, 0xffffff, 0.45 * a);
				g.beginPath();
				g.moveTo(cx + s * 2, cy - s * 9.5);
				g.lineTo(cx + s * 2, cy - s * 4.5);
				g.strokePath();
				g.beginPath();
				g.moveTo(cx - s * 0.5, cy - s * 7);
				g.lineTo(cx + s * 4.5, cy - s * 7);
				g.strokePath();
				// Casing shine
				g.fillStyle(0xffffff, 0.18 * a);
				g.fillRect(cx - s * 11, cy + s * 1.5, s * 13, s * 1.5);
				// Scope-to-body mounting rail
				g.fillStyle(shade(c, 0.4), a);
				g.fillRect(cx - s * 1, cy - s * 4, s * 3, s * 4.5);
				break;
			}
		}
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
		this.healthFill.fillRect(
			this.healthBarX,
			this.healthBarY,
			this.healthBarW * pct,
			this.healthBarH
		);
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
