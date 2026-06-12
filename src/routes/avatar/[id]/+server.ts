import { readFile } from 'fs/promises';
import { error } from '@sveltejs/kit';
import path from 'path';
import type { RequestHandler } from './$types';

const STATIC_DIR = path.join(process.cwd(), 'static/uploads');

export const GET: RequestHandler = async ({ params }) => {
	const filepath = path.join(STATIC_DIR, params.id);
	if (!filepath.startsWith(STATIC_DIR)) {
		return error(403, 'Forbidden');
	}
	try {
		const file = await readFile(filepath);
		return new Response(file, {});
	} catch {
		return error(404, 'File not found');
	}
};
