import { COOKIE_NAME, SESSION_TTL_SECONDS, type Env } from './types';

function b64url(bytes: ArrayBuffer | Uint8Array): string {
	const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
	let s = '';
	for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]!);
	return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
	const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
	const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

async function hmacKey(password: string): Promise<CryptoKey> {
	const enc = new TextEncoder();
	return crypto.subtle.importKey(
		'raw',
		enc.encode(`yb-ig-admin|${password}`),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify'],
	);
}

async function sign(password: string, payload: string): Promise<string> {
	const key = await hmacKey(password);
	const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
	return b64url(sig);
}

export function passwordConfigured(env: Env): boolean {
	return Boolean(env.ADMIN_SOCIAL_PASSWORD && env.ADMIN_SOCIAL_PASSWORD.length > 0);
}

/** True when KV + R2 bindings are present on the Worker env. */
export function hasQueueBindings(env: Env): boolean {
	return Boolean(env.IG_QUEUE && env.IG_MEDIA);
}

/**
 * Explicit fixture only (`ADMIN_SOCIAL_FIXTURE=1`).
 * Missing bindings must NOT silently serve the 7-item sample as a real day —
 * APIs return bindingsRequired instead.
 */
export function fixtureMode(env: Env): boolean {
	return env.ADMIN_SOCIAL_FIXTURE === '1';
}

export async function createSessionCookie(
	password: string,
	opts: { secure?: boolean } = {},
): Promise<string> {
	const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
	const payload = `v1.${exp}`;
	const sig = await sign(password, payload);
	const value = `${payload}.${sig}`;
	const parts = [
		`${COOKIE_NAME}=${value}`,
		'Path=/admin/social',
		'HttpOnly',
		'SameSite=Strict',
		`Max-Age=${SESSION_TTL_SECONDS}`,
	];
	if (opts.secure !== false) parts.push('Secure');
	return parts.join('; ');
}

export function clearSessionCookie(opts: { secure?: boolean } = {}): string {
	const parts = [
		`${COOKIE_NAME}=`,
		'Path=/admin/social',
		'HttpOnly',
		'SameSite=Strict',
		'Max-Age=0',
	];
	if (opts.secure !== false) parts.push('Secure');
	return parts.join('; ');
}

export function requestIsHttps(request: Request): boolean {
	const url = new URL(request.url);
	if (url.protocol === 'https:') return true;
	const proto = request.headers.get('X-Forwarded-Proto');
	return proto === 'https';
}

function parseCookieHeader(header: string | null): Record<string, string> {
	const out: Record<string, string> = {};
	if (!header) return out;
	for (const part of header.split(';')) {
		const idx = part.indexOf('=');
		if (idx < 0) continue;
		const k = part.slice(0, idx).trim();
		const v = part.slice(idx + 1).trim();
		out[k] = v;
	}
	return out;
}

export async function verifySession(request: Request, env: Env): Promise<boolean> {
	const password = env.ADMIN_SOCIAL_PASSWORD;
	if (!password) return false;
	const cookies = parseCookieHeader(request.headers.get('Cookie'));
	const raw = cookies[COOKIE_NAME];
	if (!raw) return false;
	const parts = raw.split('.');
	if (parts.length !== 3 || parts[0] !== 'v1') return false;
	const exp = Number(parts[1]);
	if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
	const payload = `${parts[0]}.${parts[1]}`;
	const expected = await sign(password, payload);
	const a = b64urlDecode(expected);
	const b = b64urlDecode(parts[2]!);
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
	return diff === 0;
}

export function timingSafeEqualString(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}
