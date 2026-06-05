<script module lang="ts">
	import type { Game, Scene } from 'phaser';

	export type TPhaserRef = {
		game: Game | null;
		scene: Scene | null;
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { syncFromCSS } from '$lib/game/phaser/colors';

	let {
		phaserRef = $bindable()
	}: {
		phaserRef: TPhaserRef;
		// currentActiveScene: (scene: Scene) => void | undefined
	} = $props();

	onMount(() => {
		let observer: MutationObserver | undefined;

		void (async () => {
			const { default: StartGame } = await import('$lib/game/phaser/game');
			const { EventBus } = await import('$lib/game/phaser/EventBus');

			syncFromCSS();
			phaserRef.game = StartGame('game-container');

			observer = new MutationObserver(() => {
				syncFromCSS();
				EventBus.emit('theme-changed');
			});
			observer.observe(document.documentElement, { attributeFilter: ['class'] });

			EventBus.on('current-scene-ready', (scene_instance: unknown) => {
				phaserRef.scene = scene_instance as Scene;
				// if (currentActiveScene) {
				//     currentActiveScene(scene_instance);
				// }
			});
		})();

		return () => observer?.disconnect();
	});
</script>

<div id="game-container"></div>
