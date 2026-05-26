
<script lang="ts">
	import type { PageProps } from './$types';
	const { data }: PageProps = $props();
</script>

<div class="layout">
	<aside class="sidebar glass p-6">
		<div class="avatar">
			{data.user.name?.charAt(0)?.toUpperCase() ?? '?'}
		</div>
		<p>{data.user.name}</p>
		<p>{data.user.email}</p>
	</aside>

	<div class="right">
		<div class="glass"></div>
		<div class="glass"></div>
	</div>
</div>

<style>

.layout {
	display: grid;

	grid-template-columns: 1fr 1fr;

	height: 100%;
	width: 100%;
	gap: 2rem;

	overflow: hidden;
}

.sidebar {
	display: flex;
	flex-direction: column;
	justify-content: center;


	overflow: hidden;
}

.right {
	display: grid;

	grid-template-rows: 1fr 1fr;
	gap: 2rem;

	min-width: 0;
	min-height: 0;
}

.avatar {
	height: 30%;
	font-size: 48px;
	font-weight: bold;
	background: rgba(255, 255, 255, 0.1);
}
</style>
