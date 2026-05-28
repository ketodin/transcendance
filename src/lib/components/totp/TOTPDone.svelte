<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { m } from '$lib/paraglide/messages';

	let { backupCodes, onBack }: { backupCodes: string[]; onBack: () => void } = $props();

	let copiedIndex = $state<number | null>(null);

	function copyAll() {
		void navigator.clipboard.writeText(backupCodes.join('\n'));
		copiedIndex = -1;
		setTimeout(() => (copiedIndex = null), 1500);
	}
</script>

<div class="space-y-5">
	<h2 class="text-lg font-medium text-green-600">{m.two_fa_enabled_title()} ✓</h2>
	<p class="text-muted-foreground text-sm">{m.backup_codes_description()}</p>
	<div class="bg-muted rounded-lg p-4">
		<div class="flex flex-col gap-2">
			{#each backupCodes as c, i (i)}
				<div class="flex items-center font-mono text-sm">
					<span class="text-muted-foreground w-5">{i + 1}.</span>
					<span class="flex-1 tracking-wider">{c}</span>
				</div>
			{/each}
		</div>
	</div>
	<Form.Button
		type="button"
		onclick={copyAll}
		variant="outline"
		class="h-11 w-full text-base font-medium"
	>
		{copiedIndex === -1 ? `${m.copied()} ✓` : m.copy_all()}
	</Form.Button>
	<button onclick={onBack} class="text-muted-foreground block text-center text-sm underline">
		{m.close_backup_code()}
	</button>
</div>
