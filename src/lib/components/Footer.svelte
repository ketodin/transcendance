<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';
</script>

<div class="glass footer">
	<a href={resolve('/legal/privacy')} class="link">
		{m.privacy()}
	</a>

	<a href={resolve('/legal/terms')} class="link">
		{m.terms()}
	</a>
</div>

<style>
.footer {
	position: fixed;
	left: 1%;
	bottom: 1%;

	width: 20%;

	display: flex;
	flex-direction: row;
	justify-content: space-between;

	padding: 0.75rem;
	border-radius: 0.9rem;
}

.link {
	font-size: 0.85rem;
	color: rgba(255, 255, 255, 0.7);
	text-decoration: none;
	transition: 0.2s ease;
	white-space: nowrap;
}

.link:hover {
	color: rgba(255, 255, 255, 1);
}
</style>
