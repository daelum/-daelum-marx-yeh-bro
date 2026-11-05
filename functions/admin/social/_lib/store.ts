import { fixtureDay, fixtureDays, summarize } from './fixtures';
import {
	INDEX_KEY,
	dayKey,
	type DayManifest,
	type DaySummary,
	type Env,
	type ItemStatus,
	type QueueItem,
} from './types';
import { fixtureMode, hasQueueBindings } from './auth';
import { hasZernio, publishApprovedItem } from './zernio';

/** In-memory fixture mutations for the life of an isolate (local demo). */
const fixtureState = new Map<string, DayManifest>();

function cloneDay(day: DayManifest): DayManifest {
	return structuredClone(day);
}

export function getFixtureDayMutable(date: string): DayManifest {
	const existing = fixtureState.get(date);
	if (existing) return existing;
	const day = cloneDay(fixtureDay(date));
	fixtureState.set(date, day);
	return day;
}

export async function listDays(
	env: Env,
): Promise<{ days: DaySummary[]; fixture: boolean; bindingsOk: boolean }> {
	if (fixtureMode(env)) {
		const dates = new Set(fixtureDays().map((d) => d.date));
		for (const key of fixtureState.keys()) dates.add(key);
		const days = [...dates]
			.sort()
			.reverse()
			.map((date) => summarize(getFixtureDayMutable(date)));
		return { days, fixture: true, bindingsOk: hasQueueBindings(env) };
	}

	if (!hasQueueBindings(env)) {
		return { days: [], fixture: false, bindingsOk: false };
	}

	const raw = await env.IG_QUEUE!.get(INDEX_KEY, 'json');
	const index = (Array.isArray(raw) ? raw : []) as string[];
	const days: DaySummary[] = [];
	for (const date of index.sort().reverse()) {
		const day = await readDay(env, date);
		if (day) days.push(summarize(day));
	}
	return { days, fixture: false, bindingsOk: true };
}

export async function readDay(env: Env, date: string): Promise<DayManifest | null> {
	if (fixtureMode(env)) {
		const day = getFixtureDayMutable(date);
		return day.items.length ? day : null;
	}
	if (!hasQueueBindings(env)) return null;
	const data = await env.IG_QUEUE!.get(dayKey(date), 'json');
	return (data as DayManifest | null) ?? null;
}

export async function writeDay(env: Env, day: DayManifest): Promise<void> {
	day.updatedAt = new Date().toISOString();
	if (fixtureMode(env)) {
		fixtureState.set(day.date, day);
		return;
	}
	if (!hasQueueBindings(env)) {
		throw new Error('IG_QUEUE / IG_MEDIA bindings required');
	}
	await env.IG_QUEUE!.put(dayKey(day.date), JSON.stringify(day));
	const raw = await env.IG_QUEUE!.get(INDEX_KEY, 'json');
	const index = new Set((Array.isArray(raw) ? raw : []) as string[]);
	index.add(day.date);
	await env.IG_QUEUE!.put(INDEX_KEY, JSON.stringify([...index].sort()));
}

export async function setItemStatus(
	env: Env,
	date: string,
	id: string,
	status: ItemStatus,
): Promise<QueueItem | null> {
	const day = await readDay(env, date);
	if (!day) return null;
	const item = day.items.find((i) => i.id === id);
	if (!item) return null;
	if (item.status === 'posted') return item;
	item.status = status;
	if (status !== 'failed') delete item.failReason;
	await writeDay(env, day);
	return item;
}

export type ApprovePublishResult = {
	item: QueueItem;
	day: DayManifest;
	published: boolean;
	mode: 'zernio' | 'agent' | 'reject' | 'status';
	message?: string;
	reason?: string;
};

/**
 * Approve one item then publish immediately via Zernio when the key is present.
 * Reject never publishes. On publish failure the item becomes `failed` (retryable).
 */
export async function approveAndPublishItem(
	env: Env,
	date: string,
	id: string,
): Promise<ApprovePublishResult | null> {
	const day = await readDay(env, date);
	if (!day) return null;
	const item = day.items.find((i) => i.id === id);
	if (!item) return null;
	if (item.status === 'posted') {
		return { item, day, published: false, mode: 'status', message: 'Already posted.' };
	}
	if (item.status === 'rejected') {
		return {
			item,
			day,
			published: false,
			mode: 'status',
			message: 'Rejected items are not posted. Clear reject first if needed.',
		};
	}

	item.status = 'approved';
	delete item.failReason;

	if (fixtureMode(env) || !hasZernio(env)) {
		const stamp = new Date().toISOString();
		day.publishLog = day.publishLog || [];
		day.publishLog.push(
			`${stamp} — ${item.id} approved (agent post; ZERNIO_API_KEY unset or fixture).`,
		);
		await writeDay(env, day);
		return {
			item,
			day,
			published: false,
			mode: 'agent',
			message:
				'Approved — ask agent to post (ZERNIO_API_KEY not available on Worker, or fixture mode).',
		};
	}

	const result = await publishApprovedItem(env, date, item);
	if (result.ok) {
		item.status = 'posted';
		item.postedAt = new Date().toISOString();
		item.zernioPostId = result.zernioPostId;
		item.igUrl = result.igUrl;
		delete item.failReason;
		day.publishLog = day.publishLog || [];
		day.publishLog.push(
			`${item.postedAt} — ${item.id} approved & posted via admin (zernio ${result.zernioPostId || 'n/a'})`,
		);
		await writeDay(env, day);
		return { item, day, published: true, mode: 'zernio' };
	}

	item.status = 'failed';
	item.failReason = result.reason;
	day.publishLog = day.publishLog || [];
	day.publishLog.push(
		`${new Date().toISOString()} — ${item.id} approve&post failed: ${result.reason}`,
	);
	await writeDay(env, day);
	return {
		item,
		day,
		published: false,
		mode: 'zernio',
		reason: result.reason,
		message: `Approved but Instagram publish failed: ${result.reason}`,
	};
}

export function itemMediaUrls(date: string, item: QueueItem): string[] {
	return item.files.map(
		(file) => `/admin/social/media/${encodeURIComponent(date)}/${encodeURIComponent(file)}`,
	);
}

export function enrichDay(day: DayManifest) {
	return {
		...day,
		items: day.items.map((item) => ({
			...item,
			mediaUrls: itemMediaUrls(day.date, item),
		})),
	};
}
