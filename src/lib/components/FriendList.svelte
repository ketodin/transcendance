<script lang="ts">
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages';
	import { Plus } from '@lucide/svelte';
	import FriendCard from './FriendCard.svelte';
	import * as friends from '$lib/friends.remote';
	import type { FriendRequestStatus } from '$lib/friends';
	import { Input } from '$lib/components/ui/input';
	import { presenceById, connectStatusRoom } from '$lib/status-client';
	import { friendListOpen } from '$lib/stores/sidebar';
	import { slide } from 'svelte/transition';

	const friendList = $derived(await friends.list());

	const statusOrder: Record<FriendRequestStatus, number> = { RECEIVED: 4, ACCEPTED: 2, SENT: 1 };

	let sortedFriends = $derived(
		[...friendList].sort((a, b) => {
			const aScore = a.friendRequestStatus === 'ACCEPTED'
				? ($presenceById[a.id] ? 3 : 2)
				: statusOrder[a.friendRequestStatus];
			const bScore = b.friendRequestStatus === 'ACCEPTED'
				? ($presenceById[b.id] ? 3 : 2)
				: statusOrder[b.friendRequestStatus];
			return bScore - aScore;
		})
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
		class="fixed inset-0 z-44 bg-black/10 backdrop-blur-sm lg:hidden"
		role="button"
		tabindex="-1"
		onclick={() => friendListOpen.set(false)}
		onkeydown={(e) => e.key === 'Escape' && friendListOpen.set(false)}
	></div>
{/if}

<div
	id="friend-sidebar"
	class="glass fixed top-[calc(var(--header-height)+var(--layout-gap))] bottom-[calc(var(--footer-height)+1rem)] left-0 flex w-(--sidebar-width) flex-col overflow-y-auto rounded-l-none! rounded-r-xl! px-3 pt-3 pb-6 transition-transform duration-300 ease-in-out max-lg:z-45 max-lg:max-w-75 {$friendListOpen
		? 'max-lg:translate-x-0'
		: 'max-lg:translate-x-[-110%]'}"
>
	<div class="relative mb-4 flex items-center justify-center">
		<h2 class="text-base font-semibold tracking-[0.08em] uppercase opacity-60">{m.friends()}</h2>
		<button
			class="absolute right-0 flex cursor-pointer items-center justify-center rounded-[4px] border-0 bg-transparent p-[2px] text-inherit opacity-50 transition-[opacity,background-color] duration-200 hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] transition hover:opacity-100"
			onclick={() => (showAddFriend = !showAddFriend)}
			title="Add a friend"
		>
			<span class="add-btn-icon {showAddFriend ? 'rotated' : ''}">
				<Plus size={22} />
			</span>
		</button>
	</div>

	{#if showAddFriend}
		<form
			transition:slide={{ duration: 300 }}
			class="glass mb-3 flex flex-col gap-[0.4rem] p-[0.6rem]" {...friends.send}>
			<Input {...friends.send.fields.email.as('text')} placeholder={m.mail_place_holder()} />
			{#each friends.send.fields.email.issues() as issue (issue.message)}
				<p class="text-xs text-red-400">{issue.message}</p>
			{/each}
		</form>
	{/if}

	{#each sortedFriends as friend (friend.id)}
		<FriendCard {friend} online={$presenceById[friend.id] ?? false} />
	{:else}
		<p class="text-center text-sm opacity-50">{m.no_friend()}</p>
	{/each}
</div>

<style>
	:global(:root) {
		--header-height: 4rem;
		--layout-gap: 1rem;
		--sidebar-width: 240px;
	}
.add-btn-icon {
    transition: transform 0.3s ease;
}

.add-btn-icon.rotated {
    transform: rotate(45deg);
}
</style>
