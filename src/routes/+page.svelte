<script lang="ts">
	import { useSession, signOut } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';

	const session = useSession();
</script>

<div class="flex flex-col gap-16">
	<div>
		{#if $session.data}
			{#each Object.entries($session.data.user) as [key, value] (key)}
				<p><strong>{key}:</strong> {value}</p>
			{/each}
			<Button
				class="glass"
				onclick={async () => {
					await signOut();
				}}>Logout</Button
			>
		{:else}
			<p>Not logged in</p>
		{/if}
	</div>
</div>
