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
			'Run Full Body 3× or Upper/Lower 4× — stop program-hopping.',
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
		name: 'Food dial-in',
		weeks: 'Weeks 3–12 (overlap)',
		job: 'Protein first, then calories for cut / maintain / lean bulk.',
		focus: [
			'Hit ~1.6–2.2 g protein per kg body weight most days.',
			'Use Food Bro to set calories, then adjust from the scale trend every 2–3 weeks.',
			'Plate frameworks before app obsession — food first, powder for gaps.',
		],
		doneWhen: 'Weight trend matches your goal without wrecking training quality.',
		href: '/food-bro',
	},
	{
		id: 'recovery',
		number: 5,
		name: 'Recovery',
		weeks: 'Ongoing',
		job: 'Sleep and steps as unpaid coaches — not optional lifestyle fluff.',
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

export const TRAINING_TEMPLATES: TrainingTemplate[] = [
	{
		id: 'full-body',
		name: 'Full body',
		level: 'Beginner → early intermediate',
		daysPerWeek: 3,
		blurb:
			'Three sessions a week. Hit squat/hinge, push, pull, and a carry or core each day. Best when life is messy and you need one template that still works.',
		days: [
			{
				id: 'a',
				label: 'Day A',
				lifts: [
					{ name: 'Squat pattern (goblet / back squat / leg press)', sets: '3', reps: '6–10' },
					{ name: 'Horizontal push (bench / push-up / DB press)', sets: '3', reps: '6–10' },
					{ name: 'Horizontal pull (row)', sets: '3', reps: '8–12' },
					{ name: 'Hinge assist (RDL / hip hinge)', sets: '2–3', reps: '8–12' },
					{ name: 'Carry or core (farmer / plank)', sets: '2–3', reps: '30–60s' },
				],
			},
			{
				id: 'b',
				label: 'Day B',
				lifts: [
					{ name: 'Hinge main (deadlift variation / trap bar)', sets: '3', reps: '4–8' },
					{ name: 'Vertical push (OHP / landmine / DB)', sets: '3', reps: '6–10' },
					{ name: 'Vertical pull (lat pulldown / assisted pull-up)', sets: '3', reps: '6–10' },
					{ name: 'Single-leg or lunge pattern', sets: '2–3', reps: '8–12/side' },
					{ name: 'Arms or rear delt finisher (optional)', sets: '2', reps: '10–15' },
				],
			},
			{
				id: 'c',
				label: 'Day C',
				lifts: [
					{ name: 'Squat pattern (lighter or different stance)', sets: '3', reps: '8–12' },
					{ name: 'Horizontal push (incline / DB)', sets: '3', reps: '8–12' },
					{ name: 'Horizontal pull (chest-supported / cable)', sets: '3', reps: '8–12' },
					{ name: 'Hip thrust / glute bridge', sets: '2–3', reps: '8–12' },
					{ name: 'Carry or core', sets: '2–3', reps: '30–60s' },
				],
			},
		],
		progression: [
			'Leave 1–3 reps in reserve (RIR) on most working sets — not a grind every set.',
			'When you hit the top of the rep range for all sets with solid form, add a small load next time.',
			'Miss a day? Shift the week; don’t “make up” with a hero double session.',
			'Every 6–8 hard weeks, deload volume ~30% for one week if joints or sleep are fried.',
		],
	},
	{
		id: 'upper-lower',
		name: 'Upper / Lower',
		level: 'Beginner → intermediate',
		daysPerWeek: 4,
		blurb:
			'Four days: Upper, Lower, Upper, Lower. More practice on the big patterns without living in the gym. Use this once three full-body days feel easy to recover from.',
		days: [
			{
				id: 'upper-1',
				label: 'Upper 1',
				lifts: [
					{ name: 'Horizontal push (bench / DB press)', sets: '3–4', reps: '5–8' },
					{ name: 'Horizontal pull (row)', sets: '3–4', reps: '6–10' },
					{ name: 'Vertical push (OHP)', sets: '3', reps: '6–10' },
					{ name: 'Vertical pull (pulldown / pull-up)', sets: '3', reps: '6–10' },
					{ name: 'Biceps + triceps (optional)', sets: '2', reps: '10–15' },
				],
			},
			{
				id: 'lower-1',
				label: 'Lower 1',
				lifts: [
					{ name: 'Squat pattern', sets: '3–4', reps: '5–8' },
					{ name: 'Hinge (RDL / deadlift variation)', sets: '3', reps: '5–8' },
					{ name: 'Single-leg (split squat / lunge)', sets: '2–3', reps: '8–12/side' },
					{ name: 'Calves or core', sets: '2–3', reps: '8–15' },
				],
			},
			{
				id: 'upper-2',
				label: 'Upper 2',
				lifts: [
					{ name: 'Horizontal push (incline / closer grip)', sets: '3', reps: '8–12' },
					{ name: 'Horizontal pull (chest-supported)', sets: '3', reps: '8–12' },
					{ name: 'Lateral raise / rear delt', sets: '2–3', reps: '12–15' },
					{ name: 'Vertical pull (neutral grip)', sets: '3', reps: '8–12' },
					{ name: 'Arms finisher (optional)', sets: '2', reps: '10–15' },
				],
			},
			{
				id: 'lower-2',
				label: 'Lower 2',
				lifts: [
					{ name: 'Hinge main or squat secondary', sets: '3', reps: '6–10' },
					{ name: 'Leg press / hack / belt squat', sets: '3', reps: '8–12' },
					{ name: 'Hip thrust / glute bridge', sets: '2–3', reps: '8–12' },
					{ name: 'Carry + core', sets: '2–3', reps: '30–60s' },
				],
			},
		],
		progression: [
			'Progress one lever at a time: load, then reps, then an extra set if recovery is excellent.',
			'Upper days: keep shoulders happy — full ROM beats ego load.',
			'Lower days: if low back is fried, swap hinge volume for leg press / hip thrust that week.',
			'Same deload rule as full body when the week stops recovering.',
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
			{ id: 't1', label: 'Session 1 completed', hint: 'Log main lifts' },
			{ id: 't2', label: 'Session 2 completed' },
			{ id: 't3', label: 'Session 3 completed' },
			{ id: 't4', label: 'Session 4 completed (if on Upper/Lower)' },
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
		'Phased training, food dial-in, and weekly checklists you’d normally pay a coach for. Free on Yeh Bro.',
};
