<script lang="ts">
	import User from './User.svelte';
	import { m } from '$lib/paraglide/messages';

	let users = [
		{ name: 'Emporio', online: true },
		{ name: 'timeo daclino', online: true },
		{ name: 'Jaubry', online: false },
		{ name: 'revoli', online: true },
		{ name: 'Crabs', online: false },
		{ name: 'le don', online: true },
		{ name: 'charly', online: false },
		{ name: 'lespenel', online: true },
		{ name: 'androux', online: false }
	];

	let sortedUsers = $derived([...users].sort((a, b) => Number(b.online) - Number(a.online)));
</script>

<div class="glass sidebar">
	<h2>{m.friends()}</h2>

	{#each sortedUsers as user (user.name)}
		<User name={user.name} online={user.online} />
	{/each}
</div>

<style>
	:global(:root) {
		--header-height: 4rem;
		--layout-gap: 1rem;
	}

	.sidebar h2 {
		text-align: center;
	}

	.sidebar {
		position: fixed;
		left: 1%;
		top: calc(var(--header-height) + var(--layout-gap) + 1%);
		width: 20%;
		height: calc(100vh - var(--header-height) - var(--layout-gap) - 2% - 4rem);
		display: flex;
		flex-direction: column;
		padding: 1.25rem;
		overflow-y: auto;
	}

	h2 {
		font-size: 1rem;
		font-weight: 600;
		opacity: 0.6;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin-bottom: 0.5rem;
	}
</style>
