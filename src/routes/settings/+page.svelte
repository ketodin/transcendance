<script lang="ts">
	import TOTPSection from '$lib/components/totp/TOTPSection.svelte';
	import { signOut } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { Input } from '$lib/components/ui/input';
	import Avatar from '$lib/components/Avatar.svelte';
	import type { PageProps } from './$types';
	import { LogOut, Camera, KeyRound, Pencil, Save } from '@lucide/svelte';
	import * as Form from '$lib/components/ui/form';
	import { superForm, fileProxy } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { avatarSchema, nameSchema, changePasswordSchema } from './schema';
	import { untrack } from 'svelte';
	import { toast } from '$lib/components/toast';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { authClient } from '$lib/auth-client';
	import * as friends from '$lib/friends.remote';

	let { data }: PageProps = $props();

	const nameForm = superForm(
		untrack(() => data.nameForm),
		{
			warnings: {
				duplicateId: false
			},
			validators: zod4Client(nameSchema),
			onUpdated({ form }) {
				if (form.valid) {
					nameForm.reset({ data: { name: form.data.name } });
					editing = false;
					toast.success(m.name_changed());
				}
			}
		}
	);

	const { form: nameData, enhance: nameEnhance } = nameForm;

	const avatarForm = superForm(
		untrack(() => data.avatarForm),
		{
			warnings: {
				duplicateId: false
			},
			validators: zod4Client(avatarSchema),
			onUpdated({ form }) {
				if (!form.valid && form.errors.file) {
					toast.error(form.errors.file?.[0]);
				}
				if (form.valid) {
					avatarForm.reset();
					toast.success(m.avatar_changed());
				}
			}
		}
	);

	const { enhance: avatarEnhance } = avatarForm;

	const passwordForm = superForm(
		untrack(() => data.changePasswordForm),
		{
			warnings: {
				duplicateId: false
			},
			validators: zod4Client(changePasswordSchema),
			onUpdated({ form }) {
				if (form.valid) {
					passwordForm.reset();
					toast.success(m.password_changed());
				}
			}
		}
	);

	const { form: passwordData, enhance: passwordEnhance } = passwordForm;

	const file = fileProxy(avatarForm, 'file');

	let fileInput: HTMLInputElement;
	let nameFormEl: HTMLFormElement | undefined = $state();
	let editing = $state(false);

	async function handleDelete() {
		await friends.notifyRemoval();
		await authClient.deleteUser();
		window.location.pathname = '/register';
	}
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

<div class="glass p-6">
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
				<Camera size="20%" />
			</div>
		</button>

		<div class="info p-8">
			{#if editing}
				<form bind:this={nameFormEl} method="POST" action="?/changeName" use:nameEnhance>
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
				<span class="display-name">{$nameData.name}</span>
			{/if}
		</div>

		<div class="action">
			{#if editing}
				<Button class="glassbutton group min-h-10" onclick={() => nameFormEl?.requestSubmit()}>
					{m.save()}
					<Save size={16} />
				</Button>
			{:else}
				<Button class="glassbutton group min-h-10" onclick={() => (editing = true)}>
					<Pencil size={16} />
					{m.edit()}
				</Button>
			{/if}
			<Button
				class="glassbutton group min-h-10"
				onclick={async () => {
					await signOut();
					window.location.pathname = '/login';
				}}
			>
				{m.logout()}
				<LogOut class="text-red-400 transition-colors group-hover:text-white" />
			</Button>
			<AlertDialog.Root>
				<AlertDialog.Trigger
					class="glassbutton inline-flex min-h-10 items-center justify-center px-6 text-sm text-red-400"
				>
					{m.delete_account()}
				</AlertDialog.Trigger>
				<AlertDialog.Content class="glass">
					<AlertDialog.Header>
						<AlertDialog.Title>{m.confirm_delete()}</AlertDialog.Title>
						<AlertDialog.Description>
							{m.delete_speech()}
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel class="glassbutton">{m.cancel()}</AlertDialog.Cancel>
						<Button class="glassbutton text-red-400" onclick={handleDelete}>
							{m.confirm()}
						</Button>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		</div>
	</div>
	{#if data.hasPassword}
		<div class="glass section p-6">
			<h2 class="section-title">
				<KeyRound size={18} />
				{m.change_password()}
			</h2>
			<form method="POST" action="?/changePassword" use:passwordEnhance>
				<input hidden type="text" name="username" autocomplete="username" value={data.user.email} />
				<div class="password-fields">
					<Form.Field form={passwordForm} name="currentPassword">
						<Form.Control>
							{#snippet children({ props })}
								<div class="field">
									<Form.Label>{m.current_password_placeholder()}</Form.Label>
									<Input
										{...props}
										type="password"
										autocomplete="current-password"
										bind:value={$passwordData.currentPassword}
									/>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field form={passwordForm} name="newPassword">
						<Form.Control>
							{#snippet children({ props })}
								<div class="field">
									<Form.Label>{m.new_password()}</Form.Label>
									<Input
										{...props}
										type="password"
										autocomplete="new-password"
										bind:value={$passwordData.newPassword}
									/>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field form={passwordForm} name="confirmPassword">
						<Form.Control>
							{#snippet children({ props })}
								<div class="field">
									<Form.Label>{m.confirm_new_password()}</Form.Label>
									<Input
										{...props}
										type="password"
										autocomplete="new-password"
										bind:value={$passwordData.confirmPassword}
									/>
								</div>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Button type="submit" class="glassbutton self-end" variant="outline">
						{m.save()}
					</Button>
				</div>
			</form>
		</div>

		<div class="glass p-6">
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
		width: 15%;
		font-size: 3vw;
		border-radius: 50%;
		margin: 1vw;
	}

	.header {
		display: flex;
		align-items: center;
		margin-bottom: 2rem;
	}

	.info {
		display: flex;
		flex-direction: row;
		flex: 1;
		min-height: 10vw;
	}

	.botinfo {
		font-size: 1vw;
		opacity: 0.7;
	}

	.display-name {
		display: flex;
		align-items: center;
		height: 36px;
		font-size: 3vw;
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
	}

	.section {
		margin-bottom: 2rem;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
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
</style>
