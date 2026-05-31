<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<div class="flex flex-col items-center justify-center gap-8">
	<h1 class="text-8xl font-extrabold">Transcendence</h1>
	<a
		href={resolve('/game')}
		class="group relative h-[40vh] w-[70vw] overflow-hidden rounded-md text-4xl font-bold"
	>
		<img
			src="/image.png"
			alt=""
			class="group-hover:blur-0 absolute inset-0 h-full w-full object-cover blur-xs transition-[filter] duration-300"
		/>
		<span class="relative z-10 flex h-full w-full items-center justify-center">PLAY</span>
	</a>
</div>
