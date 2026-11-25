/**
 * Personalised 12-week plan content (training + nutrition).
 * Site UI and PDF are separate layers — use buildPlanPdfBytes for the coaching PDF.
 * Education only — not medical advice.
 *
 * Calorie math: Mifflin–St Jeor BMR × activity → TDEE → goal adj → protein ~1.8 g/kg,
 * fat ~0.8 g/kg, carbs fill remainder. Estimates — not exact metabolism.
 */

import {
	resolveTrainingTemplate,
	type EquipmentPref,
	type TrainingTemplate,
} from '../data/start-here-system';
import {
	ACTIVITY_LABELS,
	GOAL_DEFAULTS,
	auditDailyMealPrescription,
	buildWeekShoppingFromPlans,
	scaleCoachDayPlans,
	type Activity,
	type CoachDayPlan,
	type FoodOsResult,
	type Goal,
	type NutritionAuditIssue,
	type PlanShoppingList,
	type Sex,
	type StoredFoodOs,
	type TrainingDaysPref,
} from './food-os';
import type { DietaryPrefs, ExperienceLevel, TargetSource } from './user-store';
import {
	adaptTrainingDeterministic,
	parseLimitations,
	type TrainingPersonaliseResult,
} from './training-personalise';

export type TrainingDays = 3 | 4 | 5 | 6;

export type PersonalPlanInputs = StoredFoodOs & {
	goalWeightKg?: number;
	targetsSource?: TargetSource;
	dietary?: DietaryPrefs;
	firstName?: string;
	email?: string;
	experience?: ExperienceLevel;
	equipment?: EquipmentPref;
	/** Optional free-text injuries / limitations. */
	limitations?: string;
	/** Typical nightly sleep hours band. */
	sleepHours?: 'under-6' | '6-7' | '7-9' | 'over-9';
	/** Current daily steps band — drives gradual build copy. */
	stepsBand?: 'under-5k' | '5-8k' | '8-10k' | '10k-plus';
};

export interface TwelveWeekBlock {
	weeks: string;
	title: string;
	focus: string[];
}

export interface NextPhaseRec {
	title: string;
	summary: string;
	bullets: string[];
}

export interface DailyHabit {
	title: string;
	detail: string;
}

export interface PlanSectionItem {
	title: string;
	detail: string;
}

export interface PersonalPlanDoc {
	generatedAt: string;
	/** Natural first name for cover / intro — never forced every line. */
	firstName?: string;
	email?: string;
	profile: {
		weightKg: number;
		heightCm: number;
		age: number;
		sex: Sex;
		activityLabel: string;
		goalLabel: string;
		goal: Goal;
		cutPct: number;
		bulkPct: number;
		goalWeightKg?: number;
		/** True when goal weight is a suggested guide, not a promise. */
		goalWeightSuggested?: boolean;
		experience?: ExperienceLevel;
		equipment?: EquipmentPref;
		limitations?: string;
		sleepHours?: PersonalPlanInputs['sleepHours'];
		stepsBand?: PersonalPlanInputs['stepsBand'];
	};
	/** Cover / intro copy — personalised, natural. */
	intro: {
		title: string;
		lede: string;
		paragraphs: string[];
	};
	targets: {
		calories: number;
		tdee: number;
		bmr: number;
		proteinG: number;
		carbsG: number;
		fatG: number;
		adjustmentPct: number;
		why: string[];
		source: TargetSource;
	};
	training: TrainingTemplate;
	/** Limitation personalisation meta (AI or deterministic). */
	trainingPersonalisation?: {
		mode: TrainingPersonaliseResult['mode'];
		adaptations: string[];
		message?: string;
		refused?: boolean;
	};
	/**
	 * Nutrition days for the plan. Index 0 is the one prescribed daily meal plan.
	 * Optional diet-break week may follow — never a duplicated rest/training twin.
	 */
	nutritionDays: CoachDayPlan[];
	nutritionLede: string;
	/** Profile line under nutrition (targets vs body). */
	nutritionProfileLine: string;
	nutritionProfileNote?: string;
	/** Prominent non-negotiables — steps 10k+, water ~4 L. */
	nonNegotiables: PlanSectionItem[];
	dailyHabits: DailyHabit[];
	recovery: PlanSectionItem[];
	progressTracking: PlanSectionItem[];
	actionPlan: PlanSectionItem[];
	priorities: string[];
	close: string;
	shopping: PlanShoppingList;
	/** Empty when kcal/macro line→meal→day checks pass. Fail → do not silently deliver. */
	nutritionAudit: NutritionAuditIssue[];
	goalFraming: {
		headline: string;
		timeframe: string;
		schedule: string[];
	};
	twelveWeek: TwelveWeekBlock[];
	nextPhase: NextPhaseRec;
	dietaryNote?: string;
	disclaimer: string;
}

function displayName(firstName?: string): string | undefined {
	const n = firstName?.trim();
	if (!n) return undefined;
	return n.charAt(0).toUpperCase() + n.slice(1);
}

/** One place for steps / cardio / water / recover — not 25 rules. */
export function buildDailyHabits(
	inputs: Pick<
		PersonalPlanInputs,
		'activity' | 'goal' | 'sex' | 'weightKg' | 'stepsBand' | 'sleepHours'
	>,
): DailyHabit[] {
	const lowAct = inputs.activity === 'sedentary' || inputs.activity === 'light';
	const lowSteps =
		inputs.stepsBand === 'under-5k' ||
		inputs.stepsBand === '5-8k' ||
		(inputs.stepsBand == null && lowAct);
	const stepDetail = lowSteps
		? 'Minimum target: 10,000 steps / day. If you’re under that now, build in stages (e.g. +1–2k / week) until 10,000+ sticks — don’t jump overnight.'
		: 'Minimum target: 10,000 steps / day. Keep it there most days; more is fine if recovery allows.';
	const cardioDefault =
		inputs.goal === 'cut'
			? 'Default ~3×10 min easy spin (or 2×20 min walk/bike) on non-lift days — optional, not punishment.'
			: 'Default ~2×20 min easy cardio or 3×10 min spin if you enjoy it — optional.';
	const water =
		'~4 litres fluids / day as a general guide (a little less on rest / cooler days; more if you sweat hard or train in heat). Not a medical prescription.';
	const sleep =
		inputs.sleepHours === 'under-6' || inputs.sleepHours === '6-7'
			? 'Protect sleep — push toward 7–9 h most nights. Same bedtime beats weekend catch-up.'
			: 'Protect sleep (aim 7–9 h). Easy walks beat redline conditioning when you’re fried.';
	return [
		{
			title: 'Train',
			detail: 'Hit your scheduled lift days. Show up > perfect sessions.',
		},
		{
			title: 'Move',
			detail: stepDetail,
		},
		{
			title: 'Cardio',
			detail: cardioDefault,
		},
		{
			title: 'Hydrate',
			detail: water,
		},
		{
			title: 'Recover',
			detail: sleep,
		},
	];
}

export function buildNonNegotiables(
	inputs: Pick<PersonalPlanInputs, 'activity' | 'stepsBand' | 'sex'>,
): PlanSectionItem[] {
	const lowAct = inputs.activity === 'sedentary' || inputs.activity === 'light';
	const lowSteps =
		inputs.stepsBand === 'under-5k' ||
		inputs.stepsBand === '5-8k' ||
		(inputs.stepsBand == null && lowAct);
	return [
		{
			title: '10,000+ steps / day',
			detail: lowSteps
				? 'This is a floor, not a flex. Build toward 10,000 if you’re below it — gradual weekly bumps beat a heroic week then nothing.'
				: 'Keep daily steps at 10,000 or more most days. Treat it like a session on the calendar.',
		},
		{
			title: '~4 litres water / day',
			detail:
				'General target around 4 L of fluids. Adjust for heat, sweat, and body size — not a hard medical rule. Tick it on the daily checklist.',
		},
		{
			title: 'Protein + scheduled lifts',
			detail:
				'Hit protein most days and show up for the lift days you booked. Consistency compounds faster than perfect macros.',
		},
	];
}

export function buildRecoverySection(
	inputs: Pick<PersonalPlanInputs, 'sleepHours' | 'trainingDays' | 'limitations'>,
): PlanSectionItem[] {
	const restDays = Math.max(0, 7 - (inputs.trainingDays || 3));
	const items: PlanSectionItem[] = [
		{
			title: 'Sleep 7–9 hours',
			detail:
				inputs.sleepHours === 'under-6' || inputs.sleepHours === '6-7'
					? 'You’re undershooting sleep. Protect a fixed window before chasing more volume or cardio.'
					: 'Most nights in the 7–9 h range. Same bedtime beats weekend catch-up.',
		},
		{
			title: `Rest days (~${restDays} / week)`,
			detail:
				'Rest days are part of the plan. Easy walking is fine; don’t stack hero sessions on every free day.',
		},
		{
			title: 'Fatigue check',
			detail:
				'If mood, joints, or lifts slide for days, cut volume ~30% for a week or drop optional cardio. Persistent issues → clinician, not more caffeine.',
		},
	];
	if (inputs.limitations?.trim()) {
		items.push({
			title: 'Your notes',
			detail: `Work around what you flagged: ${inputs.limitations.trim()}. Pain ≠ normal soreness — regress the lift or skip it.`,
		});
	}
	return items;
}

export function buildProgressTracking(): PlanSectionItem[] {
	return [
		{
			title: 'Weekly average weight',
			detail: '2–3 morning weigh-ins (same conditions). Use the weekly average — ignore single-day noise.',
		},
		{
			title: 'Progress photos',
			detail: 'Same lighting, pose, and time of day every 2–4 weeks. Photos catch what the scale misses.',
		},
		{
			title: 'Measurements (optional)',
			detail: 'Waist / hips every 2–4 weeks if you like numbers. Trend > one reading.',
		},
		{
			title: 'Training log',
			detail: 'Load + reps on main lifts each session. Double progression lives in the logbook.',
		},
		{
			title: 'Habit checklist',
			detail: 'Train / 10,000+ steps / ~4 L fluids / sleep window. Tick daily; review weekly.',
		},
	];
}

export function buildActionPlan(
	name: string | undefined,
	goal: Goal,
	training: TrainingTemplate,
): PlanSectionItem[] {
	const who = name ? `${name}, this` : 'This';
	return [
		{
			title: 'This week',
			detail: `${who} week: put all ${training.daysPerWeek} lift days on the calendar, buy the shopping list once, and start the 10,000-step floor.`,
		},
		{
			title: 'Daily',
			detail:
				'Hit protein, drink toward ~4 L, walk your steps, sleep in the 7–9 h window. Tick the checklist.',
		},
		{
			title: 'Every session',
			detail:
				'Run the prescribed lifts only — one exercise per slot. Log sets/reps. Add load when you own the top of the range.',
		},
		{
			title: 'Every 2–3 weeks',
			detail:
				goal === 'cut'
					? 'Check scale trend. Flat with solid adherence → nudge calories slightly down or steps up. Crashing energy → optional diet break at maintenance.'
					: goal === 'lean-bulk'
						? 'Check waist vs strength. Surplus should feel boring — pull food back if the waist races ahead.'
						: 'Confirm weight is stable and lifts are improving. Then choose cut or lean bulk from data, not stress.',
		},
	];
}

export function buildIntro(
	name: string | undefined,
	inputs: PersonalPlanInputs,
	result: FoodOsResult,
	training: TrainingTemplate,
): PersonalPlanDoc['intro'] {
	const goalLabel = GOAL_DEFAULTS[inputs.goal].label;
	const title = name ? `${name} — your Yeh Bro plan` : 'Your Yeh Bro plan';
	const lede = name
		? `${name}, here’s a 12-week block built from your stats — not a generic PDF with a name stuck on top.`
		: 'Here’s a 12-week block built from your stats — not a generic template.';
	const paragraphs: string[] = [
		`Starting point: ${inputs.weightKg} kg · ${inputs.heightCm} cm · age ${inputs.age}. Goal: ${goalLabel}. Training: ${training.daysPerWeek}-day ${training.name.split(' (')[0]}.`,
		`Estimated maintenance ≈ ${result.tdee} kcal. Your daily target is ~${result.calories} kcal (P ${result.proteinG}g · C ${result.carbsG}g · F ${result.fatG}g). These are estimates from standard formulas — adjust from your scale trend and how training feels.`,
	];
	if (inputs.experience === 'beginner') {
		paragraphs.push(
			'You’re early in the lifting game — keep loads honest, learn the prescribed movements, and chase consistency before intensity.',
		);
	} else if (inputs.experience === 'experienced') {
		paragraphs.push(
			'You’ve got training years behind you — own the double progression, keep form honest, and don’t invent extra work the plan didn’t ask for.',
		);
	}
	if (inputs.equipment === 'limited') {
		paragraphs.push(
			'Equipment is limited, so every slot is a dumbbell / bodyweight prescription you can run at home or a minimal gym.',
		);
	}
	return { title, lede, paragraphs };
}

export function buildPriorities(
	name: string | undefined,
	goal: Goal,
	training: TrainingTemplate,
): string[] {
	const open = name ? `${name} — priorities for this block:` : 'Priorities for this block:';
	return [
		open,
		`Show up for ${training.daysPerWeek} lift days and log them.`,
		'Hit protein most days; keep calories near target.',
		'Floor: 10,000 steps / day and ~4 L fluids.',
		goal === 'cut'
			? 'Judge fat loss from the 2–3 week scale trend — not Tuesday’s water weight.'
			: goal === 'lean-bulk'
				? 'Grow slowly — strength up, waist under control.'
				: 'Lock habits at maintenance before forcing a cut or surplus.',
	];
}

export function buildClose(name: string | undefined, goal: Goal): string {
	const bit =
		goal === 'cut'
			? 'Stay patient in the deficit and protect training quality.'
			: goal === 'lean-bulk'
				? 'Keep the surplus boring and the logbook honest.'
				: 'Nail the habits, then choose the next phase from data.';
	if (name) {
		return `${name}, you’ve got the plan. Execute the boring basics for 12 weeks — ${bit} Yeh Bro is here when you want a deeper coaching block; the PDF stands on its own.`;
	}
	return `You’ve got the plan. Execute the boring basics for 12 weeks — ${bit} Yeh Bro is here when you want a deeper coaching block; the PDF stands on its own.`;
}

export function pickTrainingTemplate(
	days: TrainingDays,
	equipment: EquipmentPref = 'full-gym',
): TrainingTemplate {
	return resolveTrainingTemplate(days, equipment);
}

export function buildGoalFraming(
	goal: Goal,
	training: TrainingTemplate,
	calories: number,
	name?: string,
): PersonalPlanDoc['goalFraming'] {
	const schedule = [
		`Lift ${training.daysPerWeek}× / week on ${training.name.split(' (')[0]}.`,
		'Weigh in 2–3 mornings/week (same conditions) — trend beats single days.',
		'Protein first; use the rest + training day meal templates. Diet break is optional.',
		'Non-negotiable floor: 10,000 steps / day and ~4 L fluids.',
	];
	const who = name ? `${name} — ` : '';
	if (goal === 'cut') {
		return {
			headline: `${who}12-week cut block @ ~${calories} kcal / day`,
			timeframe:
				'Aim for a steady scale trend (often ~0.5–1% body weight / week). If flat 2–3 weeks with adherence, nudge food — don’t panic-cut. Any goal weight is a suggested guide, not a promise.',
			schedule: [
				...schedule,
				'If energy / lifts tank for a stretch, consider an optional 1–2 week diet break at maintenance, then resume.',
			],
		};
	}
	if (goal === 'lean-bulk') {
		return {
			headline: `${who}12-week lean bulk @ ~${calories} kcal / day`,
			timeframe:
				'Slow surplus — grow without a dirty bulk. Expect gradual scale creep; pull back if waist races ahead of strength.',
			schedule: [
				...schedule,
				'Keep progression boring: add load or reps when you own the top of the rep range.',
			],
		};
	}
	return {
		headline: `${who}12-week maintain / rebuild @ ~${calories} kcal / day`,
		timeframe:
			'Hold weight while training quality and habits rise. Best default if you’re unsure about a cut or surplus yet.',
		schedule: [
			...schedule,
			'After habits stick, choose cut or lean bulk from the scale + how clothes fit — not from one stressful week.',
		],
	};
}

export function buildTwelveWeekBlocks(goal: Goal, training: TrainingTemplate): TwelveWeekBlock[] {
	const split =
		training.daysPerWeek === 6
			? '6-day PPL×2'
			: training.daysPerWeek === 5
				? '5-day PPLUL'
				: training.daysPerWeek === 4
					? '4-day PPLU'
					: '3-day PPL';
	return [
		{
			weeks: 'Weeks 1–2',
			title: 'Setup',
			focus: [
				`Lock ${split} on the calendar — protect a sleep window.`,
				'Log sessions; weigh in 2–3× / week under the same conditions.',
				'Hit protein most days; keep calories in your target ballpark.',
				'Install the 10,000-step floor and ~4 L fluid habit.',
			],
		},
		{
			weeks: 'Weeks 3–6',
			title: 'Consistency',
			focus: [
				`Same ${split} — stop program-hopping.`,
				'Double progression: earn the top of the rep range, then add load.',
				goal === 'cut'
					? 'Stay in the deficit; optional diet break only if flat / depleted for a stretch.'
					: goal === 'lean-bulk'
						? 'Own the surplus without ego eating — training quality first.'
						: 'Maintain calories; let the logbook improve.',
			],
		},
		{
			weeks: 'Weeks 7–10',
			title: 'Progress',
			focus: [
				'Add weight or reps when you own the top of the rep range with solid form.',
				'Track 3–5 main lifts; ignore the rest of the noise.',
				'Optional easier week (~30% volume) if sleep or joints are wrecked.',
			],
		},
		{
			weeks: 'Weeks 11–12',
			title: 'Review',
			focus: [
				'Keep showing up — polish adherence, don’t invent a new program.',
				'Compare week 1 vs week 12: sessions hit, scale trend, how lifts feel.',
				'Decide next phase from that data — education, not a prescription.',
			],
		},
	];
}

export function buildNextPhase(goal: Goal, tdee: number): NextPhaseRec {
	if (goal === 'cut') {
		return {
			title: 'After 12 weeks on a cut',
			summary: `Compare the scale trend and training quality. Est. maintenance ≈ ${tdee} kcal — use that as the diet-break / reverse anchor.`,
			bullets: [
				'Still have fat to lose and lifts feel fine → continue the cut another block, or take an optional 1–2 week diet break then resume.',
				'Flat, exhausted, or strength sliding → diet break / reverse toward maintenance for 1–4 weeks, then reassess.',
				'Happy with leanness → maintain 2–4 weeks, then lean bulk if you want size.',
				'Education only — not medical advice. Clinical conditions → talk to a clinician.',
			],
		};
	}
	if (goal === 'lean-bulk') {
		return {
			title: 'After 12 weeks on a lean bulk',
			summary: `Check waist vs strength. Maintenance ≈ ${tdee} kcal if you need to settle.`,
			bullets: [
				'Strength up, waist under control → continue lean bulk or keep a small surplus.',
				'Waist raced ahead → short maintain or mini-cut (a few weeks), then decide.',
				'Want a reset → maintain 2–4 weeks, then pick cut or another surplus block.',
				'Education only — not a personal prescription.',
			],
		};
	}
	return {
		title: 'After 12 weeks at maintain',
		summary: `Habits first. Maintenance ≈ ${tdee} kcal. Next phase is a choice, not a panic.`,
		bullets: [
			'Want fat loss → start a cut block with a deficit + training/rest day templates.',
			'Want size → lean bulk (~10% over maintenance) and keep PPL / PPLU progression.',
			'Still rebuilding habit → another maintain block is a win, not a stall.',
			'Education only — not medical advice.',
		],
	};
}

export type BuildPersonalPlanOptions = {
	/** Pre-computed limitation personalisation (from /api/plan/personalise or local). */
	trainingPersonalisation?: TrainingPersonaliseResult;
};

export function buildPersonalPlan(
	inputs: PersonalPlanInputs,
	result: FoodOsResult,
	opts?: BuildPersonalPlanOptions,
): PersonalPlanDoc {
	const days = ([3, 4, 5, 6].includes(inputs.trainingDays)
		? inputs.trainingDays
		: 3) as TrainingDaysPref;
	const equipment: EquipmentPref = inputs.equipment === 'limited' ? 'limited' : 'full-gym';
	const baseTraining = pickTrainingTemplate(days, equipment);
	const parsedLimits = parseLimitations(inputs.limitations);
	const personalisation =
		opts?.trainingPersonalisation ??
		adaptTrainingDeterministic(baseTraining, parsedLimits, equipment);

	const training = personalisation.ok && personalisation.training
		? personalisation.training
		: baseTraining;

	const name = displayName(inputs.firstName);
	const scaled = scaleCoachDayPlans(result, {
		weightKg: inputs.weightKg,
		heightCm: inputs.heightCm,
		age: inputs.age,
	});
	// PDF / plan surface: one daily plan first; diet-break kept as optional alternate.
	const nutritionDays = scaled.plans.filter(
		(p) => p.id === 'training' || p.id === 'diet-break',
	);
	const shopping = buildWeekShoppingFromPlans(nutritionDays, days);
	const nutritionAudit: NutritionAuditIssue[] = [];
	const daily = nutritionDays.find((p) => p.id === 'training');
	if (daily) nutritionAudit.push(...auditDailyMealPrescription(daily));
	for (const p of nutritionDays) {
		if (p.id === 'training') continue;
		nutritionAudit.push(...auditDailyMealPrescription(p));
	}
	if (shopping.orphans.length) {
		nutritionAudit.push({
			path: 'shopping.orphans',
			message: `Unparsed shopping lines: ${shopping.orphans.join(', ')}`,
		});
	}
	if (!personalisation.ok) {
		nutritionAudit.push({
			path: 'training.limitations',
			message:
				personalisation.message ||
				'Training could not be safely personalised for the stated limitations.',
		});
	}
	for (const issue of personalisation.validationIssues) {
		nutritionAudit.push({ path: 'training.validation', message: issue });
	}

	const dietaryBits: string[] = [];
	if (inputs.dietary && inputs.dietary.pattern !== 'none') {
		dietaryBits.push(`Dietary pattern: ${inputs.dietary.pattern}`);
	}
	if (inputs.dietary?.excludes) dietaryBits.push(`Excludes: ${inputs.dietary.excludes}`);
	if (inputs.dietary?.notes) dietaryBits.push(inputs.dietary.notes);
	return {
		generatedAt: new Date().toISOString().slice(0, 10),
		firstName: name,
		email: inputs.email?.trim() || undefined,
		profile: {
			weightKg: inputs.weightKg,
			heightCm: inputs.heightCm,
			age: inputs.age,
			sex: inputs.sex,
			activityLabel: ACTIVITY_LABELS[inputs.activity as Activity],
			goalLabel: GOAL_DEFAULTS[inputs.goal].label,
			goal: inputs.goal,
			cutPct: inputs.cutPct,
			bulkPct: inputs.bulkPct,
			goalWeightKg: inputs.goalWeightKg,
			goalWeightSuggested: inputs.goalWeightKg != null,
			experience: inputs.experience,
			equipment,
			limitations: inputs.limitations?.trim() || undefined,
			sleepHours: inputs.sleepHours,
			stepsBand: inputs.stepsBand,
		},
		intro: buildIntro(name, inputs, result, training),
		targets: {
			calories: result.calories,
			tdee: result.tdee,
			bmr: result.bmr,
			proteinG: result.proteinG,
			carbsG: result.carbsG,
			fatG: result.fatG,
			adjustmentPct: result.adjustmentPct,
			why: result.why,
			source: inputs.targetsSource === 'user' ? 'user' : 'calculated',
		},
		training,
		trainingPersonalisation: {
			mode: personalisation.mode,
			adaptations: personalisation.adaptations,
			message: personalisation.message,
			refused: !personalisation.ok,
		},
		nutritionDays,
		nutritionLede: scaled.lede,
		nutritionProfileLine: scaled.profileLine,
		nutritionProfileNote: scaled.profileNote,
		nonNegotiables: buildNonNegotiables(inputs),
		dailyHabits: buildDailyHabits(inputs),
		recovery: buildRecoverySection({ ...inputs, trainingDays: days }),
		progressTracking: buildProgressTracking(),
		actionPlan: buildActionPlan(name, inputs.goal, training),
		priorities: buildPriorities(name, inputs.goal, training),
		close: buildClose(name, inputs.goal),
		shopping,
		nutritionAudit,
		goalFraming: buildGoalFraming(inputs.goal, training, result.calories, name),
		twelveWeek: buildTwelveWeekBlocks(inputs.goal, training),
		nextPhase: buildNextPhase(inputs.goal, result.tdee),
		dietaryNote: dietaryBits.length ? dietaryBits.join(' · ') : undefined,
		disclaimer:
			'Yeh Bro — education only, not medical advice or a personal prescription. Calorie and macro estimates vary; adjust from your scale trend and how training feels. Goal weight (if shown) is a suggested guide, not a guarantee. Under 18 or clinical conditions → talk to a clinician. We don’t source AAS / SARMs / grey-market gear. Food line macros come from a food database × quantity; meal and day totals are the sum of those lines.',
	};
}

export function planFilename(doc: PersonalPlanDoc): string {
	const goal = doc.profile.goal.replace('lean-bulk', 'lean-bulk');
	const who = doc.firstName ? `${doc.firstName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-` : '';
	return `yeh-bro-plan-${who}${doc.profile.weightKg}kg-${goal}-${doc.training.daysPerWeek}day.pdf`;
}

/** Detect alternative-exercise language in a finished plan (QA). */
export function findAlternativeWording(doc: PersonalPlanDoc): string[] {
	const hits: string[] = [];
	for (const day of doc.training.days) {
		for (const lift of day.lifts) {
			const text = `${lift.name} | ${lift.cue ?? ''}`;
			if (/\balternative[s]?\b/i.test(text) || /\bor alternatively\b/i.test(text)) {
				hits.push(`${day.label}: ${lift.name}`);
			}
		}
	}
	return hits;
}
