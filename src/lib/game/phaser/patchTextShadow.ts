import { GameObjects } from 'phaser';

interface ShadowStyle {
	shadowOffsetX: number;
	shadowOffsetY: number;
	shadowColor: string;
	shadowBlur: number;
}

const proto = GameObjects.TextStyle.prototype as unknown as {
	syncShadow(this: ShadowStyle, context: CanvasRenderingContext2D, enabled: boolean): void;
};

proto.syncShadow = function (context, enabled) {
	if (enabled) {
		context.shadowOffsetX = this.shadowOffsetX;
		context.shadowOffsetY = this.shadowOffsetY;
		context.shadowColor = this.shadowColor;
		context.shadowBlur = this.shadowBlur;
	} else {
		context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;
		context.shadowColor = 'rgba(0,0,0,0)';
		context.shadowBlur = 0;
	}
};
