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
		pixelArt: false,
		transparent: true
	}
};
