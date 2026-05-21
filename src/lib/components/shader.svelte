<script lang="ts">
  import { onMount } from 'svelte';
  let canvas: HTMLCanvasElement;
  let animId: number;

  const VERT = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0., 1.); }
  `;

  const FRAG = `
    precision mediump float;
    uniform float u_time;
    uniform float u_seed;
    uniform vec2  u_res;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;

      vec3 bg     = vec3(0.118, 0.110, 0.294);
      vec3 mid    = vec3(0.216, 0.188, 0.639);
      vec3 bright = vec3(0.388, 0.400, 0.973);
      vec3 light  = vec3(0.780, 0.816, 0.996);
      vec3 deep   = vec3(0.082, 0.078, 0.196);
      vec3 accent = vec3(0.310, 0.251, 0.800);

      float t = u_time * 0.1;

      vec2 c1 = vec2(0.25 + sin(t * 0.7  + u_seed * 1.3) * 0.35, 0.65 + cos(t * 0.5  + u_seed * 1.3) * 0.30);
      vec2 c2 = vec2(0.72 + cos(t * 0.45 + u_seed * 2.7) * 0.30, 0.38 + sin(t * 0.6  + u_seed * 2.7) * 0.35);
      vec2 c3 = vec2(0.50 + sin(t * 0.3  + u_seed * 4.1) * 0.40, 0.50 + cos(t * 0.35 + u_seed * 4.1) * 0.35);
      vec2 c4 = vec2(0.15 + cos(t * 0.55 + u_seed * 0.9) * 0.20, 0.25 + sin(t * 0.8  + u_seed * 0.9) * 0.25);
      vec2 c5 = vec2(0.80 + sin(t * 0.4  + u_seed * 3.5) * 0.15, 0.75 + cos(t * 0.65 + u_seed * 3.5) * 0.20);

      float d1 = 1.0 - smoothstep(0.0, 0.55, distance(uv, c1));
      float d2 = 1.0 - smoothstep(0.0, 0.45, distance(uv, c2));
      float d3 = 1.0 - smoothstep(0.0, 0.40, distance(uv, c3));
      float d4 = 1.0 - smoothstep(0.0, 0.35, distance(uv, c4));
      float d5 = 1.0 - smoothstep(0.0, 0.30, distance(uv, c5));

      vec3 color = deep;
      color = mix(color, mid,    d1 * 0.90);
      color = mix(color, bright, d2 * 0.85);
      color = mix(color, accent, d3 * 0.80);
      color = mix(color, light,  d4 * 0.60);
      color = mix(color, bg,     d5 * 0.70);

      float pulse = 0.04 * sin(t * 1.2);
      color += pulse;

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
    }
  `;

  onMount(() => {
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    function shader(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uSeed = gl.getUniformLocation(prog, 'u_seed');
    const uRes  = gl.getUniformLocation(prog, 'u_res');

    const seed = Math.random() * 100;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      gl!.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (t: number) => {
      gl!.uniform1f(uTime, t / 1000);
      gl!.uniform1f(uSeed, seed);
      gl!.uniform2f(uRes, canvas.width, canvas.height);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(draw);
    };
    animId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  });
</script>

<canvas bind:this={canvas} class="fixed inset-0 -z-10 h-full w-full" />
