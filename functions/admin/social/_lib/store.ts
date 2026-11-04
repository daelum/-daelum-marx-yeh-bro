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
	item.status = status;
	if (status !== 'failed') delete item.failReason;
	await writeDay(env, day);
	return item;
}

export async function bulkUpdate(
	env: Env,
	date: string,
	action: 'approve_pending' | 'reject_selected',
	ids?: string[],
): Promise<DayManifest | null> {
	const day = await readDay(env, date);
	if (!day) return null;
	if (action === 'approve_pending') {
		for (const item of day.items) {
			if (item.status === 'pending') item.status = 'approved';
		}
	} else if (action === 'reject_selected') {
		const set = new Set(ids ?? []);
		for (const item of day.items) {
			if (set.has(item.id) && item.status !== 'posted') item.status = 'rejected';
		}
	}
	await writeDay(env, day);
	return day;
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
