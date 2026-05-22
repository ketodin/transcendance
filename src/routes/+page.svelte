<script lang="ts">
	import { useSession, signOut } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { send as sendFriendRequest } from '$lib/friends.remote';

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

	<div>
		<h1 class="font-extrabold">Add Friend</h1>
		<form {...sendFriendRequest}>
			<Input {...sendFriendRequest.fields.email.as('text')}></Input>
			{#each sendFriendRequest.fields.email.issues() as issue (issue.message)}
				<p class="text-red-400">{issue.message}</p>
			{/each}
			<Button type="submit" class="glass">Send</Button>
		</form>
	</div>
</div>
