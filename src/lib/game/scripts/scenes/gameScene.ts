import { type GameState } from '../../shared/state/GameState';
import { type TankState } from '../../shared/state/TankState';
import { PROJECTILE_TYPES } from '../../shared/projectileTypes';
import { generateTerrain, getHeightAt, applyCrater } from '../../shared/logic/terrain';
import { createProjectile, stepProjectile, getTurretTip } from '../../shared/logic/physics';
import { TankSprite } from '../../client/view/TankSprite';
import { TerrainView } from '../../client/view/TerrainView';
import { ProjectileView } from '../../client/view/ProjectileView';
import { Scene, GameObjects, Input } from 'phaser';

const PLAYER_COLORS = [0xd4b832, 0xd4b832];
const PLAYER_NAMES = ['Player 1', 'Player 2'];
const TANK_X = [180, 1100];
const MOVE_SPEED = 100;
const AIM_SPEED = 55;
const POWER_RATE = 55;
const MAX_SLOPE_ANGLE = 80;
const MAX_FUEL_DISTANCE = 200;

export default class GameScene extends Scene {
	private gs!: GameState;

	private tankSprites!: [TankSprite, TankSprite];
	private terrainView!: TerrainView;
	private projView!: ProjectileView;

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
		const { width, height } = this.scale;

		const terrain = generateTerrain(width, height);

		const makeTank = (index: 0 | 1): TankState => ({
			x: TANK_X[index],
			y: getHeightAt(terrain, TANK_X[index]),
			turretAngle: index === 0 ? 60 : 120,
			health: 100,
			color: PLAYER_COLORS[index],
			name: PLAYER_NAMES[index],
			facing: index === 0 ? 1 : -1
		});

		this.gs = {
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

		this.createBackground();

		this.terrainView = new TerrainView(this);
		this.terrainView.sync(this.gs.terrain);

		this.tankSprites = [
			new TankSprite(this, this.gs.tanks[0]),
			new TankSprite(this, this.gs.tanks[1])
		];

		this.projView = new ProjectileView(this);

		this.input.keyboard!.removeAllKeys(true);
		this.setupKeys();
		this.setupUI();
		this.refreshTurnUI();

		this.input.keyboard!.on('keydown-R', () => this.scene.restart());
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
		this.turnText = this.add
			.text(640, 18, '', {
				fontSize: '22px',
				color: '#88e8a0',
				stroke: '#0e0e24',
				strokeThickness: 4
			})
			.setOrigin(0.5, 0)
			.setDepth(10);

		this.timerText = this.add
			.text(640, 46, '', {
				fontSize: '18px',
				color: '#88e8a0',
				stroke: '#0e0e24',
				strokeThickness: 3
			})
			.setOrigin(0.5, 0)
			.setDepth(10);

		this.powerBg = this.add.graphics().setDepth(10);
		this.powerBg.fillStyle(0x0e0e24, 0.92);
		this.powerBg.fillRect(this.barX - 1, this.barY - 1, this.barW + 2, this.barH + 2);
		this.powerBg.setVisible(false);

		this.powerFill = this.add.graphics().setDepth(10);
		this.powerFill.setVisible(false);

		this.powerLabel = this.add
			.text(640, this.barY - 22, 'POWER — release to fire', {
				fontSize: '13px',
				color: '#88e8a0',
				stroke: '#0e0e24',
				strokeThickness: 3
			})
			.setOrigin(0.5, 0)
			.setDepth(10)
			.setVisible(false);

		this.hintText = this.add
			.text(640, 700, '', {
				fontSize: '11px',
				color: 'rgba(255,255,255,0.5)',
				stroke: '#0e0e24',
				strokeThickness: 2
			})
			.setOrigin(0.5, 0)
			.setDepth(10);

		this.fuelBg = this.add.graphics().setDepth(10);
		this.fuelBg.fillStyle(0x0e0e24, 0.92);
		this.fuelBg.fillRect(
			this.fuelBarX - 1,
			this.fuelBarY - 1,
			this.fuelBarW + 2,
			this.fuelBarH + 2
		);

		this.fuelFill = this.add.graphics().setDepth(10);

		this.add
			.text(this.fuelBarX + this.fuelBarW / 2, this.fuelBarY - 18, 'FUEL', {
				fontSize: '13px',
				color: '#00ccff',
				stroke: '#0e0e24',
				strokeThickness: 3
			})
			.setOrigin(0.5, 0)
			.setDepth(10);

		this.updateFuelBar();

		this.trajectoryGfx = this.add.graphics().setDepth(8);

		const weaponXPositions = [490, 640, 790];
		this.weaponTexts = PROJECTILE_TYPES.map((type, i) =>
			this.add
				.text(weaponXPositions[i], 50, type.name, {
					fontSize: '14px',
					color: '#ffffff',
					stroke: '#0e0e24',
					strokeThickness: 3
				})
				.setOrigin(0.5)
				.setDepth(10)
		);
		this.updateWeaponUI();
	}

	private updateWeaponUI() {
		PROJECTILE_TYPES.forEach((type, i) => {
			const active = i === this.gs.weaponIndex;
			this.weaponTexts[i]
				.setText(active ? `[ ${type.name} ]` : type.name)
				.setColor(active ? '#ffdd55' : 'rgba(200,200,200,0.4)')
				.setFontSize(active ? 17 : 13);
		});
	}

	private refreshTurnUI() {
		const p = this.gs.currentPlayer;
		this.turnText.setText(`${PLAYER_NAMES[p]}'s Turn`).setColor('#88e8a0');
		this.gs.turnTimeLeft = 30;
		this.updateTimerText();

		const hint =
			p === 0
				? 'A/D: move   W/S: aim   Q: weapon   SPACE: charge'
				: '←/→: move   ↑/↓: aim   Q: weapon   ENTER: charge';
		this.hintText.setText(hint);
	}

	private updateTimerText() {
		const secs = Math.ceil(this.gs.turnTimeLeft);
		const color = secs > 10 ? '#88e8a0' : secs > 5 ? '#ffdd55' : '#ff4444';
		this.timerText.setText(`${secs}s`).setColor(color);
	}

	private updateFuelBar() {
		this.fuelFill.clear();
		const pct = this.gs.fuel / 100;
		const color = pct > 0.5 ? 0x00ccff : pct > 0.25 ? 0xffaa00 : 0xff3333;
		this.fuelFill.fillStyle(color);
		this.fuelFill.fillRect(this.fuelBarX, this.fuelBarY, this.fuelBarW * pct, this.fuelBarH);
	}

	private updatePowerBar() {
		this.powerFill.clear();
		const pct = this.gs.power / 100;
		const color = pct < 0.4 ? 0x00ff44 : pct < 0.7 ? 0xffdd00 : 0xff3333;
		this.powerFill.fillStyle(color);
		this.powerFill.fillRect(this.barX, this.barY, this.barW * pct, this.barH);
	}

	update(_time: number, delta: number) {
		if (this.gs.phase === 'OVER') return;

		const p = this.gs.currentPlayer;
		const tank = this.gs.tanks[p];

		const moveLeft = p === 0 ? this.keys.p1Left : this.keys.p2Left;
		const moveRight = p === 0 ? this.keys.p1Right : this.keys.p2Right;
		const aimUp = p === 0 ? this.keys.p1AimUp : this.keys.p2AimUp;
		const aimDown = p === 0 ? this.keys.p1AimDown : this.keys.p2AimDown;
		const shootKey = p === 0 ? this.keys.p1Shoot : this.keys.p2Shoot;

		if (this.gs.phase === 'AIMING' || this.gs.phase === 'CHARGING') {
			this.gs.turnTimeLeft -= delta / 1000;
			this.updateTimerText();
			if (this.gs.turnTimeLeft <= 0) {
				this.powerBg.setVisible(false);
				this.powerFill.setVisible(false);
				this.powerLabel.setVisible(false);
				this.nextTurn();
				return;
			}

			const aimDelta = (AIM_SPEED * delta) / 1000;
			if (aimUp.isDown) this.rotateTurret(p, aimDelta);
			if (aimDown.isDown) this.rotateTurret(p, -aimDelta);
			this.drawTrajectory(tank);
		} else {
			this.trajectoryGfx.clear();
		}

		if (this.gs.phase === 'AIMING') {
			const moveStep = (MOVE_SPEED * delta) / 1000;
			let nx = tank.x;
			if (moveLeft.isDown && this.gs.fuel > 0) nx -= moveStep;
			if (moveRight.isDown && this.gs.fuel > 0) nx += moveStep;
			nx = Math.max(40, Math.min(this.scale.width - 40, nx));
			if (nx !== tank.x) {
				const newY = getHeightAt(this.gs.terrain, nx);
				const slope = Math.abs(newY - tank.y) / Math.abs(nx - tank.x);
				if (slope <= Math.tan((MAX_SLOPE_ANGLE * Math.PI) / 180)) {
					this.gs.fuel = Math.max(
						0,
						this.gs.fuel - (Math.abs(nx - tank.x) / MAX_FUEL_DISTANCE) * 100
					);
					this.updateFuelBar();
					tank.x = nx;
					tank.y = newY;
					this.tankSprites[p].sync(tank);
				}
			}

			if (Input.Keyboard.JustDown(this.keys.weaponKey)) {
				this.gs.weaponIndex = (this.gs.weaponIndex + 1) % PROJECTILE_TYPES.length;
				this.updateWeaponUI();
			}

			if (Input.Keyboard.JustDown(shootKey)) {
				this.gs.phase = 'CHARGING';
				this.gs.power = 0;
				this.gs.powerIncreasing = true;
				this.powerBg.setVisible(true);
				this.powerFill.setVisible(true);
				this.powerLabel.setVisible(true);
			}
		}

		if (this.gs.phase === 'CHARGING') {
			const rate = (POWER_RATE * delta) / 1000;
			if (this.gs.powerIncreasing) {
				this.gs.power += rate;
				if (this.gs.power >= 100) {
					this.gs.power = 100;
					this.gs.powerIncreasing = false;
				}
			} else {
				this.gs.power -= rate;
				if (this.gs.power <= 0) {
					this.gs.power = 0;
					this.gs.powerIncreasing = true;
				}
			}
			this.updatePowerBar();

			if (Input.Keyboard.JustUp(shootKey)) {
				this.fire();
			}
		}

		if (this.gs.phase === 'FLYING' && this.gs.projectile) {
			const result = stepProjectile(this.gs.projectile, this.gs.terrain, this.gs.tanks, delta);
			this.projView.sync(this.gs.projectile);

			if (result.type === 'oob') {
				this.gs.projectile = undefined;
				this.projView.sync(undefined);
				this.nextTurn();
				return;
			}
			if (result.type === 'explode') {
				this.explode(result.x, result.y);
				return;
			}
		}
	}

	private rotateTurret(playerIndex: 0 | 1, delta: number) {
		const tank = this.gs.tanks[playerIndex];
		tank.turretAngle = Math.max(5, Math.min(175, tank.turretAngle + delta * tank.facing));
		this.tankSprites[playerIndex].sync(tank);
	}

	private drawTrajectory(tank: TankState) {
		this.trajectoryGfx.clear();
		const tip = getTurretTip(tank);
		const previewPower = this.gs.phase === 'CHARGING' ? this.gs.power : 50;
		if (previewPower < 1) return;

		const weapon = PROJECTILE_TYPES[this.gs.weaponIndex];
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
			if (y >= getHeightAt(this.gs.terrain, x)) break;
			if (i % DOT_INTERVAL === DOT_INTERVAL - 1) {
				const alpha = 0.8 * (1 - dotsDrawn / MAX_DOTS);
				this.trajectoryGfx.fillStyle(0xffffff, alpha);
				this.trajectoryGfx.fillCircle(x, y, 2.5);
				dotsDrawn++;
			}
		}
	}

	private fire() {
		const tank = this.gs.tanks[this.gs.currentPlayer];
		const tip = getTurretTip(tank);
		this.gs.projectile = createProjectile(
			tip.x,
			tip.y,
			tank.turretAngle,
			this.gs.power,
			this.gs.weaponIndex
		);
		this.gs.phase = 'FLYING';
		this.powerBg.setVisible(false);
		this.powerFill.setVisible(false);
		this.powerLabel.setVisible(false);
		this.timerText.setVisible(false);
	}

	private explode(x: number, y: number) {
		if (this.gs.projectile) {
			this.gs.projectile = undefined;
			this.projView.sync(undefined);
		}

		const weaponType = PROJECTILE_TYPES[this.gs.weaponIndex];
		const { craterRadius, blastRadius, maxDamage } = weaponType;

		this.cameras.main.shake(350, blastRadius * 0.00018);

		const gfx = this.add.graphics().setDepth(5);
		gfx.fillStyle(0xff6600).fillCircle(x, y, craterRadius * 0.93);
		gfx.fillStyle(0xffcc00).fillCircle(x, y, craterRadius * 0.57);
		gfx.fillStyle(0xffffff).fillCircle(x, y, craterRadius * 0.26);
		this.time.delayedCall(450, () => gfx.destroy());

		let deadTankIndex = -1;
		for (let i = 0; i < 2; i++) {
			const t = this.gs.tanks[i];
			const dist = Math.sqrt((x - t.x) ** 2 + (y - t.y) ** 2);
			if (dist < blastRadius) {
				const dmg = Math.round(maxDamage * (1 - dist / blastRadius));
				t.health = Math.max(0, t.health - dmg);
				this.tankSprites[i].sync(t);
				if (t.health === 0) deadTankIndex = i;
			}
		}

		applyCrater(this.gs.terrain, x, y, craterRadius);
		this.terrainView.sync(this.gs.terrain);
		this.snapTanksToTerrain();
		this.spawnCraterDust(x, y, craterRadius);

		if (deadTankIndex !== -1) {
			this.tankSprites[deadTankIndex].explodeAndDestroy(this.gs.tanks[deadTankIndex]);
			const winner = (deadTankIndex === 0 ? 1 : 0) as 0 | 1;
			this.time.delayedCall(900, () => this.showGameOver(winner));
			return;
		}

		this.time.delayedCall(600, () => this.nextTurn());
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

	private snapTanksToTerrain() {
		for (let i = 0; i < 2; i++) {
			this.gs.tanks[i].y = getHeightAt(this.gs.terrain, this.gs.tanks[i].x);
			this.tankSprites[i].sync(this.gs.tanks[i]);
		}
	}

	private nextTurn() {
		this.gs.currentPlayer = (this.gs.currentPlayer === 0 ? 1 : 0) as 0 | 1;
		this.gs.phase = 'AIMING';
		this.gs.fuel = 100;
		this.updateFuelBar();
		this.timerText.setVisible(true);
		this.refreshTurnUI();
	}

	private showGameOver(winner: 0 | 1) {
		this.gs.phase = 'OVER';

		this.add.graphics().setDepth(20).fillStyle(0x0e0e24, 0.88).fillRect(290, 240, 700, 220);

		this.add
			.text(640, 280, `${PLAYER_NAMES[winner]} Wins!`, {
				fontSize: '52px',
				color: '#d4b832',
				stroke: '#0e0e24',
				strokeThickness: 6
			})
			.setOrigin(0.5)
			.setDepth(21);

		this.add
			.text(640, 370, 'Press R to play again', {
				fontSize: '22px',
				color: '#88e8a0',
				stroke: '#0e0e24',
				strokeThickness: 4
			})
			.setOrigin(0.5)
			.setDepth(21);

		this.input.keyboard!.once('keydown-R', () => this.scene.restart());
	}
}
