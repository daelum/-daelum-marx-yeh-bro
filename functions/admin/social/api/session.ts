import { fixtureMode, passwordConfigured, verifySession } from '../_lib/auth';
import { json, setupRequired } from '../_lib/responses';
import { hasZernio } from '../_lib/zernio';
import type { Env } from '../_lib/types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const { request, env } = context;
	if (!passwordConfigured(env)) return setupRequired();
	const ok = await verifySession(request, env);
	return json({
		ok,
		setupRequired: false,
		fixture: fixtureMode(env),
		zernio: hasZernio(env),
		account: '@theyehbro',
	});
};
