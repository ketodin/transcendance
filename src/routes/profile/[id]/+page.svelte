<script lang="ts">
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button';
	import { Settings } from '@lucide/svelte';
	import * as friends from '$lib/friends.remote';
	import { toast } from "svelte-sonner";

	const { data }: PageProps = $props();
	import { getLocale } from '$lib/paraglide/runtime';

	const formattedDate = $derived(
		new Intl.DateTimeFormat(getLocale(), {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(new Date(data.user.createdAt))
	);
</script>

<div class="glass h-full w-full p-6">
	<div class="glass header p-6">
		<div class="avatar outline">
			{#if data.user.image}
				<img src={data.user.image} alt="avatar" />
			{:else}
				<div class="placeholder">
					{data.user.name?.charAt(0)?.toUpperCase() ?? '?'}
				</div>
			{/if}
		</div>

		<div class="info p-8">
			<p class="name">{data.user.name}</p>
			<p class="botinfo">{m.joined_on({ date: formattedDate })}</p>
		</div>
		<div class="action">
			{#if data.userType === 'self'}
				<Button href={resolve('/settings')} class="glassbutton" variant="outline">
					{m.settings()}
					<Settings size={20} />
				</Button>
			{:else if data.userType === 'friend'}
				<Button onclick={() => {
					friends.remove(data.user.id);
					toast.success(m.removed_friend(), {
						unstyled: true,
						class:
						"glass flex px-4 py-3 gap-4",
					})
				}} class="glassbutton" variant="outline">
					<p>{m.remove_friend()}</p>
				</Button>
				<Button 
					onclick={() => 
						toast.success(m.invited_play(), {
							unstyled: true,
							class:
							"glass flex px-4 py-3 gap-4",
						})
					}
					class="glassbutton" variant="outline">
					{m.invite_play()}
				</Button>
			{:else if data.userType === 'someone'}
				<Button
					onclick={() => {
						friends.accept(data.user.id);
						toast.success(m.sent_friend_request(), {
							unstyled: true,
							class:
							"glass flex px-4 py-3 gap-4",
						})
					}}
					class="glassbutton"
					variant="outline">
					{m.add_friend()}
				</Button>
			{/if}
		</div>
	</div>
</div>

<style>
	.avatar {
		margin: 1vw;
		width: 15%;
		aspect-ratio: 1 / 1;

		display: flex;
		align-items: center;
		justify-content: center;

		font-size: 3vw;
		font-weight: bold;
	}

	.header {
		display: flex;
		flex-direction: row;
		align-items: stretch;
	}
	.info {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		flex: 1;
		min-height: 10vw;
	}

	.name {
		font-size: 3vw;
	}

	.botinfo {
		font-size: 1vw;
		opacity: 0.7;
	}
</style>
