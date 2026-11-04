import { fixtureMode, passwordConfigured, verifySession } from '../_lib/auth';
import { fixtureSvg } from '../_lib/fixtures';
import { notFound, setupRequired, unauthorized } from '../_lib/responses';
import { mediaKey, type Env } from '../_lib/types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const { request, env, params } = context;
	if (!passwordConfigured(env)) return setupRequired();
	if (!(await verifySession(request, env))) return unauthorized();

	const parts = Array.isArray(params.path)
		? params.path
		: String(params.path || '')
				.split('/')
				.filter(Boolean);

	if (parts.length < 2) return notFound('Bad media path');
	const date = parts[0]!;
	const file = parts.slice(1).join('/');
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return notFound('Bad date');
	if (file.includes('..') || file.startsWith('/')) return notFound('Bad file');

	if (fixtureMode(env)) {
		const svg = fixtureSvg(file.replace(/\.png$/i, ''));
		return new Response(svg, {
			headers: {
				'Content-Type': 'image/svg+xml; charset=utf-8',
				'Cache-Control': 'private, no-store',
			},
		});
	}

	const obj = await env.IG_MEDIA!.get(mediaKey(date, file));
	if (!obj) return notFound('Media not found');

	const headers = new Headers();
	headers.set('Content-Type', obj.httpMetadata?.contentType || 'image/png');
	headers.set('Cache-Control', 'private, max-age=60');
	if (obj.httpEtag) headers.set('ETag', obj.httpEtag);

	return new Response(obj.body, { headers });
};

export const onRequestHead: PagesFunction<Env> = async (context) => {
	const res = await onRequestGet(context);
	return new Response(null, { status: res.status, headers: res.headers });
};
