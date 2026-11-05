import { fixtureDay, fixtureDays, summarize } from './fixtures';
import {
	INDEX_KEY,
	POOL_KEY,
	REFILL_NEEDED_KEY,
	dayKey,
	mediaKey,
	type DayManifest,
	type DaySummary,
	type Env,
	type ItemStatus,
	type QueueItem,
	type RefillPool,
} from './types';
import { fixtureMode, hasQueueBindings } from './auth';
import { hasZernio, publishApprovedItem } from './zernio';

/** In-memory fixture mutations for the life of an isolate (local demo). */
const fixtureState = new Map<string, DayManifest>();
const fixturePool: RefillPool = { updatedAt: new Date(0).toISOString(), items: [] };
let fixtureRefillNeeded = false;

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

export async function readPool(env: Env): Promise<RefillPool> {
	if (fixtureMode(env)) {
		return {
			updatedAt: fixturePool.updatedAt,
			items: fixturePool.items.map((i) => structuredClone(i)),
		};
	}
	if (!hasQueueBindings(env)) return { updatedAt: new Date(0).toISOString(), items: [] };
	const data = (await env.IG_QUEUE!.get(POOL_KEY, 'json')) as RefillPool | null;
	if (!data || !Array.isArray(data.items)) {
		return { updatedAt: new Date(0).toISOString(), items: [] };
	}
	return data;
}

export async function writePool(env: Env, pool: RefillPool): Promise<void> {
	pool.updatedAt = new Date().toISOString();
	if (fixtureMode(env)) {
		fixturePool.updatedAt = pool.updatedAt;
		fixturePool.items = pool.items.map((i) => structuredClone(i));
		return;
	}
	if (!hasQueueBindings(env)) throw new Error('IG_QUEUE / IG_MEDIA bindings required');
	await env.IG_QUEUE!.put(POOL_KEY, JSON.stringify(pool));
}

export async function isRefillNeeded(env: Env): Promise<boolean> {
	if (fixtureMode(env)) return fixtureRefillNeeded;
	if (!hasQueueBindings(env)) return false;
	const raw = await env.IG_QUEUE!.get(REFILL_NEEDED_KEY);
	return raw === '1' || raw === 'true';
}

export async function setRefillNeeded(env: Env, needed: boolean): Promise<void> {
	if (fixtureMode(env)) {
		fixtureRefillNeeded = needed;
		return;
	}
	if (!hasQueueBindings(env)) return;
	if (needed) await env.IG_QUEUE!.put(REFILL_NEEDED_KEY, '1');
	else await env.IG_QUEUE!.delete(REFILL_NEEDED_KEY);
}

function nextRefillId(day: DayManifest, kind: QueueItem['kind']): string {
	const prefix = kind === 'carousel' ? 'RC' : 'R';
	let max = 0;
	for (const item of day.items) {
		const m = item.id.match(new RegExp(`^${prefix}(\\d+)$`, 'i'));
		if (m) max = Math.max(max, Number(m[1]));
	}
	return `${prefix}${String(max + 1).padStart(2, '0')}`;
}

export type RejectRefillResult = {
	item: QueueItem;
	day: DayManifest;
	replaced: boolean;
	replacement?: QueueItem;
	poolRemaining: number;
	refillNeeded: boolean;
	message?: string;
};

/**
 * Reject one item, then append the next refill-pool item at the bottom of the
 * current day queue (constant pending supply). Reject never publishes.
 */
export async function rejectAndRefill(
	env: Env,
	date: string,
	id: string,
): Promise<RejectRefillResult | null> {
	const day = await readDay(env, date);
	if (!day) return null;
	const item = day.items.find((i) => i.id === id);
	if (!item) return null;
	if (item.status === 'posted') {
		return {
			item,
			day,
			replaced: false,
			poolRemaining: (await readPool(env)).items.length,
			refillNeeded: await isRefillNeeded(env),
			message: 'Already posted — cannot reject.',
		};
	}
	if (item.status === 'rejected') {
		const pool = await readPool(env);
		return {
			item,
			day,
			replaced: false,
			poolRemaining: pool.items.length,
			refillNeeded: await isRefillNeeded(env),
			message: 'Already rejected.',
		};
	}

	item.status = 'rejected';
	delete item.failReason;

	const pool = await readPool(env);
	const next = pool.items.shift();
	let replacement: QueueItem | undefined;
	let replaced = false;
	let refillNeeded = false;
	let message: string | undefined;

	if (next) {
		replacement = {
			...structuredClone(next),
			id: nextRefillId(day, next.kind),
			status: 'pending',
		};
		delete replacement.failReason;
		delete replacement.postedAt;
		delete replacement.zernioPostId;
		delete replacement.igUrl;
		day.items.push(replacement);
		replaced = true;
		await writePool(env, pool);
		if (pool.items.length === 0) {
			refillNeeded = true;
			await setRefillNeeded(env, true);
			message = `Rejected ${item.id}; appended ${replacement.id} from refill pool. Pool now empty — generating more.`;
		} else {
			await setRefillNeeded(env, false);
			message = `Rejected ${item.id}; appended ${replacement.id} from refill pool (${pool.items.length} left).`;
		}
	} else {
		refillNeeded = true;
		await setRefillNeeded(env, true);
		message = `Rejected ${item.id}. Refill pool empty — generating more.`;
	}

	day.publishLog = day.publishLog || [];
	day.publishLog.push(
		`${new Date().toISOString()} — ${item.id} rejected` +
			(replacement ? `; refilled ${replacement.id}` : '; pool empty'),
	);
	await writeDay(env, day);

	return {
		item,
		day,
		replaced,
		replacement,
		poolRemaining: pool.items.length,
		refillNeeded,
		message,
	};
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
	return item.files.map((file) => {
		const key = mediaKey(date, file);
		return `/admin/social/media/${key.split('/').map(encodeURIComponent).join('/')}`;
	});
}

export async function poolSummary(env: Env): Promise<{
	remaining: number;
	refillNeeded: boolean;
	updatedAt?: string;
}> {
	const pool = await readPool(env);
	return {
		remaining: pool.items.length,
		refillNeeded: await isRefillNeeded(env),
		updatedAt: pool.updatedAt,
	};
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
