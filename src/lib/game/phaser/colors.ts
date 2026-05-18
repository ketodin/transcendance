function cssHex(varName: string): number {
	const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
	return parseInt(val.replace('#', ''), 16);
}

function cssStr(varName: string): string {
	return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

// ─── Theme-linked — driven by --game-* CSS variables in app.css ──────────
export const COLORS = {
	bg: 0xffffff,
	skyTop: 0x111130,
	navy: 0x0e0e24,
	terrain: 0x3d7a52,
	terrainDark: 0x2a5c3a,
	terrainBase: 0x1e3d2a,
	neonGlow: 0x88e8a0,
	neonBright: 0x4cff80,
	barHigh: 0x00ff44,
	barMid: 0xffdd00,
	barLow: 0xff3333,
	fuelHigh: 0x00ccff,
	fuelMid: 0xffaa00,
	white: 0xffffff,
	black: 0x000000,

	// ─── Game-inherent — hardcoded, never affected by theme ──────────────
	tankTracks: 0x222222,
	tankWheels: 0x555555,
	tankDebris: 0x333333,
	craterOuter: 0xff6600,
	craterMid: 0xffcc00,
	craterStone: 0x5a4a30,
	craterGrey: 0x888888,
	shell: 0xffdd55,
	shellGlow: 0xff8800,
	shellTrail: 0xff7828,
	heavy: 0xff4444,
	heavyGlow: 0xff2200,
	bouncer: 0x44ffee,
	bouncerGlow: 0x00aaff
};

export const COLOR_STRINGS = {
	// Theme-linked
	bg: '#ffffff',
	navy: '#0e0e24',
	neonGlow: '#88e8a0',
	white: '#ffffff',
	black: '#000000',
	gold: '#d4b832',
	yellow: '#ffdd55',
	red: '#ff4444',
	fuelHigh: '#00ccff',
	hint: 'rgba(255,255,255,0.5)',
	weaponInactive: 'rgba(200,200,200,0.4)'
};

export function syncFromCSS(): void {
	// Only theme-linked — game-inherent stay hardcoded above
	COLORS.bg = cssHex('--game-bg');
	COLORS.skyTop = cssHex('--game-sky-top');
	COLORS.navy = cssHex('--game-navy');
	COLORS.terrain = cssHex('--game-terrain');
	COLORS.terrainDark = cssHex('--game-terrain-dark');
	COLORS.terrainBase = cssHex('--game-terrain-base');
	COLORS.neonGlow = cssHex('--game-neon-glow');
	COLORS.neonBright = cssHex('--game-neon-bright');
	COLORS.barHigh = cssHex('--game-bar-high');
	COLORS.barMid = cssHex('--game-bar-mid');
	COLORS.barLow = cssHex('--game-bar-low');
	COLORS.fuelHigh = cssHex('--game-fuel-high');
	COLORS.fuelMid = cssHex('--game-fuel-mid');
	COLORS.white = cssHex('--game-white');
	COLORS.black = cssHex('--game-black');

	COLOR_STRINGS.bg = cssStr('--game-bg');
	COLOR_STRINGS.navy = cssStr('--game-navy');
	COLOR_STRINGS.neonGlow = cssStr('--game-neon-glow');
	COLOR_STRINGS.white = cssStr('--game-white');
	COLOR_STRINGS.black = cssStr('--game-black');
	COLOR_STRINGS.gold = cssStr('--game-gold');
	COLOR_STRINGS.yellow = cssStr('--game-yellow');
	COLOR_STRINGS.red = cssStr('--game-red');
	COLOR_STRINGS.fuelHigh = cssStr('--game-fuel-high');
	COLOR_STRINGS.hint = cssStr('--game-hint');
	COLOR_STRINGS.weaponInactive = cssStr('--game-weapon-inactive');
}
