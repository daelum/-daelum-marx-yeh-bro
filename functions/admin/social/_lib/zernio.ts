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

function redact(message: string): string {
	// Never include secrets in reason strings surfaced to the UI/logs.
	return message.replace(/Bearer\s+\S+/gi, '[redacted]');
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
			filename: filename.split('/').pop() || filename,
			contentType,
			size: bytes.byteLength,
		}),
	});
	if (status >= 400) {
		const detail = body?.error || body?.message || body?.raw || '';
		throw new Error(
			`Zernio presign failed for ${filename} (HTTP ${status})${detail ? `: ${String(detail).slice(0, 180)}` : ''}`,
		);
	}
	const data = (body as PresignResponse).data ?? body;
	const uploadUrl = data.uploadUrl;
	const publicUrl = data.publicUrl;
	if (!uploadUrl || !publicUrl) {
		throw new Error(`Zernio presign missing uploadUrl/publicUrl for ${filename}`);
	}

	const put = await fetch(uploadUrl, {
		method: 'PUT',
		headers: { 'Content-Type': contentType },
		body: bytes,
	});
	if (!put.ok) {
		throw new Error(`Zernio media upload PUT failed for ${filename} (HTTP ${put.status})`);
	}
	return publicUrl;
}

async function readItemBytes(
	env: Env,
	date: string,
	item: QueueItem,
): Promise<{ filename: string; bytes: ArrayBuffer; contentType: string }[]> {
	const out: { filename: string; bytes: ArrayBuffer; contentType: string }[] = [];
	for (const file of item.files) {
		const key = mediaKey(date, file);
		const obj = await env.IG_MEDIA!.get(key);
		if (!obj) {
			throw new Error(`R2 media missing: ${key} (item ${item.id})`);
		}
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
	if (!apiKey) {
		return {
			ok: false,
			reason: 'ZERNIO_API_KEY unset on Worker — Approve marked approved only; ask agent to post.',
		};
	}

	try {
		if (!item.files?.length) {
			return { ok: false, reason: `Item ${item.id} has no media files` };
		}
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
				reason: redact(
					`Zernio create post failed (HTTP ${status}): ${
						body?.error || body?.message || body?.raw || 'unknown error'
					}`.slice(0, 280),
				),
			};
		}
		const post = body.post || body.data?.post || body;
		const platforms = post.platforms || [];
		const ig = platforms.find((p: any) => p.platform === 'instagram');
		if (ig?.status === 'failed' || post.status === 'failed') {
			return {
				ok: false,
				reason: redact(
					`Instagram publish failed: ${ig?.errorMessage || post?.error || 'publish failed'}`.slice(
						0,
						280,
					),
				),
			};
		}
		return {
			ok: true,
			zernioPostId: post._id || post.id,
			igUrl: ig?.platformPostUrl,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : 'publish error';
		return { ok: false, reason: redact(message).slice(0, 280) };
	}
}

export function hasZernio(env: Env): boolean {
	return Boolean(env.ZERNIO_API_KEY && env.ZERNIO_API_KEY.length > 0);
}
