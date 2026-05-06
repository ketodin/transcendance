<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Label } from "$lib/components/ui/label";
	import { Input } from "$lib/components/ui/input";
	import { resolve } from '$app/paths';
	import { enhance } from "$app/forms";
	import type { PageProps } from "./$types";

	const { data }: PageProps = $props();

	const profiles = $derived(data.profiles.sort((a, b) => b.xp - a.xp));

</script>


<div>
	<h1 class="text-4xl/7 font-bold">Create a new Profile</h1><br>
	<form method="POST" use:enhance class="flex flex-col gap-4 w-1/2">
		<div>
			<Label for="username">Username:</Label>
			<Input type="text" id="username" name="username" required/>
		</div>
		<div>
			<Label for="email">Email:</Label>
			<Input type="email" id="email" name="email" required/>
		</div>
		<div>
			<Label for="bio">Bio:</Label>
			<Input type="text" id="bio" name="bio"/>
		</div>
		<div>
			<Button type="submit">Create new profile</Button>
		</div>
	</form>

	<br> <br> <br> <br>
	<h1 class="text-4xl/7 font-bold">XP Leaderboard</h1><br>
	<ul class="list-decimal pl-5">
		{#each profiles as { id, username, xp } (id)}
			<li><a href={resolve("/profile/[id]", { id })}>{username} ({xp})</a></li>
		{/each}
	</ul>
</div>

