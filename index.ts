import express from 'express';
import { createServer } from 'http';
import { handler } from './build/handler.js';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { defineServer } from 'colyseus';

const PORT = Number(process.env.PORT ?? 3000);

const app = express();
app.use(handler);

const httpServer = createServer(app);

const gameServer = defineServer({
	transport: new WebSocketTransport({ server: httpServer }),
	rooms: {}
});

globalThis.gameServer = gameServer;

await gameServer.listen(PORT);

console.log(`Server now running on http://localhost:${PORT}`);
