<script lang="ts">
	import { resolve } from '$app/paths';

	import type { PageProps } from "./$types";
	const { data, form }: PageProps = $props();

	const profiles = data.profiles;
</script>


<div>
	<h1 class="text-4xl/7 font-bold">Create a new Profile</h1><br>
	<form method="POST">
		<label for="username">Username:</label>
		<input type="text" id="username" name="username" required class="border"><br>
		<label for="email">Email:</label>
		<input type="email" id="email" name="email" required class="border"><br>
		<label for="bio">Bio:</label>
		<input type="text" id="bio" name="bio" class="border"><br>
		<button class="border">Create new profile</button>
	</form>
	<br> <br> <br> <br>
	<h1 class="text-4xl/7 font-bold">All Profiles</h1><br>
	<ul class="list-disc pl-5">
		{#each profiles as profile (profile.createdAt)}
			<li><a href={resolve("/profile/[id]", { id: profile.id })}>{profile.username}</a></li>
		{/each}
	</ul>
</div>

