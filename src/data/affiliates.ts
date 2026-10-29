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

export const affiliates: Record<string, AffiliateEntry> = {
	'creatine-amz': {
		url: 'https://example.com/TODO/creatine-amz',
		network: 'amazon-au',
		rel: 'sponsored noopener noreferrer',
		label: 'Amazon AU creatine mono pick',
		lastVerified: null,
		active: false,
	},
	'creatine-bulk': {
		url: 'https://example.com/TODO/creatine-bulk',
		network: 'bulk-nutrients',
		rel: 'sponsored noopener noreferrer',
		label: 'Bulk Nutrients creatine',
		lastVerified: null,
		active: false,
	},
	'creatine-true': {
		url: 'https://example.com/TODO/creatine-true',
		network: 'true-protein',
		rel: 'sponsored noopener noreferrer',
		label: 'True Protein creatine',
		lastVerified: null,
		active: false,
	},
	'protein-true': {
		url: 'https://example.com/TODO/protein-true',
		network: 'true-protein',
		rel: 'sponsored noopener noreferrer',
		label: 'True Protein whey / WPI',
		lastVerified: null,
		active: false,
	},
	'protein-bulk': {
		url: 'https://example.com/TODO/protein-bulk',
		network: 'bulk-nutrients',
		rel: 'sponsored noopener noreferrer',
		label: 'Bulk Nutrients protein',
		lastVerified: null,
		active: false,
	},
	'protein-mn': {
		url: 'https://example.com/TODO/protein-mn',
		network: 'muscle-nation',
		rel: 'sponsored noopener noreferrer',
		label: 'Muscle Nation protein',
		lastVerified: null,
		active: false,
	},
	'protein-sm': {
		url: 'https://example.com/TODO/protein-sm',
		network: 'supplement-mart',
		rel: 'sponsored noopener noreferrer',
		label: 'Supplement Mart protein pick',
		lastVerified: null,
		active: false,
	},
	'protein-mypro': {
		url: 'https://example.com/TODO/protein-mypro',
		network: 'myprotein-au',
		rel: 'sponsored noopener noreferrer',
		label: 'Myprotein AU protein',
		lastVerified: null,
		active: false,
	},
	'pre-mn': {
		url: 'https://example.com/TODO/pre-mn',
		network: 'muscle-nation',
		rel: 'sponsored noopener noreferrer',
		label: 'Muscle Nation pre-workout',
		lastVerified: null,
		active: false,
	},
	'pre-sm': {
		url: 'https://example.com/TODO/pre-sm',
		network: 'supplement-mart',
		rel: 'sponsored noopener noreferrer',
		label: 'Supplement Mart pre pick',
		lastVerified: null,
		active: false,
	},
	'stack-beginner-sm': {
		url: 'https://example.com/TODO/stack-beginner-sm',
		network: 'supplement-mart',
		rel: 'sponsored noopener noreferrer',
		label: 'Beginner stack @ Supplement Mart',
		lastVerified: null,
		active: false,
	},
	'omega-iherb': {
		url: 'https://example.com/TODO/omega-iherb',
		network: 'iherb',
		rel: 'sponsored noopener noreferrer',
		label: 'Omega-3 via iHerb',
		lastVerified: null,
		active: false,
	},
	'mag-iherb': {
		url: 'https://example.com/TODO/mag-iherb',
		network: 'iherb',
		rel: 'sponsored noopener noreferrer',
		label: 'Magnesium via iHerb',
		lastVerified: null,
		active: false,
	},
};

export function getAffiliate(slug: string): AffiliateEntry | undefined {
	return affiliates[slug];
}
