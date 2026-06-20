import { Session } from 'better-auth/types';
import type { User } from '$lib/server/prisma/browser';
import { type Server as ColyseusServer } from 'colyseus';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
			session: Session | null;
		}
	}
	var gameServer: ColyseusServer;
}

export {};
