<script lang="ts">
	import { onMount } from 'svelte';
	import { syncFromCSS } from '$lib/game/phaser/colors';
	import type { GameRoomState } from '$lib/game/colyseus/schema/GameRoomState';
	import type { Room } from '@colyseus/sdk';
	import type { Game } from 'phaser';

	let { room }: { room: Room<GameRoomState> } = $props();

	onMount(() => {
		let themeObserver: MutationObserver | undefined;
		let resizeObserver: ResizeObserver | undefined;
		let game: Game | undefined;
		let cancelled = false;

		void (async () => {
			const { default: StartGame } = await import('$lib/game/phaser/game');
			const { EventBus } = await import('$lib/game/phaser/EventBus');

			if (cancelled) return;
			syncFromCSS();
			game = StartGame('game-container', room);

			const container = document.getElementById('game-container');

			if (container) {
				resizeObserver = new ResizeObserver(() => {
					if (game?.isRunning) game.scale.refresh();
				});

				resizeObserver.observe(container);
			}

			themeObserver = new MutationObserver(() => {
				syncFromCSS();
				EventBus.emit('theme-changed');
			});

			themeObserver.observe(document.documentElement, { attributeFilter: ['class'] });
		})();

		return () => {
			cancelled = true;

			themeObserver?.disconnect();
			resizeObserver?.disconnect();

			if (game) {
				const renderer = game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
				const canvas = game.canvas;

				const contextLostHandler =
					renderer.contextLostHandler || renderer.onContextLost || renderer._contextLostHandler;

				if (canvas && contextLostHandler) {
					canvas.removeEventListener('webglcontextlost', contextLostHandler);
				}

				const gl = renderer.gl;
				const loseContextExt = gl?.getExtension('WEBGL_lose_context');

				loseContextExt?.loseContext();

				game.destroy(true, false);
				game = undefined;
			}
		};
	});
</script>

<div id="game-container"></div>
