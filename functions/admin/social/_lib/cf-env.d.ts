/** Minimal Cloudflare Pages Function typings (bindings stubs — no secret values). */

interface KVNamespace {
	get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<any>;
	put(key: string, value: string | ArrayBuffer | ReadableStream, options?: unknown): Promise<void>;
	delete(key: string): Promise<void>;
}

interface R2ObjectBody {
	body: ReadableStream;
	arrayBuffer(): Promise<ArrayBuffer>;
	httpMetadata?: { contentType?: string };
	httpEtag?: string;
}

interface R2Bucket {
	get(key: string): Promise<R2ObjectBody | null>;
	put(key: string, value: ArrayBuffer | Uint8Array | string | ReadableStream, options?: unknown): Promise<unknown>;
}

interface EventContext<Env, Params extends string, Data> {
	request: Request;
	env: Env;
	params: Record<Params, string | string[]>;
	data: Data;
	next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
	waitUntil: (promise: Promise<unknown>) => void;
}

declare type PagesFunction<
	Env = unknown,
	Params extends string = string,
	Data extends Record<string, unknown> = Record<string, unknown>,
> = (context: EventContext<Env, Params, Data>) => Response | Promise<Response>;
