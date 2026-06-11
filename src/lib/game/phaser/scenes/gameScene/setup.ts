import type GameScene from './GameScene';
import { Scene } from 'phaser';
import { PROJECTILE_TYPES } from '../../../shared/projectileTypes';
import { COLORS, COLOR_STRINGS } from '../../colors';
import { TerrainView } from '../../../client/view/TerrainView';
import { TankSprite } from '../../../client/view/TankSprite';
import { ProjectileView } from '../../../client/view/ProjectileView';
import { SpeechBubble } from '../../../client/view/speechBubble';
import { ChatInput } from '../../../client/view/ChatInput';
import { CHAT_BUBBLE_DURATION } from '$lib/game/shared/chatConfig';
import { showLeaveConfirm } from './hud';
import { m } from '$lib/paraglide/messages';

export function createBackground(scene: Scene) {
	const { width, height } = scene.scale;
	const stars = scene.add.graphics().setDepth(-1);
	for (let i = 0; i < 80; i++) {
		const sx = Math.random() * width;
		const sy = Math.random() * height * 0.65;
		stars.fillStyle(COLORS.white, Math.random() * 0.4 + 0.2);
		stars.fillCircle(sx, sy, Math.random() * 1.2 + 0.3);
	}
}

export function setupUI(scene: GameScene) {
	scene.statusText = scene.add
		.text(scene.scale.width / 2, scene.scale.height / 2, m.game_connecting(), {
			fontSize: `${Math.round(scene.sh(28))}px`,
			color: COLOR_STRINGS.neonGlow,
			stroke: COLOR_STRINGS.navy,
			strokeThickness: 5
		})
		.setOrigin(0.5)
		.setDepth(20);

	scene.turnText = scene.add
		.text(scene.scale.width / 2, scene.sh(18), '', {
			fontSize: `${Math.round(scene.sh(22))}px`,
			color: COLOR_STRINGS.neonGlow,
			stroke: COLOR_STRINGS.navy,
			strokeThickness: 4
		})
		.setOrigin(0.5, 0)
		.setDepth(10)
		.setVisible(false);

	scene.timerText = scene.add
		.text(scene.scale.width / 2, scene.sh(46), '', {
			fontSize: `${Math.round(scene.sh(18))}px`,
			color: COLOR_STRINGS.neonGlow,
			stroke: COLOR_STRINGS.navy,
			strokeThickness: 3
		})
		.setOrigin(0.5, 0)
		.setDepth(10)
		.setVisible(false);

	scene.fuelBg = scene.add.graphics().setDepth(10);
	scene.fuelBg.fillStyle(COLORS.navy, 0.92);
	scene.fuelBg.fillRect(
		scene.fuelBarX - 1,
		scene.fuelBarY - 1,
		scene.fuelBarW + 2,
		scene.fuelBarH + 2
	);
	scene.fuelBg.setVisible(false);

	scene.fuelFill = scene.add.graphics().setDepth(10);

	scene.fuelIcon = scene.add
		.text(scene.fuelBarX - scene.sw(14), scene.fuelBarY + scene.fuelBarH / 2, '⛽', {
			fontSize: `${Math.round(scene.sh(14))}px`
		})
		.setOrigin(0.5)
		.setDepth(10)
		.setVisible(false);

	scene.healthBg = scene.add.graphics().setDepth(10);
	scene.healthBg.fillStyle(COLORS.navy, 0.92);
	scene.healthBg.fillRect(
		scene.healthBarX - 1,
		scene.healthBarY - 1,
		scene.healthBarW + 2,
		scene.healthBarH + 2
	);
	scene.healthBg.setVisible(false);

	scene.healthFill = scene.add.graphics().setDepth(10);

	scene.healthIcon = scene.add
		.text(scene.healthBarX - scene.sw(14), scene.healthBarY + scene.healthBarH / 2, '♥', {
			fontSize: `${Math.round(scene.sh(26))}px`,
			color: '#ff4444'
		})
		.setOrigin(0.5)
		.setDepth(10)
		.setVisible(false);

	scene.trajectoryGfx = scene.add.graphics().setDepth(8);

	scene.selectableWeaponIndices = PROJECTILE_TYPES.map((t, i) =>
		t.selectable !== false ? i : -1
	).filter((i) => i !== -1);

	const iSize = scene.sw(42);
	const iGap = scene.sw(8);
	const n = scene.selectableWeaponIndices.length;
	const startX = (scene.scale.width - (n * iSize + (n - 1) * iGap)) / 2;
	const iconY = scene.scale.height - scene.sh(66) + 6;
	scene.selectableWeaponIndices.forEach((typeIdx, si) => {
		const cx = startX + si * (iSize + iGap) + iSize / 2;
		const zone = scene.add
			.zone(cx, iconY, iSize, iSize)
			.setDepth(11)
			.setInteractive({ useHandCursor: true });
		zone.on('pointerover', () => {
			scene.hoveredWeaponTypeIdx = typeIdx;
		});
		zone.on('pointerout', () => {
			scene.hoveredWeaponTypeIdx = -1;
		});
		zone.on('pointerdown', () => {
			if (scene.localCurrentPlayer !== scene.myPlayerIndex) return;
			if (scene.localPhase !== 'AIMING') return;
			scene.room?.send('select_weapon', { index: typeIdx });
		});
	});

	const moveBtnW = scene.sw(52);
	const moveBtnH = scene.sw(42);
	const moveBtnGap = scene.sw(6);
	const moveBtnY = iconY;
	const rightCx = startX - scene.sw(80) - moveBtnGap - moveBtnW / 2;
	const leftCx = rightCx - moveBtnGap - moveBtnW;

	scene.moveLeftBtn = scene.add.graphics().setDepth(11).setVisible(false);
	scene.moveRightBtn = scene.add.graphics().setDepth(11).setVisible(false);

	scene.moveBtnCx = [leftCx, rightCx];
	scene.moveBtnCy = moveBtnY;
	scene.moveBtnW = moveBtnW;
	scene.moveBtnH = moveBtnH;

	const leftZone = scene.add
		.zone(leftCx, moveBtnY, moveBtnW, moveBtnH)
		.setDepth(12)
		.setInteractive({ useHandCursor: true });
	leftZone.on('pointerover', () => {
		scene.moveLeftBtnHovered = true;
	});
	leftZone.on('pointerout', () => {
		scene.moveLeftBtnHovered = false;
		scene.moveLBtnDown = false;
	});
	leftZone.on('pointerdown', () => {
		if (scene.localCurrentPlayer === scene.myPlayerIndex && scene.localPhase === 'AIMING')
			scene.moveLBtnDown = true;
	});
	leftZone.on('pointerup', () => {
		scene.moveLBtnDown = false;
	});

	const rightZone = scene.add
		.zone(rightCx, moveBtnY, moveBtnW, moveBtnH)
		.setDepth(12)
		.setInteractive({ useHandCursor: true });
	rightZone.on('pointerover', () => {
		scene.moveRightBtnHovered = true;
	});
	rightZone.on('pointerout', () => {
		scene.moveRightBtnHovered = false;
		scene.moveRBtnDown = false;
	});
	rightZone.on('pointerdown', () => {
		if (scene.localCurrentPlayer === scene.myPlayerIndex && scene.localPhase === 'AIMING')
			scene.moveRBtnDown = true;
	});
	rightZone.on('pointerup', () => {
		scene.moveRBtnDown = false;
	});

	scene.fireBtnW = scene.sw(80);
	scene.fireBtnH = scene.sw(42);
	const iconsEndX = (scene.scale.width + (n * iSize + (n - 1) * iGap)) / 2;
	scene.fireBtnCx = iconsEndX + scene.sw(20) + scene.fireBtnW / 2;
	scene.fireBtnCy = iconY;

	scene.fireBtn = scene.add.graphics().setDepth(11).setVisible(false);
	scene.fireBtnLabel = scene.add
		.text(scene.fireBtnCx, scene.fireBtnCy, m.game_fire(), {
			fontSize: `${Math.round(scene.sh(14))}px`,
			color: '#ffffff',
			fontStyle: 'bold',
			stroke: '#000000',
			strokeThickness: 2
		})
		.setOrigin(0.5)
		.setDepth(12)
		.setVisible(false);

	const fireBtnZone = scene.add
		.zone(scene.fireBtnCx, scene.fireBtnCy, scene.fireBtnW, scene.fireBtnH)
		.setDepth(12)
		.setInteractive({ useHandCursor: true });

	fireBtnZone.on('pointerover', () => {
		scene.fireBtnHovered = true;
	});
	fireBtnZone.on('pointerout', () => {
		scene.fireBtnHovered = false;
	});
	fireBtnZone.on('pointerdown', () => {
		if (scene.localPhase !== 'AIMING' || scene.localCurrentPlayer !== scene.myPlayerIndex) return;
		scene.room?.send('fire_direct', {
			angle: scene.localTurretAngle,
			power: Math.max(20, scene.localPower)
		});
	});

	scene.chatBtnW = scene.fireBtnW;
	scene.chatBtnH = scene.fireBtnH;
	scene.chatBtnCx = scene.fireBtnCx + scene.fireBtnW / 2 + scene.sw(8) + scene.chatBtnW / 2 + 30;
	scene.chatBtnCy = scene.fireBtnCy;

	scene.chatBtn = scene.add.graphics().setDepth(11).setVisible(false);

	const chatBtnZone = scene.add
		.zone(scene.chatBtnCx, scene.chatBtnCy, scene.chatBtnW, scene.chatBtnH)
		.setDepth(12)
		.setInteractive({ useHandCursor: true });

	chatBtnZone.on('pointerover', () => {
		scene.chatBtnHovered = true;
	});
	chatBtnZone.on('pointerout', () => {
		scene.chatBtnHovered = false;
	});
	chatBtnZone.on('pointerdown', () => {
		scene.chatInput?.toggle();
	});

	scene.weaponUiGfx = scene.add.graphics().setDepth(10).setVisible(false);
	scene.weaponNameLabel = scene.add
		.text(0, 0, '', {
			fontSize: `${Math.round(scene.sh(11))}px`,
			color: COLOR_STRINGS.yellow,
			stroke: COLOR_STRINGS.navy,
			strokeThickness: 3
		})
		.setOrigin(0.5)
		.setDepth(10)
		.setVisible(false);

	scene.leaveBtnW = scene.sw(80);
	scene.leaveBtnH = scene.sh(28);
	scene.leaveBtnCx = scene.scale.width - scene.sw(48);
	scene.leaveBtnCy = scene.scale.height - scene.sh(22);

	scene.leaveBtn = scene.add.graphics().setDepth(11).setVisible(false);
	scene.leaveBtnLabel = scene.add
		.text(scene.leaveBtnCx, scene.leaveBtnCy, m.game_leave(), {
			fontSize: `${Math.round(scene.sh(12))}px`,
			color: '#ff6655',
			fontStyle: 'bold',
			stroke: COLOR_STRINGS.navy,
			strokeThickness: 2
		})
		.setOrigin(0.5)
		.setDepth(12)
		.setVisible(false);

	const leaveBtnZone = scene.add
		.zone(scene.leaveBtnCx, scene.leaveBtnCy, scene.leaveBtnW, scene.leaveBtnH)
		.setDepth(12)
		.setInteractive({ useHandCursor: true });

	leaveBtnZone.on('pointerover', () => {
		scene.leaveBtnHovered = true;
	});
	leaveBtnZone.on('pointerout', () => {
		scene.leaveBtnHovered = false;
	});
	leaveBtnZone.on('pointerdown', () => {
		if (!scene.showingLeaveConfirm && scene.localPhase !== 'OVER') showLeaveConfirm(scene);
	});
}

export function initViews(scene: GameScene) {
	scene.terrainView?.destroy();
	scene.tankSprites?.[0].destroy();
	scene.tankSprites?.[1].destroy();
	scene.projView?.destroy();
	for (const fv of scene.fragmentViews) fv.destroy();
	scene.fragmentViews = [];
	scene.fragmentTrails = [];

	scene.terrainView = new TerrainView(scene);
	scene.terrainView.sync(scene.localTerrain!);

	scene.tankSprites = [
		new TankSprite(scene, scene.localGameData!.tanks[0]),
		new TankSprite(scene, scene.localGameData!.tanks[1])
	];
	scene.speechBubbles = [new SpeechBubble(scene), new SpeechBubble(scene)];
	const iSize = scene.sw(42);
	const iconY = scene.scale.height - scene.sh(66) + 6;
	const chatBarY = iconY + iSize / 2 + scene.sh(10);
	scene.chatInput?.destroy();
	scene.chatInput = new ChatInput(scene, chatBarY, (text: string) => {
		scene.room.send('chat', { text });
		scene.chatInput.block(CHAT_BUBBLE_DURATION);
	});
	scene.projView = new ProjectileView(scene);
	scene.lastShotGfx = scene.add.graphics().setDepth(7);
}

export function showGameUI(scene: GameScene) {
	scene.turnText.setVisible(true);
	scene.timerText.setVisible(true);
	scene.fuelBg.setVisible(true);
	scene.fuelIcon.setVisible(true);
	scene.healthBg.setVisible(true);
	scene.healthIcon.setVisible(true);
	scene.weaponUiGfx.setVisible(true);
	scene.weaponNameLabel.setVisible(true);
	scene.fireBtn.setVisible(true);
	scene.fireBtnLabel.setVisible(true);
	scene.chatBtn.setVisible(true);
	scene.moveLeftBtn.setVisible(true);
	scene.moveRightBtn.setVisible(true);
	scene.leaveBtn.setVisible(true);
	scene.leaveBtnLabel.setVisible(true);
}
