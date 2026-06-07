<script module lang="ts">
	import type { Game, Scene } from 'phaser';
	import type { Room } from '@colyseus/sdk';

	export type TPhaserRef = {
		game: Game | null;
		scene: Scene | null;
	};
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { syncFromCSS } from '$lib/game/phaser/colors';
	import type { GameRoomState } from '$lib/game/colyseus/schema/GameRoomState';

	let {
		phaserRef = $bindable(),
		room
	}: {
		phaserRef: TPhaserRef;
		room: Room<GameRoomState>;
	} = $props();

	onMount(() => {
		let observer: MutationObserver | undefined;

		void (async () => {
			const { default: StartGame } = await import('$lib/game/phaser/game');
			const { EventBus } = await import('$lib/game/phaser/EventBus');

			syncFromCSS();
			phaserRef.game = StartGame('game-container', room);

			observer = new MutationObserver(() => {
				syncFromCSS();
				EventBus.emit('theme-changed');
			});
			observer.observe(document.documentElement, { attributeFilter: ['class'] });

			EventBus.on('current-scene-ready', (scene_instance: unknown) => {
				phaserRef.scene = scene_instance as Scene;
			});
		})();

		return () => observer?.disconnect();
	});
</script>

<div id="game-container"></div>
