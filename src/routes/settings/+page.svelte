<script lang="ts">
	import TOTPSection from '$lib/components/totp/TOTPSection.svelte';
	import { signOut } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import type { PageProps } from './$types';
	import { disconnectStatusRoom } from '$lib/status-client';

	// TODO: move this to a component
	import * as Form from '$lib/components/ui/form';
	import { superForm, fileProxy } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { avatarSchema } from './avatarSchema';
	import SuperDebug from "sveltekit-superforms";

	let { data }: PageProps = $props();


	const avatarForm = $derived(superForm(data.avatarForm, { validators: zod4Client(avatarSchema) }));
	const { form: avatarData, enhance: avatarEnhance } = $derived(avatarForm);
	const file = fileProxy(avatarForm, 'file')

	// if /avatar/[userid] exist : is avatar
	// else if user.image_url exist : is avatar
	// else : letter with decent background.
</script>

<div class="flex flex-col gap-16">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">{m.settings()}</h1>
		{#each Object.entries(data.user) as [key, value] (key)}
			<p><strong>{key}:</strong> {value}</p>
		{/each}
		<Button
			class="glass"
			onclick={async () => {
				await disconnectStatusRoom();
				await signOut();
				//window.location.href = '/login';
			}}>Logout</Button
		>
	</div>
	<TOTPSection
		user={data.user}
		enableForm={data.enableForm}
		verifyForm={data.verifyForm}
		disableForm={data.disableForm}
	/>


	<!-- TODO: move this to a component -->
	<h2>Upload Avatar</h2>
	<form method="POST" action="?/avatar" enctype="multipart/form-data" use:avatarEnhance>
		<Form.Field form={avatarForm} name="file">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label class="text-sm font-medium">Avatar</Form.Label>
					<input
						{...props}
						type="file"
						accept="image/jpeg,image/png"
						bind:files={$file}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
			<Form.Button type="submit" class="glass">Upload</Form.Button>
		</Form.Field>
	</form>
	<SuperDebug display={false} data={$avatarData}/> <!-- TODO: why is this needed, find a way to remove it -->

</div>


