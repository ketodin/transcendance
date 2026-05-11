<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { resolve } from '$app/paths';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { formSchema } from "./schema";
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	const form = superForm(data.form, { validators: zod4Client(formSchema) });
	const { form: formData, enhance } = form;

	const profiles = $derived(data.profiles.sort((a, b) => b.xp - a.xp));
</script>


<div class="flex flex-col gap-16">

	<div>
		<h1 class="text-4xl/7 font-bold">New profile</h1><br>
		<form method="POST" use:enhance>
			<Form.Field {form} name="username">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Username</Form.Label>
						<Input {...props} type="text" bind:value={$formData.username} required/>
					{/snippet}
				</Form.Control>
				<Form.Description />
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="email">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Email</Form.Label>
						<Input {...props} type="text" bind:value={$formData.email} required/>
					{/snippet}
				</Form.Control>
				<Form.Description />
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="bio">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Bio</Form.Label>
						<Input {...props} type="text" bind:value={$formData.bio}/>
					{/snippet}
				</Form.Control>
				<Form.Description />
				<Form.FieldErrors />
			</Form.Field>
			<Form.Button>
				Create new profile
			</Form.Button>
		</form>
	</div>

	<div>
		<h1 class="text-4xl/7 font-bold">XP Leaderboard</h1><br>
		<ul class="list-decimal pl-5">
			{#each profiles as { id, username, xp } (id)}
				<li><a href={resolve("/profile/[id]", { id })}>{username} ({xp})</a></li>
			{/each}
		</ul>
	</div>

</div>
