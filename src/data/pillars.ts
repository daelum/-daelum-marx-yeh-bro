/**
 * Five-pillar IA for Yeh Bro lifestyle brand.
 * Product routes (/start-here, /food-bro, …) stay canonical; pillars are hubs.
 */

export interface PillarLink {
	href: string;
	label: string;
	blurb: string;
}

export interface Pillar {
	id: 'train' | 'fuel' | 'recover' | 'culture' | 'shop';
	label: string;
	href: string;
	/** Short card line for homepage / nav context */
	tagline: string;
	/** Hub page lede */
	lede: string;
	links: PillarLink[];
}

export const PILLARS: Pillar[] = [
	{
		id: 'train',
		label: 'Train',
		href: '/train',
		tagline: 'Programs, progression, and a week you can repeat.',
		lede: 'Lift with a plan that sticks. Simple splits, progressive overload, and checklists — not a new program every Monday.',
		links: [
			{
				href: '/start-here',
				label: 'Yeh Bro System',
				blurb: 'Five phases from foundation through recovery — free, no signup.',
			},
			{
				href: '/start-here/training',
				label: 'Training templates',
				blurb: '3-day PPL and 4-day PPLU with progression rules.',
			},
			{
				href: '/start-here/weekly',
				label: 'Weekly checklist',
				blurb: 'Sessions, steps, sleep, weigh-ins — check off in the browser.',
			},
			{
				href: '/blog#training',
				label: 'Training guides',
				blurb: 'Overload, deloads, warmups, and program literacy.',
			},
		],
	},
	{
		id: 'fuel',
		label: 'Fuel',
		href: '/fuel',
		tagline: 'Calories, macros, Food Bro, and honest sports nutrition.',
		lede: 'Eat for the cut, the hold, or the lean bulk. Food Bro scales the day; guides cover protein, carbs, and when a powder earns a place.',
		links: [
			{
				href: '/food-bro',
				label: 'Food Bro',
				blurb: 'Calculator + scaled day templates and a printable plan.',
			},
			{
				href: '/food-bro/shopping',
				label: 'Weekly shopping list',
				blurb: 'Phone-copyable Woolworths totals for a training week or diet break.',
			},
			{
				href: '/food',
				label: 'Food hub',
				blurb: 'Protein, cutting, and lean bulk guides around the calculator.',
			},
			{
				href: '/blog#creatine',
				label: 'Supplements literacy',
				blurb: 'Creatine, protein, pre — labels and scoop maths, not hype.',
			},
		],
	},
	{
		id: 'recover',
		label: 'Recover',
		href: '/recover',
		tagline: 'Sleep, fatigue, deloads, and the boring work that pays.',
		lede: 'Recovery is part of training — sleep windows, steps, deloads, and knowing when to back off. Not optional lifestyle fluff.',
		links: [
			{
				href: '/start-here/weekly',
				label: 'Weekly checklist',
				blurb: 'Protect sleep and steps the same way you protect sessions.',
			},
			{
				href: '/blog/sleep-for-lifters',
				label: 'Sleep for lifters',
				blurb: 'Protect a window before you add more volume.',
			},
			{
				href: '/blog/deload-week',
				label: 'Deload week',
				blurb: 'When to pull volume and how to come back.',
			},
			{
				href: '/blog#recovery',
				label: 'Recovery guides',
				blurb: 'Rest days, stress, walking, and damage control.',
			},
		],
	},
	{
		id: 'culture',
		label: 'Culture',
		href: '/culture',
		tagline: 'Gym culture, physique standards, and PED harm-reduction education.',
		lede: 'Straight talk about bodybuilding culture — including performance-enhancing drugs (PEDs) as education: risks, bloodwork, legality. Not sourcing. Not day one.',
		links: [
			{
				href: '/blog/bodybuilding-culture-education',
				label: 'Bodybuilding culture',
				blurb: 'How the scene actually works — without the forum theatre.',
			},
			{
				href: '/blog/ped-harm-reduction-australia',
				label: 'PED harm reduction',
				blurb: 'Risks, bloodwork, legality — education only.',
			},
			{
				href: '/blog/bloodwork-for-lifters',
				label: 'Bloodwork for lifters',
				blurb: 'What to ask a clinician about, not a protocol from this site.',
			},
			{
				href: '/blog#culture',
				label: 'Culture guides',
				blurb: 'Natty standards, media literacy, contest vs health.',
			},
		],
	},
	{
		id: 'shop',
		label: 'Shop',
		href: '/shop',
		tagline: 'Apparel, sports nutrition, energy, accessories — coming soon.',
		lede: 'Gear for the lifestyle. Shop is coming soon — no fake products or prices while we build it.',
		links: [
			{
				href: '/shop',
				label: 'Shop Coming Soon',
				blurb: 'Apparel, legal sports nutrition, energy drinks, gym accessories.',
			},
			{
				href: 'https://www.instagram.com/theyehbro/',
				label: '@theyehbro',
				blurb: 'Drops land on Instagram first.',
			},
		],
	},
];

/** Primary nav order (About sits after pillars). */
export const NAV_PILLARS = PILLARS.map(({ label, href }) => ({ label, href }));

export function getPillar(id: Pillar['id']): Pillar {
	const pillar = PILLARS.find((p) => p.id === id);
	if (!pillar) throw new Error(`Unknown pillar: ${id}`);
	return pillar;
}
