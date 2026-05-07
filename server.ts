/**
 * Production entry point: SvelteKit + Colyseus on the same HTTP server.
 *
 * Build first:
 *   pnpm run build           <- SvelteKit → build/
 *   pnpm run build:server    <- Colyseus  → build-server/
 *
 * Then run:
 *   node build-server/server.js
 */
import { createServer } from 'http';
import { Server } from 'colyseus';
// @ts-ignore - generated at build time
import { handler } from './build/handler.js';
// @ts-ignore - compiled at build time
import { TankRoom } from './build-server/colyseus/rooms/TankRoom.js';

const port = Number(process.env.PORT) || 3000;

const httpServer = createServer(handler);

const gameServer = new Server({ server: httpServer });
gameServer.define('tank_room', TankRoom);

httpServer.listen(port, () => {
	console.log(`Server running on http://localhost:${port}`);
	console.log(`WebSocket game server on ws://localhost:${port}`);
});
