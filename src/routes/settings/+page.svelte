<script lang="ts">
	import TOTPSection from '$lib/components/totp/TOTPSection.svelte';
	import { signOut } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { Input } from '$lib/components/ui/input';
	import Avatar from '$lib/components/Avatar.svelte';
	import type { PageProps } from './$types';
	import { disconnectStatusRoom } from '$lib/status-client';
	import { LogOut, Crop, KeyRound, Pencil, Save } from '@lucide/svelte';
	import * as Form from '$lib/components/ui/form';
	import { superForm, fileProxy } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { avatarSchema, nameSchema } from './schema';
	import { untrack } from 'svelte';
	import { toast } from '$lib/components/toast';

	let { data }: PageProps = $props();

	const nameForm = superForm(
		untrack(() => data.nameForm),
		{
			validators: zod4Client(nameSchema),
			onUpdated({ form }) {
				if (form.valid) {
					nameForm.reset({ data: { name: form.data.name } });
					editing = false;
				}
			}
		}
	);

	const { form: nameData, enhance: nameEnhance } = nameForm;

	const avatarForm = superForm(
		untrack(() => data.avatarForm),
		{
			validators: zod4Client(avatarSchema),
			onUpdated({ form }) {
				if (!form.valid && form.errors.file) {
					toast.error(form.errors.file?.[0]);
				}
			}
		}
	);

	const { enhance: avatarEnhance } = avatarForm;

	const file = fileProxy(avatarForm, 'file');

	let fileInput: HTMLInputElement;
	let nameFormEl: HTMLFormElement | undefined = $state();
	let editing = $state(false);
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

<div class="glass min-h-full w-full p-6">
	<div class="glass header p-6">
		<button
			type="button"
			class="avatar group relative cursor-pointer outline"
			onclick={() => fileInput.click()}
		>
			<Avatar {...data.user} size="100%" />

			<div
				class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
			>
				<Crop class="h-6 w-6 text-white" />
			</div>
		</button>

		<div class="info p-8">
			{#if editing}
				<form
					bind:this={nameFormEl}
					class="input-form"
					method="POST"
					action="?/changeName"
					use:nameEnhance
				>
					<Form.Field form={nameForm} name="name">
						<Form.Control>
							{#snippet children({ props })}
								<Input {...props} type="text" bind:value={$nameData.name} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</form>
			{:else}
				<div class="display-name">
					<span class="display-value">{$nameData.name}</span>
				</div>
			{/if}
		</div>

		<div class="action">
			{#if editing}
				<Button class="glassbutton group" onclick={() => nameFormEl?.requestSubmit()}>
					<Save size={16} />
					{m.save()}
				</Button>
			{:else}
				<Button class="glassbutton group" onclick={() => (editing = true)}>
					<Pencil size={16} />
					{m.edit()}
				</Button>
			{/if}
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
	{#if data.hasPassword}
		<div class="glass section p-6">
			<h2 class="section-title">
				<KeyRound size={18} />
				{m.change_password()}
			</h2>
			<div class="password-fields">
				<div class="field">
					<label for="currentPassword">{m.current_password_placeholder()}</label>
					<Input
						id="currentPassword"
						type="password"
						name="currentPassword"
						autocomplete="current-password"
					/>
				</div>
				<div class="field">
					<label for="newPassword">{m.new_password()}</label>
					<Input id="newPassword" type="password" name="newPassword" autocomplete="new-password" />
				</div>
				<div class="field">
					<label for="confirmPassword">{m.confirm_new_password()}</label>
					<Input
						id="confirmPassword"
						type="password"
						name="confirmPassword"
						autocomplete="new-password"
					/>
				</div>
				<Button type="button" class="glassbutton self-end" variant="outline">
					{m.save()}
				</Button>
			</div>
		</div>

		<div class="glass section p-6">
			<TOTPSection
				user={data.user}
				enableForm={data.enableForm}
				verifyForm={data.verifyForm}
				disableForm={data.disableForm}
			/>
		</div>
	{/if}
</div>

<style>
	.avatar {
		margin: 1vw;
		width: 15%;
		height: 15%;
		aspect-ratio: 1 / 1;
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
		align-items: center;
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
	}

	.display-name {
		display: flex;
		align-items: center;
		height: 36px;
	}

	.display-value {
		font-size: 1rem;
		font-weight: 500;
	}

	.action {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		justify-content: center;
		align-items: flex-end;
	}

	.section {
		margin-top: 1rem;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 1rem;
		opacity: 0.9;
	}

	.password-fields {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.85rem;
		opacity: 0.8;
	}

	@media (max-width: 768px) {
		.header {
			flex-direction: column;
			align-items: center;
			gap: 1rem;
		}
		.avatar {
			width: 30%;
			height: auto;
			margin: 0;
			font-size: 8vw;
		}
		.info {
			align-items: center;
			min-height: unset;
			padding: 0;
			width: 100%;
		}
		.action {
			width: 100%;
			align-items: stretch;
		}
	}
</style>
