/** Shared types for /admin/social Pages Functions. */

export type ItemStatus = 'pending' | 'approved' | 'rejected' | 'posted' | 'failed';

export type ItemKind = 'single' | 'carousel';

export interface QueueItem {
	id: string;
	kind: ItemKind;
	status: ItemStatus;
	caption: string;
	angle?: string;
	/** R2 object keys relative to day, e.g. ["01.png"] or ["c01-1.png", ...] */
	files: string[];
	slides?: string[];
	failReason?: string;
	postedAt?: string;
	zernioPostId?: string;
	igUrl?: string;
}

export interface DayManifest {
	date: string;
	account: string;
	updatedAt: string;
	items: QueueItem[];
	publishLog?: string[];
}

export interface DaySummary {
	date: string;
	pending: number;
	approved: number;
	rejected: number;
	posted: number;
	failed: number;
	total: number;
}

export interface Env {
	IG_QUEUE?: KVNamespace;
	IG_MEDIA?: R2Bucket;
	ADMIN_SOCIAL_PASSWORD?: string;
	ZERNIO_API_KEY?: string;
	/** When "1", serve fixture data even if bindings exist (local demo). */
	ADMIN_SOCIAL_FIXTURE?: string;
}

export const COOKIE_NAME = 'yb_ig_admin';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
export const ZERNIO_ACCOUNT_ID = '6aeb1fe121bff1684d110b8e';
export const ZERNIO_ACCOUNT_HANDLE = 'theyehbro';
export const ZERNIO_API_BASE = 'https://zernio.com/api/v1';
export const INDEX_KEY = 'index:days';
export const dayKey = (date: string) => `day:${date}`;
export const mediaKey = (date: string, file: string) => `${date}/${file}`;
