<script lang="ts">
	import type { PageProps } from './$types';
	import * as Form from '$lib/components/ui/form';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { formSchema } from './schema';

	const { data }: PageProps = $props();
	const form = $derived(superForm(data.form, { validators: zod4Client(formSchema) }));
	const { form: formData, enhance } = $derived(form);
</script>

<div class="flex flex-col gap-16">
	<h1>Friends</h1>

	<form method="POST" action="?/send" use:enhance>
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
		<Form.Button>Send friend request</Form.Button>
	</form>

	<div>
		<h1 class="font-bold">Friend Requests</h1>
		<br />
		<br />

		<h3>Accepted</h3>
		<ul>
			{#each data.friends.accepted as friend (friend.id)}
				<li class="flex flex-row">
					<p>{friend.name} {friend.email}</p>
					<form method="POST" action="?/dismiss">
						<input type="hidden" name="id" value={friend.id} />
						<Button type="submit" variant="secondary" size="xs" class="rounded-full">Remove</Button>
					</form>
				</li>
			{/each}
		</ul>

		<br />
		<hr />
		<br />

		<h3>Received</h3>
		<ul>
			{#each data.friends.received as sender (sender.id)}
				<li class="flex flex-row">
					<p>{sender.name} {sender.email}</p>
					<form method="POST" action="?/accept">
						<input type="hidden" name="id" value={sender.id} />
						<Button type="submit" variant="secondary" size="xs" class="rounded-full">Accept</Button>
					</form>
					<form method="POST" action="?/dismiss">
						<input type="hidden" name="id" value={sender.id} />
						<Button type="submit" variant="secondary" size="xs" class="rounded-full">Dismiss</Button
						>
					</form>
				</li>
			{/each}
		</ul>

		<br />
		<hr />
		<br />

		<h3>Sent</h3>
		<ul>
			{#each data.friends.sent as receiver (receiver.id)}
				<li class="flex flex-row">
					<p>{receiver.name} {receiver.email}</p>
				</li>
			{/each}
		</ul>
	</div>
</div>
