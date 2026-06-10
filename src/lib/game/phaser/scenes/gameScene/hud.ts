import type GameScene from './GameScene';
import { COLORS, COLOR_STRINGS } from '../../colors';
import { resolve } from '$app/paths';
import { goto } from '$app/navigation';

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
	// If the player had the leave-confirm window open, close it so the two
	// modals don't overlap when the opponent leaves / the game ends.
	scene.dismissLeaveConfirm?.();

	const w = scene.scale.width;
	const h = scene.scale.height;

	const overlay = scene.add.graphics().setDepth(30);
	overlay.fillStyle(0x000000, 0.65);
	overlay.fillRect(0, 0, w, h);

	// Block clicks from reaching the game behind the overlay.
	scene.add
		.zone(w / 2, h / 2, w, h)
		.setDepth(30)
		.setInteractive();

	const panelW = scene.sw(420);
	const panelH = scene.sh(220);
	const px = w / 2 - panelW / 2;
	const py = h / 2 - panelH / 2;

	const panel = scene.add.graphics().setDepth(31);
	panel.fillStyle(COLORS.navy, 0.97);
	panel.fillRoundedRect(px, py, panelW, panelH, scene.sw(8));
	panel.lineStyle(1, COLORS.neonGlow, 0.35);
	panel.strokeRoundedRect(px, py, panelW, panelH, scene.sw(8));

	scene.add
		.text(w / 2, py + scene.sh(85), `${scene.playerNames[winner]} Wins!`, {
			fontSize: `${Math.round(scene.sh(46))}px`,
			color: COLOR_STRINGS.gold,
			stroke: COLOR_STRINGS.navy,
			strokeThickness: 6
		})
		.setOrigin(0.5)
		.setDepth(32);

	const btnW = scene.sw(190);
	const btnH = scene.sh(48);
	const btnCx = w / 2;
	const btnY = py + scene.sh(160);

	const homeGfx = scene.add.graphics().setDepth(32);
	homeGfx.fillStyle(0x0a1430, 1);
	homeGfx.fillRoundedRect(btnCx - btnW / 2, btnY - btnH / 2, btnW, btnH, scene.sw(5));
	homeGfx.lineStyle(scene.sw(1.5), COLORS.neonGlow, 1);
	homeGfx.strokeRoundedRect(btnCx - btnW / 2, btnY - btnH / 2, btnW, btnH, scene.sw(5));

	scene.add
		.text(btnCx, btnY, 'RETURN HOME', {
			fontSize: `${Math.round(scene.sh(16))}px`,
			color: COLOR_STRINGS.neonGlow,
			fontStyle: 'bold',
			stroke: COLOR_STRINGS.navy,
			strokeThickness: 3
		})
		.setOrigin(0.5)
		.setDepth(33);

	const homeZone = scene.add
		.zone(btnCx, btnY, btnW, btnH)
		.setDepth(33)
		.setInteractive({ useHandCursor: true });

	homeZone.on('pointerdown', async () => {
		void scene.room?.leave();
		await goto(resolve('/'));
	});
}

export function showLeaveConfirm(scene: GameScene) {
	scene.showingLeaveConfirm = true;

	const w = scene.scale.width;
	const h = scene.scale.height;

	const overlay = scene.add.graphics().setDepth(30);
	overlay.fillStyle(0x000000, 0.65);
	overlay.fillRect(0, 0, w, h);

	const blockZone = scene.add
		.zone(w / 2, h / 2, w, h)
		.setDepth(30)
		.setInteractive();

	const panelW = scene.sw(380);
	const panelH = scene.sh(200);
	const px = w / 2 - panelW / 2;
	const py = h / 2 - panelH / 2;

	const panel = scene.add.graphics().setDepth(31);
	panel.fillStyle(COLORS.navy, 0.97);
	panel.fillRoundedRect(px, py, panelW, panelH, scene.sw(8));
	panel.lineStyle(1, COLORS.neonGlow, 0.35);
	panel.strokeRoundedRect(px, py, panelW, panelH, scene.sw(8));

	const title = scene.add
		.text(w / 2, py + scene.sh(50), 'Leave the game?', {
			fontSize: `${Math.round(scene.sh(26))}px`,
			color: COLOR_STRINGS.white,
			stroke: COLOR_STRINGS.navy,
			strokeThickness: 4
		})
		.setOrigin(0.5)
		.setDepth(32);

	const subtitle = scene.add
		.text(w / 2, py + scene.sh(95), 'You will forfeit the match.', {
			fontSize: `${Math.round(scene.sh(16))}px`,
			color: COLOR_STRINGS.red,
			stroke: COLOR_STRINGS.navy,
			strokeThickness: 3
		})
		.setOrigin(0.5)
		.setDepth(32);

	const btnW = scene.sw(130);
	const btnH = scene.sh(44);
	const btnY = py + scene.sh(155);
	const stayCx = w / 2 - scene.sw(80);
	const leaveCx = w / 2 + scene.sw(80);

	const stayGfx = scene.add.graphics().setDepth(32);
	stayGfx.fillStyle(0x0e1a0e, 1);
	stayGfx.fillRoundedRect(stayCx - btnW / 2, btnY - btnH / 2, btnW, btnH, scene.sw(5));
	stayGfx.lineStyle(scene.sw(1.5), 0x22aa44, 1);
	stayGfx.strokeRoundedRect(stayCx - btnW / 2, btnY - btnH / 2, btnW, btnH, scene.sw(5));

	const stayLabel = scene.add
		.text(stayCx, btnY, 'STAY', {
			fontSize: `${Math.round(scene.sh(16))}px`,
			color: '#22cc55',
			fontStyle: 'bold',
			stroke: COLOR_STRINGS.navy,
			strokeThickness: 3
		})
		.setOrigin(0.5)
		.setDepth(33);

	const leaveGfx = scene.add.graphics().setDepth(32);
	leaveGfx.fillStyle(0x1a0500, 1);
	leaveGfx.fillRoundedRect(leaveCx - btnW / 2, btnY - btnH / 2, btnW, btnH, scene.sw(5));
	leaveGfx.lineStyle(scene.sw(1.5), 0xcc2211, 1);
	leaveGfx.strokeRoundedRect(leaveCx - btnW / 2, btnY - btnH / 2, btnW, btnH, scene.sw(5));

	const leaveConfirmLabel = scene.add
		.text(leaveCx, btnY, 'LEAVE', {
			fontSize: `${Math.round(scene.sh(16))}px`,
			color: '#ff4433',
			fontStyle: 'bold',
			stroke: COLOR_STRINGS.navy,
			strokeThickness: 3
		})
		.setOrigin(0.5)
		.setDepth(33);

	const stayZone = scene.add
		.zone(stayCx, btnY, btnW, btnH)
		.setDepth(33)
		.setInteractive({ useHandCursor: true });

	const leaveZone = scene.add
		.zone(leaveCx, btnY, btnW, btnH)
		.setDepth(33)
		.setInteractive({ useHandCursor: true });

	const dismiss = () => {
		overlay.destroy();
		blockZone.destroy();
		panel.destroy();
		title.destroy();
		subtitle.destroy();
		stayGfx.destroy();
		stayLabel.destroy();
		leaveGfx.destroy();
		leaveConfirmLabel.destroy();
		stayZone.destroy();
		leaveZone.destroy();
		scene.showingLeaveConfirm = false;
		scene.dismissLeaveConfirm = null;
	};
	scene.dismissLeaveConfirm = dismiss;

	stayZone.on('pointerdown', dismiss);
	leaveZone.on('pointerdown', async () => {
		dismiss();
		void scene.room?.leave();
		await goto(resolve('/'));
	});
}
