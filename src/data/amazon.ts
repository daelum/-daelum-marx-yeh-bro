/**
 * Amazon Associates AU — single tag source.
 *
 * Tracking ID (Human): **yehbro-22**
 * Every `*-amz` /go/ deep link uses `tag=` from `AMZ_ASSOCIATE_TAG` below.
 *
 * Override at build time with env `PUBLIC_AMZ_ASSOCIATE_TAG` if needed
 * (e.g. staging). Default is the live Associates tag.
 *
 * Prefer `amzAuAsinUrl(ASIN)` for founder-pasted SiteStripe picks; keep
 * `amzAuSearchUrl` for category browse until an ASIN is locked.
 */

/** Historical placeholder — kept so old docs still resolve “not ready” checks. */
export const AMZ_TAG_PLACEHOLDER = 'YEHBRO_AMZ_TAG';

/** Live Associates tracking ID baked into all Amazon AU `tag=` params. */
export const AMZ_TAG_DEFAULT = 'yehbro-22';

/**
 * Associates tracking ID used in every Amazon AU `tag=` param.
 * Env overrides the default so deploys can swap without a code edit.
 */
export const AMZ_ASSOCIATE_TAG: string = (() => {
	const env = import.meta.env as { PUBLIC_AMZ_ASSOCIATE_TAG?: string } | undefined;
	const fromEnv =
		env && typeof env.PUBLIC_AMZ_ASSOCIATE_TAG === 'string'
			? env.PUBLIC_AMZ_ASSOCIATE_TAG.trim()
			: '';
	return fromEnv || AMZ_TAG_DEFAULT;
})();

/** True when tag is a real Associates ID (not the old placeholder). */
export const AMZ_ASSOCIATES_READY =
	AMZ_ASSOCIATE_TAG.length > 0 && AMZ_ASSOCIATE_TAG !== AMZ_TAG_PLACEHOLDER;

const AMZ_AU_ORIGIN = 'https://www.amazon.com.au';

/**
 * Amazon AU keyword search deep link with Associates tag.
 * Prefer swapping to `/dp/{ASIN}?tag=` via intake when Ops picks a SKU.
 */
export function amzAuSearchUrl(keywords: string): string {
	const url = new URL(`${AMZ_AU_ORIGIN}/s`);
	url.searchParams.set('k', keywords);
	url.searchParams.set('tag', AMZ_ASSOCIATE_TAG);
	return url.toString();
}

/**
 * Amazon AU ASIN deep link (`/dp/{ASIN}?tag=`).
 * Use for SiteStripe / Product Linker pastes in `affiliates.ts`.
 */
export function amzAuAsinUrl(asin: string): string {
	const url = new URL(`${AMZ_AU_ORIGIN}/dp/${encodeURIComponent(asin)}`);
	url.searchParams.set('tag', AMZ_ASSOCIATE_TAG);
	return url.toString();
}
