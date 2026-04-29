<script lang="ts">
	import GameWindow, { type TPhaserRef } from '$lib/components/GameWindow.svelte';
	// import type { Scene } from 'phaser';

	let phaserRef: TPhaserRef = $state({ game: null, scene: null });
</script>

<GameWindow bind:phaserRef />
