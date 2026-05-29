<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as Form from '$lib/components/ui/form';
	import type { SuperForm, Infer } from 'sveltekit-superforms';
	import type { EnableSchema } from './schema';
	import { m } from '$lib/paraglide/messages';

	let { form }: { form: SuperForm<Infer<EnableSchema>> } = $props();
	const { form: formData, enhance } = $derived(form);
</script>

<form method="POST" action="?/enable" use:enhance class="space-y-5">
	<div>
		<h2 class="text-lg font-medium">{m.two_fa_enable_title()}</h2>
		<p class="text-muted-foreground text-sm">{m.two_fa_enable_description()}</p>
	</div>
	<Form.Field {form} name="password">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label class="text-sm font-medium">{m.password()}</Form.Label>
				<Input
					{...props}
					type="password"
					bind:value={$formData.password}
					placeholder={m.current_password_placeholder()}
					class="h-11"
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Button class="glass h-11 w-full text-base font-medium">
		{m.generate_qr()}
	</Form.Button>
</form>
