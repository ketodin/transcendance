<script lang="ts">
	import { onMount } from 'svelte';

	let { base = 1, error = 0 } = $props<{ base?: number; error?: number }>();

	let canvas: HTMLCanvasElement;
	let animId: number;

	const VERT = `
attribute vec2 a_pos;
void main() {
	gl_Position = vec4(a_pos, 0., 1.);
}
`;

	const FRAG = `
precision highp float;

uniform float u_time;
uniform float u_seed;
uniform vec2 u_res;
uniform float u_base;
uniform float u_error;

float hash(vec2 p) {
	p = fract(p * vec2(123.34, 456.21));
	p += dot(p, p + 45.32);
	return fract(p.x * p.y);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);

	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));

	vec2 u = f * f * (3.0 - 2.0 * f);

	return mix(a, b, u.x) +
	       (c - a) * u.y * (1.0 - u.x) +
	       (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;

	for (int i = 0; i < 5; i++) {
		v += a * noise(p);
		p *= 2.0;
		a *= 0.5;
	}
	return v;
}

void main() {
	vec2 uv = gl_FragCoord.xy / u_res.xy;
	vec2 p = uv * 3.0 - 1.5;

	float t = u_time * 0.03;

	p += vec2(
		fbm(p + t + u_seed),
		fbm(p - t - u_seed)
	) * 0.8;

	float n = fbm(p * 2.0 + t);

	vec3 d1 = vec3(0.02, 0.03, 0.08);
	vec3 d2 = vec3(0.10, 0.06, 0.18);
	vec3 d3 = vec3(0.10, 0.15, 0.28);

	vec3 darkCol = mix(d1, d2, n);
	darkCol = mix(darkCol, d3, smoothstep(0.25, 0.85, n));
	darkCol += n * 0.22;
	darkCol *= 2.0;

	vec3 l1 = vec3(0.4, 0.4, 0.4);
	vec3 l2 = vec3(0.20, 0.06, 0.18);
	vec3 l3 = vec3(0.00, 0.10, 0.28);

	vec3 lightCol = mix(l1, l2, n);
	lightCol = mix(lightCol, l3, smoothstep(0.2, 0.9, n));
	lightCol += n * 0.22;
	lightCol *= 2.5;

	vec3 color = mix(lightCol, darkCol, u_base);

	float vignette = smoothstep(1.3, 0.2, length(uv - 0.5));
	color *= vignette;

if (u_error > 0.0) {

	float lum = dot(color, vec3(0.299, 0.587, 0.114));

	vec3 emberDark = vec3(0.08, 0.02, 0.01);
	vec3 emberMid  = vec3(0.55, 0.12, 0.05);
	vec3 emberHot  = vec3(1.0, 0.35, 0.1);

	float heat = smoothstep(0.2, 0.85, n * 1.2 + lum * 0.3);

	vec3 ember = mix(emberDark, emberMid, heat);
	ember = mix(ember, emberHot, heat * heat);

	float depth = 1.0 - lum;

	color = mix(color, ember, u_error * (0.35 + 0.35 * depth));

	color += ember * u_error * 0.08 * depth;
}

	gl_FragColor = vec4(color, 1.0);
}
`;

	let running = true;

	let currentBase = 1;
	let targetBase = 1;

	let currentError = 0;
	let targetError = 0;

	$effect(() => {
		targetBase = base;
		targetError = error;
	});

	function animate() {
		currentBase += (targetBase - currentBase) * 0.08;
		currentError += (targetError - currentError) * 0.08;
	}

	onMount(() => {
		const gl = canvas.getContext('webgl');
		if (!gl) return;

		const ctx = gl;

		function compile(type: number, src: string) {
			const shader = ctx.createShader(type);
			if (!shader) throw new Error('shader error');

			ctx.shaderSource(shader, src);
			ctx.compileShader(shader);

			return shader;
		}

		const prog = ctx.createProgram();
		if (!prog) return;

		ctx.attachShader(prog, compile(ctx.VERTEX_SHADER, VERT));
		ctx.attachShader(prog, compile(ctx.FRAGMENT_SHADER, FRAG));
		ctx.linkProgram(prog);
		ctx.useProgram(prog);

		const buf = ctx.createBuffer();
		ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
		ctx.bufferData(
			ctx.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
			ctx.STATIC_DRAW
		);

		const loc = ctx.getAttribLocation(prog, 'a_pos');
		ctx.enableVertexAttribArray(loc);
		ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);

		const uTime = ctx.getUniformLocation(prog, 'u_time');
		const uSeed = ctx.getUniformLocation(prog, 'u_seed');
		const uRes = ctx.getUniformLocation(prog, 'u_res');
		const uBase = ctx.getUniformLocation(prog, 'u_base');
		const uError = ctx.getUniformLocation(prog, 'u_error');

		const seed = Math.random() * 100;

		const resize = () => {
			canvas.width = canvas.offsetWidth * devicePixelRatio;
			canvas.height = canvas.offsetHeight * devicePixelRatio;
			ctx.viewport(0, 0, canvas.width, canvas.height);
		};

		resize();
		window.addEventListener('resize', resize);

		const draw = (t: number) => {
			if (!running) return;

			animate();

			if (uTime) ctx.uniform1f(uTime, t / 1000);
			if (uSeed) ctx.uniform1f(uSeed, seed);
			if (uRes) ctx.uniform2f(uRes, canvas.width, canvas.height);
			if (uBase) ctx.uniform1f(uBase, currentBase);
			if (uError) ctx.uniform1f(uError, currentError);

			ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);

			animId = requestAnimationFrame(draw);
		};

		animId = requestAnimationFrame(draw);

		return () => {
			running = false;
			window.removeEventListener('resize', resize);
			cancelAnimationFrame(animId);
			ctx.getExtension('WEBGL_lose_context')?.loseContext();
		};
	});
</script>

<canvas bind:this={canvas} class="fixed inset-0 -z-10 h-full w-full"></canvas>
