import { fixtureMode, hasQueueBindings, passwordConfigured, verifySession } from '../../../_lib/auth';
import {
	badRequest,
	bindingsRequired,
	json,
	notFound,
	setupRequired,
	unauthorized,
} from '../../../_lib/responses';
import {
	approveAndPublishItem,
	enrichDay,
	poolSummary,
	readDay,
	rejectAndRefill,
	setItemStatus,
} from '../../../_lib/store';
import { DAY_KEY_RE, type Env, type ItemStatus } from '../../../_lib/types';

const STATUSES = new Set<ItemStatus>(['pending', 'approved', 'rejected', 'posted', 'failed']);

function gate(env: Env) {
	if (!passwordConfigured(env)) return setupRequired();
	if (!fixtureMode(env) && !hasQueueBindings(env)) return bindingsRequired();
	return null;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const { request, env, params } = context;
	const blocked = gate(env);
	if (blocked) return blocked;
	if (!(await verifySession(request, env))) return unauthorized();

	const date = String(params.date || '');
	if (!DAY_KEY_RE.test(date)) return badRequest('Invalid date');

	const day = await readDay(env, date);
	if (!day) return notFound('Day not found');
	const pool = await poolSummary(env);
	return json({ day: enrichDay(day), fixture: fixtureMode(env), pool });
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
	const { request, env, params } = context;
	const blocked = gate(env);
	if (blocked) return blocked;
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

	// Approve → mark approved then publish immediately via Zernio (when key present).
	if (status === 'approved') {
		const result = await approveAndPublishItem(env, date, id);
		if (!result) return notFound('Item not found');
		const pool = await poolSummary(env);
		return json({
			ok: result.published || result.mode === 'agent',
			published: result.published,
			mode: result.mode,
			message: result.message,
			reason: result.reason,
			item: result.item,
			day: enrichDay(result.day),
			pool,
			// Soft-fail publish: HTTP 200 with published:false so UI can show retry.
			publishFailed: Boolean(result.reason && !result.published && result.mode === 'zernio'),
		});
	}

	// Reject → never publish; append next refill-pool item at bottom when available.
	if (status === 'rejected') {
		const result = await rejectAndRefill(env, date, id);
		if (!result) return notFound('Item not found');
		return json({
			ok: true,
			published: false,
			mode: 'reject',
			message: result.message,
			item: result.item,
			replacement: result.replacement,
			replaced: result.replaced,
			pool: {
				remaining: result.poolRemaining,
				refillNeeded: result.refillNeeded,
			},
			day: enrichDay(result.day),
		});
	}

	// Other status writes never publish.
	const item = await setItemStatus(env, date, id, status);
	if (!item) return notFound('Item not found');
	const day = await readDay(env, date);
	const pool = await poolSummary(env);
	return json({
		ok: true,
		published: false,
		mode: 'status',
		item,
		day: day ? enrichDay(day) : undefined,
		pool,
	});
};
