import { fixtureMode, passwordConfigured, verifySession } from '../../../_lib/auth';
import { badRequest, json, notFound, setupRequired, unauthorized } from '../../../_lib/responses';
import { enrichDay, readDay, writeDay } from '../../../_lib/store';
import { hasZernio, publishApprovedItem } from '../../../_lib/zernio';
import type { Env } from '../../../_lib/types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const onRequestPost: PagesFunction<Env> = async (context) => {
	const { request, env, params } = context;
	if (!passwordConfigured(env)) return setupRequired();
	if (!(await verifySession(request, env))) return unauthorized();

	const date = String(params.date || '');
	if (!DATE_RE.test(date)) return badRequest('Invalid date');

	const day = await readDay(env, date);
	if (!day) return notFound('Day not found');

	const approved = day.items.filter((i) => i.status === 'approved');
	if (approved.length === 0) {
		return json({ ok: true, posted: 0, message: 'No approved items to post.' });
	}

	// Fixture / missing Zernio: mark as approved (unchanged) and ask agent to post.
	if (fixtureMode(env) || !hasZernio(env)) {
		const stamp = new Date().toISOString();
		day.publishLog = day.publishLog || [];
		day.publishLog.push(
			`${stamp} — synced for agent post (${approved.length} approved). Ask agent: “post approved”.`,
		);
		await writeDay(env, day);
		return json({
			ok: true,
			mode: 'agent',
			posted: 0,
			queued: approved.map((i) => i.id),
			message: 'Synced — ask agent to post (ZERNIO_API_KEY not available on Pages, or fixture mode).',
			day: enrichDay(day),
		});
	}

	const results: { id: string; ok: boolean; reason?: string }[] = [];
	let posted = 0;
	for (const item of approved) {
		const result = await publishApprovedItem(env, date, item);
		if (result.ok) {
			item.status = 'posted';
			item.postedAt = new Date().toISOString();
			item.zernioPostId = result.zernioPostId;
			item.igUrl = result.igUrl;
			posted++;
			day.publishLog = day.publishLog || [];
			day.publishLog.push(
				`${item.postedAt} — ${item.id} posted via admin (zernio ${result.zernioPostId || 'n/a'})`,
			);
			results.push({ id: item.id, ok: true });
		} else {
			results.push({ id: item.id, ok: false, reason: result.reason });
		}
	}
	await writeDay(env, day);

	return json({
		ok: true,
		mode: 'zernio',
		posted,
		results,
		day: enrichDay(day),
	});
};
