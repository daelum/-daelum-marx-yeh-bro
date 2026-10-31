/**
 * Guide clusters for hub listing + related-link rails.
 * Keep slugs in sync with `src/content/blog/*.mdx`.
 */

export type GuideClusterId =
	| 'training'
	| 'food'
	| 'recovery'
	| 'creatine'
	| 'protein'
	| 'pre'
	| 'stack'
	| 'basics'
	| 'blueprint'
	| 'culture';

export interface GuideCluster {
	id: GuideClusterId;
	label: string;
	blurb: string;
	/** Order for /blog index; first slug is the cluster “pillar” when linking hubs. */
	slugs: string[];
}

export const GUIDE_CLUSTERS: GuideCluster[] = [
	{
		id: 'training',
		label: 'Training',
		blurb: 'Simple programs, progressive overload, deloads.',
		slugs: [
			'beginner-full-body-program',
			'progressive-overload',
			'how-many-days-to-lift',
			'deload-week',
		],
	},
	{
		id: 'food',
		label: 'Food',
		blurb: 'Protein targets, cuts, lean bulks — without the app obsession.',
		slugs: [
			'protein-targets-for-lifters',
			'cutting-without-wrecking-lifts',
			'lean-bulk-basics',
			'whey-vs-food-protein',
		],
	},
	{
		id: 'recovery',
		label: 'Recovery',
		blurb: 'Sleep, walking, stress — the unpaid coaches.',
		slugs: ['sleep-for-lifters', 'walking-for-lifters', 'stress-and-lifting'],
	},
	{
		id: 'creatine',
		label: 'Creatine',
		blurb: 'Monohydrate first. Dose, myths, forms, beginners.',
		slugs: [
			'best-creatine-australia',
			'how-to-dose-creatine',
			'creatine-myths',
			'when-to-take-creatine',
			'creatine-loading-phase',
			'does-creatine-cause-bloating',
			'creatine-monohydrate-vs-hcl',
			'creapure-vs-generic-creatine',
			'best-creatine-for-beginners-australia',
			'creatine-for-women',
		],
	},
	{
		id: 'protein',
		label: 'Protein powder',
		blurb: 'Scoop maths, WPC vs WPI, plant, budget tubs.',
		slugs: [
			'best-protein-powder-australia',
			'whey-concentrate-vs-isolate-australia',
			'protein-per-scoop-australia',
			'protein-scoop-economics-australia',
			'cheapest-protein-powder-australia',
			'lactose-whey-isolate',
			'casein-vs-whey',
			'best-plant-protein-australia',
		],
	},
	{
		id: 'pre',
		label: 'Pre / caffeine',
		blurb: 'Clear doses, stim-free options, coffee vs tub.',
		slugs: [
			'best-stim-free-pre-workout-australia',
			'pre-workout-without-hype',
			'proprietary-blend-pre-workout',
			'caffeine-dose-training',
			'pre-workout-vs-coffee',
			'beta-alanine-tingles',
			'intra-workout-electrolytes-australia',
		],
	},
	{
		id: 'stack',
		label: 'Stacks & shopping',
		blurb: 'Beginner order of operations, picks, shops, mistakes.',
		slugs: [
			'beginner-supplement-stack-australia',
			'yeh-bro-current-picks',
			'supplement-mistakes-beginners-australia',
			'supplement-label-red-flags-australia',
			'amazon-au-vs-supplement-shops',
		],
	},
	{
		id: 'basics',
		label: 'Basics (optional)',
		blurb: 'Magnesium, omega-3, vitamin D — conservative framing.',
		slugs: [
			'magnesium-for-lifters-australia',
			'omega-3-for-lifters-australia',
			'vitamin-d-training-australia',
		],
	},
	{
		id: 'blueprint',
		label: 'Bodybuilding blueprint',
		blurb: 'Cut → health pivot → lean bulk, plus safety.',
		slugs: [
			'bodybuilding-blueprint',
			'bodybuilding-blueprint-phase-1-cut',
			'bodybuilding-blueprint-phase-2-health-pivot',
			'bodybuilding-blueprint-phase-3-lean-bulk',
			'bodybuilding-blueprint-safety',
		],
	},
	{
		id: 'culture',
		label: 'Culture & PED literacy',
		blurb: 'Optional later — risks, bloodwork, coming off under care.',
		slugs: [
			'ped-harm-reduction-australia',
			'bodybuilding-culture-education',
			'natty-or-not-physique-standards',
			'bloodwork-for-lifters',
			'ped-bloodwork-literacy',
			'ped-coming-off-under-care',
		],
	},
];

const slugToCluster = new Map<string, GuideClusterId>();
for (const cluster of GUIDE_CLUSTERS) {
	for (const slug of cluster.slugs) {
		slugToCluster.set(slug, cluster.id);
	}
}

export function getClusterForSlug(slug: string): GuideCluster | undefined {
	const id = slugToCluster.get(slug);
	if (!id) return undefined;
	return GUIDE_CLUSTERS.find((c) => c.id === id);
}

/** Related slugs for a post: same cluster (ex self), capped. */
export function relatedSlugsFor(slug: string, limit = 6): string[] {
	const cluster = getClusterForSlug(slug);
	if (!cluster) return [];
	return cluster.slugs.filter((s) => s !== slug).slice(0, limit);
}

/** Hub-facing pillar links (one per major commercial/training cluster). */
export const HUB_PILLAR_LINKS: { href: string; label: string }[] = [
	{ href: '/blog/beginner-full-body-program', label: 'Beginner full body' },
	{ href: '/blog/protein-targets-for-lifters', label: 'Protein targets' },
	{ href: '/blog/sleep-for-lifters', label: 'Sleep for lifters' },
	{ href: '/blog/best-creatine-australia', label: 'Creatine guide' },
	{ href: '/blog/best-protein-powder-australia', label: 'Protein powder' },
	{ href: '/blog/beginner-supplement-stack-australia', label: 'Beginner stack' },
	{ href: '/blog/best-stim-free-pre-workout-australia', label: 'Stim-free pre' },
	{ href: '/blog/yeh-bro-current-picks', label: 'Current picks' },
	{ href: '/blog/bodybuilding-blueprint', label: 'Blueprint' },
	{ href: '/blog/ped-harm-reduction-australia', label: 'PED literacy' },
];
