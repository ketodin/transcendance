<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
	const profile = $derived(data.profile);
</script>

<div class="flex flex-col gap-4">
	<p class="text-4xl/7 font-bold">id: {profile!.id}</p>
	<p class="text-4xl/7 font-bold">username: {profile!.username}</p>
	<p class="text-4xl/7 font-bold">email: {profile!.email}</p>
	<p class="text-4xl/7 font-bold">bio: {profile!.bio}</p>
	<p class="text-4xl/7 font-bold">xp: {profile!.xp}</p>
</div>
<br>
<br>
<form method="POST" action="?/levelup" use:enhance>
	<Button type="submit">Level Up</Button>
</form>
<br>
<form method="POST" action="?/delete" use:enhance>
	<Button type="submit" variant="destructive">Delete Profile</Button>
</form>
