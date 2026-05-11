<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<footer class="bg-background border-t">
	<div
		class="text-muted-foreground mx-auto flex h-14 max-w-7xl items-center justify-end px-4 text-sm"
	>
		<div class="flex gap-4">
			<a href={resolve('/legal/privacy')} class="hover:text-foreground transition-colors">{m.privacy()}</a>
			<a href={resolve('/legal/terms')} class="hover:text-foreground transition-colors">{m.terms()}</a>
		</div>
	</div>
</footer>
