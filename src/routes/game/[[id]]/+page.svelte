<script lang="ts">
	import GameWindow from '$lib/components/GameWindow.svelte';
	import { colyseusClient } from '$lib/colyseusClient';
	import { onMount } from 'svelte';
	import type { Room } from '@colyseus/sdk';
	import type { PageProps } from './$types';
	import { afterNavigate, beforeNavigate } from '$app/navigation';

	const { data }: PageProps = $props();

	let room: Room | null = $state(null);
	let errorMsg: string = $state('');

	const reservation = $derived(data.reservation);

	const connectRoom = async () => {
		try {
			console.log('try to join', reservation);
			room = await colyseusClient!.consumeSeatReservation(reservation);
			console.log('joined room', room);
		} catch (err) {
			if (err instanceof Error) {
				errorMsg = err.message;
			} else {
				errorMsg = String(err);
			}
		}
	};

	onMount(() => {
		void connectRoom();
	});

	afterNavigate(() => {
		console.log('afterNavigate');
		void connectRoom();
	});

	beforeNavigate(() => {
		console.log('leaving room', room);
		void room?.leave();
	});
</script>

{#key room}
	{#if room}
		<GameWindow {room} />
	{/if}
{/key}

{#if errorMsg}
	<p class="font-bold text-red-500">Error: {errorMsg}</p>
{/if}
