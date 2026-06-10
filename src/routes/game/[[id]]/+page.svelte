<script lang="ts">
	import GameWindow from '$lib/components/GameWindow.svelte';
	import GameLobby from '$lib/components/GameLobby.svelte';
	import { colyseusClient } from '$lib/colyseusClient';
	import { onMount } from 'svelte';
	import { MatchMakeError, type Room } from '@colyseus/sdk';
	import type { PageProps } from './$types';
	import { applyAction } from '$app/forms';
	import { m } from '$lib/paraglide/messages';
	import { browser } from '$app/environment';

	const { params, data }: PageProps = $props();

	let room: Room | null = $state(null);
	let started = $state(false);

	onMount(() => {
		document.body.classList.add('game-mode');
		return () => document.body.classList.remove('game-mode');
	});


	const reconnectRoom = async () => {
		const reconnectionToken = localStorage.getItem('reconnectionToken');
		if (!reconnectionToken)
			return null;
		try {
			const newRoom = await colyseusClient!.reconnect(reconnectionToken);
			if (params.id && params.id !== newRoom.roomId) {
				await newRoom.leave();
				return null;
			}
			return newRoom;
		}
		catch {
			localStorage.removeItem('reconnectionToken');
			return null;
		}
	}

	$effect(() => {
		if (!browser) return;
		let cancelled = false;

		void (async () => {
			try {

				const reconnectedRoom = await reconnectRoom();

				const newRoom = reconnectedRoom ? reconnectedRoom : (params.id
					? await colyseusClient!.joinById(params.id, {})
					: await colyseusClient!.joinOrCreate('tank_room', {}));

				if (cancelled) {
					void newRoom.leave();
					return;
				}
				room = newRoom;
				newRoom.onMessage('game_start', () => {
					started = true;
				});

				localStorage.setItem('reconnectionToken', newRoom.reconnectionToken);

			} catch (err) {
				if (err instanceof MatchMakeError) {
					if (err.code === 400 && err.message.match(/room ".*" not found/)) {
						return await applyAction({
							type: 'error',
							status: 400,
							error: { message: m.error_room_not_exist() }
						});
					}
					if (err.message === 'ALREADY_IN_A_GAME') {
						return await applyAction({
							type: 'error',
							status: err.code,
							error: { message: m.error_already_game() }
						});
					} else if (err.message === 'UNAUTHORIZED') {
						return await applyAction({
							type: 'error',
							status: err.code,
							error: { message: m.error_not_auth() }
						});
					} else {
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
