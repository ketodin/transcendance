<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as Form from '$lib/components/ui/form';
	import type { SuperForm, Infer } from 'sveltekit-superforms';
	import type { DisableSchema } from './schema';
	import { m } from '$lib/paraglide/messages';

	let { form }: { form: SuperForm<Infer<DisableSchema>> } = $props();
	const { form: formData, enhance } = $derived(form);
</script>

<form method="POST" action="?/disable" use:enhance class="space-y-5">
	<h2 class="text-lg font-medium">{m.disable_2fa_title()}</h2>
	<Form.Field {form} name="password">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label class="text-sm font-medium">{m.password()}</Form.Label>
				<Input
					{...props}
					type="password"
					autocomplete="off"
					bind:value={$formData.password}
					placeholder={m.current_password_placeholder()}
					class="h-11"
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Button variant="destructive" class="h-11 w-full text-base font-medium">
		{m.disable()}
	</Form.Button>
</form>
