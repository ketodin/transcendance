import { Room, Client } from 'colyseus';
import { GameRoomState } from '../../src/lib/game/colyseus/schema/GameRoomState.js';
import { generateTerrain, getHeightAt, applyCrater } from '../../src/lib/game/shared/logic/terrain.js';
import { createProjectile, stepProjectile, getTurretTip } from '../../src/lib/game/shared/logic/physics.js';
import { PROJECTILE_TYPES } from '../../src/lib/game/shared/projectileTypes.js';
import type { GameState } from '../../src/lib/game/shared/state/GameState.js';
import type { TankState } from '../../src/lib/game/shared/state/TankState.js';

const SCENE_WIDTH = 1280;
const SCENE_HEIGHT = 720;
const MOVE_SPEED = 100;
const AIM_SPEED = 55;
const POWER_RATE = 55;
const MAX_SLOPE_ANGLE = 80;
const MAX_FUEL_DISTANCE = 200;
const TANK_X: [number, number] = [180, 1100];

type InputState = {
	moveLeft: boolean;
	moveRight: boolean;
	aimUp: boolean;
	aimDown: boolean;
};

export class TankRoom extends Room<GameRoomState> {
	private physicsState!: GameState;
	private inputs = new Map<string, InputState>();

	onCreate() {
		this.maxClients = 2;
		this.patchRate = 16;
		this.setState(new GameRoomState());

		this.onMessage<InputState>('input', (client, data) => {
			console.log('-1-1')
			if (this.isCurrentPlayer(client)) {
				this.inputs.set(client.sessionId, data);
			}
		});

		this.onMessage('charge_start', (client) => {
			console.log('00')
			if (!this.isCurrentPlayer(client)) return;
			if (this.physicsState?.phase !== 'AIMING') return;
			this.physicsState.phase = 'CHARGING';
			this.physicsState.power = 0;
			this.physicsState.powerIncreasing = true;
			this.state.phase = 'CHARGING';
			this.state.power = 0;
			this.state.powerIncreasing = true;
		});

		this.onMessage('fire', (client) => {
			console.log('11')
			if (!this.isCurrentPlayer(client)) return;
			if (this.physicsState?.phase !== 'CHARGING') return;
			this.fireProjectile();
		});

		this.onMessage('cycle_weapon', (client) => {
			console.log('22')
			if (!this.isCurrentPlayer(client)) return;
			if (this.physicsState?.phase !== 'AIMING') return;
			this.physicsState.weaponIndex = (this.physicsState.weaponIndex + 1) % PROJECTILE_TYPES.length;
			this.state.weaponIndex = this.physicsState.weaponIndex;
		});

		this.onMessage('restart', () => {
			console.log('33')
			if (this.physicsState?.phase === 'OVER') this.initGame();
		});

		this.setSimulationInterval((dt) => this.tick(dt), 1000 / 60);
	}

	onJoin(client: Client) {
		const idx = this.clients.length - 1;
		console.log(`[TankRoom] onJoin — idx=${idx}, sessionId=${client.sessionId}`);
		if (idx === 0) {
			this.state.player0Id = client.sessionId;
			console.log('[TankRoom] Player 1 registered, waiting for Player 2...');
		} else if (idx === 1) {
			this.state.player1Id = client.sessionId;
			console.log('[TankRoom] Player 2 joined — starting game...');
			try {
				this.initGame();
				console.log('[TankRoom] initGame() OK, phase =', this.state.phase);
			} catch (e) {
				console.error('[TankRoom] initGame() threw:', e);
			}
		}
	}

	onLeave(client: Client) {
		if (
			this.physicsState &&
			this.physicsState.phase !== 'OVER' &&
			this.physicsState.phase !== 'WAITING'
		) {
			const winner = this.getPlayerIndex(client) === 0 ? 1 : 0;
			this.physicsState.phase = 'OVER';
			this.state.phase = 'OVER';
			this.state.winner = winner;
		}
	}

	private initGame() {
		const terrain = generateTerrain(SCENE_WIDTH, SCENE_HEIGHT);
		console.log('[initGame] 1')
		const makeTank = (index: 0 | 1): TankState => ({
			x: TANK_X[index],
			y: getHeightAt(terrain, TANK_X[index]),
			turretAngle: index === 0 ? 60 : 120,
			health: 100,
			color: 0xd4b832,
			name: `Player ${index + 1}`,
			facing: index === 0 ? 1 : -1
		});
		console.log('2')
		this.physicsState = {
			terrain,
			tanks: [makeTank(0), makeTank(1)],
			projectile: undefined,
			currentPlayer: 0,
			phase: 'AIMING',
			power: 0,
			powerIncreasing: true,
			weaponIndex: 0,
			fuel: 100,
			turnTimeLeft: 30
		};
		console.log('3')
		this.syncTank(0);
		this.syncTank(1);
		this.initTerrainHeights();
		this.state.phase = 'AIMING';
		this.state.currentPlayer = 0;
		this.state.power = 0;
		this.state.powerIncreasing = true;
		this.state.weaponIndex = 0;
		this.state.fuel = 100;
		this.state.turnTimeLeft = 30;
		this.state.winner = -1;
		this.state.projectile.active = false;
	}

	private tick(dt: number) {
		if (!this.physicsState) return;
		const { phase } = this.physicsState;
		if (phase === 'OVER') return;

		const p = this.physicsState.currentPlayer;
		const currentId = p === 0 ? this.state.player0Id : this.state.player1Id;
		const input = this.inputs.get(currentId) ?? null;

		if (phase === 'AIMING' || phase === 'CHARGING') {
			this.physicsState.turnTimeLeft -= dt / 1000;
			this.state.turnTimeLeft = this.physicsState.turnTimeLeft;
			if (this.physicsState.turnTimeLeft <= 0) {
				this.nextTurn();
				return;
			}
		}

		if (phase === 'AIMING' && input) {
			const tank = this.physicsState.tanks[p];
			const moveStep = (MOVE_SPEED * dt) / 1000;
			let nx = tank.x;
			if (input.moveLeft && this.physicsState.fuel > 0) nx -= moveStep;
			if (input.moveRight && this.physicsState.fuel > 0) nx += moveStep;
			nx = Math.max(40, Math.min(SCENE_WIDTH - 40, nx));
			if (nx !== tank.x) {
				const newY = getHeightAt(this.physicsState.terrain, nx);
				const slope = Math.abs(newY - tank.y) / Math.abs(nx - tank.x);
				if (slope <= Math.tan((MAX_SLOPE_ANGLE * Math.PI) / 180)) {
					this.physicsState.fuel -= (Math.abs(nx - tank.x) / MAX_FUEL_DISTANCE) * 100;
					this.physicsState.fuel = Math.max(0, this.physicsState.fuel);
					tank.x = nx;
					tank.y = newY;
					this.syncTank(p);
					this.state.fuel = this.physicsState.fuel;
				}
			}

			const aimDelta = (AIM_SPEED * dt) / 1000;
			if (input.aimUp) this.rotateTurret(p, aimDelta);
			if (input.aimDown) this.rotateTurret(p, -aimDelta);
		}

		if (phase === 'CHARGING') {
			const rate = (POWER_RATE * dt) / 1000;
			if (this.physicsState.powerIncreasing) {
				this.physicsState.power = Math.min(100, this.physicsState.power + rate);
				if (this.physicsState.power >= 100) this.physicsState.powerIncreasing = false;
			} else {
				this.physicsState.power = Math.max(0, this.physicsState.power - rate);
				if (this.physicsState.power <= 0) this.physicsState.powerIncreasing = true;
			}
			this.state.power = this.physicsState.power;
			this.state.powerIncreasing = this.physicsState.powerIncreasing;
		}

		if (phase === 'FLYING' && this.physicsState.projectile) {
			const result = stepProjectile(
				this.physicsState.projectile,
				this.physicsState.terrain,
				this.physicsState.tanks,
				dt
			);
			this.syncProjectile();

			if (result.type === 'oob') {
				this.physicsState.projectile = undefined;
				this.state.projectile.active = false;
				this.nextTurn();
			} else if (result.type === 'explode') {
				this.handleExplosion(result.x, result.y);
			}
		}
	}

	private fireProjectile() {
		const p = this.physicsState.currentPlayer;
		const tank = this.physicsState.tanks[p];
		const tip = getTurretTip(tank);
		this.physicsState.projectile = createProjectile(
			tip.x,
			tip.y,
			tank.turretAngle,
			this.physicsState.power,
			this.physicsState.weaponIndex
		);
		this.physicsState.phase = 'FLYING';
		this.state.phase = 'FLYING';
		this.syncProjectile();
	}

	private handleExplosion(x: number, y: number) {
		const weapon = PROJECTILE_TYPES[this.physicsState.weaponIndex];
		const { craterRadius, blastRadius, maxDamage } = weapon;

		this.physicsState.projectile = undefined;
		this.state.projectile.active = false;

		let deadTankIdx = -1;
		for (let i = 0; i < 2; i++) {
			const t = this.physicsState.tanks[i];
			const dist = Math.sqrt((x - t.x) ** 2 + (y - t.y) ** 2);
			if (dist < blastRadius) {
				const dmg = Math.round(maxDamage * (1 - dist / blastRadius));
				t.health = Math.max(0, t.health - dmg);
				this.syncTank(i as 0 | 1);
				if (t.health === 0) deadTankIdx = i;
			}
		}

		applyCrater(this.physicsState.terrain, x, y, craterRadius);
		this.syncTerrainHeights();
		this.snapTanksToTerrain();

		this.broadcast('explosion', { x, y, craterRadius, blastRadius });

		if (deadTankIdx !== -1) {
			const winner = deadTankIdx === 0 ? 1 : 0;
			this.physicsState.phase = 'OVER';
			this.physicsState.winner = winner as 0 | 1;
			this.state.phase = 'OVER';
			this.state.winner = winner;
		} else {
			this.clock.setTimeout(() => this.nextTurn(), 600);
		}
	}

	private nextTurn() {
		this.physicsState.currentPlayer = (this.physicsState.currentPlayer === 0 ? 1 : 0) as 0 | 1;
		this.physicsState.phase = 'AIMING';
		this.physicsState.fuel = 100;
		this.physicsState.turnTimeLeft = 30;
		this.state.currentPlayer = this.physicsState.currentPlayer;
		this.state.phase = 'AIMING';
		this.state.fuel = 100;
		this.state.turnTimeLeft = 30;
	}

	private rotateTurret(playerIndex: 0 | 1, delta: number) {
		const tank = this.physicsState.tanks[playerIndex];
		tank.turretAngle = Math.max(5, Math.min(175, tank.turretAngle + delta * tank.facing));
		this.syncTank(playerIndex);
	}

	private syncTank(idx: 0 | 1) {
		const tank = this.physicsState.tanks[idx];
		const schema = idx === 0 ? this.state.tank0 : this.state.tank1;
		schema.x = tank.x;
		schema.y = tank.y;
		schema.turretAngle = tank.turretAngle;
		schema.health = tank.health;
		schema.color = tank.color;
		schema.name = tank.name;
		schema.facing = tank.facing;
	}

	private syncProjectile() {
		const proj = this.physicsState.projectile;
		if (!proj) {
			this.state.projectile.active = false;
			return;
		}
		this.state.projectile.active = true;
		this.state.projectile.x = proj.x;
		this.state.projectile.y = proj.y;
		this.state.projectile.vx = proj.vx;
		this.state.projectile.vy = proj.vy;
		this.state.projectile.typeIndex = proj.typeIndex;
		this.state.projectile.bouncesLeft = proj.bouncesLeft;
	}

	private initTerrainHeights() {
		const { heights, cols, floorY, sceneWidth, sceneHeight } = this.physicsState.terrain;
		this.state.terrain.heights.splice(0);
		for (const h of heights) {
			this.state.terrain.heights.push(h);
		}
		this.state.terrain.cols = cols;
		this.state.terrain.floorY = floorY;
		this.state.terrain.sceneWidth = sceneWidth;
		this.state.terrain.sceneHeight = sceneHeight;
	}

	private syncTerrainHeights() {
		const { heights } = this.physicsState.terrain;
		for (let i = 0; i < heights.length; i++) {
			this.state.terrain.heights[i] = heights[i];
		}
	}

	private snapTanksToTerrain() {
		for (let i = 0; i < 2; i++) {
			const tank = this.physicsState.tanks[i];
			tank.y = getHeightAt(this.physicsState.terrain, tank.x);
			this.syncTank(i as 0 | 1);
		}
	}

	private isCurrentPlayer(client: Client): boolean {
		const p = this.physicsState?.currentPlayer;
		if (p === undefined) return false;
		const id = p === 0 ? this.state.player0Id : this.state.player1Id;
		return client.sessionId === id;
	}

	private getPlayerIndex(client: Client): number {
		if (client.sessionId === this.state.player0Id) return 0;
		if (client.sessionId === this.state.player1Id) return 1;
		return -1;
	}
}
