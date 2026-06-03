<script lang="ts">
	type Props = {
		image: string | null;
		name: string;
		size: string;
	};
	let { image, name, size }: Props = $props();

	const initial = $derived(name.charAt(0).toUpperCase());
</script>

<img src={image} alt={initial} style="--size: {size}" />

<style>
	img {
		width: var(--size, 2.5rem);
		aspect-ratio: 1 / 1;
		border-radius: 50%;
		object-fit: cover;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		border: 2px solid rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.1);
		font-size: 100%;
	}
</style>
