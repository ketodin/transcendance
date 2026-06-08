import { GameObjects } from 'phaser';

interface ButtonsCtx {
	fireBtn: GameObjects.Graphics;
	fireBtnLabel: GameObjects.Text;
	fireBtnCx: number;
	fireBtnCy: number;
	fireBtnW: number;
	fireBtnH: number;
	chatBtn: GameObjects.Graphics;
	chatBtnCx: number;
	chatBtnCy: number;
	chatBtnW: number;
	chatBtnH: number;
	moveLeftBtn: GameObjects.Graphics;
	moveRightBtn: GameObjects.Graphics;
	moveBtnCx: [number, number];
	moveBtnCy: number;
	moveBtnW: number;
	moveBtnH: number;
	sw(n: number): number;
}

export function drawFireButton(ctx: ButtonsCtx, hovered: boolean, disabled = false) {
	const g = ctx.fireBtn;
	g.clear();
	const cx = ctx.fireBtnCx;
	const cy = ctx.fireBtnCy;
	const w = ctx.fireBtnW;
	const h = ctx.fireBtnH;
	const r = ctx.sw(6);

	if (disabled) {
		g.fillStyle(0x0a0a0a, 1);
		g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, r);
		g.lineStyle(ctx.sw(1), 0x2a1a1a, 1);
		g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, r);
		ctx.fireBtnLabel.setAlpha(0.25);
		return;
	}

	ctx.fireBtnLabel.setAlpha(1);

	if (hovered) {
		g.lineStyle(ctx.sw(5), 0xff3322, 0.18);
		g.strokeRoundedRect(
			cx - w / 2 - ctx.sw(3),
			cy - h / 2 - ctx.sw(3),
			w + ctx.sw(6),
			h + ctx.sw(6),
			r + ctx.sw(2)
		);
	}

	g.fillStyle(hovered ? 0x3a0a05 : 0x200505, 1);
	g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, r);

	g.lineStyle(ctx.sw(1.5), hovered ? 0xff4433 : 0xaa2211, 1);
	g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, r);

	g.lineStyle(ctx.sw(1), 0xffffff, hovered ? 0.15 : 0.06);
	g.beginPath();
	g.moveTo(cx - w / 2 + r, cy - h / 2);
	g.lineTo(cx + w / 2 - r, cy - h / 2);
	g.strokePath();
}

export function drawChatButton(ctx: ButtonsCtx, hovered: boolean) {
	const g = ctx.chatBtn;
	g.clear();
	const cx = ctx.chatBtnCx;
	const cy = ctx.chatBtnCy;
	const w = ctx.chatBtnW;
	const h = ctx.chatBtnH;
	const r = ctx.sw(6);

	if (hovered) {
		g.lineStyle(ctx.sw(5), 0x00aaff, 0.18);
		g.strokeRoundedRect(
			cx - w / 2 - ctx.sw(3),
			cy - h / 2 - ctx.sw(3),
			w + ctx.sw(6),
			h + ctx.sw(6),
			r + ctx.sw(2)
		);
	}

	g.fillStyle(hovered ? 0x051a2e : 0x030f1a, 1);
	g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, r);

	g.lineStyle(ctx.sw(1.5), hovered ? 0x00ccff : 0x005577, 1);
	g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, r);

	g.lineStyle(ctx.sw(1), 0xffffff, hovered ? 0.15 : 0.06);
	g.beginPath();
	g.moveTo(cx - w / 2 + r, cy - h / 2);
	g.lineTo(cx + w / 2 - r, cy - h / 2);
	g.strokePath();

	const s = ctx.sw(1);
	const iconColor = hovered ? 0x00ccff : 0x4499bb;
	const bw = s * 20;
	const bh = s * 13;
	const br = s * 3;
	const bx = cx - bw / 2;
	const by = cy - bh / 2 - s * 2;

	g.fillStyle(iconColor, hovered ? 0.95 : 0.7);
	g.fillRoundedRect(bx, by, bw, bh, br);

	g.fillTriangle(bx + s * 3, by + bh, bx + s * 3, by + bh + s * 5, bx + s * 9, by + bh);

	g.fillStyle(hovered ? 0x001a2e : 0x011015, 1);
	g.fillCircle(cx - s * 5, by + bh / 2, s * 1.8);
	g.fillCircle(cx, by + bh / 2, s * 1.8);
	g.fillCircle(cx + s * 5, by + bh / 2, s * 1.8);
}

export function drawMoveButton(ctx: ButtonsCtx, side: 0 | 1, hovered: boolean, disabled: boolean) {
	const g = side === 0 ? ctx.moveLeftBtn : ctx.moveRightBtn;
	g.clear();
	const cx = ctx.moveBtnCx[side];
	const cy = ctx.moveBtnCy;
	const w = ctx.moveBtnW;
	const h = ctx.moveBtnH;
	const r = ctx.sw(6);

	const bgColor = disabled ? 0x080808 : hovered ? 0x1c1c1c : 0x0e0e0e;
	const borderColor = disabled ? 0x1a1a1a : hovered ? 0xffffff : 0x2a3a4a;
	const borderAlpha = disabled ? 1 : hovered ? 0.5 : 0.7;
	const arrowColor = disabled ? 0x2a2a2a : hovered ? 0xffffff : 0x8899aa;
	const arrowAlpha = disabled ? 0.3 : 1;

	if (hovered) {
		g.lineStyle(ctx.sw(5), 0xffffff, 0.1);
		g.strokeRoundedRect(
			cx - w / 2 - ctx.sw(3),
			cy - h / 2 - ctx.sw(3),
			w + ctx.sw(6),
			h + ctx.sw(6),
			r + ctx.sw(2)
		);
	}

	g.fillStyle(bgColor, 1);
	g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, r);

	g.lineStyle(ctx.sw(1.5), borderColor, borderAlpha);
	g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, r);

	g.lineStyle(ctx.sw(1), 0xffffff, hovered ? 0.2 : 0.06);
	g.beginPath();
	g.moveTo(cx - w / 2 + r, cy - h / 2);
	g.lineTo(cx + w / 2 - r, cy - h / 2);
	g.strokePath();

	const dir = side === 0 ? -1 : 1;
	const aw = ctx.sw(14);
	const ah = ctx.sw(11);
	const sw2 = ctx.sw(5);
	const sl = ctx.sw(8);

	const tipX = cx + dir * (aw + sl * 0.5);
	const baseX = cx + dir * sl * 0.5;
	const shaftEndX = cx - dir * (sl * 0.5 + ctx.sw(1));

	g.fillStyle(arrowColor, arrowAlpha);
	g.fillTriangle(tipX, cy, baseX, cy - ah, baseX, cy + ah);

	const shaftLeft = Math.min(baseX, shaftEndX);
	const shaftRight = Math.max(baseX, shaftEndX);
	g.fillRect(shaftLeft, cy - sw2, shaftRight - shaftLeft, sw2 * 2);
}
