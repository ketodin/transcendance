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
	class="glass fixed left-0 top-[calc(var(--header-height)+var(--layout-gap)+1rem)] w-[var(--sidebar-width)] bottom-[calc(var(--footer-height)+0.5rem)] !rounded-l-none !rounded-r-[var(--radius-xl)] flex flex-col px-3 pt-3 pb-6 overflow-y-auto transition-transform duration-300 ease-in-out max-lg:w-4/5 max-lg:max-w-[300px] max-lg:z-[45] {$friendListOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-[110%]'}"
>
	<div class="flex items-center justify-center relative mb-4">
		<h2 class="text-base font-semibold opacity-60 uppercase tracking-[0.08em]">{m.friends()}</h2>
		<button
			class="absolute right-0 bg-transparent border-0 cursor-pointer opacity-50 p-[2px] flex items-center justify-center rounded-[4px] text-inherit transition-[opacity,background-color] duration-200 hover:opacity-100 hover:bg-white/10"
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
		<form class="glass flex flex-col gap-[0.4rem] mb-3 p-[0.6rem]" {...friends.send}>
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
