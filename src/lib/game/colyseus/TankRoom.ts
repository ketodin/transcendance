import { Room, type Client, ServerError } from 'colyseus';
import { auth } from '$lib/server/auth';
import { GameRoomState } from '$lib/game/colyseus/schema/GameRoomState';
import { generateTerrain, getHeightAt, applyCrater } from '$lib/game/shared/logic/terrain';
import { createProjectile, stepProjectile, getTurretTip } from '$lib/game/shared/logic/physics';
import { PROJECTILE_TYPES, AIRSTRIKE_TYPE_INDEX } from '$lib/game/shared/projectileTypes';
import type { GameState } from '$lib/game/shared/state/GameState';
import type { TankState } from '$lib/game/shared/state/TankState';
// import chat handler
import { registerChatHandler } from '$lib/game/colyseus/handlers/chatHandler';

const activePlayers = new Set<string>();

const SCENE_WIDTH = 1920;
const SCENE_HEIGHT = 1080;
const MOVE_SPEED = 100;
const MAX_SLOPE_ANGLE = 80;
const MAX_FUEL_DISTANCE = 200;
const TANK_X: [number, number] = [180, 1740];

type InputState = {
	moveLeft: boolean;
	moveRight: boolean;
};

export class TankRoom extends Room<{ state: GameRoomState }> {
	private physicsState!: GameState;
	private inputs = new Map<string, InputState>();
	private tickCount = 0;
	private _nextTurnPending = false;
	private player0Name = 'Player 1';
	private player1Name = 'Player 2';
	private playerIds: [string, string] = ['', ''];
	private playersReady: [boolean, boolean] = [false, false];

	async onCreate(options: { private: boolean } = { private: false }) {
		this.maxClients = 2;
		this.patchRate = 16;
		this.setState(new GameRoomState());

		if (options.private) {
			await this.setPrivate();
		}

		this.onMessage<InputState>('input', (client, data) => {
			if (this.isCurrentPlayer(client)) {
				this.inputs.set(client.sessionId, data);
			}
		});

		this.onMessage('fire_direct', (client, data: { angle: number; power: number }) => {
			if (!this.isCurrentPlayer(client)) return;
			if (this.physicsState?.phase !== 'AIMING') return;
			const p = this.physicsState.currentPlayer;
			if (this.physicsState.weaponCooldowns[p][this.physicsState.weaponIndex]) return;
			const tank = this.physicsState.tanks[p];
			tank.turretAngle = data.angle;
			this.clampTurretAngle(p);
			this.physicsState.power = Math.max(0, Math.min(100, data.power));
			this.fireProjectile();
		});

		this.onMessage('set_turret_angle', (client, data: { angle: number }) => {
			if (!this.isCurrentPlayer(client)) return;
			if (this.physicsState?.phase !== 'AIMING') return;
			const p = this.physicsState.currentPlayer;
			const tank = this.physicsState.tanks[p];
			tank.turretAngle = data.angle;
			this.clampTurretAngle(p);
		});

		this.onMessage('select_weapon', (client, data: { index: number }) => {
			if (!this.isCurrentPlayer(client)) return;
			if (this.physicsState?.phase !== 'AIMING') return;
			const p = this.physicsState.currentPlayer;
			const type = PROJECTILE_TYPES[data.index];
			if (!type || type.selectable === false) return;
			if (this.physicsState.weaponCooldowns[p][data.index]) return;
			this.physicsState.weaponIndex = data.index;
			this.state.weaponIndex = data.index;
		});

		this.onMessage('ready', (client) => {
			const idx = this.getPlayerIndex(client);
			if (idx !== undefined) this.playersReady[idx] = true;
			if (this.playersReady.every((v) => v)) {
				try {
					this.initGame();
					console.log('[TankRoom] initGame() OK, phase =', this.state.phase);
				} catch (e) {
					console.error('[TankRoom] initGame() threw:', e);
				}
			}
		});

		this.setSimulationInterval((dt) => this.tick(dt), 1000 / 60);
		// register chat handler
		registerChatHandler(this, (client) => this.getPlayerIndex(client));
	}

	async onAuth(_client: Client, _options: unknown, ctx: { headers: Headers }) {
		const session = await auth.api.getSession({ headers: ctx.headers });
		if (!session?.user) throw new ServerError(4001, 'Not authenticated');
		if (activePlayers.has(session.user.id)) throw new ServerError(4002, 'Already in a game.');
		return session.user;
	}

	onJoin(client: Client, _options: unknown, user: { id: string; name: string }) {
		const idx = this.clients.length - 1;
		activePlayers.add(user.id);
		console.log(`[TankRoom] onJoin — idx=${idx}, sessionId=${client.sessionId}`);
		if (idx === 0) {
			this.state.player0Id = client.sessionId;
			this.state.player0Name = user.name;
			this.player0Name = user.name;
			this.playerIds[0] = user.id;
			console.log('[TankRoom] Player 1 registered, waiting for Player 2...');
		} else if (idx === 1) {
			this.state.player1Id = client.sessionId;
			this.state.player1Name = user.name;
			this.player1Name = user.name;
			this.playerIds[1] = user.id;
			console.log('[TankRoom] Player 2 joined — starting game...');
		}
	}

	onLeave(client: Client) {
		const idx = this.getPlayerIndex(client);
		if (idx !== undefined && this.playerIds[idx]) activePlayers.delete(this.playerIds[idx]);

		if (this.physicsState && this.physicsState.phase !== 'OVER') {
			const winner = (idx === 0 ? 1 : 0) satisfies 0 | 1;
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

	onDrop(client: Client) {
		const idx = this.getPlayerIndex(client);
		if (idx !== undefined && this.playerIds[idx]) activePlayers.delete(this.playerIds[idx]);
	}

	private initGame() {
		const terrain = generateTerrain(SCENE_WIDTH, SCENE_HEIGHT);
		const makeTank = (index: 0 | 1): TankState => ({
			x: TANK_X[index],
			y: getHeightAt(terrain, TANK_X[index]),
			turretAngle: index === 0 ? 60 : 120,
			health: 100,
			color: index === 0 ? 0xcc2222 : 0x2255cc,
			name: index === 0 ? this.player0Name : this.player1Name,
			facing: index === 0 ? 1 : -1
		});
		const emptyCooldowns = (): boolean[] => new Array<boolean>(PROJECTILE_TYPES.length).fill(false);
		this.physicsState = {
			terrain,
			tanks: [makeTank(0), makeTank(1)],
			projectile: undefined,
			fragments: [],
			currentPlayer: 0,
			phase: 'AIMING',
			power: 0,
			weaponIndex: 0,
			fuel: 100,
			turnTimeLeft: 30,
			weaponCooldowns: [emptyCooldowns(), emptyCooldowns()]
		};
		this.state.phase = 'AIMING';
		this.state.currentPlayer = 0;
		this.state.power = 0;
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
			weaponCooldowns: this.physicsState.weaponCooldowns
		});
	}

	private tick(dt: number) {
		if (!this.physicsState) return;
		const { phase } = this.physicsState;
		if (phase === 'OVER') return;

		const p = this.physicsState.currentPlayer;
		const currentId = p === 0 ? this.state.player0Id : this.state.player1Id;
		const input = this.inputs.get(currentId) ?? null;

		if (phase === 'AIMING') {
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
					this.clampTurretAngle(p);

					this.state.fuel = this.physicsState.fuel;
				}
			}
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
		const tip = getTurretTip(tank, this.physicsState.terrain);
		const wi = this.physicsState.weaponIndex;
		this.physicsState.projectile = createProjectile(
			tip.x,
			tip.y,
			tank.turretAngle,
			this.physicsState.power,
			wi
		);

		// Mark weapon as used for this player
		this.physicsState.weaponCooldowns[p][wi] = true;
		const selectable = PROJECTILE_TYPES.map((t, i) => (t.selectable !== false ? i : -1)).filter(
			(i) => i !== -1
		);
		const allUsed = selectable.every((i) => this.physicsState.weaponCooldowns[p][i]);
		if (allUsed) {
			this.physicsState.weaponCooldowns[p] = new Array<boolean>(PROJECTILE_TYPES.length).fill(
				false
			);
		}

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
				if (t.health === 0) deadTankIdx = i;
			}
		}

		applyCrater(this.physicsState.terrain, x, y, craterRadius);
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

		// Ensure the current weapon is available for the new active player
		const p = this.physicsState.currentPlayer;
		const selectable = PROJECTILE_TYPES.map((t, i) => (t.selectable !== false ? i : -1)).filter(
			(i) => i !== -1
		);
		const available = selectable.filter((i) => !this.physicsState.weaponCooldowns[p][i]);
		if (
			available.length > 0 &&
			this.physicsState.weaponCooldowns[p][this.physicsState.weaponIndex]
		) {
			this.physicsState.weaponIndex = available[0];
			this.state.weaponIndex = available[0];
		}

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
			fuel: ps.fuel,
			weaponIndex: ps.weaponIndex,
			weaponCooldowns: ps.weaponCooldowns
		});
	}

	private clampTurretAngle(playerIndex: 0 | 1) {
		const tank = this.physicsState.tanks[playerIndex];
		tank.turretAngle = Math.max(-180, Math.min(180, tank.turretAngle));
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

	private snapTanksToTerrain() {
		for (let i = 0; i < 2; i++) {
			const tank = this.physicsState.tanks[i];
			tank.y = getHeightAt(this.physicsState.terrain, tank.x);
		}
	}

	private isCurrentPlayer(client: Client): boolean {
		const p = this.physicsState?.currentPlayer;
		if (p === undefined) return false;
		const id = p === 0 ? this.state.player0Id : this.state.player1Id;
		return client.sessionId === id;
	}

	private getPlayerIndex(client: Client): 0 | 1 | undefined {
		if (client.sessionId === this.state.player0Id) return 0;
		if (client.sessionId === this.state.player1Id) return 1;
		return undefined;
	}
}
