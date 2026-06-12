import { Scale, WEBGL, type Types } from 'phaser';

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;

export const commonGameConfig: Types.Core.GameConfig = {
	type: WEBGL,
	scale: {
		mode: Scale.FIT,
		autoCenter: Scale.CENTER_BOTH,
		width: DEFAULT_WIDTH,
		height: DEFAULT_HEIGHT
	},
	banner: false,
	audio: {
		noAudio: true,
		disableWebAudio: true
	},
	disableContextMenu: true,
	render: {
		// premultipliedAlpha must stay at its default (true): Phaser's WebGL
		// pipeline outputs premultiplied alpha, and on a transparent canvas
		// `false` makes the compositor apply alpha twice, darkening every
		// semi-transparent effect (aiming cone, trails, stars, glows).
		pixelArt: false,
		transparent: true
	}
};
