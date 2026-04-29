export interface ProjectileState {
	x: number;
	y: number;
	prevX: number;
	prevY: number;
	vx: number;
	vy: number;
	trail: Array<{ x: number; y: number }>;
	typeIndex: number;
	bouncesLeft: number;
}
