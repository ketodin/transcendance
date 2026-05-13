<script lang="ts">
	import type { PageProps } from './$types';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { formSchema } from './schema';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();

	const form = $derived(superForm(data.form, { validators: zod4Client(formSchema) }));
	const { form: formData, enhance } = $derived(form);
</script>

<form method="POST" use:enhance>
	<Form.Field {form} name="name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Name</Form.Label>
				<Input {...props} type="text" bind:value={$formData.name} required />
			{/snippet}
		</Form.Control>
		<Form.Description />
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="email">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Email</Form.Label>
				<Input {...props} type="text" bind:value={$formData.email} required />
			{/snippet}
		</Form.Control>
		<Form.Description />
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="password">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Password</Form.Label>
				<Input {...props} type="text" bind:value={$formData.password} required />
			{/snippet}
		</Form.Control>
		<Form.Description />
		<Form.FieldErrors />
	</Form.Field>
	<Form.Button>Register</Form.Button>
	<p class="text-muted-foreground text-center text-sm">
		Already have an account? <a href={resolve('/login')} class="underline">Login</a>
	</p>
</form>
