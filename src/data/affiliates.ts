/**
 * Yeh Bro affiliate map — phase-1 seed from Context docs/affiliate.
 * Replace url TODOs only with real tagged/deep links after approval.
 * Source: docs/affiliate/go-slug-map.md + affiliates-ts-seed.md
 * Deprecated aliases: docs/affiliate/slug-changelog.md — do not add keys for those.
 */

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
	/** Network deep link when approved — never invent; keep TODO until then */
	url: string;
	network: AffiliateNetwork;
	notes: string;
};

export const affiliates: AffiliateEntry[] = [
	{
		slug: 'creatine-amz',
		label: 'Creatine — Amazon AU',
		url: 'https://example.com/TODO/creatine-amz',
		network: 'amazon',
		notes:
			'Amazon Associates AU mono pick; verify Sports & Outdoors vs Health fee schedule before relying on margin.',
	},
	{
		slug: 'creatine-bulk',
		label: 'Creatine — Bulk Nutrients',
		url: 'https://example.com/TODO/creatine-bulk',
		network: 'referral',
		notes:
			'Referral/ambassador only until a cash program exists — activate only if T&Cs allow content use; no invented CPA %.',
	},
	{
		slug: 'creatine-true',
		label: 'Creatine — True Protein',
		url: 'https://example.com/TODO/creatine-true',
		network: 'commission-factory',
		notes: 'CF advertiser deep link after True Protein join; pair with protein-true in creatine guides.',
	},
	{
		slug: 'protein-true',
		label: 'Protein — True Protein',
		url: 'https://example.com/TODO/protein-true',
		network: 'commission-factory',
		notes: 'Primary CF True Protein CTA (flagship whey/WPI). Default protein slug for pillars.',
	},
	{
		slug: 'protein-bulk',
		label: 'Protein — Bulk Nutrients',
		url: 'https://example.com/TODO/protein-bulk',
		network: 'referral',
		notes: 'Same referral constraint as creatine-bulk; keep stub for content continuity.',
	},
	{
		slug: 'protein-mn',
		label: 'Protein — Muscle Nation',
		url: 'https://example.com/TODO/protein-mn',
		network: 'direct',
		notes: 'Growi / Muscle Nation direct affiliate link when approved.',
	},
	{
		slug: 'protein-sm',
		label: 'Protein — Supplement Mart',
		url: 'https://example.com/TODO/protein-sm',
		network: 'commission-factory',
		notes:
			'Prefer one path: CF or BrandChamp — if BrandChamp wins, change network to brandchamp; do not dual-attribute.',
	},
	{
		slug: 'protein-mypro',
		label: 'Protein — Myprotein AU',
		url: 'https://example.com/TODO/protein-mypro',
		network: 'awin',
		notes: 'Awin Myprotein AU deep link after publisher + advertiser approval.',
	},
	{
		slug: 'pre-mn',
		label: 'Pre-workout — Muscle Nation',
		url: 'https://example.com/TODO/pre-mn',
		network: 'direct',
		notes: 'MN pre CTA; disclose stimulants; open-label preference in copy.',
	},
	{
		slug: 'pre-sm',
		label: 'Pre-workout — Supplement Mart',
		url: 'https://example.com/TODO/pre-sm',
		network: 'commission-factory',
		notes: 'Retailer pre pick; same single-path rule as protein-sm.',
	},
	{
		slug: 'stack-beginner-sm',
		label: 'Beginner stack — Supplement Mart',
		url: 'https://example.com/TODO/stack-beginner-sm',
		network: 'commission-factory',
		notes: 'Shopping-list / category deep link for beginner stack guide.',
	},
	{
		slug: 'omega-iherb',
		label: 'Omega-3 — iHerb',
		url: 'https://example.com/TODO/omega-iherb',
		network: 'multi-network',
		notes: 'Confirm Partnerize/Awin/CJ/Impact path; disclose AU shipping/duties in copy.',
	},
	{
		slug: 'mag-iherb',
		label: 'Magnesium — iHerb',
		url: 'https://example.com/TODO/mag-iherb',
		network: 'multi-network',
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
