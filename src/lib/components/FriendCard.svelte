<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import Check from '$lib/components/Check.svelte';
	import X from '$lib/components/X.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { type Friend } from '$lib/friends';
	import * as friends from '$lib/friends.remote';
	import { resolve } from '$app/paths';
	import { toast } from '$lib/components/toast';
	import Avatar from '$lib/components/Avatar.svelte';

	type Props = { friend: Friend; online: boolean };
	let { friend, online }: Props = $props();
</script>

<a
	href={resolve('/profile/[id]', { id: friend.id })}
	class="glass relative mb-3 flex items-center justify-between rounded-xl p-[0.85rem] hover:-translate-y-px"
>
	<div class="flex min-w-0 items-center gap-3">
		<Avatar {...friend} size="2.5rem" />

		<div class="flex flex-col">
			{#if friend.friendRequestStatus == 'RECEIVED'}
				<div class:fade-end={friend.name.length > 9}>{friend.name.slice(0, 9)}</div>
			{:else}
				<div class:fade-end={friend.name.length > 11}>{friend.name.slice(0, 11)}</div>
			{/if}
			{#if friend.friendRequestStatus == 'SENT' || friend.friendRequestStatus == 'RECEIVED'}
				<Badge variant="destructive" style="animation: breathe-red 2.2s ease-in-out infinite;">
					{m.pending()}
				</Badge>
			{:else if online}
				<Badge variant="outline" style="box-shadow: 0 0 12px rgba(255,255,255,0.5);">
					{m.online()}
				</Badge>
			{:else}
				<Badge variant="secondary" style="box-shadow: 0 0 12px rgba(0,0,0,0.5);">
					{m.offline()}
				</Badge>
			{/if}
		</div>
	</div>

	{#if friend.friendRequestStatus == 'RECEIVED'}
		<div class="flex flex-col items-center">
			<button
				class="text-white hover:text-green-400"
				onclick={async (e: MouseEvent) => {
					e.preventDefault();
					await friends.accept(friend.id);
					toast.success(m.friend_request_accept());
				}}
			>
				<Check />
			</button>

			<button
				class="text-white hover:text-red-400"
				onclick={async (e: MouseEvent) => {
					e.preventDefault();
					await friends.remove(friend.id);
					toast.success(m.friend_request_deny());
				}}
			>
				<X />
			</button>
		</div>
	{/if}
</a>

<style>
	.fade-end {
		white-space: nowrap;
		overflow: hidden;

		mask-image: linear-gradient(to right, black 0%, black 80%, transparent 100%);

		-webkit-mask-image: linear-gradient(to right, black 0%, black 80%, transparent 100%);
	}
</style>
