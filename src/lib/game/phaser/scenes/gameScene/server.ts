import type GameScene from './GameScene';
import type { TankState } from '../../../shared/state/TankState';
import type { TerrainState } from '../../../shared/state/TerrainState';
import type { GameUpdateData } from './types';
import { handleExplosionFx, showAirstrikeZone } from './effects';
import { initViews, showGameUI } from './setup';
import { showGameOver } from './hud';

export function connectToServer(scene: GameScene) {
	scene.roomReady = false;
	scene.returningToLobby = false;
	scene.tankSprites = null;
	scene.terrainView = null;
	scene.projView = null;
	scene.localGameData = null;
	scene.localTerrain = null;
	scene.clientTrail = [];
	scene.lastProjActive = false;
	scene.localPhase = '';
	scene.localCurrentPlayer = 0;
	scene.localWinner = -1;

	try {
		const room = scene.room;

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
				scene.myPlayerIndex = data.player0Id === room.sessionId ? 0 : 1;
				scene.localCurrentPlayer = data.currentPlayer;
				scene.localPhase = 'AIMING';
				scene.localTerrain = data.terrain;
				if (data.weaponCooldowns) scene.weaponCooldowns = data.weaponCooldowns;
				scene.localTurretAngle = data.tanks[scene.myPlayerIndex].turretAngle;
				scene.lastSentAngle = scene.localTurretAngle;
				scene.localGameData = {
					tanks: data.tanks,
					projectile: { active: false, x: 0, y: 0, typeIndex: 0, bouncesLeft: 0 },
					turnTimeLeft: data.turnTimeLeft,
					power: data.power,
					powerIncreasing: true,
					fuel: data.fuel,
					weaponIndex: data.weaponIndex
				};
				scene.playerNames = [data.tanks[0].name, data.tanks[1].name];
				scene.roomReady = true;
				scene.statusText.setVisible(false);
				initViews(scene);
				showGameUI(scene);
			}
		);

		room.onMessage('game_update', (data: GameUpdateData) => {
			if (data.weaponCooldowns) scene.weaponCooldowns = data.weaponCooldowns;
			scene.localGameData = data;
		});

		room.onMessage(
			'phase_change',
			(data: { phase: string; currentPlayer: number; winner?: number }) => {
				scene.localPhase = data.phase;
				scene.localCurrentPlayer = data.currentPlayer;
				if (data.phase === 'AIMING') {
					scene.isGrabbing = false;
				}
				if (data.phase === 'FLYING') {
					scene.flyingProjectileIsMine = data.currentPlayer === scene.myPlayerIndex;
					if (scene.flyingProjectileIsMine) {
						scene.fullFlightTrail = [];
						scene.lastShotTrail = [];
						scene.lastShotGfx?.clear();
					}
				}
				if (data.winner !== undefined) scene.localWinner = data.winner;
				if (data.phase === 'OVER') showGameOver(scene, scene.localWinner);
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
				handleExplosionFx(scene, data.x, data.y, data.craterRadius, data.blastRadius);
				if (scene.localTerrain) {
					scene.localTerrain.heights = data.terrainHeights;
					scene.terrainView?.sync(scene.localTerrain);
				}
				if (scene.localGameData) {
					scene.localGameData.tanks = data.tanks;
				}
			}
		);

		room.onMessage('airstrike_incoming', (data: { x: number }) => {
			showAirstrikeZone(scene, data.x);
		});

		room.onLeave.once(() => {
			if (scene.returningToLobby) {
				scene.returningToLobby = false;
				scene.scene.restart();
			} else {
				scene.statusText.setText('Disconnected').setVisible(true);
			}
		});

		scene.statusText.setText('Waiting for Player 2...');
		room.onMessage('chat', (data: { playerIndex: number; text: string }) => {
			const tank = scene.localGameData!.tanks[data.playerIndex];
			scene.speechBubbles[data.playerIndex].setText(data.text, tank);
		});

		room.send('ready');

	} catch (err) {
		const message =
			err instanceof Error
				? 'Connection failed.\n' + err.message
				: 'Connection failed.\nCheck the game server is running.';
		scene.statusText.setText(message);
	}
}
