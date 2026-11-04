import { fixtureMode, hasQueueBindings, passwordConfigured, verifySession } from '../../../_lib/auth';
import {
	badRequest,
	bindingsRequired,
	json,
	notFound,
	setupRequired,
	unauthorized,
} from '../../../_lib/responses';
import { bulkUpdate, enrichDay } from '../../../_lib/store';
import { DAY_KEY_RE, type Env } from '../../../_lib/types';

export const onRequestPost: PagesFunction<Env> = async (context) => {
	const { request, env, params } = context;
	if (!passwordConfigured(env)) return setupRequired();
	if (!fixtureMode(env) && !hasQueueBindings(env)) return bindingsRequired();
	if (!(await verifySession(request, env))) return unauthorized();

	const date = String(params.date || '');
	if (!DAY_KEY_RE.test(date)) return badRequest('Invalid date');

	let body: { action?: string; ids?: string[] } = {};
	try {
		body = (await request.json()) as { action?: string; ids?: string[] };
	} catch {
		return badRequest('Expected JSON body');
	}

	const action = body.action;
	if (action !== 'approve_pending' && action !== 'reject_selected') {
		return badRequest('action must be approve_pending or reject_selected');
	}
	if (action === 'reject_selected' && (!Array.isArray(body.ids) || body.ids.length === 0)) {
		return badRequest('ids required for reject_selected');
	}

	const day = await bulkUpdate(env, date, action, body.ids);
	if (!day) return notFound('Day not found');
	return json({ ok: true, day: enrichDay(day) });
};
