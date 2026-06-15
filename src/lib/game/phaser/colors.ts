function cssHex(varName: string): number {
	const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
	const hex = val.replace('#', '').trim();
	const full = hex.length === 3 ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] : hex;
	return parseInt(full, 16);
}

function cssStr(varName: string): string {
	return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

export const COLORS = {
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
	fuelLow: 0xff0000,
	white: 0xffffff,
	black: 0x000000,
	aiming: 0xffffff,

	craterOuter: 0xff6600,
	craterMid: 0xffcc00,
	craterStone: 0x5a4a30,
	craterGrey: 0x888888,
	shell: 0xffdd55,
	shellGlow: 0xff8800,
	shellTrail: 0xff7828,
	split: 0x7f00ff,
	splitGlow: 0xa54dff,
	splitTrail: 0xb266ff,
	heavy: 0xff4444,
	heavyGlow: 0xff2200,
	bouncer: 0x44ffee,
	bouncerGlow: 0x00aaff,
	airstrike: 0xffffff,
	airstrikeGlow: 0xffffff,
	airstrikeTrail: 0xffffff,
	strikeBomb: 0xff6600,
	strikeBombGlow: 0xff3300,
	strikeBombTrail: 0xffffff,
	sniper: 0x0ac248,
	sniperGlow: 0x2af46e,
	sniperTrail: 0x60f793
};

export const COLOR_STRINGS = {
	navy: '#0e0e24',
	neonGlow: '#88e8a0',
	white: '#ffffff',
	black: '#000000',
	gold: '#d4b832',
	yellow: '#ffdd55',
	red: '#ff4444'
};

export function syncFromCSS(): void {
	COLORS.navy = cssHex('--game-navy');
	COLORS.aiming = cssHex('--game-aiming');
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
	COLORS.fuelLow = cssHex('--game-fuel-low');
	COLORS.white = cssHex('--game-white');
	COLORS.black = cssHex('--game-black');

	COLOR_STRINGS.navy = cssStr('--game-navy');
	COLOR_STRINGS.neonGlow = cssStr('--game-neon-glow');
	COLOR_STRINGS.white = cssStr('--game-white');
	COLOR_STRINGS.black = cssStr('--game-black');
	COLOR_STRINGS.gold = cssStr('--game-gold');
	COLOR_STRINGS.yellow = cssStr('--game-yellow');
	COLOR_STRINGS.red = cssStr('--game-red');
}
