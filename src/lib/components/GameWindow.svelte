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

		void (async () => {
			const { default: StartGame } = await import('$lib/game/phaser/game');
			const { EventBus } = await import('$lib/game/phaser/EventBus');

			syncFromCSS();
			game = StartGame('game-container', room);

			// Refit the Phaser canvas whenever its container changes size — covers
			// window resizes and the initial hidden -> visible transition, which
			// Scale.FIT alone doesn't pick up.
			const container = document.getElementById('game-container');
			if (container) {
				resizeObserver = new ResizeObserver(() => {
					// Only refit once the renderer is live; refreshing during boot crashes.
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
