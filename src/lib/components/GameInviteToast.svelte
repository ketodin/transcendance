<script lang="ts">
	import { X, Check } from '@lucide/svelte';

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

<div class="glass flex items-center justify-between gap-4 px-4 py-3">
	<span>{message}</span>
	<div class="flex gap-4">
		<button onclick={onAccept} class="text-white hover:text-green-400">
			<Check size={26} />
		</button>
		<button onclick={onDeny} class="text-white hover:text-red-400">
			<X size={26} />
		</button>
	</div>
</div>
