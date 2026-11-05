import { fixtureMode, hasQueueBindings, passwordConfigured, verifySession } from '../../../_lib/auth';
import {
	badRequest,
	bindingsRequired,
	setupRequired,
	unauthorized,
} from '../../../_lib/responses';
import { DAY_KEY_RE, type Env } from '../../../_lib/types';

/**
 * Bulk approve / multi-post shortcuts removed by founder request.
 * Use per-item Approve & post (PATCH) or Reject (PATCH).
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
	const { request, env, params } = context;
	if (!passwordConfigured(env)) return setupRequired();
	if (!fixtureMode(env) && !hasQueueBindings(env)) return bindingsRequired();
	if (!(await verifySession(request, env))) return unauthorized();

	const date = String(params.date || '');
	if (!DAY_KEY_RE.test(date)) return badRequest('Invalid date');

	return badRequest(
		'Bulk approve/post disabled — approve or reject one item at a time (PATCH /days/:date)',
	);
};
