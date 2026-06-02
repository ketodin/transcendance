<script lang="ts">
	import TOTPSection from '$lib/components/totp/TOTPSection.svelte';
	import { signOut } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { Input } from '$lib/components/ui/input';
	import type { PageProps } from './$types';
	import { disconnectStatusRoom } from '$lib/status-client';
	import { LogOut, Crop } from '@lucide/svelte';
	import * as Form from '$lib/components/ui/form';
	import { superForm, fileProxy } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { avatarSchema, nameSchema } from './schema';
	import { untrack } from 'svelte';

	let { data }: PageProps = $props();

	const nameForm = superForm(
		untrack(() => data.nameForm),
		{
			validators: zod4Client(nameSchema),
			onUpdated({ form }) {
				if (form.valid) {
					nameForm.reset({ data: { name: form.data.name } });
				}
			}
		}
	);

	const { form: nameData, enhance: nameEnhance } = nameForm;

	const avatarForm = superForm(
		untrack(() => data.avatarForm),
		{
			validators: zod4Client(avatarSchema)
		}
	);

	const { enhance: avatarEnhance } = avatarForm;

	const file = fileProxy(avatarForm, 'file');

	let fileInput: HTMLInputElement;
</script>

<form
	method="POST"
	action="?/avatar"
	enctype="multipart/form-data"
	use:avatarEnhance
	class="hidden"
>
	<Form.Field form={avatarForm} name="file">
		<Form.Control>
			{#snippet children({ props })}
				<input
					{...props}
					bind:this={fileInput}
					type="file"
					accept="image/jpeg,image/png"
					bind:files={$file}
					onchange={() => {
						if ($file && $file.length > 0) {
							(fileInput.closest('form') as HTMLFormElement)?.requestSubmit();
						}
					}}
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>
</form>

<div class="glass h-full w-full p-6">
	<div class="glass header p-6">
		<button
			type="button"
			class="avatar group relative cursor-pointer outline"
			onclick={() => fileInput.click()}
		>
			{#if data.user.image}
				<img src={data.user.image} alt="avatar" class="h-full w-full rounded-full object-cover" />
			{:else}
				<div class="placeholder">
					{data.user.name?.charAt(0)?.toUpperCase() ?? '?'}
				</div>
			{/if}

			<div
				class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
			>
				<Crop class="h-6 w-6 text-white" />
			</div>
		</button>

		<div class="info p-8">
			<form class="input-form" method="POST" action="?/changeName" use:nameEnhance>
				<Form.Field form={nameForm} name="name">
					<div class="edit">
						{m.display_name()}
						<Form.Control>
							{#snippet children({ props })}
								<Input {...props} type="text" bind:value={$nameData.name} />
							{/snippet}
						</Form.Control>
					</div>
					<Form.FieldErrors />
				</Form.Field>
			</form>
		</div>

		<div class="action">
			<Button
				class="glassbutton group"
				onclick={async () => {
					await disconnectStatusRoom();
					await signOut();
				}}
			>
				<div class="group-hover:text-white">{m.logout()}</div>
				<LogOut class="text-red-400 group-hover:text-white" />
			</Button>
		</div>
	</div>

	<TOTPSection
		user={data.user}
		enableForm={data.enableForm}
		verifyForm={data.verifyForm}
		disableForm={data.disableForm}
	/>
</div>

<style>
	.avatar {
		margin: 1vw;
		width: 15%;
		aspect-ratio: 1 / 1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3vw;
		font-weight: bold;
		border-radius: 50%;
		border: none;
		background: transparent;
		padding: 0;
		overflow: hidden;
	}

	.edit {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.header {
		display: flex;
		flex-direction: row;
		align-items: stretch;
		margin-bottom: 2rem;
	}

	.info {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 10vw;
	}

	.botinfo {
		font-size: 1vw;
		opacity: 0.7;
	}

	.input-form {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 0.75rem;
		padding: 0.6rem;
	}
</style>
