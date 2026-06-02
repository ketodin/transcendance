<script lang="ts">
	type Props = {
		id: string;
		image: string | null;
		name: string;
		size?: string;
	};

	let { id, image, name, size = '2.5rem' }: Props = $props();

	type AvatarSource = 'api' | 'image_url' | 'initial';

	let source = $state<AvatarSource>('api');
	let apiUrl = $derived(`/avatar/${id}`);

	const initial = $derived(name.charAt(0).toUpperCase());

	async function checkApiAvatar(): Promise<boolean> {
		try {
			const res = await fetch(apiUrl, { method: 'HEAD' });
			return res.ok;
		} catch {
			return false;
		}
	}

	$effect(() => {
		void checkApiAvatar()
			.then((exists) => {
				if (exists) {
					source = 'api';
				} else if (image) {
					source = 'image_url';
				} else {
					source = 'initial';
				}
			})
			.catch((err) => {
				console.error(err);
			});
	});

	function onImgError() {
		if (source === 'api' && image) {
			source = 'image_url';
		} else {
			source = 'initial';
		}
	}
</script>

{#if source === 'initial'}
	<div class="avatar initial" style="--size: {size}">
		{initial}
	</div>
{:else}
	<img
		class="avatar"
		style="--size: {size}"
		src={source === 'api' ? apiUrl : image}
		alt={name}
		onerror={onImgError}
	/>
{/if}

<style>
	.avatar {
		width: var(--size, 2.5rem);
		aspect-ratio: 1 / 1;
		border-radius: 50%;
		object-fit: cover;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.initial {
		background: rgba(255, 255, 255, 0.1);
		font-size: calc(var(--size, 2.5rem) * 0.4);
	}
</style>
