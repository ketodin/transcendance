<script lang="ts">
	import GameWindow from '$lib/components/GameWindow.svelte';
	import GameLobby from '$lib/components/GameLobby.svelte';
	import { colyseusClient } from '$lib/colyseusClient';
	import { onMount } from 'svelte';
	import { MatchMakeError, type Room } from '@colyseus/sdk';
	import type { PageProps } from './$types';
	import { applyAction } from '$app/forms';
	import { m } from '$lib/paraglide/messages';

	const { params, data }: PageProps = $props();

	let room: Room | null = $state(null);
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
				if (err instanceof MatchMakeError) {
					if (err.code == 400 && err.message.match(/room ".*" not found/)) {
						return await applyAction({
							type: 'error',
							status: 400,
							error: { message: m.error_room_not_exist() }
						});
					}
					if (err.message = 'ALREADY_IN_A_GAME') {
						return await applyAction({
							type: 'error',
							status: err.code,
							error: { message: m.error_already_game() }
						});
					} else if (err.message = 'UNAUTHORIZED') {
						return await applyAction({
							type: 'error',
							status: err.code,
							error: { message: m.error_not_auth() }
						});
					}
					else {
						return await applyAction({
							type: 'error',
							status: err.code,
							error: { message: err.message }
						});
					}
				}
				return await applyAction({
					type: 'error',
					status: 400,
					error: { message: err instanceof Error ? err.message : String(err) }
				});
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
		{#if room}
			<GameLobby {room} user={data.user!} />
		{:else}
			<span class="text-sm tracking-widest uppercase opacity-40">Connexion...</span>
		{/if}
	</div>
{/if}
