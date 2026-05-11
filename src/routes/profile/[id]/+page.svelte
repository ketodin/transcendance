<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeftIcon } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const profile = $derived(data.profile);
</script>

<div class="flex flex-col gap-16">
	<a href={resolve('/profile')}>
		<Button variant="outline" size="icon">
			<ArrowLeftIcon />
		</Button>
	</a>

	<div class="flex flex-col">
		<p class="text-xl font-bold">id: {profile.id}</p>
		<p class="text-xl font-bold">username: {profile.username}</p>
		<p class="text-xl font-bold">email: {profile.email}</p>
		<p class="text-xl font-bold">bio: {profile.bio}</p>
		<p class="text-xl font-bold">xp: {profile.xp}</p>
	</div>

	<div class="flex flex-row gap-4">
		<form method="POST" action="?/levelup" use:enhance>
			<Button type="submit">Level Up</Button>
		</form>
		<form method="POST" action="?/delete" use:enhance>
			<Button type="submit" variant="destructive">Delete Profile</Button>
		</form>
	</div>
</div>
