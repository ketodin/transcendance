<script module lang="ts">
	import type { Game, Scene } from 'phaser';

	export type TPhaserRef = {
		game: Game | null;
		scene: Scene | null;
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import StartGame from '$lib/game/scripts/game';
	import { EventBus } from '$lib/game/scripts/EventBus';

	let {
		phaserRef = $bindable()
	}: {
		phaserRef: TPhaserRef;
		// currentActiveScene: (scene: Scene) => void | undefined
	} = $props();

	onMount(() => {
		phaserRef.game = StartGame('game-container');
		EventBus.on('current-scene-ready', (scene_instance: Scene) => {
			phaserRef.scene = scene_instance;
			// if (currentActiveScene) {
			//     currentActiveScene(scene_instance);
			// }
		});
	});
</script>

<div id="game-container" style="width: 1280px; height: 720px"></div>
<!-- <div id="game-container"></div> -->
