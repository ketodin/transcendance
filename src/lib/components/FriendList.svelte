<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import { Plus, X } from '@lucide/svelte';
	import FriendCard from './FriendCard.svelte';
	import * as friends from '$lib/friends.remote';
	import type { FriendRequestStatus } from '$lib/friends';
	import { Input } from '$lib/components/ui/input';
	import { presenceById, connectStatusRoom } from '$lib/status-client';
	import { friendListOpen } from '$lib/stores/sidebar';

	const friendList = $derived(await friends.list());

	const statusOrder: Record<FriendRequestStatus, number> = { RECEIVED: 3, ACCEPTED: 2, SENT: 1 };
	let sortedFriends = $derived(
		[...friendList].sort(
			(a, b) => statusOrder[b.friendRequestStatus] - statusOrder[a.friendRequestStatus]
		)
	);

	let showAddFriend = $state(false);

	let disconnect = () => {};
	onMount(() => {
		connectStatusRoom()
			.then((fn) => {
				disconnect = fn;
			})
			.catch((e) => {
				console.error(e);
			});
		return () => {
			disconnect();
		};
	});
</script>

{#if $friendListOpen}
	<div
		class="fixed inset-0 z-[44] bg-black/10 backdrop-blur-sm lg:hidden"
		role="button"
		tabindex="-1"
		onclick={() => friendListOpen.set(false)}
		onkeydown={(e) => e.key === 'Escape' && friendListOpen.set(false)}
	></div>
{/if}

<div
	id="friend-sidebar"
	class="glass fixed top-[calc(var(--header-height)+var(--layout-gap))] bottom-[calc(var(--footer-height)+1rem)] left-0 flex w-[var(--sidebar-width)] flex-col overflow-y-auto !rounded-l-none !rounded-r-[var(--radius-xl)] px-3 pt-3 pb-6 transition-transform duration-300 ease-in-out max-lg:z-[45] max-lg:w-4/5 max-lg:max-w-[300px] {$friendListOpen
		? 'max-lg:translate-x-0'
		: 'max-lg:-translate-x-[110%]'}"
>
	<div class="relative mb-4 flex items-center justify-center">
		<h2 class="text-base font-semibold tracking-[0.08em] uppercase opacity-60">{m.friends()}</h2>
		<button
			class="absolute right-0 flex cursor-pointer items-center justify-center rounded-[4px] border-0 bg-transparent p-[2px] text-inherit opacity-50 transition-[opacity,background-color] duration-200 hover:bg-white/10 hover:opacity-100"
			onclick={() => (showAddFriend = !showAddFriend)}
			title="Add a friend"
		>
			{#if showAddFriend}
				<X size={20} />
			{:else}
				<Plus size={20} />
			{/if}
		</button>
	</div>

	{#if showAddFriend}
		<form class="glass mb-3 flex flex-col gap-[0.4rem] p-[0.6rem]" {...friends.send}>
			<Input {...friends.send.fields.email.as('text')} placeholder={m.mail_place_holder()} />
			{#each friends.send.fields.email.issues() as issue (issue.message)}
				<p class="text-xs text-red-400">{issue.message}</p>
			{/each}
		</form>
	{/if}

	{#each sortedFriends as friend (friend.id)}
		<FriendCard {friend} online={$presenceById[friend.id] ?? false} />
	{/each}
</div>

<style>
	:global(:root) {
		--header-height: 4rem;
		--layout-gap: 1rem;
		--sidebar-width: 240px;
	}
</style>
