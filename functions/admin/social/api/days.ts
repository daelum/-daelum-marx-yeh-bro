import { passwordConfigured, verifySession } from '../_lib/auth';
import { json, setupRequired, unauthorized } from '../_lib/responses';
import { listDays } from '../_lib/store';
import type { Env } from '../_lib/types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const { request, env } = context;
	if (!passwordConfigured(env)) return setupRequired();
	if (!(await verifySession(request, env))) return unauthorized();

	const { days, fixture } = await listDays(env);
	return json({ days, fixture });
};
