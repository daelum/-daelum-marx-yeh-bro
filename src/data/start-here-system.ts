/**
 * Yeh Bro System — natural transformation playbook data.
 * Product UX content (not blog dump). Keep voice guide-first.
 */

export interface SystemPhase {
	id: string;
	number: number;
	name: string;
	weeks: string;
	job: string;
	focus: string[];
	doneWhen: string;
	href: string;
}

export const SYSTEM_PHASES: SystemPhase[] = [
	{
		id: 'foundation',
		number: 1,
		name: 'Foundation',
		weeks: 'Weeks 1–2',
		job: 'Honest baseline + a week you can actually repeat.',
		focus: [
			'Pick one 12-week goal: get stronger, lose fat, or rebuild the habit — not all three.',
			'Book 3–4 lift sessions on the calendar and protect a sleep window.',
			'Weigh in 2–3 mornings/week (same conditions) and log sessions completed.',
		],
		doneWhen: 'You finished two boring, complete weeks without hero-mode.',
		href: '/start-here#phase-foundation',
	},
	{
		id: 'consistency',
		number: 2,
		name: 'Consistency',
		weeks: 'Weeks 3–6',
		job: 'Same split, same big lifts, show up when life is average.',
		focus: [
			'Run 3-day PPL or 4-day PPLU — stop program-hopping.',
			'Leave 1–3 reps in the tank (RIR) most working sets.',
			'Walk most days; one harder conditioning session only if recovery allows.',
		],
		doneWhen: 'You hit ≥85% of planned sessions for four weeks straight.',
		href: '/start-here/training',
	},
	{
		id: 'overload',
		number: 3,
		name: 'Progressive overload',
		weeks: 'Weeks 5–12+',
		job: 'Progress the logbook — load, reps, or cleaner reps.',
		focus: [
			'Add weight or reps when you hit the top of the rep range with solid form.',
			'Deload ~30% volume for a week if mood, sleep, or joints are wrecked for days.',
			'Track 3–5 main lifts; ignore the rest of the noise.',
		],
		doneWhen: 'Main lifts trend up across a month (even slowly).',
		href: '/start-here/training#progression',
	},
	{
		id: 'food',
		number: 4,
		name: 'Food',
		weeks: 'Weeks 3–12 (overlap)',
		job: 'Protein first, then calories for cut / maintain / lean bulk.',
		focus: [
			'Hit ~1.6–2.2 g protein per kg body weight most days.',
			'Use Food Bro to set calories, then run the coach day templates (training / rest / diet break).',
			'Adjust from the scale trend every 2–3 weeks — food first, powder for gaps.',
		],
		doneWhen: 'Weight trend matches your goal without wrecking training quality.',
		href: '/food-bro',
	},
	{
		id: 'recovery',
		number: 5,
		name: 'Recovery',
		weeks: 'Ongoing',
		job: 'Sleep and steps as non-negotiables — not optional lifestyle fluff.',
		focus: [
			'Protect 7–9 hours most nights; same bedtime beats weekend catch-up.',
			'Daily steps / walking as the default cardio base.',
			'Persistent fatigue or hard cuts → bloodwork with a clinician, not Discord.',
		],
		doneWhen: 'Sleep and steps are on the weekly checklist like sessions.',
		href: '/start-here/weekly',
	},
];

export interface Lift {
	name: string;
	sets: string;
	reps: string;
	notes?: string;
}

export interface TrainingDay {
	id: string;
	label: string;
	lifts: Lift[];
}

export interface TrainingTemplate {
	id: string;
	name: string;
	level: string;
	daysPerWeek: number;
	blurb: string;
	days: TrainingDay[];
	progression: string[];
}

/** Shared day templates — commercial gym machines, cables, DBs, Smith, barbell. */
const DAY_PUSH: TrainingDay = {
	id: 'push',
	label: 'Push',
	lifts: [
		{ name: 'Dumbbell seated bent-arm lateral raise', sets: '3', reps: '8–15' },
		{ name: 'Machine fly', sets: '3', reps: '8–15' },
		{
			name: 'Incline Smith press',
			sets: '3',
			reps: '6–12',
			notes: 'No Smith → incline dumbbell press',
		},
		{ name: 'Machine chest press (flat)', sets: '2', reps: '10–15' },
		{ name: 'Cable single-arm tricep pushdown', sets: '2', reps: '6–12' },
		{ name: 'Cable rope overhead triceps extension', sets: '3', reps: '8–15' },
	],
};

const DAY_PULL: TrainingDay = {
	id: 'pull',
	label: 'Pull',
	lifts: [
		{ name: 'Seated cable row', sets: '3', reps: '6–12' },
		{ name: 'Dumbbell bent-over row', sets: '2', reps: '8–12' },
		{ name: 'Barbell bent-over row (pronated)', sets: '3', reps: '5–10' },
		{ name: 'Cable neutral-grip lat pulldown', sets: '2', reps: '8–15' },
		{ name: 'Reverse machine fly', sets: '2', reps: '10–20' },
		{ name: 'Dumbbell hammer curl', sets: '3', reps: '6–12' },
		{ name: 'Barbell curls', sets: '2', reps: '8–12' },
	],
};

const DAY_LEGS: TrainingDay = {
	id: 'legs',
	label: 'Legs',
	lifts: [
		{ name: 'Lying leg curl', sets: '3', reps: '8–12' },
		{ name: '45° leg press', sets: '2', reps: '8–12' },
		{ name: 'Leg extensions', sets: '3', reps: '10–20' },
		{ name: 'Goblet squat', sets: '2', reps: '10–15' },
		{ name: 'Seated calf raise', sets: '3', reps: '8–15' },
		{ name: 'Seated crunch', sets: '3', reps: '8–15' },
	],
};

const DAY_UPPER: TrainingDay = {
	id: 'upper',
	label: 'Upper',
	lifts: [
		{ name: 'Machine shoulder press', sets: '2', reps: '10–15' },
		{ name: 'Standing unilateral cable lateral raise', sets: '3', reps: '6–12' },
		{ name: 'Flat dumbbell bench press', sets: '3', reps: '6–12' },
		{
			name: 'Machine incline hammer chest press',
			sets: '2',
			reps: '10–15',
			notes: 'No hammer machine → incline dumbbell press',
		},
		{ name: 'Machine tricep pushdown', sets: '3', reps: '8–12' },
		{ name: 'Single-arm preacher curl', sets: '3', reps: '8–12' },
	],
};

const PPL_PROGRESSION = [
	'Leave 1–3 reps in reserve (RIR) on most working sets — not a grind every set.',
	'When you hit the top of the rep range for all sets with solid form, add a small load next time.',
	'Miss a day? Shift the week; don’t “make up” with a hero double session.',
	'Every 6–8 hard weeks, deload volume ~30% for one week if joints or sleep are fried.',
];

export const TRAINING_TEMPLATES: TrainingTemplate[] = [
	{
		id: 'ppl',
		name: 'PPL (Push / Pull / Legs)',
		level: 'Beginner → intermediate',
		daysPerWeek: 3,
		blurb:
			'Three days a week — Push, Pull, Legs. Rotate through the week (e.g. Mon / Wed / Fri). Simple commercial-gym machines, cables, dumbbells, Smith, and barbell. Stick with it for months.',
		days: [DAY_PUSH, DAY_PULL, DAY_LEGS],
		progression: PPL_PROGRESSION,
	},
	{
		id: 'pplu',
		name: 'PPLU (Push / Pull / Legs / Upper)',
		level: 'Beginner → intermediate',
		daysPerWeek: 4,
		blurb:
			'Four days — Push, Pull, Legs, then a second Upper day for extra chest, shoulders, and arms. Same gym-bro equipment as 3-day PPL. Add the fourth day when recovery and schedule allow.',
		days: [DAY_PUSH, DAY_PULL, DAY_LEGS, DAY_UPPER],
		progression: [
			'Leave 1–3 reps in reserve (RIR) on most working sets — not a grind every set.',
			'When you hit the top of the rep range for all sets with solid form, add a small load next time.',
			'Miss a day? Shift the week; don’t “make up” with a hero double session.',
			'Upper day is volume, not ego — keep shoulders happy and leave room to recover into next Push.',
			'Every 6–8 hard weeks, deload volume ~30% for one week if joints or sleep are fried.',
		],
	},
];

export interface ChecklistItem {
	id: string;
	label: string;
	hint?: string;
}

export interface ChecklistGroup {
	id: string;
	title: string;
	items: ChecklistItem[];
}

export const WEEKLY_CHECKLIST: ChecklistGroup[] = [
	{
		id: 'training',
		title: 'Training',
		items: [
			{ id: 't1', label: 'Push completed', hint: 'Log main lifts' },
			{ id: 't2', label: 'Pull completed' },
			{ id: 't3', label: 'Legs completed' },
			{ id: 't4', label: 'Upper completed', hint: '4-day PPLU only' },
			{ id: 't5', label: 'Progression noted (load, reps, or hold)', hint: 'One line in the logbook' },
		],
	},
	{
		id: 'steps',
		title: 'Steps / cardio',
		items: [
			{ id: 's1', label: 'Walked most days this week', hint: 'Default: daily steps, not daily redline' },
			{ id: 's2', label: 'Optional hard conditioning ≤1×', hint: 'Only if sleep and joints are fine' },
		],
	},
	{
		id: 'sleep',
		title: 'Sleep',
		items: [
			{ id: 'sl1', label: 'Protected sleep window ≥5 nights', hint: '7–9 hours target' },
			{ id: 'sl2', label: 'Same-ish bedtime most weeknights' },
		],
	},
	{
		id: 'weigh',
		title: 'Weigh-ins & food',
		items: [
			{ id: 'w1', label: 'Morning weigh-ins 2–3×', hint: 'Trend > single day' },
			{ id: 'w2', label: 'Protein target hit most days', hint: '~1.6–2.2 g/kg' },
			{ id: 'w3', label: 'Calories in the Food Bro ballpark', hint: 'Adjust from the 2–3 week trend' },
		],
	},
];

export const SYSTEM_PRODUCT = {
	name: 'Yeh Bro System',
	tagline: 'The natural playbook — best shape of your life without the circus.',
	oneLiner:
		'Phased training, food setup, and weekly checklists — the same structure you’d run with a good coach. Free on Yeh Bro.',
};
