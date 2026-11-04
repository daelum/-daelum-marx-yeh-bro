import { mediaKey, ZERNIO_ACCOUNT_ID, ZERNIO_API_BASE, type Env, type QueueItem } from './types';

interface PresignResponse {
	uploadUrl?: string;
	publicUrl?: string;
	data?: { uploadUrl?: string; publicUrl?: string };
}

async function zernioFetch(
	apiKey: string,
	path: string,
	init: RequestInit = {},
): Promise<{ status: number; body: any }> {
	const headers = new Headers(init.headers);
	headers.set('Authorization', `Bearer ${apiKey}`);
	headers.set('Accept', 'application/json');
	if (init.body && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}
	const res = await fetch(`${ZERNIO_API_BASE}${path}`, { ...init, headers });
	const text = await res.text();
	let body: any = {};
	try {
		body = text ? JSON.parse(text) : {};
	} catch {
		body = { raw: text.slice(0, 400) };
	}
	return { status: res.status, body };
}

async function uploadBytes(
	apiKey: string,
	filename: string,
	bytes: ArrayBuffer,
	contentType: string,
): Promise<string> {
	const { status, body } = await zernioFetch(apiKey, '/media/presign', {
		method: 'POST',
		body: JSON.stringify({
			filename,
			contentType,
			size: bytes.byteLength,
		}),
	});
	if (status >= 400) {
		throw new Error(`presign failed (${status})`);
	}
	const data = (body as PresignResponse).data ?? body;
	const uploadUrl = data.uploadUrl;
	const publicUrl = data.publicUrl;
	if (!uploadUrl || !publicUrl) throw new Error('presign missing urls');

	const put = await fetch(uploadUrl, {
		method: 'PUT',
		headers: { 'Content-Type': contentType },
		body: bytes,
	});
	if (!put.ok) throw new Error(`upload PUT failed (${put.status})`);
	return publicUrl;
}

async function readItemBytes(
	env: Env,
	date: string,
	item: QueueItem,
): Promise<{ filename: string; bytes: ArrayBuffer; contentType: string }[]> {
	const out: { filename: string; bytes: ArrayBuffer; contentType: string }[] = [];
	for (const file of item.files) {
		const obj = await env.IG_MEDIA!.get(mediaKey(date, file));
		if (!obj) throw new Error(`missing media ${file}`);
		const bytes = await obj.arrayBuffer();
		out.push({
			filename: file,
			bytes,
			contentType: obj.httpMetadata?.contentType || 'image/png',
		});
	}
	return out;
}

export async function publishApprovedItem(
	env: Env,
	date: string,
	item: QueueItem,
): Promise<{ ok: true; zernioPostId?: string; igUrl?: string } | { ok: false; reason: string }> {
	const apiKey = env.ZERNIO_API_KEY;
	if (!apiKey) return { ok: false, reason: 'ZERNIO_API_KEY unset' };

	try {
		const files = await readItemBytes(env, date, item);
		const publicUrls: string[] = [];
		for (const f of files) {
			publicUrls.push(await uploadBytes(apiKey, f.filename, f.bytes, f.contentType));
		}
		const mediaItems = publicUrls.map((url) => ({ type: 'image', url }));
		const { status, body } = await zernioFetch(apiKey, '/posts', {
			method: 'POST',
			body: JSON.stringify({
				content: item.caption,
				mediaItems,
				platforms: [{ platform: 'instagram', accountId: ZERNIO_ACCOUNT_ID }],
				publishNow: true,
				timezone: 'Australia/Sydney',
				tags: ['yehbro-queue', `admin-${date}-${item.id}`],
			}),
		});
		if (status >= 400) {
			return {
				ok: false,
				reason: body?.error || body?.message || `HTTP ${status}`,
			};
		}
		const post = body.post || body.data?.post || body;
		const platforms = post.platforms || [];
		const ig = platforms.find((p: any) => p.platform === 'instagram');
		if (ig?.status === 'failed' || post.status === 'failed') {
			return { ok: false, reason: ig?.errorMessage || 'publish failed' };
		}
		return {
			ok: true,
			zernioPostId: post._id || post.id,
			igUrl: ig?.platformPostUrl,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : 'publish error';
		// Never include secrets in reason strings.
		return { ok: false, reason: message.replace(/Bearer\s+\S+/gi, '[redacted]') };
	}
}

export function hasZernio(env: Env): boolean {
	return Boolean(env.ZERNIO_API_KEY && env.ZERNIO_API_KEY.length > 0);
}
