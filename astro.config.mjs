// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://yehbro.com',
	integrations: [
		mdx(),
		sitemap({
			filter: (page) => !page.includes('/go/') && !page.includes('/guides/'),
		}),
	],
	// SEO drafts / link map use /guides/*; content lives under /blog/*
	redirects: {
		'/guides/best-creatine-australia': '/blog/best-creatine-australia',
		'/guides/how-to-dose-creatine': '/blog/how-to-dose-creatine',
		'/guides/creatine-monohydrate-vs-hcl': '/blog/creatine-monohydrate-vs-hcl',
		'/guides/best-protein-powder-australia': '/blog/best-protein-powder-australia',
		'/guides/whey-concentrate-vs-isolate-australia': '/blog/whey-concentrate-vs-isolate-australia',
		'/guides/best-stim-free-pre-workout-australia': '/blog/best-stim-free-pre-workout-australia',
		'/guides/protein-scoop-economics-australia': '/blog/protein-scoop-economics-australia',
		'/guides/pre-workout-without-hype': '/blog/pre-workout-without-hype',
		'/guides/beginner-supplement-stack-australia': '/blog/beginner-supplement-stack-australia',
		'/guides/does-creatine-cause-bloating': '/blog/does-creatine-cause-bloating',
		'/guides/cheapest-protein-powder-australia': '/blog/cheapest-protein-powder-australia',
		'/guides/proprietary-blend-pre-workout': '/blog/proprietary-blend-pre-workout',
		'/guides/creapure-vs-generic-creatine': '/blog/creapure-vs-generic-creatine',
		'/guides/protein-per-scoop-australia': '/blog/protein-per-scoop-australia',
		'/guides/best-creatine-for-beginners-australia': '/blog/best-creatine-for-beginners-australia',
		'/guides/creatine-for-women': '/blog/creatine-for-women',
		'/guides/caffeine-dose-training': '/blog/caffeine-dose-training',
		'/guides/lactose-whey-isolate': '/blog/lactose-whey-isolate',
		'/guides/creatine-loading-phase': '/blog/creatine-loading-phase',
		'/guides/when-to-take-creatine': '/blog/when-to-take-creatine',
		'/guides/beta-alanine-tingles': '/blog/beta-alanine-tingles',
		'/guides/pre-workout-vs-coffee': '/blog/pre-workout-vs-coffee',
		'/guides/casein-vs-whey': '/blog/casein-vs-whey',
		'/guides/best-plant-protein-australia': '/blog/best-plant-protein-australia',
		'/guides/magnesium-for-lifters-australia': '/blog/magnesium-for-lifters-australia',
		'/guides/omega-3-for-lifters-australia': '/blog/omega-3-for-lifters-australia',
		'/guides/intra-workout-electrolytes-australia': '/blog/intra-workout-electrolytes-australia',
		'/guides/supplement-label-red-flags-australia': '/blog/supplement-label-red-flags-australia',
		'/guides/vitamin-d-training-australia': '/blog/vitamin-d-training-australia',
		'/guides/amazon-au-vs-supplement-shops': '/blog/amazon-au-vs-supplement-shops',
		'/guides/yeh-bro-current-picks': '/blog/yeh-bro-current-picks',
		'/guides/supplement-mistakes-beginners-australia': '/blog/supplement-mistakes-beginners-australia',
		'/guides/ped-harm-reduction-australia': '/blog/ped-harm-reduction-australia',
		'/guides/bodybuilding-culture-education': '/blog/bodybuilding-culture-education',
		'/guides/bodybuilding-blueprint': '/blog/bodybuilding-blueprint',
		'/guides/bodybuilding-blueprint-phase-1-cut': '/blog/bodybuilding-blueprint-phase-1-cut',
		'/guides/bodybuilding-blueprint-phase-2-health-pivot':
			'/blog/bodybuilding-blueprint-phase-2-health-pivot',
		'/guides/bodybuilding-blueprint-phase-3-lean-bulk':
			'/blog/bodybuilding-blueprint-phase-3-lean-bulk',
		'/guides/bodybuilding-blueprint-safety': '/blog/bodybuilding-blueprint-safety',
		'/guides/beginner-full-body-program': '/blog/beginner-full-body-program',
		'/guides/progressive-overload': '/blog/progressive-overload',
		'/guides/how-many-days-to-lift': '/blog/how-many-days-to-lift',
		'/guides/deload-week': '/blog/deload-week',
		'/guides/protein-targets-for-lifters': '/blog/protein-targets-for-lifters',
		'/guides/cutting-without-wrecking-lifts': '/blog/cutting-without-wrecking-lifts',
		'/guides/lean-bulk-basics': '/blog/lean-bulk-basics',
		'/guides/sleep-for-lifters': '/blog/sleep-for-lifters',
		'/guides/walking-for-lifters': '/blog/walking-for-lifters',
		'/guides/stress-and-lifting': '/blog/stress-and-lifting',
		'/guides/whey-vs-food-protein': '/blog/whey-vs-food-protein',
		'/guides/creatine-myths': '/blog/creatine-myths',
		'/guides/natty-or-not-physique-standards': '/blog/natty-or-not-physique-standards',
		'/guides/ped-bloodwork-literacy': '/blog/ped-bloodwork-literacy',
		'/guides/ped-coming-off-under-care': '/blog/ped-coming-off-under-care',
		'/guides/bloodwork-for-lifters': '/blog/bloodwork-for-lifters',
	},
});





