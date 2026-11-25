/**
 * Yeh Bro System — natural transformation playbook data.
 * Product UX content (not blog dump). Keep voice guide-first.
 *
 * Training templates: ONE prescribed exercise per slot — no alternatives.
 * Video URLs live in `exercise-videos.ts` (central registry).
 */

import { videoUrlForExercise } from './exercise-videos';

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
			'Set calories from your plan targets, then run the coach day templates (training / rest / diet break).',
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
			'Daily steps / walking as the default cardio base — aim for 10,000+.',
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
	/** Rest between working sets. */
	rest?: string;
	/** One short coaching cue — not an alternate exercise. */
	cue?: string;
	/** From central exercise-videos registry (null = placeholder). */
	videoUrl?: string | null;
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

function lift(
	name: string,
	sets: string,
	reps: string,
	opts?: { rest?: string; cue?: string },
): Lift {
	return {
		name,
		sets,
		reps,
		rest: opts?.rest ?? '90–120s',
		cue: opts?.cue,
		videoUrl: videoUrlForExercise(name),
	};
}

/** Full commercial-gym days — one exercise per slot, no alternatives. */
const DAY_PUSH: TrainingDay = {
	id: 'push',
	label: 'Push',
	lifts: [
		lift('Seated dumbbell lateral raise', '3', '8–15', {
			rest: '60–90s',
			cue: 'Lead with elbows; light enough to control the top.',
		}),
		lift('Machine chest fly', '3', '8–15', {
			rest: '60–90s',
			cue: 'Soft elbows; squeeze at the stretch, don’t bounce.',
		}),
		lift('Incline Smith machine press', '3', '6–12', {
			rest: '2–3 min',
			cue: 'Wrists stacked; stop just short of locking out hard.',
		}),
		lift('Flat machine chest press', '2', '10–15', {
			rest: '90–120s',
			cue: 'Full controlled range; leave 1–2 reps in reserve.',
		}),
		lift('Cable tricep pushdown', '2', '6–12', {
			rest: '60–90s',
			cue: 'Pin elbows to ribs; finish with a hard squeeze.',
		}),
		lift('Cable overhead tricep extension', '3', '8–15', {
			rest: '60–90s',
			cue: 'Upper arms stay still; stretch at the bottom.',
		}),
	],
};

const DAY_PULL: TrainingDay = {
	id: 'pull',
	label: 'Pull',
	lifts: [
		lift('Seated cable row', '3', '6–12', {
			rest: '90–120s',
			cue: 'Pull to lower ribs; pause briefly at contraction.',
		}),
		lift('Dumbbell bent-over row', '2', '8–12', {
			rest: '90–120s',
			cue: 'Flat back; drive elbows toward hips.',
		}),
		lift('Barbell bent-over row', '3', '5–10', {
			rest: '2–3 min',
			cue: 'Pronated grip; torso stays braced — no bounce.',
		}),
		lift('Lat pulldown', '2', '8–15', {
			rest: '90–120s',
			cue: 'Pull to upper chest; control the eccentric.',
		}),
		lift('Reverse pec deck', '2', '10–20', {
			rest: '60–90s',
			cue: 'Think “elbows out”; light weight, clean reps.',
		}),
		lift('Dumbbell hammer curl', '3', '6–12', {
			rest: '60–90s',
			cue: 'Neutral grip; no swinging.',
		}),
		lift('Barbell curl', '2', '8–12', {
			rest: '60–90s',
			cue: 'Elbows pinned; stop short of cheating the last reps.',
		}),
	],
};

const DAY_LEGS: TrainingDay = {
	id: 'legs',
	label: 'Legs',
	lifts: [
		lift('Lying leg curl', '3', '8–12', {
			rest: '90–120s',
			cue: 'Hips glued down; squeeze at the top.',
		}),
		lift('Leg press', '2', '8–12', {
			rest: '2–3 min',
			cue: 'Feet mid-platform; don’t bounce out of the hole.',
		}),
		lift('Leg extension', '3', '10–20', {
			rest: '60–90s',
			cue: 'Control the lockout; no kicking.',
		}),
		lift('Goblet squat', '2', '10–15', {
			rest: '90–120s',
			cue: 'Elbows inside knees; sit between the hips.',
		}),
		lift('Seated calf raise', '3', '8–15', {
			rest: '60–90s',
			cue: 'Full stretch at the bottom; pause at the top.',
		}),
		lift('Machine crunch', '3', '8–15', {
			rest: '60s',
			cue: 'Round through the ribs; don’t yank with arms.',
		}),
	],
};

const DAY_UPPER: TrainingDay = {
	id: 'upper',
	label: 'Upper',
	lifts: [
		lift('Machine shoulder press', '2', '10–15', {
			rest: '90–120s',
			cue: 'Don’t flare ribs; stop short of pain at the bottom.',
		}),
		lift('Cable lateral raise', '3', '6–12', {
			rest: '60–90s',
			cue: 'Lead with the elbow; light and strict.',
		}),
		lift('Flat dumbbell bench press', '3', '6–12', {
			rest: '2–3 min',
			cue: 'Shoulder blades set; controlled descent.',
		}),
		lift('Incline machine chest press', '2', '10–15', {
			rest: '90–120s',
			cue: 'Upper-chest bias; leave a rep or two.',
		}),
		lift('Tricep pushdown', '3', '8–12', {
			rest: '60–90s',
			cue: 'Elbows still; full extension without shrugging.',
		}),
		lift('Preacher curl', '3', '8–12', {
			rest: '60–90s',
			cue: 'Chest on pad; no hip drive.',
		}),
	],
};

const DAY_LEGS_B: TrainingDay = {
	id: 'legs-b',
	label: 'Legs B',
	lifts: [
		lift('Seated leg curl', '3', '8–12', {
			rest: '90–120s',
			cue: 'Control both directions; no bouncing.',
		}),
		lift('Hack squat', '3', '8–12', {
			rest: '2–3 min',
			cue: 'Depth you own; knees track over toes.',
		}),
		lift('Romanian deadlift', '3', '8–12', {
			rest: '2–3 min',
			cue: 'Hinge at hips; soft knees; bar close to legs.',
		}),
		lift('Walking lunges', '2', '10–12 / leg', {
			rest: '90–120s',
			cue: 'Tall torso; front knee tracks over mid-foot.',
		}),
		lift('Standing calf raise', '3', '8–15', {
			rest: '60–90s',
			cue: 'Full stretch; pause at the top.',
		}),
		lift('Cable crunch', '3', '10–15', {
			rest: '60s',
			cue: 'Crunch the ribs toward the hips.',
		}),
	],
};

/** Limited equipment (home / dumbbells) — still one exercise per slot. */
const DAY_PUSH_HOME: TrainingDay = {
	id: 'push',
	label: 'Push',
	lifts: [
		lift('Dumbbell floor press', '3', '6–12', {
			rest: '2–3 min',
			cue: 'Upper arms kiss the floor; press up without flaring hard.',
		}),
		lift('Push-up', '3', '8–15', {
			rest: '90–120s',
			cue: 'Body straight; full range you can own. Knees-down if needed.',
		}),
		lift('Dumbbell shoulder press', '3', '8–12', {
			rest: '90–120s',
			cue: 'Ribs down; press to lockout without shrugging.',
		}),
		lift('Dumbbell lateral raise', '3', '10–15', {
			rest: '60–90s',
			cue: 'Soft elbows; stop at shoulder height.',
		}),
		lift('Overhead dumbbell tricep extension', '3', '8–12', {
			rest: '60–90s',
			cue: 'Elbows high; stretch at the bottom.',
		}),
	],
};

const DAY_PULL_HOME: TrainingDay = {
	id: 'pull',
	label: 'Pull',
	lifts: [
		lift('One-arm dumbbell row', '3', '8–12', {
			rest: '90–120s',
			cue: 'Flat back; pull elbow to hip.',
		}),
		lift('Dumbbell Romanian deadlift', '3', '8–12', {
			rest: '2–3 min',
			cue: 'Hinge; feel hamstrings stretch; don’t round hard.',
		}),
		lift('Band pulldown', '3', '8–12', {
			rest: '2–3 min',
			cue: 'Pull elbows down to ribs; control the return. Progress the band strength over weeks.',
		}),
		lift('Rear-delt reverse fly', '3', '12–15', {
			rest: '60–90s',
			cue: 'Slight bend in elbows; squeeze shoulder blades.',
		}),
		lift('Dumbbell hammer curl', '3', '8–12', {
			rest: '60–90s',
			cue: 'Neutral grip; no swing.',
		}),
	],
};

const DAY_LEGS_HOME: TrainingDay = {
	id: 'legs',
	label: 'Legs',
	lifts: [
		lift('Goblet squat', '3', '8–12', {
			rest: '2–3 min',
			cue: 'Elbows inside knees; depth you own.',
		}),
		lift('Dumbbell Romanian deadlift', '3', '8–12', {
			rest: '2–3 min',
			cue: 'Hinge pattern; soft knees.',
		}),
		lift('Dumbbell reverse lunge', '2', '8–12 / leg', {
			rest: '90–120s',
			cue: 'Step back; front knee tracks mid-foot.',
		}),
		lift('Glute bridge', '3', '10–15', {
			rest: '60–90s',
			cue: 'Squeeze glutes at the top; don’t over-arch lumbar.',
		}),
		lift('Standing single-leg calf raise', '3', '10–15', {
			rest: '60s',
			cue: 'Full stretch; pause at the top.',
		}),
		lift('Dead bug', '3', '8–10 / side', {
			rest: '60s',
			cue: 'Low back pressed down; slow and controlled.',
		}),
	],
};

const DAY_UPPER_HOME: TrainingDay = {
	id: 'upper',
	label: 'Upper',
	lifts: [
		lift('Flat dumbbell bench press', '3', '6–12', {
			rest: '2–3 min',
			cue: 'On floor or bench; controlled descent.',
		}),
		lift('One-arm dumbbell row', '3', '8–12', {
			rest: '90–120s',
			cue: 'Brace hard; pull to hip.',
		}),
		lift('Dumbbell shoulder press', '2', '8–12', {
			rest: '90–120s',
			cue: 'Ribs down; clean lockout.',
		}),
		lift('Dumbbell lateral raise', '3', '10–15', {
			rest: '60–90s',
			cue: 'Light and strict.',
		}),
		lift('Overhead dumbbell tricep extension', '2', '8–12', {
			rest: '60–90s',
			cue: 'Keep elbows pointed up.',
		}),
		lift('Dumbbell hammer curl', '2', '8–12', {
			rest: '60–90s',
			cue: 'No hip drive.',
		}),
	],
};

/** Simple double progression — consistency over program-hopping. */
const PPL_PROGRESSION = [
	'Double progression: work in the listed rep range with 1–3 reps in reserve (RIR).',
	'When you hit the top of the rep range on all sets with solid form, add a little weight next session and drop back toward the bottom of the range.',
	'If you miss the bottom of the range, keep the load and earn the reps back — don’t ego-load.',
	'Miss a day? Shift the week forward. Don’t “make up” with a hero double session.',
	'Stick with this split for the full block. Consistency beats program-hopping.',
	'Every 6–8 hard weeks, optional easy week (~30% less volume) if joints or sleep are fried.',
	'Log every session. Track consistency first — missed weeks matter more than perfect sets.',
];

export type EquipmentPref = 'full-gym' | 'limited';

export const TRAINING_TEMPLATES: TrainingTemplate[] = [
	{
		id: 'ppl',
		name: 'PPL (Push / Pull / Legs)',
		level: 'Beginner → intermediate',
		daysPerWeek: 3,
		blurb:
			'Three days a week — Push, Pull, Legs. Rotate through the week (e.g. Mon / Wed / Fri). One prescribed exercise per slot. Stick with it for the block.',
		days: [DAY_PUSH, DAY_PULL, DAY_LEGS],
		progression: PPL_PROGRESSION,
	},
	{
		id: 'pplu',
		name: 'PPLU (Push / Pull / Legs / Upper)',
		level: 'Beginner → intermediate',
		daysPerWeek: 4,
		blurb:
			'Four days — Push, Pull, Legs, then a second Upper day for extra chest, shoulders, and arms. One exercise per slot. Add the fourth day when recovery and schedule allow.',
		days: [DAY_PUSH, DAY_PULL, DAY_LEGS, DAY_UPPER],
		progression: [
			...PPL_PROGRESSION,
			'Upper day is extra volume — keep shoulders happy and leave room to recover into the next Push.',
		],
	},
	{
		id: 'pplul',
		name: 'PPL + Upper + Legs B (5-day)',
		level: 'Intermediate',
		daysPerWeek: 5,
		blurb:
			'Five days — Push, Pull, Legs, Upper, then a second Legs day. More volume for people who recover well and can protect five sessions.',
		days: [DAY_PUSH, DAY_PULL, DAY_LEGS, DAY_UPPER, DAY_LEGS_B],
		progression: [
			...PPL_PROGRESSION,
			'If joints or sleep slip, drop Legs B and run 4-day PPLU for a block.',
		],
	},
	{
		id: 'pplx2',
		name: 'PPL × 2 (6-day)',
		level: 'Intermediate',
		daysPerWeek: 6,
		blurb:
			'Six days — Push / Pull / Legs twice through the week. Keep loads honest; recovery and sleep matter more than hero volume.',
		days: [DAY_PUSH, DAY_PULL, DAY_LEGS, DAY_PUSH, DAY_PULL, DAY_LEGS],
		progression: [
			...PPL_PROGRESSION,
			'Six days is optional intensity — if sessions get sloppy, drop to 4–5 days immediately.',
		],
	},
];

const TRAINING_TEMPLATES_LIMITED: TrainingTemplate[] = [
	{
		id: 'ppl-home',
		name: 'PPL (home / limited equipment)',
		level: 'Beginner → intermediate',
		daysPerWeek: 3,
		blurb:
			'Three days — Push, Pull, Legs with dumbbells and bodyweight. One prescribed exercise per slot. No gym machines required.',
		days: [DAY_PUSH_HOME, DAY_PULL_HOME, DAY_LEGS_HOME],
		progression: PPL_PROGRESSION,
	},
	{
		id: 'pplu-home',
		name: 'PPLU (home / limited equipment)',
		level: 'Beginner → intermediate',
		daysPerWeek: 4,
		blurb:
			'Four days — Push, Pull, Legs, Upper with dumbbells and bodyweight. One exercise per slot.',
		days: [DAY_PUSH_HOME, DAY_PULL_HOME, DAY_LEGS_HOME, DAY_UPPER_HOME],
		progression: [
			...PPL_PROGRESSION,
			'Upper day is extra volume — keep shoulders happy.',
		],
	},
];

/** Pick the training template for days + equipment. Limited only supports 3–4 days (maps 5–6 → 4). */
export function resolveTrainingTemplate(
	daysPerWeek: number,
	equipment: EquipmentPref = 'full-gym',
): TrainingTemplate {
	const days = ([3, 4, 5, 6].includes(daysPerWeek) ? daysPerWeek : 3) as 3 | 4 | 5 | 6;
	if (equipment === 'limited') {
		const limitedDays = days >= 4 ? 4 : 3;
		const id = limitedDays === 4 ? 'pplu-home' : 'ppl-home';
		const tpl = TRAINING_TEMPLATES_LIMITED.find((t) => t.id === id);
		if (!tpl) throw new Error(`Missing limited template: ${id}`);
		return tpl;
	}
	const id = days === 6 ? 'pplx2' : days === 5 ? 'pplul' : days === 4 ? 'pplu' : 'ppl';
	const tpl = TRAINING_TEMPLATES.find((t) => t.id === id);
	if (!tpl) throw new Error(`Missing training template: ${id}`);
	return tpl;
}

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
			{ id: 's1', label: '10,000+ steps most days', hint: 'Build gradually if you’re coming from low' },
			{ id: 's2', label: 'Optional hard conditioning ≤1×', hint: 'Only if sleep and joints are fine' },
			{ id: 's3', label: '~4 L fluids (general guide)', hint: 'More if you sweat hard' },
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
			{ id: 'w3', label: 'Calories in the plan ballpark', hint: 'Adjust from the 2–3 week trend' },
		],
	},
];

export const SYSTEM_PRODUCT = {
	name: 'Yeh Bro System',
	tagline: 'The natural playbook — best shape of your life without the circus.',
	oneLiner:
		'Phased training, food setup, and weekly checklists — the same structure you’d run with a good coach. Free on Yeh Bro.',
};
