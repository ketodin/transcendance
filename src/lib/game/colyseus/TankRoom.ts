import { Room, type Client } from 'colyseus';
import { GameRoomState } from '$lib/game/colyseus/schema/GameRoomState';
import { generateTerrain, getHeightAt, applyCrater } from '$lib/game/shared/logic/terrain';
import { createProjectile, stepProjectile, getTurretTip } from '$lib/game/shared/logic/physics';
import { PROJECTILE_TYPES, AIRSTRIKE_TYPE_INDEX } from '$lib/game/shared/projectileTypes';
import type { GameState } from '$lib/game/shared/state/GameState';
import type { TankState } from '$lib/game/shared/state/TankState';
// import chat handler
import { registerChatHandler } from '$lib/game/colyseus/handlers/chatHandler';

const SCENE_WIDTH = 1920;
const SCENE_HEIGHT = 1080;
const MOVE_SPEED = 100;
const AIM_SPEED = 55;
const POWER_RATE = 55;
const MAX_SLOPE_ANGLE = 80;
const MAX_FUEL_DISTANCE = 200;
const TANK_X: [number, number] = [180, 1740];

type InputState = {
	moveLeft: boolean;
	moveRight: boolean;
	aimUp: boolean;
	aimDown: boolean;
};

export class TankRoom extends Room<{ state: GameRoomState }> {
	private physicsState!: GameState;
	private inputs = new Map<string, InputState>();
	private tickCount = 0;
	private _nextTurnPending = false;

	onCreate() {
		this.maxClients = 2;
		this.patchRate = 16;
		this.setState(new GameRoomState());

		this.onMessage<InputState>('input', (client, data) => {
			if (this.isCurrentPlayer(client)) {
				this.inputs.set(client.sessionId, data);
			}
		});

		this.onMessage('charge_start', (client) => {
			if (!this.isCurrentPlayer(client)) return;
			if (this.physicsState?.phase !== 'AIMING') return;
			this.physicsState.phase = 'CHARGING';
			this.physicsState.power = 0;
			this.physicsState.powerIncreasing = true;
			this.state.phase = 'CHARGING';
			this.state.power = 0;
			this.state.powerIncreasing = true;
			this.broadcast('phase_change', {
				phase: 'CHARGING',
				currentPlayer: this.physicsState.currentPlayer
			});
		});

		this.onMessage('fire', (client) => {
			if (!this.isCurrentPlayer(client)) return;
			if (this.physicsState?.phase !== 'CHARGING') return;
			this.fireProjectile();
		});

		this.onMessage('cycle_weapon', (client) => {
			if (!this.isCurrentPlayer(client)) return;
			if (this.physicsState?.phase !== 'AIMING') return;
			const selectable = PROJECTILE_TYPES.map((t, i) => (t.selectable !== false ? i : -1)).filter(
				(i) => i !== -1
			);
			const cur = selectable.indexOf(this.physicsState.weaponIndex);
			this.physicsState.weaponIndex = selectable[(cur + 1) % selectable.length];
			this.state.weaponIndex = this.physicsState.weaponIndex;
		});

		this.setSimulationInterval((dt) => this.tick(dt), 1000 / 60);
		// register chat handler
		registerChatHandler(this, (client) => this.getPlayerIndex(client));
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
		if (this.physicsState && this.physicsState.phase !== 'OVER') {
			const winner = this.getPlayerIndex(client) === 0 ? 1 : 0;
			this.physicsState.phase = 'OVER';
			this.state.phase = 'OVER';
			this.state.winner = winner;
			this.broadcast('phase_change', {
				phase: 'OVER',
				currentPlayer: this.physicsState.currentPlayer,
				winner
			});
			void this.lock();
		}
	}

	private initGame() {
		const terrain = generateTerrain(SCENE_WIDTH, SCENE_HEIGHT);
		const makeTank = (index: 0 | 1): TankState => ({
			x: TANK_X[index],
			y: getHeightAt(terrain, TANK_X[index]),
			turretAngle: index === 0 ? 60 : 120,
			health: 100,
			color: 0xd4b832,
			name: `Player ${index + 1}`,
			facing: index === 0 ? 1 : -1
		});
		this.physicsState = {
			terrain,
			tanks: [makeTank(0), makeTank(1)],
			projectile: undefined,
			fragments: [],
			currentPlayer: 0,
			phase: 'AIMING',
			power: 0,
			powerIncreasing: true,
			weaponIndex: 0,
			fuel: 100,
			turnTimeLeft: 30
		};
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
		this.broadcast('game_start', {
			player0Id: this.state.player0Id,
			player1Id: this.state.player1Id,
			currentPlayer: 0,
			terrain: {
				heights: Array.from(this.physicsState.terrain.heights),
				cols: this.physicsState.terrain.cols,
				floorY: this.physicsState.terrain.floorY,
				sceneWidth: this.physicsState.terrain.sceneWidth,
				sceneHeight: this.physicsState.terrain.sceneHeight
			},
			tanks: this.physicsState.tanks.map((t) => ({ ...t })),
			fuel: 100,
			weaponIndex: 0,
			turnTimeLeft: 30,
			power: 0
		});
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

		if (phase === 'FLYING') {
			if (this.physicsState.projectile) {
				const proj = this.physicsState.projectile;
				const type = PROJECTILE_TYPES[proj.typeIndex];

				if ((type.splitCount ?? 0) > 0 && proj.vy > 0 && !proj.hasSplit) {
					proj.hasSplit = true;
					const speed = Math.sqrt(proj.vx ** 2 + proj.vy ** 2);
					const angle = Math.atan2(proj.vy, proj.vx);
					for (const deg of [-25, 0, 25]) {
						const a = angle + (deg * Math.PI) / 180;
						this.physicsState.fragments.push({
							x: proj.x,
							y: proj.y,
							prevX: proj.x,
							prevY: proj.y,
							vx: Math.cos(a) * speed * 0.75,
							vy: Math.sin(a) * speed * 0.75,
							trail: [],
							typeIndex: 0,
							bouncesLeft: 0,
							hasSplit: false
						});
					}
					this.physicsState.projectile = undefined;
					this.state.projectile.active = false;
				} else {
					const result = stepProjectile(
						proj,
						this.physicsState.terrain,
						this.physicsState.tanks,
						dt
					);
					this.syncProjectile();
					if (result.type === 'oob') {
						this.physicsState.projectile = undefined;
						this.state.projectile.active = false;
						this.checkFlightEnd();
					} else if (result.type === 'explode') {
						if (proj.typeIndex === AIRSTRIKE_TYPE_INDEX) {
							this.triggerAirstrike(result.x);
						} else {
							this.handleExplosion(result.x, result.y);
						}
					}
				}
			}

			for (let i = this.physicsState.fragments.length - 1; i >= 0; i--) {
				if (this.physicsState.phase === 'OVER') break;
				const frag = this.physicsState.fragments[i];
				const result = stepProjectile(frag, this.physicsState.terrain, this.physicsState.tanks, dt);
				if (result.type === 'oob') {
					this.physicsState.fragments.splice(i, 1);
					this.checkFlightEnd();
				} else if (result.type === 'explode') {
					const fragTypeIndex = frag.typeIndex;
					this.physicsState.fragments.splice(i, 1);
					this.applyExplosionAt(result.x, result.y, fragTypeIndex);
					this.checkFlightEnd();
				}
			}
		}

		this.tickCount++;
		if (this.tickCount % 2 === 0) this.broadcastGameUpdate();
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
		this.broadcast('phase_change', {
			phase: 'FLYING',
			currentPlayer: this.physicsState.currentPlayer
		});
	}

	private handleExplosion(x: number, y: number) {
		this.physicsState.projectile = undefined;
		this.state.projectile.active = false;
		const gameOver = this.applyExplosionAt(x, y, this.physicsState.weaponIndex);
		if (!gameOver) this.checkFlightEnd();
	}

	private applyExplosionAt(x: number, y: number, typeIndex: number): boolean {
		if (this.physicsState.phase === 'OVER') return true;
		const { craterRadius, blastRadius, maxDamage, fixedDamage } = PROJECTILE_TYPES[typeIndex];

		let deadTankIdx = -1;
		for (let i = 0; i < 2; i++) {
			const t = this.physicsState.tanks[i];
			const dist = Math.sqrt((x - t.x) ** 2 + (y - t.y) ** 2);
			if (dist < blastRadius) {
				const dmg = fixedDamage ? maxDamage : Math.round(maxDamage * (1 - dist / blastRadius));
				t.health = Math.max(0, t.health - dmg);
				this.syncTank(i as 0 | 1);
				if (t.health === 0) deadTankIdx = i;
			}
		}

		applyCrater(this.physicsState.terrain, x, y, craterRadius);
		this.syncTerrainHeights();
		this.snapTanksToTerrain();

		this.broadcast('explosion', {
			x,
			y,
			craterRadius,
			blastRadius,
			terrainHeights: Array.from(this.physicsState.terrain.heights),
			tanks: this.physicsState.tanks.map((t) => ({ ...t }))
		});

		if (deadTankIdx !== -1) {
			const winner = (deadTankIdx === 0 ? 1 : 0) satisfies 0 | 1;
			this.physicsState.phase = 'OVER';
			this.physicsState.winner = winner;
			this.state.phase = 'OVER';
			this.state.winner = winner;
			this.broadcast('phase_change', {
				phase: 'OVER',
				currentPlayer: this.physicsState.currentPlayer,
				winner
			});
			void this.lock();
			return true;
		}
		return false;
	}

	private checkFlightEnd() {
		if (this.physicsState.phase === 'OVER' || this._nextTurnPending) return;
		const frags = this.physicsState.fragments;
		if (!this.physicsState.projectile && frags.length === 0) {
			this._nextTurnPending = true;
			this.clock.setTimeout(() => {
				this._nextTurnPending = false;
				this.nextTurn();
			}, 600);
		}
	}

	private triggerAirstrike(targetX: number) {
		this.physicsState.projectile = undefined;
		this.state.projectile.active = false;
		this._nextTurnPending = true;
		this.broadcast('airstrike_incoming', { x: targetX });

		const BOMB_COUNT = 5;
		const SPREAD = 150;
		const bombTypeIndex = PROJECTILE_TYPES.findIndex((t) => t.name === 'Strike Bomb');

		this.clock.setTimeout(() => {
			if (this.physicsState.phase === 'OVER') {
				this._nextTurnPending = false;
				return;
			}
			for (let i = 0; i < BOMB_COUNT; i++) {
				const baseOffset = (i / (BOMB_COUNT - 1) - 0.5) * 2 * SPREAD;
				const xOffset = baseOffset + (Math.random() - 0.5) * 40;
				this.physicsState.fragments.push({
					x: targetX + xOffset,
					y: -50 - i * 120,
					prevX: targetX + xOffset,
					prevY: -50 - i * 120,
					vx: 0,
					vy: 700,
					trail: [],
					typeIndex: bombTypeIndex,
					bouncesLeft: 0,
					hasSplit: false
				});
			}
			this._nextTurnPending = false;
		}, 500);
	}

	private nextTurn() {
		this.physicsState.currentPlayer = (this.physicsState.currentPlayer === 0 ? 1 : 0) satisfies
			| 0
			| 1;
		this.physicsState.phase = 'AIMING';
		this.physicsState.fragments = [];
		this.physicsState.fuel = 100;
		this.physicsState.turnTimeLeft = 30;
		this.state.currentPlayer = this.physicsState.currentPlayer;
		this.state.phase = 'AIMING';
		this.state.fuel = 100;
		this.state.turnTimeLeft = 30;
		this.broadcast('phase_change', {
			phase: 'AIMING',
			currentPlayer: this.physicsState.currentPlayer
		});
	}

	private broadcastGameUpdate() {
		const ps = this.physicsState;
		const proj = ps.projectile;
		this.broadcast('game_update', {
			tanks: ps.tanks.map((t) => ({ ...t })),
			projectile: proj
				? {
						active: true,
						x: proj.x,
						y: proj.y,
						typeIndex: proj.typeIndex,
						bouncesLeft: proj.bouncesLeft
					}
				: { active: false, x: 0, y: 0, typeIndex: 0, bouncesLeft: 0 },
			fragments: ps.fragments.map((f) => ({ x: f.x, y: f.y, typeIndex: f.typeIndex })),
			turnTimeLeft: ps.turnTimeLeft,
			power: ps.power,
			powerIncreasing: ps.powerIncreasing,
			fuel: ps.fuel,
			weaponIndex: ps.weaponIndex
		});
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
