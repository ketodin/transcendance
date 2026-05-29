import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/lib/server/prisma/client';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { twoFactor } from 'better-auth/plugins';
import { betterAuth } from 'better-auth';
import 'dotenv/config';

const DEFAULT_PASSWORD = 'abcdef12';

const users: {
	key: string;
	email: string;
	name: string;
	password?: string;
}[] = [
	{ key: 'abc', email: 'abc@def.com', name: 'abc' },
	{ key: 'test', email: 'test@test.test', name: 'Test' },
	{ key: 'emporio', email: 'emporio@gmail.com', name: 'Emporio' },
	{ key: 'daclino', email: 'timeo@daclino.fr', name: 'TimeoDaclino' },
	{ key: 'ketodin', email: 'ketodin@mail.com', name: 'Ketodin' },
	{ key: 'revoli', email: 'revoli@mail.com', name: 'Revoli' },
	{ key: 'ledon', email: 'le.don@mail.com', name: 'le Don' },
	{ key: 'charly', email: 'charly@mail.com', name: 'charly' },
	{ key: 'lespenel', email: 'lespenel@mail.com', name: 'lespenel' },
	{ key: 'androux', email: 'androux@mail.com', name: 'Androux' },
	{
		key: 'adrilava',
		email: 'adrilavaa@gmail.com',
		name: 'AdrilavaMinecraft',
		password: 'otherpassword'
	}
];

const friendships: {
	sender: string;
	receiver: string;
	status: 'ACCEPTED' | 'PENDING';
}[] = [
	{ sender: 'daclino', receiver: 'abc', status: 'ACCEPTED' },
	{ sender: 'emporio', receiver: 'abc', status: 'ACCEPTED' },
	{ sender: 'abc', receiver: 'ketodin', status: 'ACCEPTED' },
	{ sender: 'adrilava', receiver: 'abc', status: 'PENDING' },
	{ sender: 'ledon', receiver: 'abc', status: 'PENDING' },
	{ sender: 'abc', receiver: 'revoli', status: 'PENDING' },
	{ sender: 'daclino', receiver: 'test', status: 'ACCEPTED' },
	{ sender: 'emporio', receiver: 'test', status: 'ACCEPTED' },
	{ sender: 'test', receiver: 'ketodin', status: 'ACCEPTED' },
	{ sender: 'adrilava', receiver: 'test', status: 'PENDING' },
	{ sender: 'ledon', receiver: 'test', status: 'PENDING' },
	{ sender: 'test', receiver: 'revoli', status: 'PENDING' }
];

const url = process.env.DATABASE_URL ?? 'file:./dev.db';
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: 'sqlite'
	}),
	experimental: { joins: true },
	emailAndPassword: { enabled: true },
	plugins: [
		twoFactor({
			issuer: 'ft_transcendence',
			TOTPOptions: { window: 1 },
			backupCodes: { count: 8, length: 10 }
		})
	]
});

async function ensureUser(user: (typeof users)[number]) {
	const existing = await prisma.user.findUnique({
		where: { email: user.email }
	});
	if (existing) {
		return existing.id;
	}

	const result = await auth.api.signUpEmail({
		body: {
			email: user.email,
			name: user.name,
			password: user.password ?? DEFAULT_PASSWORD
		}
	});
	return result.user.id;
}

async function ensureFriendship(
	userIds: Map<string, string>,
	friendship: (typeof friendships)[number]
) {
	await prisma.friendRequest.upsert({
		where: {
			senderId_receiverId: {
				senderId: userIds.get(friendship.sender)!,
				receiverId: userIds.get(friendship.receiver)!
			}
		},
		update: { status: friendship.status },
		create: {
			senderId: userIds.get(friendship.sender)!,
			receiverId: userIds.get(friendship.receiver)!,
			status: friendship.status
		}
	});
}

async function main() {
	const userIds = new Map<string, string>();

	for (const user of users) {
		userIds.set(user.key, await ensureUser(user));
	}

	for (const friendship of friendships) {
		await ensureFriendship(userIds, friendship);
	}
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
