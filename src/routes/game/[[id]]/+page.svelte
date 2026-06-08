<script lang="ts">
	import GameWindow from '$lib/components/GameWindow.svelte';
	import GameLobby from '$lib/components/GameLobby.svelte';
	import { colyseusClient } from '$lib/colyseusClient';
	import { onMount } from 'svelte';
	import type { Room } from '@colyseus/sdk';
	import type { PageProps } from './$types';

	const { params, data }: PageProps = $props();

	let room: Room | null = $state(null);
	let errorMsg: string = $state('');
	let started = $state(false);

	onMount(() => {
		document.body.classList.add('game-mode');
		return () => document.body.classList.remove('game-mode');
	});

	$effect(() => {
		let cancelled = false;

		void (async () => {
			try {
				const newRoom = params.id
					? await colyseusClient!.joinById(params.id, {})
					: await colyseusClient!.joinOrCreate('tank_room', {});
				if (cancelled) {
					void newRoom.leave();
					return;
				}
				room = newRoom;
				newRoom.onMessage('game_start', () => {
					started = true;
				});
			} catch (err) {
				if (!cancelled) errorMsg = err instanceof Error ? err.message : String(err);
			}
		})();

		return () => {
			cancelled = true;
			void room?.leave();
			room = null;
			started = false;
		};
	});
</script>

{#key room}
	{#if room}
		<div class={!started ? 'hidden' : ''}>
			<GameWindow {room} />
		</div>
	{/if}
{/key}

{#if !started}
	<div class="flex h-full min-h-screen items-center justify-center">
		{#if errorMsg}
			<p class="font-bold text-red-500">Error: {errorMsg}</p>
		{:else if room}
			<GameLobby {room} user={data.user!} />
		{:else}
			<span class="text-sm tracking-widest uppercase opacity-40">Connexion...</span>
		{/if}
	</div>
{/if}
