import { fixtureMode, hasQueueBindings, passwordConfigured, verifySession } from '../_lib/auth';
import { json, setupRequired } from '../_lib/responses';
import { poolSummary } from '../_lib/store';
import { hasZernio } from '../_lib/zernio';
import type { Env } from '../_lib/types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const { request, env } = context;
	if (!passwordConfigured(env)) return setupRequired();
	const ok = await verifySession(request, env);
	const bindingsOk = hasQueueBindings(env);
	const fixture = fixtureMode(env);
	const pool = ok && (fixture || bindingsOk) ? await poolSummary(env) : undefined;
	return json({
		ok,
		setupRequired: false,
		fixture,
		bindingsOk,
		bindingsRequired: !fixture && !bindingsOk,
		zernio: hasZernio(env),
		account: '@theyehbro',
		pool,
	});
};
