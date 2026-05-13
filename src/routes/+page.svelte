<script lang="ts">
	import { useSession, signOut } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';

	const session = useSession();
</script>

<div>
	{#if $session.data}
		{#each Object.entries($session.data.user) as [key, value] (key)}
			<p><strong>{key}:</strong> {value}</p>
		{/each}
		<Button
			onclick={async () => {
				await signOut();
			}}>Logout</Button
		>
	{:else}
		<p>Not logged in</p>
	{/if}
</div>
