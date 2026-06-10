<script lang="ts">
	import GameWindow from '$lib/components/GameWindow.svelte';
	import GameLobby from '$lib/components/GameLobby.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { connectToRoom } from './client';
	import type { Room } from '@colyseus/sdk';
	import type { PageProps } from './$types';

	const { params, data }: PageProps = $props();

	let room: Room | null = $state(null);
	let started = $state(false);

	onMount(() => {
		document.body.classList.add('game-mode');
		return () => document.body.classList.remove('game-mode');
	});

	$effect(() => {
		if (!browser) return;

		connectToRoom(params.id)
			.then((result) => {
				room = result;
				if (!room) return;
				room.onMessage('game_start', () => {
					started = true;
				});
			})
			.catch(() => {}); // already handled in the function

		return () => {
			void room?.leave();
			localStorage.removeItem('reconnectionToken');
			room = null;
			started = false;
		};
	});
</script>

{#key room}
	{#if room}
		<!-- Kept laid out (full size) but hidden until the match starts, so Phaser
		     boots against a correctly-sized container. `absolute inset-0` keeps it
		     out of flow so the lobby underneath is unaffected. -->
		<div class="absolute inset-0 {!started ? 'invisible' : ''}">
			<GameWindow {room} />
		</div>
	{/if}
{/key}

{#if !started}
	<div class="flex h-full min-h-screen items-center justify-center">
		{#if room}
			<GameLobby {room} user={data.user!} />
		{:else}
			<span class="text-sm tracking-widest uppercase opacity-40">Connexion...</span>
		{/if}
	</div>
{/if}
