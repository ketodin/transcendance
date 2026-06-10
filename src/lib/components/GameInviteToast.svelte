<script lang="ts">
	import Check from '$lib/components/Check.svelte'
	import X from '$lib/components/X.svelte'

	let {
		message,
		onAccept,
		onDeny
	}: {
		message: string;
		onAccept: () => void;
		onDeny: () => void;
	} = $props();
</script>

<div class="glass flex items-center justify-between gap-4 px-4 py-3"
				style="animation: breathe 2.2s ease-in-out infinite;"
>
	<span>{message}</span>
	<div class="flex gap-4">
		<button onclick={onAccept}>
			<Check />
		</button>
		<button onclick={onDeny}>
			<X />
		</button>
	</div>
</div>
