<script lang="ts">
	import GameWindow, { type TPhaserRef } from '$lib/components/GameWindow.svelte';
	import { colyseusClient } from '$lib/colyseusClient';
	import { onDestroy, onMount } from 'svelte';
	import type { Room } from '@colyseus/sdk';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let phaserRef: TPhaserRef = $state({ game: null, scene: null });
	let room: Room | null = $state(null);
	let errorMsg: string = $state('');

	onMount(async () => {
		try {
			room = await colyseusClient!.consumeSeatReservation(data.reservation);
		} catch (err) {
			if (err instanceof Error) {
				errorMsg = err.message;
			} else {
				errorMsg = String(err);
			}
		}
	});

	onDestroy(async () => {
		await room?.leave();
	});
</script>

{#if room}
	<GameWindow bind:phaserRef {room} />
{/if}

{#if errorMsg}
	<p class="font-bold text-red-500">Error: {errorMsg}</p>
{/if}
