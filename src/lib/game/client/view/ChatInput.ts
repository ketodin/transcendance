import { COLOR_STRINGS } from '$lib/game/phaser/colors';
import { m } from '$lib/paraglide/messages';

type OnSendCallback = (text: string) => void;

export class ChatInput {
	private input: HTMLInputElement;
	private container: HTMLElement;
	private isOpen = false;
	private onSend: OnSendCallback;
	private scene: Phaser.Scene;
	private canOpen = true;
	private targetGameY: number;

	constructor(scene: Phaser.Scene, targetGameY: number, onSend: OnSendCallback) {
		this.scene = scene;
		this.onSend = onSend;
		this.targetGameY = targetGameY;

		this.container = document.createElement('div');
		Object.assign(this.container.style, {
			position: 'fixed',
			transform: 'translateX(-50%)',
			display: 'none',
			zIndex: '999'
		});

		this.input = document.createElement('input');
		this.input.type = 'text';
		this.input.maxLength = 80;
		this.input.placeholder = m.chat_placeholder();
		Object.assign(this.input.style, {
			background: COLOR_STRINGS.navy,
			color: COLOR_STRINGS.white,
			borderStyle: 'solid',
			borderColor: COLOR_STRINGS.neonGlow,
			outline: 'none',
			caretColor: COLOR_STRINGS.neonGlow,
			boxSizing: 'border-box'
		});
		this.container.appendChild(this.input);

		const host = this.scene.game.canvas.parentElement ?? document.body;
		host.appendChild(this.container);

		this.scene.scale.on('resize', this.reposition, this);

		this.input.addEventListener('focus', () => {
			this.scene.input.keyboard!.disableGlobalCapture();
		});
		this.input.addEventListener('blur', () => {
			this.scene.input.keyboard!.enableGlobalCapture();
		});
		this.input.addEventListener('keydown', (e) => {
			e.stopPropagation();
			if (e.key === 'Enter') this.submit();
			if (e.key === 'Escape') this.close();
		});
	}

	open() {
		if (this.isOpen || !this.canOpen) return;
		this.isOpen = true;
		this.input.value = '';
		this.container.style.display = 'block';
		this.reposition();
		setTimeout(() => this.input.focus(), 30);
	}

	private readonly reposition = (): void => {
		if (!this.isOpen) return;
		const canvas = this.scene.game.canvas;
		const canvasRect = canvas.getBoundingClientRect();
		const scaleX = canvasRect.width / this.scene.scale.width;
		const scaleY = canvasRect.height / this.scene.scale.height;

		this.input.style.width = `${Math.round(320 * scaleX)}px`;
		this.input.style.fontSize = `${Math.round(14 * scaleX)}px`;
		this.input.style.padding = `${Math.round(8 * scaleX)}px ${Math.round(14 * scaleX)}px`;
		this.input.style.borderRadius = `${Math.round(8 * scaleX)}px`;
		this.input.style.borderWidth = `${Math.max(1, Math.round(2 * scaleX))}px`;

		const inputH = this.container.offsetHeight;
		const rawTop = canvasRect.top + this.targetGameY * scaleY;
		const cssTop = Math.min(rawTop, canvasRect.top + canvasRect.height - inputH - 4);
		const cssLeft = canvasRect.left + canvasRect.width / 2;
		this.container.style.top = `${cssTop}px`;
		this.container.style.left = `${cssLeft}px`;
	};

	toggle() {
		if (this.isOpen) this.close();
		else this.open();
	}

	block(duration: number) {
		this.canOpen = false;
		setTimeout(() => {
			this.canOpen = true;
		}, duration);
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
		this.scene.scale?.off('resize', this.reposition, this);
		this.container.remove();
	}
}
