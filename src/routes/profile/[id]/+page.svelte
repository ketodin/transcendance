<script lang="ts">
	import type { PageProps } from "./$types";

	let { data, params }: PageProps = $props();
</script>

<div class="flex">
	<h1 class="text-4xl/7 font-bold">{params.id}</h1>
</div>
