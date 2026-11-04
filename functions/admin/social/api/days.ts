import { fixtureMode, hasQueueBindings, passwordConfigured, verifySession } from '../_lib/auth';
import { bindingsRequired, json, setupRequired, unauthorized } from '../_lib/responses';
import { listDays } from '../_lib/store';
import type { Env } from '../_lib/types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const { request, env } = context;
	if (!passwordConfigured(env)) return setupRequired();
	if (!(await verifySession(request, env))) return unauthorized();

	if (!fixtureMode(env) && !hasQueueBindings(env)) return bindingsRequired();

	const { days, fixture, bindingsOk } = await listDays(env);
	return json({ days, fixture, bindingsOk });
};
