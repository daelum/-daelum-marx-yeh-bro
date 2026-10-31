/**
 * Yeh Bro affiliate map — phase-1 seed from Context docs/affiliate.
 * Amazon AU (`*-amz`): real amazon.com.au search deep links; tag from
 * `src/data/amazon.ts` (`PUBLIC_AMZ_ASSOCIATE_TAG` or `YEHBRO_AMZ_TAG` fallback).
 * Other networks: keep TODO stubs until Ops pastes approved deep links.
 * Source: docs/affiliate/go-slug-map.md + affiliates-ts-seed.md
 * Deprecated aliases: docs/affiliate/slug-changelog.md — do not add keys for those.
 */

import { AMZ_ASSOCIATES_READY, amzAuSearchUrl } from './amazon';

export const AFFILIATE_REL = 'sponsored noopener noreferrer';

export type AffiliateNetwork =
	| 'amazon'
	| 'awin'
	| 'commission-factory'
	| 'direct'
	| 'referral'
	| 'brandchamp'
	| 'multi-network';

export type AffiliateEntry = {
	slug: string;
	label: string;
	/** Network deep link when approved — never invent merchant URLs for non-Amazon */
	url: string;
	network: AffiliateNetwork;
	notes: string;
	/**
	 * When false, `/go/{slug}` shows a soft pending page (no merchant hop).
	 * Amazon rows flip true when `AMZ_ASSOCIATES_READY` (one tag paste → all).
	 */
	active: boolean;
	/**
	 * `search` = category/keyword browse Ops can swap for ASIN via intake.
	 * `asin-needed` = same for now; Ops should prefer SiteStripe ASIN when ready.
	 * `todo` = non-Amazon stub awaiting network approval.
	 */
	linkKind: 'search' | 'asin-needed' | 'todo';
};

function amzEntry(
	partial: Omit<AffiliateEntry, 'network' | 'active' | 'url'> & {
		keywords: string;
		url?: string;
	},
): AffiliateEntry {
	const { keywords, url, ...rest } = partial;
	return {
		...rest,
		url: url ?? amzAuSearchUrl(keywords),
		network: 'amazon',
		active: AMZ_ASSOCIATES_READY,
	};
}

export const affiliates: AffiliateEntry[] = [
	// —— Amazon AU (legal sports nutrition + basic gear only; no AAS/SARMs/PCT) ——
	amzEntry({
		slug: 'creatine-amz',
		label: 'Creatine — Amazon AU',
		keywords: 'creatine monohydrate',
		linkKind: 'asin-needed',
		notes:
			'Primary Amazon Associates AU CTA. Search deep link until SiteStripe ASIN for a mono pick. Verify Sports & Outdoors vs Health fee schedule.',
	}),
	amzEntry({
		slug: 'creatine-amz-mono',
		label: 'Creatine mono — Amazon AU',
		keywords: 'creatine monohydrate powder',
		linkKind: 'asin-needed',
		notes:
			'Explicit mono vs blended Amazon browse. Prefer ASIN swap when Ops locks a Creapure or generic mono SKU.',
	}),
	amzEntry({
		slug: 'protein-amz',
		label: 'Protein / whey — Amazon AU',
		keywords: 'whey protein powder',
		linkKind: 'asin-needed',
		notes:
			'Whey/protein discovery backup. Brand paths (protein-true / protein-bulk) stay primary editorial CTAs.',
	}),
	amzEntry({
		slug: 'pre-amz',
		label: 'Pre-workout — Amazon AU',
		keywords: 'pre workout',
		linkKind: 'search',
		notes:
			'Stim pre browse. Prefer open-label panels; disclose caffeine. ASIN optional once a labelled pick is locked.',
	}),
	amzEntry({
		slug: 'pre-amz-stimfree',
		label: 'Stim-free pre — Amazon AU',
		keywords: 'stim free pre workout',
		linkKind: 'search',
		notes:
			'Stim-free / caffeine-free pre browse for evening sessions. Pair with stim-free guide; no disease claims.',
	}),
	amzEntry({
		slug: 'mag-amz',
		label: 'Magnesium — Amazon AU',
		keywords: 'magnesium glycinate',
		linkKind: 'asin-needed',
		notes:
			'Optional basics. Prefer clear elemental Mg on panel. iHerb path remains mag-iherb. No sleep/cure claims.',
	}),
	amzEntry({
		slug: 'omega-amz',
		label: 'Omega-3 — Amazon AU',
		keywords: 'omega 3 fish oil EPA DHA',
		linkKind: 'asin-needed',
		notes:
			'Optional basics. Judge EPA+DHA per serve. Sibling: omega-iherb. No cardio-cure claims.',
	}),
	amzEntry({
		slug: 'vitd-amz',
		label: 'Vitamin D — Amazon AU',
		keywords: 'vitamin D3',
		linkKind: 'asin-needed',
		notes:
			'Conservative micronutrient browse only. Clinician-first for status/testing. No disease or hormone claims.',
	}),
	amzEntry({
		slug: 'shaker-amz',
		label: 'Shaker bottle — Amazon AU',
		keywords: 'protein shaker bottle',
		linkKind: 'search',
		notes: 'Useful lifter accessory. Low-claim gear CTA; ASIN optional.',
	}),
	amzEntry({
		slug: 'bands-amz',
		label: 'Resistance bands — Amazon AU',
		keywords: 'resistance bands set',
		linkKind: 'search',
		notes: 'Basic gym accessory browse. No miracle-transformation framing.',
	}),

	// —— Non-Amazon phase-1 seeds (TODO until network approval) ——
	{
		slug: 'creatine-bulk',
		label: 'Creatine — Bulk Nutrients',
		url: 'https://example.com/TODO/creatine-bulk',
		network: 'referral',
		active: false,
		linkKind: 'todo',
		notes:
			'Referral/ambassador only until a cash program exists — activate only if T&Cs allow content use; no invented CPA %.',
	},
	{
		slug: 'creatine-true',
		label: 'Creatine — True Protein',
		url: 'https://example.com/TODO/creatine-true',
		network: 'commission-factory',
		active: false,
		linkKind: 'todo',
		notes: 'CF advertiser deep link after True Protein join; pair with protein-true in creatine guides.',
	},
	{
		slug: 'protein-true',
		label: 'Protein — True Protein',
		url: 'https://example.com/TODO/protein-true',
		network: 'commission-factory',
		active: false,
		linkKind: 'todo',
		notes: 'Primary CF True Protein CTA (flagship whey/WPI). Default protein slug for pillars.',
	},
	{
		slug: 'protein-bulk',
		label: 'Protein — Bulk Nutrients',
		url: 'https://example.com/TODO/protein-bulk',
		network: 'referral',
		active: false,
		linkKind: 'todo',
		notes: 'Same referral constraint as creatine-bulk; keep stub for content continuity.',
	},
	{
		slug: 'protein-mn',
		label: 'Protein — Muscle Nation',
		url: 'https://example.com/TODO/protein-mn',
		network: 'direct',
		active: false,
		linkKind: 'todo',
		notes: 'Growi / Muscle Nation direct affiliate link when approved.',
	},
	{
		slug: 'protein-sm',
		label: 'Protein — Supplement Mart',
		url: 'https://example.com/TODO/protein-sm',
		network: 'commission-factory',
		active: false,
		linkKind: 'todo',
		notes:
			'Prefer one path: CF or BrandChamp — if BrandChamp wins, change network to brandchamp; do not dual-attribute.',
	},
	{
		slug: 'protein-mypro',
		label: 'Protein — Myprotein AU',
		url: 'https://example.com/TODO/protein-mypro',
		network: 'awin',
		active: false,
		linkKind: 'todo',
		notes: 'Awin Myprotein AU deep link after publisher + advertiser approval.',
	},
	{
		slug: 'pre-mn',
		label: 'Pre-workout — Muscle Nation',
		url: 'https://example.com/TODO/pre-mn',
		network: 'direct',
		active: false,
		linkKind: 'todo',
		notes: 'MN pre CTA; disclose stimulants; open-label preference in copy.',
	},
	{
		slug: 'pre-sm',
		label: 'Pre-workout — Supplement Mart',
		url: 'https://example.com/TODO/pre-sm',
		network: 'commission-factory',
		active: false,
		linkKind: 'todo',
		notes: 'Retailer pre pick; same single-path rule as protein-sm.',
	},
	{
		slug: 'stack-beginner-sm',
		label: 'Beginner stack — Supplement Mart',
		url: 'https://example.com/TODO/stack-beginner-sm',
		network: 'commission-factory',
		active: false,
		linkKind: 'todo',
		notes: 'Shopping-list / category deep link for beginner stack guide.',
	},
	{
		slug: 'omega-iherb',
		label: 'Omega-3 — iHerb',
		url: 'https://example.com/TODO/omega-iherb',
		network: 'multi-network',
		active: false,
		linkKind: 'todo',
		notes: 'Confirm Partnerize/Awin/CJ/Impact path; disclose AU shipping/duties in copy.',
	},
	{
		slug: 'mag-iherb',
		label: 'Magnesium — iHerb',
		url: 'https://example.com/TODO/mag-iherb',
		network: 'multi-network',
		active: false,
		linkKind: 'todo',
		notes: 'Same network path as omega-iherb once iHerb affiliate is live.',
	},
];

export const affiliatesBySlug = Object.fromEntries(
	affiliates.map((a) => [a.slug, a]),
) as Record<string, AffiliateEntry>;

/** Lookup by slug. Unknown → undefined (host/route 404). */
export function getAffiliate(slug: string): AffiliateEntry | undefined {
	return affiliatesBySlug[slug];
}

/** Amazon AU seed slugs (legal products / accessories only). */
export const AMAZON_AU_SLUGS = affiliates
	.filter((a) => a.network === 'amazon')
	.map((a) => a.slug);
