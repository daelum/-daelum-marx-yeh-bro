/**
 * Yeh Bro affiliate map — phase-1 seed from Context docs/affiliate.
 * Amazon AU (`*-amz`): amazon.com.au search or `/dp/{ASIN}` deep links; tag from
 * `src/data/amazon.ts` (`PUBLIC_AMZ_ASSOCIATE_TAG` or `YEHBRO_AMZ_TAG` fallback).
 * Other networks: keep TODO stubs until Ops pastes approved deep links.
 * Source: docs/affiliate/go-slug-map.md + affiliates-ts-seed.md
 * Deprecated aliases: docs/affiliate/slug-changelog.md — do not add keys for those.
 */

import { AMZ_ASSOCIATES_READY, amzAuAsinUrl, amzAuSearchUrl } from './amazon';

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
	 * `asin` = live `/dp/{ASIN}?tag=` deep link.
	 * `search` = category/keyword browse Ops can swap for ASIN via intake.
	 * `asin-needed` = search for now; Ops should prefer SiteStripe ASIN when ready.
	 * `todo` = non-Amazon stub awaiting network approval.
	 */
	linkKind: 'asin' | 'search' | 'asin-needed' | 'todo';
};

/** Founder SiteStripe pastes (Amazon AU · tag yehbro-22). */
const ASIN_CREATINE_MN_MONO = 'B0D47CJPPC';
const ASIN_PROTEIN_MN_WPI = 'B0DJ53C7GV';
const ASIN_OXYSHRED_NONSTIM = 'B07WTPM5YN';
const ASIN_MAG_GLYCINATE = 'B0F3C9LKNJ';
const ASIN_SHAKER_VOLTRX = 'B0C7GWGLWV';
const ASIN_ENDOFDAYZ_PRE = 'B0DPJFGYGG';
const ASIN_VITD_D3 = 'B00IDDQBF4';
const ASIN_GARLIC_EXTRACT = 'B0D1LTM2KC';
const ASIN_CHROMIUM_PIC = 'B00URYHOI0';
const ASIN_OMEGA_FISH_OIL = 'B0773JF7JX';
const ASIN_K2_MK7 = 'B00N0YRR2C';
const ASIN_CREATINE_GUMMIES = 'B0H9RD7M5X';
const ASIN_OXYSHRED_ENERGY = 'B0DMMTLMYZ';

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
		url: amzAuAsinUrl(ASIN_CREATINE_MN_MONO),
		linkKind: 'asin',
		notes:
			'Muscle Nation Unflavoured Creatine Monohydrate 225g · ASIN B0D47CJPPC. Primary Amazon creatine CTA. Sibling mono alias: creatine-amz-mono.',
	}),
	amzEntry({
		slug: 'creatine-amz-mono',
		label: 'Creatine mono — Amazon AU',
		keywords: 'creatine monohydrate powder',
		url: amzAuAsinUrl(ASIN_CREATINE_MN_MONO),
		linkKind: 'asin',
		notes:
			'Same MN unflavoured mono ASIN as creatine-amz (B0D47CJPPC). Explicit mono CTA for guides that want the -mono slug.',
	}),
	amzEntry({
		slug: 'creatine-amz-gummies',
		label: 'Creatine gummies — Amazon AU',
		keywords: 'creatine gummies',
		url: amzAuAsinUrl(ASIN_CREATINE_GUMMIES),
		linkKind: 'asin',
		notes:
			'OxyShred Creatine Gummies Strawberry · ~3g creatine/serving · ASIN B0H9RD7M5X. Convenience format only — do not overwrite creatine-amz powder. Alias: oxyshred-creatine-gummies-amz. Daily mono powder remains default economics.',
	}),
	amzEntry({
		slug: 'oxyshred-creatine-gummies-amz',
		label: 'OxyShred creatine gummies — Amazon AU',
		keywords: 'oxyshred creatine gummies',
		url: amzAuAsinUrl(ASIN_CREATINE_GUMMIES),
		linkKind: 'asin',
		notes:
			'Same OxyShred Creatine Gummies ASIN as creatine-amz-gummies (B0H9RD7M5X). Brand-style alias; powder mono stays on creatine-amz.',
	}),
	amzEntry({
		slug: 'protein-amz',
		label: 'Protein / whey — Amazon AU',
		keywords: 'whey protein powder',
		url: amzAuAsinUrl(ASIN_PROTEIN_MN_WPI),
		linkKind: 'asin',
		notes:
			'Muscle Nation Vanilla Ice Cream Whey Protein Isolate 990g · ASIN B0DJ53C7GV. Amazon whey CTA; brand paths (protein-true / protein-bulk) stay primary editorial when live.',
	}),
	amzEntry({
		slug: 'protein-amz-isolate',
		label: 'Whey isolate — Amazon AU',
		keywords: 'whey protein isolate',
		url: amzAuAsinUrl(ASIN_PROTEIN_MN_WPI),
		linkKind: 'asin',
		notes:
			'Same MN Vanilla Ice Cream WPI ASIN as protein-amz (B0DJ53C7GV). Explicit isolate CTA (lactose / WPI guides).',
	}),
	amzEntry({
		slug: 'pre-amz',
		label: 'Pre-workout — Amazon AU',
		keywords: 'pre workout',
		linkKind: 'search',
		notes:
			'Stim pre browse — keep as search. Product-specific non-stim pick is oxyshred-amz (do not overwrite this slug).',
	}),
	amzEntry({
		slug: 'pre-amz-stimfree',
		label: 'Stim-free pre — Amazon AU',
		keywords: 'stim free pre workout',
		linkKind: 'search',
		notes:
			'Category stim-free browse for evening sessions. Founder OxyShred Non Stim SKU uses oxyshred-amz — leave this as discovery search; no fat-burner framing.',
	}),
	amzEntry({
		slug: 'oxyshred-amz',
		label: 'OxyShred Non Stim — Amazon AU',
		keywords: 'oxyshred non stimulant pre workout',
		url: amzAuAsinUrl(ASIN_OXYSHRED_NONSTIM),
		linkKind: 'asin',
		notes:
			'EHP Labs OxyShred Non Stimulant Pre Workout Peach 60 serves · ASIN B07WTPM5YN. Product-specific deep link — do not point generic pre-amz / pre-amz-stimfree here. Public copy: non-stim pre / training support only; no fat-burner or thermogenic claims. Sibling stim product: endofdayz-amz. RTD sibling: oxyshred-energy-amz.',
	}),
	amzEntry({
		slug: 'oxyshred-energy-amz',
		label: 'OxyShred Healthy Energy — Amazon AU',
		keywords: 'oxyshred healthy energy drink',
		url: amzAuAsinUrl(ASIN_OXYSHRED_ENERGY),
		linkKind: 'asin',
		notes:
			'EHP Labs OxyShred Healthy Energy Drink Kiwi Strawberry 12-pack · ASIN B0DMMTLMYZ. Sugar/carb/calorie-free RTD energy. Frame as caffeine/ritual/hunger-noise tool in deficit education — no fat-burner claims. Alias: energy-drink-amz. Keep separate from oxyshred-amz (powder non-stim).',
	}),
	amzEntry({
		slug: 'energy-drink-amz',
		label: 'Low-cal energy drink — Amazon AU',
		keywords: 'zero calorie energy drink',
		url: amzAuAsinUrl(ASIN_OXYSHRED_ENERGY),
		linkKind: 'asin',
		notes:
			'Same OxyShred Healthy Energy 12-pack ASIN as oxyshred-energy-amz (B0DMMTLMYZ). Generic editorial alias for deficit / hunger-noise guides.',
	}),
	amzEntry({
		slug: 'endofdayz-amz',
		label: 'End Of Dayz pre — Amazon AU',
		keywords: 'zombie labs end of dayz pre workout',
		url: amzAuAsinUrl(ASIN_ENDOFDAYZ_PRE),
		linkKind: 'asin',
		notes:
			'Zombie Labs End Of Dayz Pre-Workout Raspberry Sour 50 serves · ASIN B0DPJFGYGG. Product-specific stim pre deep link — do not overwrite oxyshred-amz or generic pre-amz search. Disclose stimulants; open-label preference in copy. Alias: pre-amz-zombie.',
	}),
	amzEntry({
		slug: 'pre-amz-zombie',
		label: 'Zombie Labs pre — Amazon AU',
		keywords: 'zombie labs end of dayz pre workout',
		url: amzAuAsinUrl(ASIN_ENDOFDAYZ_PRE),
		linkKind: 'asin',
		notes:
			'Same End Of Dayz Raspberry Sour ASIN as endofdayz-amz (B0DPJFGYGG). Brand-style alias; keep oxyshred-amz and pre-amz untouched.',
	}),
	amzEntry({
		slug: 'mag-amz',
		label: 'Magnesium — Amazon AU',
		keywords: 'magnesium glycinate',
		url: amzAuAsinUrl(ASIN_MAG_GLYCINATE),
		linkKind: 'asin',
		notes:
			'Nature’s Own Magnesium Glycinate 1150mg 120 tablets · ASIN B0F3C9LKNJ. Already glycinate-scoped keywords — upgraded to founder SiteStripe pick. Explicit alias: mag-amz-glycinate. Sibling: mag-iherb. No sleep/cure claims.',
	}),
	amzEntry({
		slug: 'mag-amz-glycinate',
		label: 'Magnesium glycinate — Amazon AU',
		keywords: 'magnesium glycinate',
		url: amzAuAsinUrl(ASIN_MAG_GLYCINATE),
		linkKind: 'asin',
		notes:
			'Same Nature’s Own Magnesium Glycinate ASIN as mag-amz (B0F3C9LKNJ). Explicit glycinate CTA for guides that want the -glycinate slug.',
	}),
	amzEntry({
		slug: 'omega-amz',
		label: 'Omega-3 — Amazon AU',
		keywords: 'omega 3 fish oil EPA DHA',
		url: amzAuAsinUrl(ASIN_OMEGA_FISH_OIL),
		linkKind: 'asin',
		notes:
			'Blackmores Omega Triple Super Strength Fish Oil — 150 capsules · ASIN B0773JF7JX. Founder stack pick; judge EPA+DHA on panel. Alias: fishoil-amz. Sibling: omega-iherb. No cardio-cure claims.',
	}),
	amzEntry({
		slug: 'fishoil-amz',
		label: 'Fish oil — Amazon AU',
		keywords: 'fish oil omega 3',
		url: amzAuAsinUrl(ASIN_OMEGA_FISH_OIL),
		linkKind: 'asin',
		notes:
			'Same Blackmores Omega Triple ASIN as omega-amz (B0773JF7JX). Explicit fish-oil CTA alias.',
	}),
	amzEntry({
		slug: 'vitd-amz',
		label: 'Vitamin D — Amazon AU',
		keywords: 'vitamin D3',
		url: amzAuAsinUrl(ASIN_VITD_D3),
		linkKind: 'asin',
		notes:
			'Best Naturals Vitamin D3 5000 IU — 360 softgels · ASIN B00IDDQBF4. Founder stack education pick; clinician-first for status/testing. Alias: vitd-amz-d3. No disease or hormone claims.',
	}),
	amzEntry({
		slug: 'vitd-amz-d3',
		label: 'Vitamin D3 — Amazon AU',
		keywords: 'vitamin D3 5000 IU',
		url: amzAuAsinUrl(ASIN_VITD_D3),
		linkKind: 'asin',
		notes:
			'Same Best Naturals D3 5000 IU ASIN as vitd-amz (B00IDDQBF4). Explicit D3 alias for founder-stack / label literacy CTAs.',
	}),
	amzEntry({
		slug: 'chromium-amz',
		label: 'Chromium picolinate — Amazon AU',
		keywords: 'chromium picolinate',
		url: amzAuAsinUrl(ASIN_CHROMIUM_PIC),
		linkKind: 'asin',
		notes:
			'Best Naturals Chromium Picolinate 1000 mcg — 120 tablets · ASIN B00URYHOI0. Founder stack education pick (app dose may differ from bottle). No glucose-cure or insulin claims.',
	}),
	amzEntry({
		slug: 'garlic-amz',
		label: 'Garlic extract — Amazon AU',
		keywords: 'garlic extract supplement',
		url: amzAuAsinUrl(ASIN_GARLIC_EXTRACT),
		linkKind: 'asin',
		notes:
			'Best Naturals Garlic Extract 5000 mg equivalent per serving — 360 tablets · ASIN B0D1LTM2KC. Founder stack education pick. Alias: garlic-amz-extract. No BP/cardio disease claims.',
	}),
	amzEntry({
		slug: 'garlic-amz-extract',
		label: 'Garlic extract tablets — Amazon AU',
		keywords: 'garlic extract 5000 mg',
		url: amzAuAsinUrl(ASIN_GARLIC_EXTRACT),
		linkKind: 'asin',
		notes:
			'Same Best Naturals Garlic Extract ASIN as garlic-amz (B0D1LTM2KC). Explicit extract alias for founder-stack CTAs.',
	}),
	amzEntry({
		slug: 'k2-amz',
		label: 'Vitamin K2 — Amazon AU',
		keywords: 'vitamin K2',
		url: amzAuAsinUrl(ASIN_K2_MK7),
		linkKind: 'asin',
		notes:
			'Best Naturals MK-7 Vitamin K2 100 mcg — 120 vcaps · ASIN B00N0YRR2C. Label is mcg (not mg); resolves founder-app unit flag. Clinician-first. No clotting or calcium-deposit claims.',
	}),
	amzEntry({
		slug: 'shaker-amz',
		label: 'Shaker bottle — Amazon AU',
		keywords: 'protein shaker bottle',
		url: amzAuAsinUrl(ASIN_SHAKER_VOLTRX),
		linkKind: 'asin',
		notes:
			'VOLTRX Protein Shaker Bottle — Merger USB-C rechargeable electric mixer, BPA free, 24oz · ASIN B0C7GWGLWV. Primary gear CTA; brand alias: shaker-amz-voltrx. Low-claim accessory only.',
	}),
	amzEntry({
		slug: 'shaker-amz-voltrx',
		label: 'VOLTRX shaker — Amazon AU',
		keywords: 'voltrx protein shaker bottle',
		url: amzAuAsinUrl(ASIN_SHAKER_VOLTRX),
		linkKind: 'asin',
		notes:
			'Same VOLTRX Merger 24oz ASIN as shaker-amz (B0C7GWGLWV). Explicit brand CTA if generic shaker search is restored later.',
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
	{
		slug: 'medibolic-heart',
		label: 'Medibolic Heart & Kidney Support',
		url: 'https://example.com/TODO/medibolic-heart',
		network: 'direct',
		active: false,
		linkKind: 'todo',
		notes:
			'Brand/retail paste only after Human confirms legal Amazon or retail promo path. Education framing — not on-cycle detox or disease treatment.',
	},
	{
		slug: 'medibolic-liver',
		label: 'Medibolic Liver Support',
		url: 'https://example.com/TODO/medibolic-liver',
		network: 'direct',
		active: false,
		linkKind: 'todo',
		notes:
			'Same gate as medibolic-heart. Activate only with approved deep link; no “liver cleanse / cycle support” shopping voice.',
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
