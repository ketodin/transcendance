import { PROJECTILE_TYPES } from '../../../shared/projectileTypes';
import { GameObjects } from 'phaser';
import { m as msg } from '$lib/paraglide/messages';

const WEAPON_NAME_MESSAGES: Record<string, () => string> = {
	Shell: msg.weapon_shell,
	Heavy: msg.weapon_heavy,
	Bouncer: msg.weapon_bouncer,
	Split: msg.weapon_split,
	Airstrike: msg.weapon_airstrike,
	Sniper: msg.weapon_sniper
};

function weaponDisplayName(name: string): string {
	return (WEAPON_NAME_MESSAGES[name] ?? (() => name))();
}

interface WeaponUICtx {
	weaponUiGfx: GameObjects.Graphics;
	weaponNameLabel: GameObjects.Text;
	selectableWeaponIndices: number[];
	weaponCooldowns: [boolean[], boolean[]];
	hoveredWeaponTypeIdx: number;
	myPlayerIndex: 0 | 1;
	scale: { width: number; height: number };
	sw(n: number): number;
	sh(n: number): number;
}

export function updateWeaponUI(ctx: WeaponUICtx, activeIndex: number, isMyTurn = true) {
	ctx.weaponUiGfx.clear();
	const iSize = ctx.sw(42);
	const iGap = ctx.sw(8);
	const n = ctx.selectableWeaponIndices.length;
	const startX = (ctx.scale.width - (n * iSize + (n - 1) * iGap)) / 2;
	const iconY = ctx.scale.height - ctx.sh(66) + 6;
	const r = ctx.sw(5);
	const half = iSize / 2;

	const myCooldowns = ctx.weaponCooldowns[ctx.myPlayerIndex] ?? [];

	ctx.selectableWeaponIndices.forEach((typeIdx, si) => {
		const cx = startX + si * (iSize + iGap) + half;
		const cy = iconY;
		const active = typeIdx === activeIndex;
		const hovered = typeIdx === ctx.hoveredWeaponTypeIdx && !active && isMyTurn;
		const onCooldown = myCooldowns[typeIdx] === true;
		const type = PROJECTILE_TYPES[typeIdx];

		if (hovered && !onCooldown) {
			ctx.weaponUiGfx.lineStyle(ctx.sw(4), 0xffffff, 0.5);
			ctx.weaponUiGfx.strokeRoundedRect(
				cx - half - ctx.sw(2),
				cy - half - ctx.sw(2),
				iSize + ctx.sw(4),
				iSize + ctx.sw(4),
				r + ctx.sw(1)
			);
		}

		if (active && !onCooldown) {
			ctx.weaponUiGfx.lineStyle(ctx.sw(6), type.glowColor, 0.12);
			ctx.weaponUiGfx.strokeRoundedRect(
				cx - half - ctx.sw(3),
				cy - half - ctx.sw(3),
				iSize + ctx.sw(6),
				iSize + ctx.sw(6),
				r + ctx.sw(2)
			);
			ctx.weaponUiGfx.lineStyle(ctx.sw(2), type.glowColor, 0.3);
			ctx.weaponUiGfx.strokeRoundedRect(
				cx - half - ctx.sw(1),
				cy - half - ctx.sw(1),
				iSize + ctx.sw(2),
				iSize + ctx.sw(2),
				r + ctx.sw(1)
			);
		}

		ctx.weaponUiGfx.fillStyle(onCooldown ? 0x080c10 : 0x0c1520, active ? 1 : 0.82);
		ctx.weaponUiGfx.fillRoundedRect(cx - half, cy - half, iSize, iSize, r);
		ctx.weaponUiGfx.fillStyle(0xffffff, onCooldown ? 0.01 : 0.03);
		ctx.weaponUiGfx.fillRect(cx - half, cy - half, iSize, half);

		ctx.weaponUiGfx.lineStyle(
			active ? ctx.sw(1.5) : ctx.sw(1),
			onCooldown ? 0x1a2028 : active ? type.color : 0x2a3a4a,
			active && !onCooldown ? 1 : 0.8
		);
		ctx.weaponUiGfx.strokeRoundedRect(cx - half, cy - half, iSize, iSize, r);
		ctx.weaponUiGfx.lineStyle(ctx.sw(1), 0xffffff, active ? 0.18 : 0.06);
		ctx.weaponUiGfx.beginPath();
		ctx.weaponUiGfx.moveTo(cx - half + r, cy - half);
		ctx.weaponUiGfx.lineTo(cx + half - r, cy - half);
		ctx.weaponUiGfx.strokePath();

		drawWeaponIconShape(ctx.weaponUiGfx, cx, cy, typeIdx, active && !onCooldown, ctx.sw(1));

		if (onCooldown) {
			ctx.weaponUiGfx.fillStyle(0x000000, 0.55);
			ctx.weaponUiGfx.fillRoundedRect(cx - half, cy - half, iSize, iSize, r);
			const m = ctx.sw(8);
			ctx.weaponUiGfx.lineStyle(ctx.sw(2), 0x556070, 0.9);
			ctx.weaponUiGfx.beginPath();
			ctx.weaponUiGfx.moveTo(cx - m, cy - m);
			ctx.weaponUiGfx.lineTo(cx + m, cy + m);
			ctx.weaponUiGfx.moveTo(cx + m, cy - m);
			ctx.weaponUiGfx.lineTo(cx - m, cy + m);
			ctx.weaponUiGfx.strokePath();
		}

		if (active) {
			const label = weaponDisplayName(type.name).toUpperCase();
			ctx.weaponNameLabel
				.setPosition(cx, cy - half - ctx.sh(10))
				.setText(onCooldown ? msg.game_weapon_used({ name: label }) : label)
				.setFontSize(Math.round(ctx.sh(11)));
		}

		if (!isMyTurn) {
			ctx.weaponUiGfx.fillStyle(0x000000, 0.55);
			ctx.weaponUiGfx.fillRoundedRect(cx - half, cy - half, iSize, iSize, r);
		}
	});
}

function drawWeaponIconShape(
	g: GameObjects.Graphics,
	cx: number,
	cy: number,
	typeIdx: number,
	active: boolean,
	s: number
): void {
	const type = PROJECTILE_TYPES[typeIdx];
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
			g.fillStyle(shade(c, 0.5), a);
			g.fillTriangle(cx - s * 10, cy - s * 4.5, cx - s * 13, cy - s * 9, cx - s * 6, cy - s * 4.5);
			g.fillTriangle(cx - s * 10, cy + s * 4.5, cx - s * 13, cy + s * 9, cx - s * 6, cy + s * 4.5);
			g.fillStyle(c, a);
			g.fillRoundedRect(cx - s * 11, cy - s * 4.5, s * 19, s * 9, s * 2.5);
			g.beginPath();
			g.moveTo(cx + s * 8, cy - s * 4.5);
			g.lineTo(cx + s * 8, cy + s * 4.5);
			g.lineTo(cx + s * 15, cy);
			g.closePath();
			g.fillPath();
			g.fillStyle(shade(c, 0.5), a);
			g.fillRect(cx + s * 1, cy - s * 4.5, s * 2.5, s * 9);
			g.fillStyle(0xffffff, 0.22 * a);
			g.fillRect(cx - s * 9, cy - s * 3.5, s * 17, s * 1.5);
			g.fillStyle(0xffffff, 0.15 * a);
			g.fillTriangle(cx + s * 8, cy - s * 4.5, cx + s * 15, cy, cx + s * 11, cy - s * 2.5);
			break;
		}
		case 'Heavy': {
			g.fillStyle(shade(c, 0.45), a);
			g.fillTriangle(cx - s * 11, cy - s * 5, cx - s * 15, cy - s * 11, cx - s * 5, cy - s * 5);
			g.fillTriangle(cx - s * 11, cy + s * 5, cx - s * 15, cy + s * 11, cx - s * 5, cy + s * 5);
			g.fillStyle(c, a);
			g.fillRoundedRect(cx - s * 12, cy - s * 6, s * 23, s * 12, s * 4);
			g.beginPath();
			g.moveTo(cx + s * 11, cy - s * 6);
			g.lineTo(cx + s * 11, cy + s * 6);
			g.lineTo(cx + s * 18, cy);
			g.closePath();
			g.fillPath();
			g.fillStyle(shade(c, 0.45), a);
			g.fillRect(cx - s * 2, cy - s * 6, s * 3, s * 12);
			g.fillRect(cx + s * 3.5, cy - s * 6, s * 2, s * 12);
			g.fillStyle(0xffcc00, 0.55 * a);
			g.fillRect(cx - s * 8, cy - s * 2, s * 11, s * 1.5);
			g.fillStyle(0xffffff, 0.2 * a);
			g.fillRect(cx - s * 10, cy - s * 5, s * 20, s * 2);
			break;
		}
		case 'Bouncer': {
			g.lineStyle(s * 1.5, type.glowColor, 0.45 * a);
			g.strokeCircle(cx, cy - s * 2, s * 11);
			g.fillStyle(c, a);
			g.fillCircle(cx, cy - s * 2, s * 8);
			g.fillStyle(0xffffff, 0.35 * a);
			g.fillEllipse(cx - s * 2, cy - s * 6, s * 7, s * 4);
			g.fillStyle(0xffffff, 0.12 * a);
			g.fillEllipse(cx - s * 1, cy - s * 4.5, s * 4, s * 2.5);
			g.lineStyle(s * 1.5, type.glowColor, 0.7 * a);
			g.beginPath();
			g.moveTo(cx - s * 11, cy + s * 11);
			g.lineTo(cx - s * 6, cy + s * 7);
			g.lineTo(cx - s * 1, cy + s * 11);
			g.lineTo(cx + s * 4, cy + s * 7);
			g.lineTo(cx + s * 9, cy + s * 11);
			g.strokePath();
			g.fillStyle(type.glowColor, 0.5 * a);
			g.fillCircle(cx - s * 6, cy + s * 7, s * 1.5);
			g.fillCircle(cx + s * 4, cy + s * 7, s * 1.5);
			break;
		}
		case 'Split': {
			const subAngles = [-38, 0, 38];
			for (const deg of subAngles) {
				const rad = (deg * Math.PI) / 180;
				const ex = cx + Math.cos(rad) * s * 11;
				const ey = cy + Math.sin(rad) * s * 11;
				g.lineStyle(s * 1.5, shade(c, 0.55), 0.45 * a);
				g.beginPath();
				g.moveTo(cx, cy);
				g.lineTo(ex, ey);
				g.strokePath();
				g.fillStyle(c, a);
				g.fillCircle(ex, ey, s * 3.5);
				g.fillStyle(0xffffff, 0.3 * a);
				g.fillCircle(ex - s * 1, ey - s * 1, s * 1.5);
			}
			g.fillStyle(type.glowColor, 0.9 * a);
			g.fillCircle(cx, cy, s * 4.5);
			g.fillStyle(0xffffff, 0.5 * a);
			g.fillCircle(cx, cy, s * 2);
			break;
		}
		case 'Airstrike': {
			g.fillStyle(shade(c, 0.72), a);
			g.fillTriangle(cx, cy - s * 2, cx - s * 4, cy - s * 14, cx - s * 11, cy - s * 2);
			g.fillTriangle(cx, cy + s * 2, cx - s * 4, cy + s * 14, cx - s * 11, cy + s * 2);
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
			g.fillStyle(shade(c, 0.55), a);
			g.fillTriangle(cx - s * 9, cy - s * 1.5, cx - s * 7, cy - s * 6, cx - s * 13, cy - s * 1.5);
			g.fillTriangle(cx - s * 9, cy + s * 1.5, cx - s * 7, cy + s * 6, cx - s * 13, cy + s * 1.5);
			g.fillStyle(0x88ccff, 0.85 * a);
			g.fillEllipse(cx + s * 9, cy, s * 6, s * 3);
			g.fillStyle(0xff6600, 0.75 * a);
			g.fillTriangle(cx - s * 14, cy - s * 1, cx - s * 14, cy + s * 1, cx - s * 19, cy);
			g.fillStyle(0xffdd00, 0.55 * a);
			g.fillTriangle(cx - s * 14, cy - s * 0.5, cx - s * 14, cy + s * 0.5, cx - s * 17, cy);
			break;
		}
		case 'Sniper': {
			g.fillStyle(shade(c, 0.6), a);
			g.fillRoundedRect(cx - s * 13, cy + s * 0.5, s * 16, s * 7, s * 2);
			g.fillStyle(c, a);
			g.beginPath();
			g.moveTo(cx + s * 3, cy + s * 0.5);
			g.lineTo(cx + s * 3, cy + s * 7.5);
			g.lineTo(cx + s * 14, cy + s * 4);
			g.closePath();
			g.fillPath();
			g.fillStyle(0xffffff, 0.28 * a);
			g.fillTriangle(cx + s * 3, cy + s * 0.5, cx + s * 14, cy + s * 4, cx + s * 8, cy + s * 1.5);
			g.fillStyle(0x111a11, 0.95);
			g.fillRoundedRect(cx - s * 4, cy - s * 10, s * 12, s * 6, s * 1.5);
			g.lineStyle(s, type.glowColor, 0.8 * a);
			g.strokeRoundedRect(cx - s * 4, cy - s * 10, s * 12, s * 6, s * 1.5);
			g.fillStyle(0x112211, 1);
			g.fillCircle(cx + s * 2, cy - s * 7, s * 2.5);
			g.lineStyle(s * 0.8, type.glowColor, 0.6 * a);
			g.strokeCircle(cx + s * 2, cy - s * 7, s * 2.5);
			g.lineStyle(s * 0.7, 0xffffff, 0.45 * a);
			g.beginPath();
			g.moveTo(cx + s * 2, cy - s * 9.5);
			g.lineTo(cx + s * 2, cy - s * 4.5);
			g.strokePath();
			g.beginPath();
			g.moveTo(cx - s * 0.5, cy - s * 7);
			g.lineTo(cx + s * 4.5, cy - s * 7);
			g.strokePath();
			g.fillStyle(0xffffff, 0.18 * a);
			g.fillRect(cx - s * 11, cy + s * 1.5, s * 13, s * 1.5);
			g.fillStyle(shade(c, 0.4), a);
			g.fillRect(cx - s * 1, cy - s * 4, s * 3, s * 4.5);
			break;
		}
	}
}
