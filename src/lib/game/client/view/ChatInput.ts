import { COLOR_STRINGS } from '$lib/game/phaser/colors';

export type OnSendCallback = (text: string) => void;

export class ChatInput {
	private input: HTMLInputElement;
	private container: HTMLElement;
	private isOpen = false;
	private onSend: OnSendCallback;
	private scene: Phaser.Scene;
	private canOpen = true;
	
	constructor(scene: Phaser.Scene, onSend: OnSendCallback) {
		this.scene = scene;
		this.onSend = onSend;

		this.container = document.createElement('div');
		Object.assign(this.container.style, {
			position: 'absolute',
			bottom: '120px',
			left: '50%',
			transform: 'translateX(-50%)',
			display: 'none',
			zIndex: '999',
		});

		this.input = document.createElement('input');
		this.input.type = 'text';
		this.input.maxLength = 80;
		this.input.placeholder = 'Say something...';
		Object.assign(this.input.style, {
			width: '320px',
			padding: '8px 14px',
			fontSize: '14px',
			background: COLOR_STRINGS.bg,
			color: COLOR_STRINGS.white,
			border: '2px solid COLOR_STRINGS.neonGlow',
			borderRadius: '8px',
			outline: 'none',
			caretColor: COLOR_STRINGS.neonGlow,
		});
		this.container.appendChild(this.input);

		const gameParent = document.getElementById('game-container') ?? document.body;
		gameParent.style.position = 'relative';
		gameParent.appendChild(this.container);

		// Prevent game input when typing
		this.input.addEventListener('focus', () => {
			this.scene.input.keyboard!.disableGlobalCapture();
		});
		this.input.addEventListener('blur', () => {
			this.scene.input.keyboard!.enableGlobalCapture();
		});
		// Handle Enter and Escape keys
		this.input.addEventListener('keydown', (e) => {
			e.stopPropagation();
			if (e.key === 'Enter') this.submit();
			if (e.key === 'Escape') this.close();
		});
	}

open() {
    if (this.isOpen || !this.canOpen) return; // if already open or recently blocked
    this.isOpen = true;
    this.input.value = '';
    this.container.style.display = 'block';
    setTimeout(() => this.input.focus(), 30);
}

block(duration: number) {
    this.canOpen = false;
    setTimeout(() => { this.canOpen = true; }, duration);
}

	private close() {
		this.isOpen = false;
		this.container.style.display = 'none';
		this.input.blur();
	}

	private submit() {
		const text = this.input.value.trim();
		this.close();
		if (text) this.onSend(text);
	}

	destroy() {
		this.container.remove();
	}
}
