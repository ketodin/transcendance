import { createServer } from 'http';
import { Server } from 'colyseus';
import { TankRoom } from './rooms/TankRoom.cjs';

const port = Number(process.env.COLYSEUS_PORT) || 2567;

const server = new Server({ server: createServer() });
server.define('tank_room', TankRoom);

server
	.listen(port)
	.then(() => {
		console.log(`Colyseus server running on ws://localhost:${port}`);
	})
	.catch(() => {
		console.log(`Colyseus server didn't run`);
	});
