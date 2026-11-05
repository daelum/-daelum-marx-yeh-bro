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

/** Maps clusters onto site IA pillars (Train / Fuel / Recover / Culture). */
export type ClusterPillar = 'train' | 'fuel' | 'recover' | 'culture';

export interface GuideCluster {
	id: GuideClusterId;
	label: string;
	blurb: string;
	pillar: ClusterPillar;
	/** Order for /blog index; first slug is the cluster “pillar” when linking hubs. */
	slugs: string[];
}

export const GUIDE_CLUSTERS: GuideCluster[] = [
	{
		id: 'training',
		label: 'Training',
		blurb: 'Simple programs, progressive overload, deloads.',
		pillar: 'train',
		slugs: [
			'beginner-full-body-program',
			'upper-lower-split',
			'upper-lower-advanced-volume',
			'powerbuilding-hybrid-week',
			'machine-only-hypertrophy-templates',
			'cable-vs-free-weight-trade-offs',
			'progressive-overload',
			'progressive-overload-for-women',
			'rpe-reps-in-reserve',
			'training-logbook',
			'plateau-checklist-for-lifters',
			'warmup-before-lifting',
			'warmup-circuit-you-keep',
			'joint-friendly-hinge-progressions',
			'barbell-vs-db-bench-shoulders',
			'cardio-on-lifting-days',
			'grip-belts-when-gear-helps',
			'hotel-travel-gym-sessions',
			'home-gym-starter-minimalism',
			'beginner-mistakes-home-gyms',
			'how-many-days-to-lift',
			'deload-week',
			'how-to-choose-deload-style',
		],
	},
	{
		id: 'food',
		label: 'Food',
		blurb: 'Start with Food Bro (/food-bro), then protein, cuts, lean bulks — without the app obsession.',
		pillar: 'fuel',
		slugs: [
			'calories-and-macros-for-lifters',
			'what-calories-are-for-lifters',
			'estimate-maintenance-calories',
			'why-am-i-not-losing-fat',
			'macro-split-basics-for-lifters',
			'protein-targets-for-lifters',
			'protein-timing-vs-total-intake',
			'carb-totals-vs-timing-for-lifters',
			'carbs-around-training',
			'intra-carbs-for-long-sessions',
			'dietary-fat-floors-for-lifters',
			'tracking-vs-hand-portions',
			'meal-structure-without-apps',
			'calorie-tracking-mistakes',
			'flexible-dieting-vs-meal-plans',
			'hitting-macros-at-restaurants',
			'partner-family-food-macros',
			'recalculating-calories-after-weight-change',
			'cutting-without-wrecking-lifts',
			'hunger-on-a-cut',
			'refeeds-and-diet-breaks',
			'reverse-diet-literacy',
			'cut-to-bulk-transition-mistakes',
			'tracking-weight-waist-photos',
			'sodium-water-scale-panic',
			'lean-bulk-basics',
			'whey-vs-food-protein',
			'energy-drinks-vs-pre-workout-deficit',
		],
	},
	{
		id: 'recovery',
		label: 'Recovery',
		blurb: 'Sleep, walking, stress — the boring work that pays.',
		pillar: 'recover',
		slugs: [
			'sleep-for-lifters',
			'sleep-hygiene-late-shift-lifters',
			'sleep-trackers-useful-or-anxiety',
			'morning-vs-evening-training',
			'walking-for-lifters',
			'step-targets-without-obsessing-neat',
			'stress-and-lifting',
			'rest-days-vs-active-recovery',
			'injury-return-to-lift-mindset',
			'weekend-warrior-damage-control',
			'alcohol-training-quiet-tax',
		],
	},
	{
		id: 'creatine',
		label: 'Creatine',
		blurb: 'Monohydrate first. Dose, myths, forms, beginners.',
		pillar: 'fuel',
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
			'creatine-for-older-lifters',
		],
	},
	{
		id: 'protein',
		label: 'Protein powder',
		blurb: 'Scoop maths, WPC vs WPI, plant, budget tubs.',
		pillar: 'fuel',
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
		pillar: 'fuel',
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
		pillar: 'fuel',
		slugs: [
			'beginner-supplement-stack-australia',
			'yeh-bro-current-picks',
			'label-math-drill',
			'omega-3-label-drill',
			'magnesium-label-form-drill',
			'gym-bag-basics',
			'supplement-mistakes-beginners-australia',
			'supplement-label-red-flags-australia',
			'amazon-au-vs-supplement-shops',
		],
	},
	{
		id: 'basics',
		label: 'Basics (optional)',
		blurb: 'Magnesium, omega-3, vitamin D — conservative framing.',
		pillar: 'fuel',
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
		pillar: 'culture',
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
		pillar: 'culture',
		slugs: [
			'ped-harm-reduction-australia',
			'bodybuilding-culture-education',
			'natty-or-not-physique-standards',
			'online-coach-red-flags',
			'when-to-hire-in-person-coach',
			'ego-lifting-vs-training-age',
			'enhanced-influencer-media-literacy',
			'body-dysmorphia-adjacency-gym-culture',
			'photo-lighting-honesty-for-lifters',
			'contest-prep-culture-vs-health',
			'comment-section-ped-debate-detox',
			'gym-etiquette-without-gatekeeping',
			'bloodwork-for-lifters',
			'what-i-run-beside-testosterone',
			'trt-culture-literacy-vs-aas',
			'ped-bloodwork-literacy',
			'peptide-literacy-harm-reduction',
			'research-chem-marketing-tells',
			'forum-cycle-lore-vs-clinical-care',
			'oral-aas-liver-risk-literacy',
			'fertility-aas-clinician-questions',
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
	{ href: '/blog/calories-and-macros-for-lifters', label: 'Calories & macros' },
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
