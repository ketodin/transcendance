<script lang="ts">
	import { onMount } from 'svelte';
	import GameWindow, { type TPhaserRef } from '$lib/components/GameWindow.svelte';

	let phaserRef: TPhaserRef = $state({ game: null, scene: null });

	onMount(() => {
		document.body.classList.add('game-mode');
		return () => document.body.classList.remove('game-mode');
	});
</script>

<GameWindow bind:phaserRef />
