export function json(data: unknown, init: ResponseInit = {}): Response {
	const headers = new Headers(init.headers);
	headers.set('Content-Type', 'application/json; charset=utf-8');
	headers.set('Cache-Control', 'no-store');
	return new Response(JSON.stringify(data), { ...init, headers });
}

export function text(body: string, init: ResponseInit = {}): Response {
	const headers = new Headers(init.headers);
	headers.set('Content-Type', 'text/plain; charset=utf-8');
	headers.set('Cache-Control', 'no-store');
	return new Response(body, { ...init, headers });
}

export function unauthorized(message = 'Unauthorized'): Response {
	return json({ error: message }, { status: 401 });
}

export function badRequest(message: string): Response {
	return json({ error: message }, { status: 400 });
}

export function notFound(message = 'Not found'): Response {
	return json({ error: message }, { status: 404 });
}

export function setupRequired(): Response {
	return json(
		{
			ok: false,
			setupRequired: true,
			message:
				'ADMIN_SOCIAL_PASSWORD is not set. Add it as a Cloudflare Pages secret, then reload.',
		},
		{ status: 503 },
	);
}

export function bindingsRequired(): Response {
	return json(
		{
			ok: false,
			bindingsRequired: true,
			fixture: false,
			message:
				'IG_QUEUE (KV) and/or IG_MEDIA (R2) are not bound on this Worker. Bind them in wrangler.toml / dashboard and redeploy — live queue will not load until then. For local demo only, open /admin/social?fixture=1.',
		},
		{ status: 503 },
	);
}
