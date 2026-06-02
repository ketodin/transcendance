import type GameScene from './GameScene';
import { COLORS, COLOR_STRINGS } from '../../colors';
import { PLAYER_NAMES } from './types';

export function updateFuelBar(scene: GameScene, fuel: number) {
	scene.fuelFill.clear();
	const pct = fuel / 100;
	const color = pct > 0.5 ? COLORS.fuelHigh : pct > 0.25 ? COLORS.fuelMid : COLORS.fuelLow;
	scene.fuelFill.fillStyle(color);
	scene.fuelFill.fillRect(scene.fuelBarX, scene.fuelBarY, scene.fuelBarW * pct, scene.fuelBarH);
}

export function updateHealthBar(scene: GameScene, health: number) {
	scene.healthFill.clear();
	const pct = health / 100;
	const color = pct > 0.5 ? COLORS.barHigh : pct > 0.25 ? COLORS.barMid : COLORS.barLow;
	scene.healthFill.fillStyle(color);
	scene.healthFill.fillRect(
		scene.healthBarX,
		scene.healthBarY,
		scene.healthBarW * pct,
		scene.healthBarH
	);
}

export function showGameOver(scene: GameScene, winner: number) {
	scene.add
		.graphics()
		.setDepth(20)
		.fillStyle(COLORS.navy, 0.88)
		.fillRect(
			scene.scale.width / 2 - scene.sw(350),
			scene.scale.height / 2 - scene.sh(110),
			scene.sw(700),
			scene.sh(220)
		);

	scene.add
		.text(
			scene.scale.width / 2,
			scene.scale.height / 2 - scene.sh(70),
			`${PLAYER_NAMES[winner]} Wins!`,
			{
				fontSize: `${Math.round(scene.sh(52))}px`,
				color: COLOR_STRINGS.gold,
				stroke: COLOR_STRINGS.navy,
				strokeThickness: 6
			}
		)
		.setOrigin(0.5)
		.setDepth(21);

	scene.add
		.text(scene.scale.width / 2, scene.scale.height / 2 + scene.sh(20), 'Press R to play again', {
			fontSize: `${Math.round(scene.sh(22))}px`,
			color: COLOR_STRINGS.neonGlow,
			stroke: COLOR_STRINGS.navy,
			strokeThickness: 4
		})
		.setOrigin(0.5)
		.setDepth(21);

	scene.input.keyboard!.once('keydown-R', () => {
		scene.returningToLobby = true;
		void scene.room?.leave();
	});
}
