<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as friends from "$lib/friends.remote";

	type Props = { friend: friends.Friend; online: boolean };
	let { friend, online }: Props = $props();

	const initial = $derived(friend.name.charAt(0).toUpperCase());
</script>

<div class="glass user">
	<div class="avatar">
		{initial}
	</div>

	<div class="info">
		<div class="name">{friend.name}</div>
		<div>{friend.friendStatus}</div>

		{#if online}
			<Badge variant="secondary">{m.online()}</Badge>
		{:else}
			<Badge variant="outline" class="status offline">
				{m.offline()}
			</Badge>
		{/if}

	</div>

	<div class="actions">
		<button class="icon-btn invite" title={m.invite_play()}>
			<svg viewBox="0 0 24 24" fill="none">
				<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"
				></path>
			</svg>
		</button>

		<div class="separator"></div>

		<button class="icon-btn remove" title={m.remove_friend()}>
			<svg viewBox="0 0 24 24" fill="none">
				<path d="M15 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"
				></path>
				<path d="M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
				<path
					d="M16 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				></path>
			</svg>
		</button>
	</div>
</div>

<style>
	.user {
		position: relative;

		display: flex;
		align-items: center;
		gap: 0.75rem;

		padding: 0.85rem;
		border-radius: 0.75rem;

		margin-bottom: 0.75rem;

		cursor: pointer;

		transition:
			transform 0.15s ease,
			background 0.2s ease;
	}

	.user:hover {
		transform: translateY(-1px);
		background: rgba(255, 255, 255, 0.06);
	}

	.avatar {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;

		display: flex;
		align-items: center;
		justify-content: center;

		font-weight: 600;

		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.name {
		font-size: 0.95rem;
		font-weight: 500;
	}

	.actions {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.icon-btn {
		width: 2rem;
		height: 2rem;

		display: flex;
		align-items: center;
		justify-content: center;

		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.05);

		color: white;

		cursor: pointer;

		transition:
			background 0.15s ease,
			transform 0.1s ease;
	}

	.icon-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-1px);
	}

	.icon-btn svg {
		width: 1rem;
		height: 1rem;
	}

	.separator {
		width: 1px;
		height: 1.2rem;
		background: rgba(255, 255, 255, 0.15);
	}

	.icon-btn.remove {
		color: #f87171;
	}
</style>
