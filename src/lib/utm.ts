/** UTM keys we forward from /go landing query → retailer URL. */
export const UTM_KEYS = [
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_content',
	'utm_term',
] as const;

/**
 * Append inbound UTM params onto a destination URL without overwriting
 * params the affiliate network already set.
 */
export function appendUtmParams(
	destination: string,
	incoming: URLSearchParams | Record<string, string | undefined>,
): string {
	let url: URL;
	try {
		url = new URL(destination);
	} catch {
		return destination;
	}

	const get =
		incoming instanceof URLSearchParams
			? (k: string) => incoming.get(k)
			: (k: string) => incoming[k] ?? null;

	for (const key of UTM_KEYS) {
		const value = get(key);
		if (value && !url.searchParams.has(key)) {
			url.searchParams.set(key, value);
		}
	}
	return url.toString();
}
