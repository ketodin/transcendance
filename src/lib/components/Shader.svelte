<script lang="ts">
	import { onMount } from 'svelte';

	type Theme = 'dark' | 'light';

	let { theme = 'dark' } = $props<{ theme?: Theme }>();
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
uniform float u_mix;

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

float t = u_time * 0.1;

p += vec2(
fbm(p + t + u_seed),
fbm(p - t - u_seed)
) * 0.8;

float n = fbm(p * 2.0 + t);

vec3 d1 = vec3(0.03, 0.10, 0.22);
vec3 d2 = vec3(0.18, 0.06, 0.35);
vec3 d3 = vec3(0.05, 0.30, 0.25);

vec3 darkCol = mix(d1, d2, n);
darkCol = mix(darkCol, d3, smoothstep(0.25, 0.85, n));
darkCol += n * 0.22;
darkCol *= 0.85;

vec3 l1 = vec3(0.35, 0.75, 1.0);
vec3 l2 = vec3(0.75, 0.55, 1.0);
vec3 l3 = vec3(0.35, 1.0, 0.85);

vec3 lightCol = mix(l1, l2, n);
lightCol = mix(lightCol, l3, smoothstep(0.2, 0.9, n));
lightCol *= 1.05;

vec3 color = mix(lightCol, darkCol, u_mix);

float vignette = smoothstep(1.3, 0.2, length(uv - 0.5));
color *= vignette;

gl_FragColor = vec4(color, 1.0);
}
`;

	let gl: WebGLRenderingContext;
	let running = true;

	let currentMix = 0;
	let targetMix = 0;

	$effect(() => {
		targetMix = theme === 'dark' ? 1 : 0;

		if (Math.abs(currentMix - targetMix) > 0.99) {
			currentMix = targetMix;
		}
	});

	function animateMix() {
		currentMix += (targetMix - currentMix) * 0.08;
	}

	onMount(() => {
		gl = canvas.getContext('webgl');
		if (!gl) return;

		function compile(type: number, src: string) {
			const s = gl.createShader(type)!;
			gl.shaderSource(s, src);
			gl.compileShader(s);
			return s;
		}

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
		const prog = gl.createProgram()!;
		if (!prog) return;
		gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
		gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
		gl.linkProgram(prog);
		gl.useProgram(prog);

		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

		const loc = gl.getAttribLocation(prog, 'a_pos');
		gl.enableVertexAttribArray(loc);
		gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

		const uTime = gl.getUniformLocation(prog, 'u_time');
		const uSeed = gl.getUniformLocation(prog, 'u_seed');
		const uRes = gl.getUniformLocation(prog, 'u_res');
		const uMix = gl.getUniformLocation(prog, 'u_mix');

		const seed = Math.random() * 100;

		const resize = () => {
			canvas.width = canvas.offsetWidth * devicePixelRatio;
			canvas.height = canvas.offsetHeight * devicePixelRatio;
			gl.viewport(0, 0, canvas.width, canvas.height);
		};

		resize();
		window.addEventListener('resize', resize);

		const draw = (t: number) => {
			if (!running) return;

			animateMix();

			gl.uniform1f(uTime, t / 1000);
			gl.uniform1f(uSeed, seed);
			gl.uniform2f(uRes, canvas.width, canvas.height);
			gl.uniform1f(uMix, currentMix);

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

			animId = requestAnimationFrame(draw);
		};

		animId = requestAnimationFrame(draw);

		return () => {
			running = false;
			window.removeEventListener('resize', resize);
			cancelAnimationFrame(animId);
			gl?.getExtension('WEBGL_lose_context')?.loseContext();
		};
	});

	// 🎯 theme change detection
	$effect(() => {
		targetMix = theme === 'dark' ? 1 : 0;
	});
</script>

<canvas bind:this={canvas} class="fixed inset-0 -z-10 h-full w-full"></canvas>
