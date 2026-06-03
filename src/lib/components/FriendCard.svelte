<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { Check, X } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { type Friend } from '$lib/friends';
	import * as friends from '$lib/friends.remote';
	import { resolve } from '$app/paths';
	import { toast } from '$lib/components/toast';

	type Props = { friend: Friend; online: boolean };
	let { friend, online }: Props = $props();

	const initial = $derived(friend.name.charAt(0).toUpperCase());
</script>

<a
	href={resolve('/profile/[id]', { id: friend.id })}
	class="glassdeep relative flex items-center gap-3 p-[0.85rem] rounded-xl mb-3 cursor-pointer transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-white/[0.06]"
>
	<div
		class="w-10 aspect-square rounded-full flex items-center justify-center font-semibold bg-white/10 border border-white/[0.08] text-base shrink-0"
	>
		{initial}
	</div>

	<div class="flex flex-col gap-[0.2rem] min-w-0 flex-1">
		<div class="flex items-center gap-2">
			<div class="text-[0.95rem] font-medium flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
				{friend.name}
			</div>
			<div class="flex items-center gap-2 shrink-0">
				{#if friend.friendRequestStatus == 'RECEIVED'}
					<Button
						class="glass"
						variant="outline"
						size="icon-sm"
						onclick={async (e) => {
							e.preventDefault();
							await friends.accept(friend.id).then(() => toast.success(m.friend_request_accept()));
						}}><Check /></Button
					>
					<div class="w-px h-[1.2rem] bg-white/15"></div>
					<Button
						class="glass text-red-400"
						variant="outline"
						size="icon-sm"
						onclick={async (e) => {
							e.preventDefault();
							await friends.remove(friend.id).then(() => toast.success(m.friend_request_deny()));
						}}><X /></Button
					>
				{/if}
			</div>
		</div>
		{#if friend.friendRequestStatus == 'SENT' || friend.friendRequestStatus == 'RECEIVED'}
			<Badge variant="destructive" class="status offline">
				{m.pending()}
			</Badge>
		{:else if online}
			<Badge variant="secondary">{m.online()}</Badge>
		{:else}
			<Badge variant="outline" class="status offline">
				{m.offline()}
			</Badge>
		{/if}
	</div>
</a>
