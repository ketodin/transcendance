import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type ViteDevServer } from 'vite';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { defineServer } from 'colyseus';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['cookie', 'preferredLanguage', 'baseLocale']
		}),
		colyseusVitePlugin()
	]
});

function colyseusVitePlugin() {
	return {
		name: 'colyseus-dev-server',
		configureServer(server: ViteDevServer) {
			server.middlewares.use(async (_req, _res, next) => {
				while (!(globalThis as any).gameServer) await new Promise((r) => setTimeout(r, 50));
				next();
			});

			server.middlewares.use(async (req, res, next) => {
				const url = req.url ?? '';
				if (!url.startsWith('/matchmake/')) return next();

				try {
					const { matchMaker } = await import('@colyseus/core');

					const body: Buffer[] = [];
					req.on('data', (chunk: Buffer) => body.push(chunk));
					await new Promise<void>((r) => req.on('end', r));
					const json = body.length ? JSON.parse(Buffer.concat(body).toString()) : {};

					const [method, roomType] = url.replace('/matchmake/', '').split('/');
					const methods: Record<string, Function> = {
						joinOrCreate: (r: string, o: any) => matchMaker.joinOrCreate(r, o),
						join: (r: string, o: any) => matchMaker.join(r, o),
						create: (r: string, o: any) => matchMaker.create(r, o),
						joinById: (r: string, o: any) => matchMaker.joinById(r, o)
					};

					if (!methods[method]) {
						res.statusCode = 404;
						return res.end(JSON.stringify({ error: `Unknown method: ${method}` }));
					}

					const result = await methods[method](roomType, json);
					res.setHeader('Content-Type', 'application/json');
					res.end(JSON.stringify(result));
				} catch (e: any) {
					res.statusCode = 400;
					res.setHeader('Content-Type', 'application/json');
					res.end(JSON.stringify({ error: e.message }));
				}
			});

			return async () => {
				const viteUpgradeListeners = server.httpServer!.listeners('upgrade').slice();
				server.httpServer!.removeAllListeners('upgrade');

				const gameServer = defineServer({
					transport: new WebSocketTransport({ server: server.httpServer! }),
					rooms: {}
				});
				(globalThis as any).gameServer = gameServer;

				await gameServer.attach({ server: server.httpServer! });

				const colyseusUpgradeListeners = server.httpServer!.listeners('upgrade').slice(0, 1);
				server.httpServer!.removeAllListeners('upgrade');

				server.httpServer!.on('upgrade', (req, socket, head) => {
					const url = req.url ?? '';
					if (url.includes('token=')) {
						for (const fn of viteUpgradeListeners) (fn as Function)(req, socket, head);
					} else {
						for (const fn of colyseusUpgradeListeners) (fn as Function)(req, socket, head);
					}
				});

				console.log('Colyseus attached to Vite dev server');
			};
		}
	};
}
