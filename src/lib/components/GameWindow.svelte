<script lang="ts">
	import { onMount } from 'svelte';
	import { syncFromCSS } from '$lib/game/phaser/colors';

	onMount(() => {
		let observer: MutationObserver | undefined;

		void (async () => {
			const { default: StartGame } = await import('$lib/game/phaser/game');
			const { EventBus } = await import('$lib/game/phaser/EventBus');

			syncFromCSS();
			StartGame('game-container');

			observer = new MutationObserver(() => {
				syncFromCSS();
				EventBus.emit('theme-changed');
			});
			observer.observe(document.documentElement, { attributeFilter: ['class'] });
		})();

		return () => observer?.disconnect();
	});
</script>

<div id="game-container"></div>
