<script lang="ts">
	import GameWindow, { type TPhaserRef } from '$lib/components/GameWindow.svelte';
	// import type { Scene } from 'phaser';

	let phaserRef: TPhaserRef = $state({ game: null, scene: null });
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<GameWindow bind:phaserRef />
