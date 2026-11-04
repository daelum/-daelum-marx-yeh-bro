import {
	createSessionCookie,
	passwordConfigured,
	requestIsHttps,
	timingSafeEqualString,
} from '../_lib/auth';
import { badRequest, json, setupRequired, unauthorized } from '../_lib/responses';
import type { Env } from '../_lib/types';

export const onRequestPost: PagesFunction<Env> = async (context) => {
	const { request, env } = context;
	if (!passwordConfigured(env)) return setupRequired();

	let body: { password?: string } = {};
	try {
		body = (await request.json()) as { password?: string };
	} catch {
		return badRequest('Expected JSON body');
	}
	const password = typeof body.password === 'string' ? body.password : '';
	if (!password) return badRequest('Password required');

	if (!timingSafeEqualString(password, env.ADMIN_SOCIAL_PASSWORD!)) {
		return unauthorized('Invalid password');
	}

	const cookie = await createSessionCookie(env.ADMIN_SOCIAL_PASSWORD!, {
		secure: requestIsHttps(request),
	});
	return json(
		{ ok: true },
		{
			headers: {
				'Set-Cookie': cookie,
			},
		},
	);
};
