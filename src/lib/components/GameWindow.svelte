<script lang="ts">
	import { onMount } from 'svelte';
	import { syncFromCSS } from '$lib/game/phaser/colors';
	import type { GameRoomState } from '$lib/game/colyseus/schema/GameRoomState';
	import type { Room } from '@colyseus/sdk';
	import type { Game } from 'phaser';

	let { room }: { room: Room<GameRoomState> } = $props();

  function forceDestroyGame(g: Game) {
        // Step 2: Stop the RAF loop so no more frames fire.
        g.loop.stop();

        // Step 1: Release the WebGL context NOW.
        // game.context is public (typed CanvasRenderingContext2D | WebGLRenderingContext).
        const gl = g.context as WebGLRenderingContext | null;
        if (gl) {
            const loseExt = gl.getExtension('WEBGL_lose_context');
            if (loseExt) {
                loseExt.loseContext();
            }
        }

        // Step 3: Run the internal destroy (scenes, renderer, canvas DOM removal).
        // runDestroy is @private in the source, so a cast is needed here.
        (g as any).removeCanvas = true;
        (g as any).runDestroy();
    }


	onMount(() => {
		let themeObserver: MutationObserver | undefined;
		let resizeObserver: ResizeObserver | undefined;
		let game: Game | undefined;

		void (async () => {
			const { default: StartGame } = await import('$lib/game/phaser/game');
			const { EventBus } = await import('$lib/game/phaser/EventBus');

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
			themeObserver?.disconnect();
			resizeObserver?.disconnect();
			forceDestroyGame(game);
		};
	});
</script>

<div id="game-container"></div>

<style>
	#game-container {
		width: 100%;
		height: 100%;
	}
</style>
