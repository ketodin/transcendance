<script lang="ts">
	import TOTPSection from '$lib/components/totp/TOTPSection.svelte';
	import { signOut } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import type { PageProps } from './$types';
	import { disconnectStatusRoom } from '$lib/status-client';

	let { data }: PageProps = $props();
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
	{#if data.hasPassword}
		<TOTPSection
			user={data.user}
			enableForm={data.enableForm}
			verifyForm={data.verifyForm}
			disableForm={data.disableForm}
		/>
	{/if}
</div>
