<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
</script>

<div class="error">
	<div class="content">
		<h1 class="code">{page.status}</h1>

		<p class="message">
			{page.error?.message}
		</p>

		<a class="home" href={resolve('/')}>{m.home_page()}</a>
	</div>
</div>

<style>
	.error {
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;

		min-height: 100vh;
		width: 100%;
	}

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.code {
		font-size: clamp(6rem, 12vw, 12rem);
		font-weight: 800;
		letter-spacing: -0.05em;
		margin: 0;
		opacity: 0.9;
	}

	.message {
		font-size: 1.1rem;
		opacity: 0.7;
		max-width: 30ch;
		margin: 0;
	}

	.home {
		font-size: 0.9rem;
		opacity: 0.6;
		text-decoration: none;
		transition: opacity 0.2s ease;
	}

	.home:hover {
		opacity: 1;
	}
</style>
