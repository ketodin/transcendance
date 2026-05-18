<div class="glass">
  <h2>Friends</h2>
</div>

<style>
:global(:root) {
	--header-height: 3.5rem;
	--layout-gap: 1rem;
}

.glass {
	background: rgba(var(--color-background), 0.4);
	backdrop-filter: blur(16px);
	border-radius: var(--radius-2xl);
	position: fixed;
	left: 1%;
	top: calc(var(--header-height) + var(--layout-gap) + 1%);
	width: 20%;
	height: calc(100vh - var(--header-height) - var(--layout-gap) - 2%);
	box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 1.25rem;
	border: 1px solid rgba(255, 255, 255, 0.4);
	overflow-y: auto;
}

h2 {
	font-size: 1rem;
	font-weight: 600;
	opacity: 0.6;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	margin-bottom: 0.5rem;
}
</style>
