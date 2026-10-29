/**
 * Affiliate redirect map. Authors link to `/go/[slug]` only — never raw network URLs.
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
		url: `https://example.com/TODO/${slug}`,
		network,
		rel: 'sponsored noopener noreferrer',
		label,
		lastVerified: null,
		active: false,
	};
}

export const affiliates: Record<string, AffiliateEntry> = {
	// Creatine
	'creatine-amz': todo('creatine-amz', 'Amazon AU creatine mono pick', 'amazon-au'),
	'creatine-amz-au': todo('creatine-amz-au', 'Amazon AU creatine backup', 'amazon-au'),
	'creatine-bulk': todo('creatine-bulk', 'Bulk Nutrients creatine', 'bulk-nutrients'),
	'creatine-bulk-mn': todo('creatine-bulk-mn', 'Default AU mono (Bulk-style)', 'bulk-nutrients'),
	'creatine-true': todo('creatine-true', 'True Protein creatine', 'true-protein'),
	'creatine-creapure-au': todo('creatine-creapure-au', 'Creapure mono AU option', 'au-retail'),

	// Protein
	'protein-true': todo('protein-true', 'True Protein whey / WPI', 'true-protein'),
	'protein-bulk': todo('protein-bulk', 'Bulk Nutrients protein', 'bulk-nutrients'),
	'protein-mn': todo('protein-mn', 'Muscle Nation protein', 'muscle-nation'),
	'protein-sm': todo('protein-sm', 'Supplement Mart protein pick', 'supplement-mart'),
	'protein-mypro': todo('protein-mypro', 'Myprotein AU protein', 'myprotein-au'),
	'whey-conc-au': todo('whey-conc-au', 'AU whey concentrate workhorse', 'au-retail'),
	'whey-isolate-au': todo('whey-isolate-au', 'AU whey isolate', 'au-retail'),
	'whey-amz-au': todo('whey-amz-au', 'Amazon AU whey backup', 'amazon-au'),
	'plant-protein-au': todo('plant-protein-au', 'AU plant protein option', 'au-retail'),

	// Pre / intra
	'pre-mn': todo('pre-mn', 'Muscle Nation pre-workout', 'muscle-nation'),
	'pre-sm': todo('pre-sm', 'Supplement Mart pre pick', 'supplement-mart'),
	'pre-stimfree-au': todo('pre-stimfree-au', 'Primary stim-free pre AU', 'au-retail'),
	'pre-stimfree-budget': todo('pre-stimfree-budget', 'Budget stim-free pre', 'au-retail'),
	'citrulline-au': todo('citrulline-au', 'Citrulline single-ingredient AU', 'au-retail'),
	'electrolytes-au': todo('electrolytes-au', 'Electrolytes / intra AU', 'au-retail'),

	// Stack / extras
	'stack-beginner-sm': todo('stack-beginner-sm', 'Beginner stack @ Supplement Mart', 'supplement-mart'),
	'omega-iherb': todo('omega-iherb', 'Omega-3 via iHerb', 'iherb'),
	'mag-iherb': todo('mag-iherb', 'Magnesium via iHerb', 'iherb'),
};

export function getAffiliate(slug: string): AffiliateEntry | undefined {
	return affiliates[slug];
}
