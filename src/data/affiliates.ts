/**
 * Affiliate redirect map. Authors link to `/go/[slug]` only — never raw network URLs.
 * Aligned with Context docs/affiliate/go-slug-map.md + SEO draft slug inventory.
 * Replace TODO urls when programs approve. lastVerified = ISO date or null.
 */
export type AffiliateEntry = {
	url: string;
	network: string;
	rel: string;
	label: string;
	lastVerified: string | null;
	active: boolean;
};

function todo(
	slug: string,
	label: string,
	network: string,
): AffiliateEntry {
	return {
		// TODO: paste live network deep link when approved (go-slug-map allows "#" stub)
		url: `https://example.com/TODO/${slug}`,
		network,
		rel: 'sponsored noopener noreferrer',
		label,
		lastVerified: null,
		active: false,
	};
}

export const affiliates: Record<string, AffiliateEntry> = {
	// --- Phase-1 seed (go-slug-map.md) ---
	'creatine-amz': todo('creatine-amz', 'Amazon AU creatine mono pick', 'amazon-associates'),
	'creatine-bulk': todo('creatine-bulk', 'Bulk Nutrients creatine', 'referral'),
	'creatine-true': todo('creatine-true', 'True Protein creatine', 'commission-factory'),
	'protein-true': todo('protein-true', 'True Protein flagship whey / WPI', 'commission-factory'),
	'protein-bulk': todo('protein-bulk', 'Bulk Nutrients protein', 'referral'),
	'protein-mn': todo('protein-mn', 'Muscle Nation protein', 'direct-growi'),
	'protein-sm': todo('protein-sm', 'Supplement Mart protein pick', 'commission-factory'),
	'protein-mypro': todo('protein-mypro', 'Myprotein AU protein', 'awin'),
	'pre-mn': todo('pre-mn', 'Muscle Nation pre-workout', 'direct-growi'),
	'pre-sm': todo('pre-sm', 'Supplement Mart pre pick', 'commission-factory'),
	'stack-beginner-sm': todo('stack-beginner-sm', 'Beginner stack @ Supplement Mart', 'commission-factory'),
	'omega-iherb': todo('omega-iherb', 'Omega-3 via iHerb', 'iherb-network'),
	'mag-iherb': todo('mag-iherb', 'Magnesium via iHerb', 'iherb-network'),

	// --- Content / comparison slugs (SEO batches; still TODO URLs) ---
	'creatine-amz-au': todo('creatine-amz-au', 'Amazon AU creatine backup', 'amazon-associates'),
	'creatine-bulk-mn': todo('creatine-bulk-mn', 'Default AU mono workhorse', 'referral'),
	'creatine-creapure-au': todo('creatine-creapure-au', 'Creapure mono AU option', 'au-retail'),
	'creatine-hcl-au': todo('creatine-hcl-au', 'Creatine HCL AU option', 'au-retail'),
	'whey-conc-au': todo('whey-conc-au', 'AU whey concentrate workhorse', 'au-retail'),
	'whey-isolate-au': todo('whey-isolate-au', 'AU whey isolate', 'au-retail'),
	'whey-amz-au': todo('whey-amz-au', 'Amazon AU whey backup', 'amazon-associates'),
	'whey-budget-au': todo('whey-budget-au', 'Budget AU whey cutter', 'au-retail'),
	'plant-protein-au': todo('plant-protein-au', 'AU plant protein option', 'au-retail'),
	'pre-stimfree-au': todo('pre-stimfree-au', 'Primary stim-free pre AU', 'au-retail'),
	'pre-stimfree-budget': todo('pre-stimfree-budget', 'Budget stim-free pre', 'au-retail'),
	'citrulline-au': todo('citrulline-au', 'Citrulline single-ingredient AU', 'au-retail'),
	'electrolytes-au': todo('electrolytes-au', 'Electrolytes / intra AU', 'au-retail'),

	// --- Optional variants (inactive until SKU locked) ---
	'protein-true-wpi': todo('protein-true-wpi', 'True Protein WPI', 'commission-factory'),
	'protein-true-wpc': todo('protein-true-wpc', 'True Protein WPC / blend', 'commission-factory'),
	'creatine-amz-mono': todo('creatine-amz-mono', 'Amazon AU mono deep link', 'amazon-associates'),
	'creatine-true-mono': todo('creatine-true-mono', 'True Protein mono', 'commission-factory'),
	'pre-mn-beginner': todo('pre-mn-beginner', 'Muscle Nation beginner / lower-stim pre', 'direct-growi'),
	'stack-beginner-true': todo('stack-beginner-true', 'Beginner stack · True Protein', 'commission-factory'),
};

export function getAffiliate(slug: string): AffiliateEntry | undefined {
	return affiliates[slug];
}
