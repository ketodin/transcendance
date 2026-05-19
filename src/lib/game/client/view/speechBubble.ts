import { type TankState } from '$lib/game/shared/state/TankState';
import { GameObjects, Scene } from 'phaser';
import { COLORS, COLOR_STRINGS } from '$lib/game/phaser/colors';
import { CHAT_BUBBLE_DURATION } from '$lib/game/shared/chatConfig';

export class SpeechBubble {
	private bg: GameObjects.Graphics;
	private label: GameObjects.Text;
	private scene: Scene;
	private timer?: Phaser.Time.TimerEvent;

    
}