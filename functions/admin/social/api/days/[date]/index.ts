import { passwordConfigured, verifySession } from '../../../_lib/auth';
import { badRequest, json, notFound, setupRequired, unauthorized } from '../../../_lib/responses';
import { enrichDay, readDay, setItemStatus } from '../../../_lib/store';
import { DAY_KEY_RE, type Env, type ItemStatus } from '../../../_lib/types';

const STATUSES = new Set<ItemStatus>(['pending', 'approved', 'rejected', 'posted', 'failed']);

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const { request, env, params } = context;
	if (!passwordConfigured(env)) return setupRequired();
	if (!(await verifySession(request, env))) return unauthorized();

	const date = String(params.date || '');
	if (!DAY_KEY_RE.test(date)) return badRequest('Invalid date');

	const day = await readDay(env, date);
	if (!day) return notFound('Day not found');
	return json({ day: enrichDay(day) });
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
	const { request, env, params } = context;
	if (!passwordConfigured(env)) return setupRequired();
	if (!(await verifySession(request, env))) return unauthorized();

	const date = String(params.date || '');
	if (!DAY_KEY_RE.test(date)) return badRequest('Invalid date');

	let body: { id?: string; status?: string } = {};
	try {
		body = (await request.json()) as { id?: string; status?: string };
	} catch {
		return badRequest('Expected JSON body');
	}
	const id = typeof body.id === 'string' ? body.id : '';
	const status = body.status as ItemStatus;
	if (!id || !STATUSES.has(status)) return badRequest('id and valid status required');

	const item = await setItemStatus(env, date, id, status);
	if (!item) return notFound('Item not found');
	return json({ ok: true, item });
};
