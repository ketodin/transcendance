import { type ProjectileState } from '../../shared/state/ProjectileState';
import { PROJECTILE_TYPES } from '../../shared/projectileTypes';
import { GameObjects, Scene } from 'phaser';

export class ProjectileView {
	private gfx: GameObjects.Graphics;

	constructor(scene: Scene) {
		this.gfx = scene.add.graphics();
	}

	sync(state: ProjectileState | undefined): void {
		this.gfx.clear();
		if (!state) return;
		this.draw(state);
	}

	private draw(state: ProjectileState): void {
		const { color, glowColor, trailColor, size } = PROJECTILE_TYPES[state.typeIndex];
		const { trail, x, y } = state;

		for (let i = 1; i < trail.length; i++) {
			const alpha = i / trail.length;
			this.gfx.lineStyle(2, trailColor, alpha * 0.7);
			this.gfx.beginPath();
			this.gfx.moveTo(trail[i - 1].x, trail[i - 1].y);
			this.gfx.lineTo(trail[i].x, trail[i].y);
			this.gfx.strokePath();
		}

		this.gfx.fillStyle(glowColor, 0.25);
		this.gfx.fillCircle(x, y, size * 2.2);
		this.gfx.fillStyle(glowColor, 0.5);
		this.gfx.fillCircle(x, y, size * 1.4);
		this.gfx.fillStyle(color);
		this.gfx.fillCircle(x, y, size);
	}

	destroy(): void {
		this.gfx.destroy();
	}
}
