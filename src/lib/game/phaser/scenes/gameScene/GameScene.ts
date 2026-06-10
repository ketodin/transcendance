import { getHeightAt } from '../../../shared/logic/terrain';
import type { TerrainState } from '../../../shared/state/TerrainState';
import type { TankSprite } from '../../../client/view/TankSprite';
import type { TerrainView } from '../../../client/view/TerrainView';
import { ProjectileView } from '../../../client/view/ProjectileView';
import type { SpeechBubble } from '../../../client/view/speechBubble';
import type { ChatInput } from '../../../client/view/ChatInput';
import { Scene, GameObjects, Input } from 'phaser';
import { Room } from '@colyseus/sdk';
import type { GameRoomState } from '../../../colyseus/schema/GameRoomState';
import { COLOR_STRINGS } from '../../colors';
import { EventBus } from '../../EventBus';
import type { InputSnapshot, GameUpdateData } from './types';
import { createBackground, setupUI } from './setup';
import { connectToServer } from './server';
import { drawLastShotTrail, drawTrajectory } from './effects';
import { updateWeaponUI } from './weaponUI';
import { drawFireButton, drawChatButton, drawMoveButton, drawLeaveButton } from './buttons';
import { updateFuelBar, updateHealthBar } from './hud';

export default class GameScene extends Scene {
	room: Room<GameRoomState>;
	returningToLobby = false;
	myPlayerIndex: 0 | 1 = 0;

	roomReady = false;
	localPhase = '';
	localCurrentPlayer = 0;
	localWinner = -1;
	localTerrain: TerrainState | null = null;
	localGameData: GameUpdateData | null = null;

	tankSprites: [TankSprite, TankSprite] | null = null;
	terrainView: TerrainView | null = null;
	projView: ProjectileView | null = null;
	clientTrail: Array<{ x: number; y: number }> = [];
	lastProjActive = false;
	lastProjX = -Infinity;
	lastShotTrail: Array<{ x: number; y: number }> = [];
	lastShotGfx!: GameObjects.Graphics;
	flyingProjectileIsMine = false;
	fullFlightTrail: Array<{ x: number; y: number }> = [];
	fragmentViews: ProjectileView[] = [];
	fragmentTrails: Array<Array<{ x: number; y: number }>> = [];
	selectableWeaponIndices: number[] = [];
	weaponCooldowns: [boolean[], boolean[]] = [[], []];
	hoveredWeaponTypeIdx = -1;
	playerNames: [string, string] = ['Player 1', 'Player 2'];

	lastInput: InputSnapshot = { moveLeft: false, moveRight: false };
	localTurretAngle = 90;
	lastSentAngle = 90;
	localPower = 0;
	isGrabbing = false;

	turnText!: GameObjects.Text;
	timerText!: GameObjects.Text;
	fireBtn!: GameObjects.Graphics;
	fireBtnLabel!: GameObjects.Text;
	fireBtnCx = 0;
	fireBtnCy = 0;
	fireBtnW = 0;
	fireBtnH = 0;
	fireBtnHovered = false;
	chatBtn!: GameObjects.Graphics;
	chatBtnCx = 0;
	chatBtnCy = 0;
	chatBtnW = 0;
	chatBtnH = 0;
	chatBtnHovered = false;
	leaveBtn!: GameObjects.Graphics;
	leaveBtnLabel!: GameObjects.Text;
	leaveBtnCx = 0;
	leaveBtnCy = 0;
	leaveBtnW = 0;
	leaveBtnH = 0;
	leaveBtnHovered = false;
	showingLeaveConfirm = false;
	fuelBg!: GameObjects.Graphics;
	fuelFill!: GameObjects.Graphics;
	fuelIcon!: GameObjects.Text;
	healthBg!: GameObjects.Graphics;
	healthFill!: GameObjects.Graphics;
	healthIcon!: GameObjects.Text;
	trajectoryGfx!: GameObjects.Graphics;
	weaponUiGfx!: GameObjects.Graphics;
	weaponNameLabel!: GameObjects.Text;
	statusText!: GameObjects.Text;

	speechBubbles!: [SpeechBubble, SpeechBubble];
	chatInput!: ChatInput;

	moveLBtnDown = false;
	moveRBtnDown = false;
	moveLeftBtn!: GameObjects.Graphics;
	moveRightBtn!: GameObjects.Graphics;
	moveLeftBtnHovered = false;
	moveRightBtnHovered = false;
	moveBtnCx: [number, number] = [0, 0];
	moveBtnCy = 0;
	moveBtnW = 0;
	moveBtnH = 0;

	sw(n: number) {
		return (n * this.scale.width) / 1280;
	}
	sh(n: number) {
		return (n * this.scale.height) / 720;
	}

	get fuelBarX() {
		return this.sw(35);
	}
	get fuelBarW() {
		return this.sw(200);
	}
	get fuelBarH() {
		return this.sh(18);
	}
	get fuelBarY() {
		return this.scale.height - this.sh(42);
	}
	get healthBarW() {
		return this.fuelBarW;
	}
	get healthBarH() {
		return this.sh(18);
	}
	get healthBarX() {
		return this.fuelBarX;
	}
	get healthBarY() {
		return this.fuelBarY - this.sh(20) - this.sh(18);
	}

	constructor(options: { room: Room<GameRoomState> }) {
		super({ key: 'GameScene' });
		this.room = options.room;
	}

	readonly onThemeChanged = () => {
		if (this.terrainView && this.localTerrain) this.terrainView.sync(this.localTerrain);
	};

	create() {
		createBackground(this);
		setupUI(this);
		void connectToServer(this);
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
		this.chatInput?.destroy();
	}

	update() {
		if (!this.roomReady || !this.tankSprites || !this.localGameData) return;

		const data = this.localGameData;
		const phase = this.localPhase;
		const currentPlayer = this.localCurrentPlayer;

		if (!this.isGrabbing) {
			this.localTurretAngle = data.tanks[this.myPlayerIndex].turretAngle;
		}

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
		this.speechBubbles[0].sync(data.tanks[0]);
		this.speechBubbles[1].sync(data.tanks[1]);

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

		drawLastShotTrail(this.lastShotGfx, this.lastShotTrail, this);

		if (phase === 'AIMING') {
			const secs = Math.ceil(data.turnTimeLeft);
			const color =
				secs > 10 ? COLOR_STRINGS.neonGlow : secs > 5 ? COLOR_STRINGS.yellow : COLOR_STRINGS.red;
			this.timerText.setText(`${secs}s`).setColor(color);
			this.turnText.setText(`${this.playerNames[currentPlayer]}'s Turn`);
		}

		const isMyTurn = currentPlayer === this.myPlayerIndex && phase === 'AIMING';
		if (isMyTurn) updateFuelBar(this, data.fuel);
		updateHealthBar(this, data.tanks[this.myPlayerIndex].health);
		updateWeaponUI(this, isMyTurn ? data.weaponIndex : -1, isMyTurn);
		drawFireButton(this, this.fireBtnHovered && isMyTurn, !isMyTurn);
		drawChatButton(this, this.chatBtnHovered);
		drawMoveButton(this, 0, this.moveLeftBtnHovered && isMyTurn, !isMyTurn);
		drawMoveButton(this, 1, this.moveRightBtnHovered && isMyTurn, !isMyTurn);
		drawLeaveButton(this, this.leaveBtnHovered);

		if (phase === 'AIMING' && currentPlayer === this.myPlayerIndex) {
			const tankForTraj = { ...data.tanks[currentPlayer], turretAngle: this.localTurretAngle };
			drawTrajectory(
				this.trajectoryGfx,
				tankForTraj,
				this.localTerrain ?? undefined,
				this.localPower
			);
		} else {
			this.trajectoryGfx.clear();
		}

		if (phase !== 'OVER' && currentPlayer === this.myPlayerIndex && !this.showingLeaveConfirm) {
			this.handleInput(phase);
		}
	}

	private handleInput(phase: string) {
		const snap: InputSnapshot = {
			moveLeft: this.moveLBtnDown,
			moveRight: this.moveRBtnDown
		};
		if (snap.moveLeft !== this.lastInput.moveLeft || snap.moveRight !== this.lastInput.moveRight) {
			this.lastInput = snap;
			this.room.send('input', snap);
		}

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

			const directAngle = Math.atan2(-(my - pivotY), mx - pivotX) * (180 / Math.PI);
			this.localTurretAngle = directAngle;
			if (Math.abs(directAngle - this.lastSentAngle) > 0.3) {
				this.lastSentAngle = directAngle;
				this.room.send('set_turret_angle', { angle: directAngle });
			}

			const dist = Math.sqrt((mx - pivotX) ** 2 + (my - pivotY) ** 2);
			const coneLength = dist - 40;
			this.localPower = Math.min(100, Math.max(0, (coneLength / 0.75 - 80) / 2.33));
		}
	}
}
