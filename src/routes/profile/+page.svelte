<script lang="ts">
	import type { PageProps } from './$types';
	const { data }: PageProps = $props();
	import { m } from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button';
	import { Settings } from '@lucide/svelte';

	let userType = 2;
	// 0 : Self
	// 1 : Friend
	// 2 : Someone
	// todo: enum clean
</script>

<div class="glass w-full h-full p-6">
	<div class="glass header p-6">
		<div class="avatar outline">
			{#if data.user.image}
				<img src={data.user.image} alt="avatar" />
			{:else}
				<div class="placeholder">
					{data.user.name?.charAt(0)?.toUpperCase() ?? '?'}
				</div>
			{/if}
		</div>

		<div class="p-8 info">
			<p class="name">{data.user.name}</p>
			<p class="botinfo">Inscription le {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(data.user.createdAt))}</p>
		</div>
		<div class="action">
			{#if userType === 0}
				<Button
					href="/settings"
					class="glassbutton"
					variant="outline">
					<p> settings </p> 
					<!-- TODO: i18n -->
					<Settings size={20} />
				</Button>
			{:else if userType === 1}
				<Button
					class="glassbutton"
					variant="outline">
					<p> {m.remove_friend()} </p>
				</Button>
				<Button
					class="glassbutton"
					variant="outline">
					<p> {m.invite_play()} </p>
				</Button>
			{:else}
				<Button
					class="glassbutton"
					variant="outline">
					<p> add friend </p>
					<!-- TODO: i18n -->
				</Button>
			{/if}
		</div>
	</div>
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
}

.header {
	display: flex;
	flex-direction: row;
	align-items: stretch;
}
.info {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	flex: 1;
	min-height: 10vw;
}

.name {
	font-size: 3vw;
}

.botinfo {
	font-size: 1vw;
	opacity: 0.7;
}
</style>
