<script lang="ts">
	type Props = {
		image: string | null;
		name: string;
		size: string;
	};
	let { image, name, size = '2.5rem' }: Props = $props();
	const initial = $derived(name.charAt(0).toUpperCase());
	let failedSrc = $state<string | null>(null);
	const imgFailed = $derived(failedSrc === image);

	function handleImageError() {
		failedSrc = image;
	}
</script>

{#if image && !imgFailed}
	<img src={image} alt={initial} style="width: {size}" onerror={handleImageError} />
{:else}
	<div class="avatar" style="width: {size}">
		{initial}
	</div>
{/if}

<style>
	img,
	.avatar {
		aspect-ratio: 1 / 1;
		border-radius: 50%;
		object-fit: cover;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		border: 2px solid rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.1);
	}
</style>
