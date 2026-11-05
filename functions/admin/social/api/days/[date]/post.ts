import { fixtureMode, hasQueueBindings, passwordConfigured, verifySession } from '../../../_lib/auth';
import {
	badRequest,
	bindingsRequired,
	json,
	notFound,
	setupRequired,
	unauthorized,
} from '../../../_lib/responses';
import { approveAndPublishItem, enrichDay } from '../../../_lib/store';
import { DAY_KEY_RE, type Env } from '../../../_lib/types';

/**
 * Single-item recovery publish. Requires `{ id }`.
 * Bulk / all-remaining is intentionally unsupported — use per-item Approve & post.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
	const { request, env, params } = context;
	if (!passwordConfigured(env)) return setupRequired();
	if (!fixtureMode(env) && !hasQueueBindings(env)) return bindingsRequired();
	if (!(await verifySession(request, env))) return unauthorized();

	const date = String(params.date || '');
	if (!DAY_KEY_RE.test(date)) return badRequest('Invalid date');

	let id = '';
	try {
		const body = (await request.json()) as { id?: string; ids?: string[] };
		if (Array.isArray(body.ids) && body.ids.length > 1) {
			return badRequest('Bulk post disabled — pass a single id');
		}
		if (typeof body.id === 'string') id = body.id;
		else if (Array.isArray(body.ids) && body.ids.length === 1 && typeof body.ids[0] === 'string') {
			id = body.ids[0];
		}
	} catch {
		return badRequest('Expected JSON body with id');
	}
	if (!id) return badRequest('id required (one item only)');

	const result = await approveAndPublishItem(env, date, id);
	if (!result) return notFound('Item not found');

	return json({
		ok: result.published || result.mode === 'agent',
		published: result.published,
		mode: result.mode,
		message: result.message,
		reason: result.reason,
		item: result.item,
		day: enrichDay(result.day),
		publishFailed: Boolean(result.reason && !result.published && result.mode === 'zernio'),
	});
};
