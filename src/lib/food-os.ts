/**
 * Calorie + macro estimates for lifters + personalised meal templates.
 * Mifflin–St Jeor BMR × activity, then goal adjustment.
 * Meal line macros come from the food DB (quantity × per-100g) — never portion-weighted fakes.
 * Educational starting point — not medical advice.
 */

import { getFood, macrosForFoodAmount, parseFoodAmount } from '../data/food-db';

export type Sex = 'male' | 'female';
export type Goal = 'cut' | 'maintain' | 'lean-bulk';
export type Activity =
	| 'sedentary'
	| 'light'
	| 'moderate'
	| 'active'
	| 'very-active';

export interface FoodOsInputs {
	weightKg: number;
	heightCm: number;
	age: number;
	sex: Sex;
	activity: Activity;
	goal: Goal;
	/** Cut deficit as fraction of TDEE (default 0.18). Lean bulk surplus default 0.1. */
	adjustment?: number;
	/** Protein g per kg (default 1.8). */
	proteinPerKg?: number;
	/** Fat g per kg (default 0.8). */
	fatPerKg?: number;
}

export interface FoodOsResult {
	bmr: number;
	tdee: number;
	calories: number;
	proteinG: number;
	fatG: number;
	carbsG: number;
	goal: Goal;
	adjustmentPct: number;
	why: string[];
}

export const ACTIVITY_LABELS: Record<Activity, string> = {
	sedentary: 'Mostly desk / little formal training',
	light: '1–3 lift days, light steps',
	moderate: '3–5 lift days, decent steps',
	active: '5–6 hard training days',
	'very-active': 'Two-a-days or physical job + lifting',
};

export const ACTIVITY_MULTIPLIERS: Record<Activity, number> = {
	sedentary: 1.2,
	light: 1.375,
	moderate: 1.55,
	active: 1.725,
	'very-active': 1.9,
};

export const GOAL_DEFAULTS: Record<
	Goal,
	{ label: string; defaultAdj: number; blurb: string }
> = {
	cut: {
		label: 'Lose body fat',
		defaultAdj: -0.18,
		blurb: '~15–20% below maintenance — fat loss without torching lifts.',
	},
	maintain: {
		label: 'Maintain / recomp',
		defaultAdj: 0,
		blurb: 'Hold weight while training quality and habits rise.',
	},
	'lean-bulk': {
		label: 'Build muscle',
		defaultAdj: 0.1,
		blurb: '~10% above maintenance — grow without a dirty bulk.',
	},
};

export const STORAGE_KEY = 'yehbro-food-os-v1';

export function clamp(n: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, n));
}

/** Mifflin–St Jeor resting estimate (kcal/day). */
export function calcBmr(weightKg: number, heightCm: number, age: number, sex: Sex): number {
	const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
	return sex === 'male' ? base + 5 : base - 161;
}

export function calcFoodOs(inputs: FoodOsInputs): FoodOsResult | null {
	const { weightKg, heightCm, age, sex, activity, goal } = inputs;
	if (
		!Number.isFinite(weightKg) ||
		!Number.isFinite(heightCm) ||
		!Number.isFinite(age) ||
		weightKg < 35 ||
		weightKg > 250 ||
		heightCm < 120 ||
		heightCm > 230 ||
		age < 16 ||
		age > 90
	) {
		return null;
	}

	const bmr = calcBmr(weightKg, heightCm, age, sex);
	const tdee = bmr * ACTIVITY_MULTIPLIERS[activity];

	const defaults = GOAL_DEFAULTS[goal];
	let adj = inputs.adjustment ?? defaults.defaultAdj;
	if (goal === 'cut') adj = clamp(adj, -0.25, -0.1);
	else if (goal === 'lean-bulk') adj = clamp(adj, 0.05, 0.15);
	else adj = 0;

	const calories = Math.round(tdee * (1 + adj));
	const proteinPerKg = clamp(inputs.proteinPerKg ?? 1.8, 1.4, 2.4);
	const fatPerKg = clamp(inputs.fatPerKg ?? 0.8, 0.6, 1.2);
	const proteinG = Math.round(weightKg * proteinPerKg);
	const fatG = Math.round(weightKg * fatPerKg);
	const proteinKcal = proteinG * 4;
	const fatKcal = fatG * 9;
	const carbKcal = Math.max(0, calories - proteinKcal - fatKcal);
	const carbsG = Math.round(carbKcal / 4);

	const adjPct = Math.round(Math.abs(adj) * 100);
	const why: string[] = [
		`Resting estimate (Mifflin–St Jeor) ≈ ${Math.round(bmr)} kcal, then × activity (${ACTIVITY_LABELS[activity].toLowerCase()}) ≈ ${Math.round(tdee)} kcal maintenance.`,
	];
	if (goal === 'cut') {
		why.push(
			`Cut target is about ${adjPct}% under that so fat comes off while you keep lifting — start here, then nudge from the 2–3 week scale trend.`,
		);
	} else if (goal === 'lean-bulk') {
		why.push(
			`Lean bulk sits about ${adjPct}% over maintenance so you can grow without a dirty surplus that undoes the next cut.`,
		);
	} else {
		why.push(
			`Maintain holds weight so training quality and habits can rise before you force a deficit or surplus.`,
		);
	}
	why.push(
		`Protein ≈ ${proteinPerKg.toFixed(1)} g/kg (${proteinG} g) — the lever that protects muscle. Fat ≈ ${fatPerKg.toFixed(1)} g/kg for hormones and satiety; carbs fill the rest for training fuel.`,
	);

	return {
		bmr: Math.round(bmr),
		tdee: Math.round(tdee),
		calories,
		proteinG,
		fatG,
		carbsG,
		goal,
		adjustmentPct: adjPct,
		why,
	};
}

export type TrainingDaysPref = 3 | 4 | 5 | 6;

export interface StoredFoodOs {
	weightKg: number;
	heightCm: number;
	age: number;
	sex: Sex;
	activity: Activity;
	goal: Goal;
	cutPct: number;
	bulkPct: number;
	/** 3 → PPL, 4 → PPLU (Yeh Bro System defaults). */
	trainingDays: TrainingDaysPref;
}

export const DEFAULT_INPUTS: StoredFoodOs = {
	weightKg: 80,
	heightCm: 178,
	age: 28,
	sex: 'male',
	activity: 'moderate',
	goal: 'maintain',
	cutPct: 18,
	bulkPct: 10,
	trainingDays: 3,
};

export interface MealFramework {
	id: string;
	title: string;
	when: string;
	plates: string[];
}

/** Soft plate heuristics — secondary to coach day templates below. */
export const MEAL_FRAMEWORKS: MealFramework[] = [
	{
		id: 'high-protein-day',
		title: 'High-protein day (any goal)',
		when: 'When you need protein without an app spiral — use beside the coach day templates.',
		plates: [
			'Breakfast: eggs or Greek-style yoghurt + fruit + toast or oats',
			'Lunch: chicken, tuna, lean beef, or tofu bowl — rice/potato + veg',
			'Dinner: similar protein + carb + veg; sauce is fine, don’t fear oil in cooking',
			'Gap filler: whey/plant scoop, cottage cheese, or jerky if food undershoots',
		],
	},
	{
		id: 'au-practical',
		title: 'Practical staples',
		when: 'Grocery reality beside the Woolworths weekly list.',
		plates: [
			'Protein: chicken thigh/breast, lean mince, eggs, tuna cans, Greek yoghurt, tofu, whey',
			'Carbs: rice, pasta, potatoes, bread, oats, fruit',
			'Fats: olive oil, avocado, nuts, fatty fish when it fits the budget',
			'Convenience: rotisserie chicken, frozen veg, microwave rice — still counts',
		],
	},
];

/** Example body the founder coach macros were built for — not a universal prescription. */
export const COACH_PLAN_EXAMPLE_PROFILE = {
	age: 36,
	weightKg: 80,
	heightCm: 178,
} as const;

export interface CoachIngredient {
	/** Food DB id — required for materialised lines. */
	foodId?: string;
	name: string;
	/** Portion as logged — e.g. "60 g", "15 ml", "1 bar". */
	amount: string;
	/** Shopping / brand note. Never invent SKUs. */
	note?: string;
	/** Line macros from food DB × quantity. Must sum to the meal. */
	kcal?: number;
	proteinG?: number;
	carbsG?: number;
	fatG?: number;
	fibreG?: number;
}

export interface CoachMealSlot {
	name: string;
	kcal: number;
	proteinG: number;
	carbsG: number;
	fatG: number;
	fibreG?: number;
	/** True for Intra — fixed practical serve (not scaled with goal calories). */
	intra?: boolean;
	ingredients?: CoachIngredient[];
}

/** Template ingredient before macros are materialised from the food DB. */
export interface MealIngredientDef {
	foodId: string;
	amount: string;
	note?: string;
}

export interface MealTemplateDef {
	name: string;
	intra?: boolean;
	ingredients: MealIngredientDef[];
}

export interface CoachDayPlan {
	/** `training` = the one prescribed daily plan; `diet-break` = optional alternate week. */
	id: 'training' | 'diet-break' | 'non-training';
	title: string;
	when: string;
	calories: number;
	proteinG: number;
	carbsG: number;
	fatG: number;
	fibreG: number;
	proteinPct: number;
	carbsPct: number;
	fatPct: number;
	meals: CoachMealSlot[];
	/** True once founder has sent full ingredients for this day type. */
	recipesReady: boolean;
}

export interface ShoppingListLine {
	name: string;
	amount: string;
	note?: string;
}

/** Baseline meal ingredient defs — macros come from FOOD_DB, not hardcoded meal totals. */
const MEAL_OATS_DEF: MealTemplateDef = {
	name: 'Protein oats',
	ingredients: [
		{ foodId: 'oats', amount: '60 g' },
		{ foodId: 'wpi_vanilla', amount: '30 g' },
		{ foodId: 'walnuts', amount: '10 g' },
		{ foodId: 'sf_maple', amount: '15 ml' },
		{ foodId: 'strawberries', amount: '100 g' },
	],
};

const MEAL_CHICKEN_DEF: MealTemplateDef = {
	name: 'Chicken and rice',
	ingredients: [
		{ foodId: 'chicken_breast_cooked', amount: '120 g' },
		{ foodId: 'mexican_rice', amount: '175 g' },
		{ foodId: 'carrots_peas_corn', amount: '100 g' },
		{ foodId: 'peri_mayo', amount: '15 ml' },
	],
};

const MEAL_SNACK_DEF: MealTemplateDef = {
	name: 'Snack',
	ingredients: [
		{ foodId: 'muesli_bar', amount: '1 bar' },
		{ foodId: 'kiwi', amount: '100 g' },
	],
};

/** Pre-workout includes prescribed 1 L coconut water (not optional / not a separate meal). */
const MEAL_PRE_DEF: MealTemplateDef = {
	name: 'Pre-workout',
	ingredients: [
		{ foodId: 'puffed_rice', amount: '60 g' },
		{ foodId: 'wpi_choc', amount: '20 g' },
		{ foodId: 'banana', amount: '50 g' },
		{ foodId: 'peanut_butter', amount: '10 g' },
		{ foodId: 'coconut_water', amount: '1000 ml' },
	],
};

const MEAL_SPAG_DEF: MealTemplateDef = {
	name: 'Spag bowl',
	ingredients: [
		{ foodId: 'lean_mince_5', amount: '120 g' },
		{ foodId: 'pasta_dry', amount: '60 g' },
		{ foodId: 'passata', amount: '100 ml' },
		{ foodId: 'zucchini', amount: '75 g' },
		{ foodId: 'mushrooms', amount: '75 g' },
	],
};

const MEAL_DESSERT_DEF: MealTemplateDef = {
	name: 'Yoghurt and berries',
	ingredients: [
		{ foodId: 'hp_yoghurt', amount: '150 g' },
		{ foodId: 'mixed_berries', amount: '150 g' },
		{ foodId: 'sf_maple', amount: '15 ml' },
	],
};

/** One complete daily meal structure — coconut water lives inside Pre-workout only. */
const COACH_DAILY_MEAL_DEFS: MealTemplateDef[] = [
	MEAL_OATS_DEF,
	MEAL_CHICKEN_DEF,
	MEAL_SNACK_DEF,
	MEAL_PRE_DEF,
	MEAL_SPAG_DEF,
	MEAL_DESSERT_DEF,
];

/** @deprecated Kept for legacy shopping helpers; prefer COACH_DAILY_MEAL_DEFS. */
const COACH_BASE_MEAL_DEFS: MealTemplateDef[] = COACH_DAILY_MEAL_DEFS;

const DIET_BREAK_MEAL_DEFS: MealTemplateDef[] = [
	MEAL_OATS_DEF,
	{
		...MEAL_CHICKEN_DEF,
		ingredients: [
			{ foodId: 'chicken_breast_cooked', amount: '120 g' },
			{ foodId: 'mexican_rice', amount: '225 g' },
			{ foodId: 'carrots_peas_corn', amount: '100 g' },
			{ foodId: 'peri_mayo', amount: '15 ml' },
		],
	},
	{
		...MEAL_SNACK_DEF,
		ingredients: [
			{ foodId: 'muesli_bar', amount: '2 bars' },
			{ foodId: 'kiwi', amount: '100 g' },
		],
	},
	{
		name: 'Pre-workout',
		ingredients: [
			{ foodId: 'puffed_rice', amount: '90 g' },
			{ foodId: 'wpi_choc', amount: '20 g' },
			{ foodId: 'banana', amount: '50 g' },
			{ foodId: 'peanut_butter', amount: '10 g' },
			{ foodId: 'coconut_water', amount: '1000 ml' },
		],
	},
	{
		...MEAL_SPAG_DEF,
		ingredients: [
			{ foodId: 'lean_mince_5', amount: '120 g' },
			{ foodId: 'pasta_dry', amount: '80 g' },
			{ foodId: 'passata', amount: '100 ml' },
			{ foodId: 'zucchini', amount: '75 g' },
			{ foodId: 'mushrooms', amount: '75 g' },
		],
	},
	MEAL_DESSERT_DEF,
];

function round1(n: number): number {
	return Math.round(n * 10) / 10;
}

/** Materialise a meal template: each line from food DB; meal totals = sum of lines. */
export function materializeMeal(def: MealTemplateDef): CoachMealSlot {
	const ingredients: CoachIngredient[] = def.ingredients.map((ing) => {
		const food = getFood(ing.foodId);
		const macros = macrosForFoodAmount(ing.foodId, ing.amount);
		return {
			foodId: ing.foodId,
			name: food.name,
			amount: ing.amount,
			note: ing.note ?? food.note,
			kcal: macros.kcal,
			proteinG: macros.proteinG,
			carbsG: macros.carbsG,
			fatG: macros.fatG,
			fibreG: macros.fibreG,
		};
	});
	const kcal = Math.round(ingredients.reduce((s, i) => s + (i.kcal ?? 0), 0));
	const proteinG = round1(ingredients.reduce((s, i) => s + (i.proteinG ?? 0), 0));
	const carbsG = round1(ingredients.reduce((s, i) => s + (i.carbsG ?? 0), 0));
	const fatG = round1(ingredients.reduce((s, i) => s + (i.fatG ?? 0), 0));
	const fibreG = round1(ingredients.reduce((s, i) => s + (i.fibreG ?? 0), 0));
	return {
		name: def.name,
		intra: def.intra,
		kcal,
		proteinG,
		carbsG,
		fatG,
		fibreG,
		ingredients,
	};
}

function materializeDay(
	id: CoachDayPlan['id'],
	title: string,
	when: string,
	defs: MealTemplateDef[],
): CoachDayPlan {
	const meals = defs.map(materializeMeal);
	const proteinG = round1(meals.reduce((s, m) => s + m.proteinG, 0));
	const carbsG = round1(meals.reduce((s, m) => s + m.carbsG, 0));
	const fatG = round1(meals.reduce((s, m) => s + m.fatG, 0));
	const calories = Math.round(meals.reduce((s, m) => s + m.kcal, 0));
	const fibreG = round1(meals.reduce((s, m) => s + (m.fibreG ?? 0), 0));
	const pcts = macroPcts(calories, proteinG, carbsG, fatG);
	return {
		id,
		title,
		when,
		calories,
		proteinG,
		carbsG,
		fatG,
		fibreG,
		...pcts,
		recipesReady: true,
		meals,
	};
}

function macroPcts(calories: number, proteinG: number, carbsG: number, fatG: number) {
	const pK = proteinG * 4;
	const cK = carbsG * 4;
	const fK = fatG * 9;
	const sum = pK + cK + fK;
	if (sum <= 0) return { proteinPct: 0, carbsPct: 0, fatPct: 0 };
	return {
		proteinPct: Math.round((pK / sum) * 100),
		carbsPct: Math.round((cK / sum) * 100),
		fatPct: Math.round((fK / sum) * 100),
	};
}

/**
 * Baseline day templates materialised from the food DB.
 * Primary prescription is a single daily plan (id: training) with coconut water
 * inside Pre-workout. Diet-break remains an optional alternate week structure.
 */
export const COACH_DAY_PLANS: CoachDayPlan[] = [
	materializeDay(
		'training',
		'Daily meal plan',
		'One complete day. Coconut water (1 L) is prescribed inside Pre-workout — counted once in that meal and the day totals.',
		COACH_DAILY_MEAL_DEFS,
	),
	materializeDay(
		'diet-break',
		'Diet break (optional week)',
		'Optional 1–2 weeks at estimated maintenance when flat or depleted — not the default day. Still one structure; coconut water stays inside Pre-workout.',
		DIET_BREAK_MEAL_DEFS,
	),
];

/** Default shopping week: 7 × daily plan. */
export const SHOPPING_WEEK_TRAINING_DAYS = 4;
export const SHOPPING_WEEK_REST_DAYS = 3;

function shoppingFromDefs(
	defs: MealTemplateDef[],
	times: number,
	notes?: Record<string, string>,
): ShoppingListLine[] {
	type Acc = { name: string; value: number; unit: 'g' | 'ml' | 'bar' | 'L'; note?: string };
	const map = new Map<string, Acc>();
	for (let t = 0; t < times; t++) {
		for (const meal of defs) {
			for (const ing of meal.ingredients) {
				const food = getFood(ing.foodId);
				const parsed = parseFoodAmount(ing.amount);
				if (!parsed) continue;
				const key = food.name.toLowerCase();
				const existing = map.get(key);
				if (existing) {
					existing.value += parsed.qty;
				} else {
					map.set(key, {
						name: food.name,
						value: parsed.qty,
						unit: parsed.kind,
						note: notes?.[ing.foodId] ?? food.note,
					});
				}
			}
		}
	}
	return [...map.values()]
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((acc) => ({
			name: acc.name,
			amount: formatShopAmount({ value: acc.value, unit: acc.unit }),
			note: acc.note,
		}));
}

/** Static baseline lists (example profile portions × 7 days). Prefer buildWeekShoppingFromPlans for PDFs. */
export const SHOPPING_LIST_TYPICAL_WEEK: ShoppingListLine[] = shoppingFromDefs(
	COACH_DAILY_MEAL_DEFS,
	7,
);

export const SHOPPING_LIST_DIET_BREAK_WEEK: ShoppingListLine[] = shoppingFromDefs(DIET_BREAK_MEAL_DEFS, 7);

/** @deprecated Use SHOPPING_LIST_TYPICAL_WEEK — kept as alias for older imports. */
export const SHOPPING_LIST_PARTIAL = SHOPPING_LIST_TYPICAL_WEEK;

/** Plain-text block for phone copy → Woolworths / notes. */
export function formatShoppingListPlain(
	lines: ShoppingListLine[] = SHOPPING_LIST_TYPICAL_WEEK,
	opts?: { title?: string; blurb?: string },
): string {
	const header = [
		opts?.title ?? 'Woolworths week (4 training / 3 rest)',
		opts?.blurb ??
			'Baseline template 36 / 80 kg / 178 cm. Scale days if your split differs. No invented SKUs.',
		'',
	];
	const body = lines.map((l) => {
		const note = l.note ? ` (${l.note})` : '';
		return `• ${l.name} — ${l.amount}${note}`;
	});
	return [...header, ...body].join('\n');
}

export function formatDietBreakShoppingPlain(): string {
	return formatShoppingListPlain(SHOPPING_LIST_DIET_BREAK_WEEK, {
		title: 'Diet-break week (7× diet-break day)',
		blurb:
			'Use for 1–2 weeks when flat / glycogen depleted (~maintenance for example profile). Then return to the typical week list.',
	});
}

/** Baseline day kcal from food-DB materialisation (example-profile portions). */
export const COACH_BASELINE_KCAL = {
	training: COACH_DAY_PLANS.find((p) => p.id === 'training')!.calories,
	'diet-break': COACH_DAY_PLANS.find((p) => p.id === 'diet-break')!.calories,
} as const;

/** Prescribed coconut water kcal (fixed 1000 ml inside Pre-workout — counted once). */
export const COCONUT_WATER_KCAL = macrosForFoodAmount('coconut_water', '1000 ml').kcal;

export interface CoachScaleFactors {
	/** Applied to daily-plan meals (coconut water amount stays fixed). */
	work: number;
	/** Applied to diet-break meals (coconut water amount stays fixed). */
	dietBreak: number;
	workTargetKcal: number;
	dietBreakTargetKcal: number;
}

function coconutKcalInPlan(plan: CoachDayPlan): number {
	return Math.round(
		plan.meals.reduce(
			(s, m) =>
				s +
				(m.ingredients ?? [])
					.filter((i) => i.foodId === 'coconut_water' || /coconut water/i.test(i.name))
					.reduce((ss, i) => ss + (i.kcal ?? 0), 0),
			0,
		),
	);
}

/**
 * Map calculator output → day-type scales.
 * Daily plan tracks goal calories; diet-break tracks TDEE (maintenance).
 * Coconut water stays a fixed 1 L serve inside Pre-workout (macros counted once),
 * so the scale factor applies only to the variable (non-coconut) portion.
 */
export function coachScaleFactors(result: Pick<FoodOsResult, 'calories' | 'tdee'>): CoachScaleFactors {
	const workTargetKcal = Math.max(1200, Math.round(result.calories));
	const dietBreakTargetKcal = Math.max(1200, Math.round(result.tdee));
	const dailyBase = COACH_DAY_PLANS.find((p) => p.id === 'training')!;
	const dietBase = COACH_DAY_PLANS.find((p) => p.id === 'diet-break')!;
	const dailyCoconut = coconutKcalInPlan(dailyBase);
	const dietCoconut = coconutKcalInPlan(dietBase);
	const workVar = Math.max(1, COACH_BASELINE_KCAL.training - dailyCoconut);
	const dietVar = Math.max(1, COACH_BASELINE_KCAL['diet-break'] - dietCoconut);
	const work = Math.max(0.35, (workTargetKcal - dailyCoconut) / workVar);
	const dietBreak = Math.max(0.35, (dietBreakTargetKcal - dietCoconut) / dietVar);
	return { work, dietBreak, workTargetKcal, dietBreakTargetKcal };
}

/** Round a scaled gram/ml quantity to a shoppable step. */
export function roundScaledQuantity(value: number): number {
	if (!Number.isFinite(value) || value <= 0) return 0;
	if (value < 5) return Math.max(1, Math.round(value));
	if (value < 20) return Math.round(value);
	if (value < 100) return Math.round(value / 5) * 5;
	if (value < 500) return Math.round(value / 5) * 5;
	return Math.round(value / 10) * 10;
}

/**
 * Scale a logged portion string ("60 g", "15 ml", "1 bar", "2 bars", "4 L").
 * Intra coconut water lines are left unchanged by callers (fixed 1 L serve).
 */
export function scalePortionAmount(amount: string, scale: number): string {
	const trimmed = amount.trim();
	if (!Number.isFinite(scale) || Math.abs(scale - 1) < 0.02) return trimmed;

	const bar = trimmed.match(/^(\d+(?:\.\d+)?)\s*bars?$/i);
	if (bar) {
		const n = Math.max(1, Math.round(Number(bar[1]) * scale));
		return n === 1 ? '1 bar' : `${n} bars`;
	}

	const litre = trimmed.match(/^(\d+(?:\.\d+)?)\s*L$/i);
	if (litre) {
		const n = Number(litre[1]) * scale;
		const rounded = n < 10 ? Math.round(n * 10) / 10 : Math.round(n);
		return `${rounded} L`;
	}

	const unit = trimmed.match(/^(\d+(?:\.\d+)?)\s*(g|ml)$/i);
	if (unit) {
		const n = roundScaledQuantity(Number(unit[1]) * scale);
		return `${n} ${unit[2].toLowerCase()}`;
	}

	return trimmed;
}

/**
 * Scale a materialised meal by adjusting portion amounts, then re-materialise
 * macros from the food DB. Prescribed coconut water stays a fixed 1000 ml.
 */
function scaleMeal(meal: CoachMealSlot, scale: number): CoachMealSlot {
	const def: MealTemplateDef = {
		name: meal.name,
		intra: meal.intra,
		ingredients: (meal.ingredients ?? [])
			.filter((ing): ing is CoachIngredient & { foodId: string } => !!ing.foodId)
			.map((ing) => ({
				foodId: ing.foodId,
				amount:
					ing.foodId === 'coconut_water'
						? ing.amount
						: scalePortionAmount(ing.amount, scale),
				note: ing.note,
			})),
	};
	return materializeMeal(def);
}

function scaleDayPlan(plan: CoachDayPlan, scale: number): CoachDayPlan {
	const meals = plan.meals.map((m) => scaleMeal(m, scale));
	const proteinG = round1(meals.reduce((s, m) => s + m.proteinG, 0));
	const carbsG = round1(meals.reduce((s, m) => s + m.carbsG, 0));
	const fatG = round1(meals.reduce((s, m) => s + m.fatG, 0));
	const calories = Math.round(meals.reduce((s, m) => s + m.kcal, 0));
	const fibreG = round1(meals.reduce((s, m) => s + (m.fibreG ?? 0), 0));
	const pcts = macroPcts(calories, proteinG, carbsG, fatG);
	return {
		...plan,
		calories,
		proteinG,
		carbsG,
		fatG,
		fibreG,
		...pcts,
		meals,
	};
}

export interface ScaledCoachBundle {
	plans: CoachDayPlan[];
	factors: CoachScaleFactors;
	/** Short quiet meta under the section lede (not a shouty teal banner). */
	profileLine: string;
	/** Optional second line when work ≈ diet-break (maintain). */
	profileNote?: string;
	lede: string;
}

function coachProfileCopy(
	result: Pick<FoodOsResult, 'calories' | 'tdee' | 'goal'>,
	factors: CoachScaleFactors,
	profile: { weightKg: number; heightCm: number },
): { profileLine: string; profileNote?: string } {
	const body = `${profile.weightKg} kg · ${profile.heightCm} cm`;
	if (result.goal === 'maintain') {
		return {
			profileLine: `Holding ~${factors.workTargetKcal} kcal · ${body}`,
			profileNote:
				'Diet-break matches because you’re already at estimated maintenance — use it as a settle week, not a surplus.',
		};
	}
	if (result.goal === 'lean-bulk') {
		return {
			profileLine: `Surplus days ~${factors.workTargetKcal} · settle / diet-break ~${factors.dietBreakTargetKcal} · ${body}`,
		};
	}
	return {
		profileLine: `Cut days ~${factors.workTargetKcal} · diet-break (maintenance) ~${factors.dietBreakTargetKcal} · ${body}`,
	};
}

/**
 * Scale a baseline day toward a calorie target.
 * Coconut water stays fixed. Binary-search the scale so discrete items
 * (bars) don’t oscillate past the target on a single correction pass.
 */
function scaleDayTowardTarget(plan: CoachDayPlan, targetKcal: number, baseScale: number): CoachDayPlan {
	const fixedCoconut = coconutKcalInPlan(plan);
	const variableTarget = Math.max(400, targetKcal - fixedCoconut);
	const variableBase = Math.max(1, plan.calories - fixedCoconut);
	const seed = Math.max(0.35, variableTarget / variableBase);
	let lo = Math.max(0.3, Math.min(seed, baseScale) * 0.7);
	let hi = Math.max(seed, baseScale) * 1.35;
	let best = scaleDayPlan(plan, seed);
	let bestDelta = Math.abs(best.calories - targetKcal);
	for (let i = 0; i < 14; i++) {
		const mid = (lo + hi) / 2;
		const scaled = scaleDayPlan(plan, mid);
		const delta = scaled.calories - targetKcal;
		const abs = Math.abs(delta);
		if (abs < bestDelta) {
			best = scaled;
			bestDelta = abs;
		}
		if (abs <= 35) return scaled;
		if (delta > 0) hi = mid;
		else lo = mid;
	}
	return best;
}

/**
 * Build the personalised nutrition pack: ONE daily meal plan (default) plus an
 * optional diet-break week structure. No duplicated rest/training meal trees.
 */
export function scaleCoachDayPlans(
	result: Pick<FoodOsResult, 'calories' | 'tdee' | 'goal'>,
	profile: { weightKg: number; heightCm: number; age?: number },
): ScaledCoachBundle {
	const factors = coachScaleFactors(result);
	const plans = COACH_DAY_PLANS.map((plan) => {
		const scale = plan.id === 'diet-break' ? factors.dietBreak : factors.work;
		const target =
			plan.id === 'diet-break' ? factors.dietBreakTargetKcal : factors.workTargetKcal;
		const scaled = scaleDayTowardTarget(plan, target, scale);
		if (plan.id === 'training') {
			scaled.title = 'Daily meal plan';
			scaled.when =
				'One complete day at your calorie target. 1 L coconut water is prescribed inside Pre-workout (macros counted once).';
		} else {
			scaled.when =
				result.goal === 'maintain'
					? 'Optional settle week at estimated maintenance. Bigger carb portions — not a forever surplus. Coconut water stays inside Pre-workout.'
					: 'Optional 1–2 weeks at estimated maintenance when flat or depleted, then return to your daily plan. Coconut water stays inside Pre-workout.';
		}
		return scaled;
	});

	const { age, weightKg, heightCm } = COACH_PLAN_EXAMPLE_PROFILE;
	const { profileLine, profileNote } = coachProfileCopy(result, factors, profile);
	const lede = `One complete daily meal plan scaled to your calorie target (baseline portions for ${age} / ${weightKg} kg / ${heightCm} cm). Food line macros come from a real food database — meal and day totals are the sum of those lines. Coconut water is prescribed inside Pre-workout. Diet-break week is optional.`;

	const reconciled = plans.map((p) => reconcileDayPlan(p));
	return { plans: reconciled, factors, profileLine, profileNote, lede };
}

/**
 * @deprecated Portion-weight heuristic removed — kept as a thin parser for any legacy callers.
 * Prefer macrosForFoodAmount from the food DB.
 */
export function estimateIngredientWeight(amount: string): number {
	const parsed = parseFoodAmount(amount);
	if (!parsed) return 1;
	if (parsed.kind === 'bar') return Math.max(1, parsed.qty) * 40;
	if (parsed.kind === 'L') return Math.max(1, parsed.qty) * 1000;
	return Math.max(1, parsed.qty);
}

/**
 * Re-materialise meal macros from the food DB using each line's foodId + amount.
 * Meal totals are always the sum of food lines — never the reverse.
 */
export function reconcileMealMacros(meal: CoachMealSlot): CoachMealSlot {
	const ingredients = meal.ingredients;
	if (!ingredients?.length) return { ...meal };
	if (ingredients.every((ing) => ing.foodId)) {
		return materializeMeal({
			name: meal.name,
			intra: meal.intra,
			ingredients: ingredients.map((ing) => ({
				foodId: ing.foodId!,
				amount: ing.amount,
				note: ing.note,
			})),
		});
	}
	// Legacy fallback: lines already carry macros — recompute meal as sum.
	const kcal = Math.round(ingredients.reduce((s, i) => s + (i.kcal ?? 0), 0));
	const proteinG = round1(ingredients.reduce((s, i) => s + (i.proteinG ?? 0), 0));
	const carbsG = round1(ingredients.reduce((s, i) => s + (i.carbsG ?? 0), 0));
	const fatG = round1(ingredients.reduce((s, i) => s + (i.fatG ?? 0), 0));
	const fibreG = round1(ingredients.reduce((s, i) => s + (i.fibreG ?? 0), 0));
	return { ...meal, kcal, proteinG, carbsG, fatG, fibreG };
}

export interface NutritionAuditIssue {
	path: string;
	message: string;
}

/** Recompute day totals from meals and reconcile ingredient lines from the food DB. */
export function reconcileDayPlan(plan: CoachDayPlan): CoachDayPlan {
	const meals = plan.meals.map((m) => reconcileMealMacros(m));
	const proteinG = round1(meals.reduce((s, m) => s + m.proteinG, 0));
	const carbsG = round1(meals.reduce((s, m) => s + m.carbsG, 0));
	const fatG = round1(meals.reduce((s, m) => s + m.fatG, 0));
	const calories = Math.round(meals.reduce((s, m) => s + m.kcal, 0));
	const fibreG = round1(meals.reduce((s, m) => s + (m.fibreG ?? 0), 0));
	const pcts = macroPcts(calories, proteinG, carbsG, fatG);
	return {
		...plan,
		meals,
		calories,
		proteinG,
		carbsG,
		fatG,
		fibreG,
		...pcts,
	};
}

/** Audit day kcal/macros: day = meals; meal = ingredient lines (when present). */
export function auditDayPlan(plan: CoachDayPlan, label = plan.id): NutritionAuditIssue[] {
	const issues: NutritionAuditIssue[] = [];
	const mealK = plan.meals.reduce((s, m) => s + m.kcal, 0);
	const mealP = round1(plan.meals.reduce((s, m) => s + m.proteinG, 0));
	const mealC = round1(plan.meals.reduce((s, m) => s + m.carbsG, 0));
	const mealF = round1(plan.meals.reduce((s, m) => s + m.fatG, 0));
	if (Math.abs(mealK - plan.calories) > 1) {
		issues.push({
			path: `${label}.calories`,
			message: `Day kcal ${plan.calories} ≠ sum of meals ${mealK}`,
		});
	}
	if (Math.abs(mealP - plan.proteinG) > 0.15) {
		issues.push({
			path: `${label}.proteinG`,
			message: `Day protein ${plan.proteinG} ≠ sum of meals ${mealP}`,
		});
	}
	if (Math.abs(mealC - plan.carbsG) > 0.15) {
		issues.push({
			path: `${label}.carbsG`,
			message: `Day carbs ${plan.carbsG} ≠ sum of meals ${mealC}`,
		});
	}
	if (Math.abs(mealF - plan.fatG) > 0.15) {
		issues.push({
			path: `${label}.fatG`,
			message: `Day fat ${plan.fatG} ≠ sum of meals ${mealF}`,
		});
	}

	plan.meals.forEach((meal, mi) => {
		const ings = meal.ingredients;
		if (!ings?.length) return;
		if (ings.some((i) => i.kcal == null || i.proteinG == null || i.carbsG == null || i.fatG == null)) {
			issues.push({
				path: `${label}.meals[${mi}].ingredients`,
				message: `Meal “${meal.name}” has ingredient lines missing macros`,
			});
			return;
		}
		const k = ings.reduce((s, i) => s + (i.kcal ?? 0), 0);
		const p = round1(ings.reduce((s, i) => s + (i.proteinG ?? 0), 0));
		const c = round1(ings.reduce((s, i) => s + (i.carbsG ?? 0), 0));
		const f = round1(ings.reduce((s, i) => s + (i.fatG ?? 0), 0));
		if (Math.abs(k - meal.kcal) > 1) {
			issues.push({
				path: `${label}.meals[${mi}].kcal`,
				message: `Meal “${meal.name}” kcal ${meal.kcal} ≠ ingredients ${k}`,
			});
		}
		if (Math.abs(p - meal.proteinG) > 0.15) {
			issues.push({
				path: `${label}.meals[${mi}].proteinG`,
				message: `Meal “${meal.name}” protein ${meal.proteinG} ≠ ingredients ${p}`,
			});
		}
		if (Math.abs(c - meal.carbsG) > 0.15) {
			issues.push({
				path: `${label}.meals[${mi}].carbsG`,
				message: `Meal “${meal.name}” carbs ${meal.carbsG} ≠ ingredients ${c}`,
			});
		}
		if (Math.abs(f - meal.fatG) > 0.15) {
			issues.push({
				path: `${label}.meals[${mi}].fatG`,
				message: `Meal “${meal.name}” fat ${meal.fatG} ≠ ingredients ${f}`,
			});
		}
		// Food-DB source check: each line must match quantity × DB (no portion-weighted fakes).
		ings.forEach((ing, ii) => {
			if (!ing.foodId) {
				issues.push({
					path: `${label}.meals[${mi}].ingredients[${ii}]`,
					message: `“${ing.name}” missing foodId — cannot verify against food DB`,
				});
				return;
			}
			try {
				const expected = macrosForFoodAmount(ing.foodId, ing.amount);
				if (
					Math.abs(expected.kcal - (ing.kcal ?? 0)) > 1 ||
					Math.abs(expected.proteinG - (ing.proteinG ?? 0)) > 0.15 ||
					Math.abs(expected.carbsG - (ing.carbsG ?? 0)) > 0.15 ||
					Math.abs(expected.fatG - (ing.fatG ?? 0)) > 0.15
				) {
					issues.push({
						path: `${label}.meals[${mi}].ingredients[${ii}]`,
						message: `“${ing.name}” ${ing.amount} macros ${ing.kcal}/${ing.proteinG}/${ing.carbsG}/${ing.fatG} ≠ food DB ${expected.kcal}/${expected.proteinG}/${expected.carbsG}/${expected.fatG}`,
					});
				}
			} catch (err) {
				issues.push({
					path: `${label}.meals[${mi}].ingredients[${ii}]`,
					message: err instanceof Error ? err.message : String(err),
				});
			}
		});
	});

	return issues;
}

interface ParsedAmount {
	value: number;
	unit: 'g' | 'ml' | 'bar' | 'L';
}

function parseShopAmount(amount: string): ParsedAmount | null {
	const trimmed = amount.trim();
	const bar = trimmed.match(/^(\d+(?:\.\d+)?)\s*bars?$/i);
	if (bar) return { value: Number(bar[1]), unit: 'bar' };
	const litre = trimmed.match(/^(\d+(?:\.\d+)?)\s*L$/i);
	if (litre) return { value: Number(litre[1]), unit: 'L' };
	const unit = trimmed.match(/^(\d+(?:\.\d+)?)\s*(g|ml)$/i);
	if (unit) return { value: Number(unit[1]), unit: unit[2].toLowerCase() as 'g' | 'ml' };
	return null;
}

function formatShopAmount(parsed: ParsedAmount): string {
	if (parsed.unit === 'bar') {
		const n = Math.max(1, Math.round(parsed.value));
		return n === 1 ? '1 bar' : `${n} bars`;
	}
	if (parsed.unit === 'L') {
		const n = parsed.value < 10 ? Math.round(parsed.value * 10) / 10 : Math.round(parsed.value);
		return `${n} L`;
	}
	return `${roundScaledQuantity(parsed.value)} ${parsed.unit}`;
}

export interface PlanShoppingList {
	title: string;
	blurb: string;
	lines: ShoppingListLine[];
	plain: string;
	/** Ingredient names present in meals but not aggregatable (should be empty). */
	orphans: string[];
}

/**
 * Build a weekly shopping list from the one daily meal plan × 7.
 * Coconut water is included once per day (prescribed in Pre-workout).
 */
export function buildWeekShoppingFromPlans(
	plans: CoachDayPlan[],
	trainingDays: TrainingDaysPref,
): PlanShoppingList {
	const days = ([3, 4, 5, 6] as TrainingDaysPref[]).includes(trainingDays) ? trainingDays : 3;
	const daily = plans.find((p) => p.id === 'training') ?? plans[0];
	const orphans: string[] = [];

	type Acc = { name: string; value: number; unit: ParsedAmount['unit']; note?: string };
	const map = new Map<string, Acc>();

	if (daily) {
		for (const meal of daily.meals) {
			for (const ing of meal.ingredients ?? []) {
				const parsed = parseShopAmount(ing.amount);
				if (!parsed) {
					orphans.push(ing.name);
					continue;
				}
				const key = ing.name.toLowerCase();
				const existing = map.get(key);
				if (existing) {
					if (existing.unit !== parsed.unit) {
						orphans.push(`${ing.name} (unit clash)`);
						continue;
					}
					existing.value += parsed.value * 7;
				} else {
					map.set(key, {
						name: ing.name,
						value: parsed.value * 7,
						unit: parsed.unit,
						note: ing.note,
					});
				}
			}
		}
	}

	const lines: ShoppingListLine[] = [...map.values()]
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((acc) => ({
			name: acc.name,
			amount: formatShopAmount({ value: acc.value, unit: acc.unit }),
			note: /coconut water/i.test(acc.name)
				? `1000 ml × 7 days (prescribed in Pre-workout)`
				: acc.note,
		}));

	const title = `Weekly shopping list (7 × daily plan · ${days} lift days)`;
	const blurb = `Aggregated from your one daily meal plan × 7 · coconut water included once per day inside Pre-workout · Woolworths-friendly weights · phone-copyable.`;
	const plain = formatShoppingListPlain(lines, { title, blurb });
	return { title, blurb, lines, plain, orphans: [...new Set(orphans)] };
}

function scaleShoppingLine(line: ShoppingListLine, scale: number, opts?: { skipCoconut?: boolean }): ShoppingListLine {
	const isCoconut = /coconut water/i.test(line.name);
	if (opts?.skipCoconut && isCoconut) return { ...line };
	return {
		...line,
		amount: scalePortionAmount(line.amount, scale),
		// Keep portion-math notes only — no “scaled × baseline” diary on every line.
		note: line.note,
	};
}

export interface ScaledShoppingBundle {
	typical: ShoppingListLine[];
	dietBreak: ShoppingListLine[];
	typicalPlain: string;
	dietBreakPlain: string;
	blurb: string;
	trainingDays: TrainingDaysPref;
	restDays: number;
}

/** Scale Woolworths weekly lists with the same factors as the day templates. */
export function scaleShoppingLists(
	result: Pick<FoodOsResult, 'calories' | 'tdee'>,
	profile: { weightKg: number; heightCm: number },
	opts?: { trainingDays?: TrainingDaysPref },
): ScaledShoppingBundle {
	const trainingDays: TrainingDaysPref = ([3, 4, 5, 6] as number[]).includes(
		opts?.trainingDays ?? 0,
	)
		? (opts!.trainingDays as TrainingDaysPref)
		: 4;
	const restDays = 7 - trainingDays;
	const factors = coachScaleFactors(result);
	const typical = SHOPPING_LIST_TYPICAL_WEEK.map((line) =>
		scaleShoppingLine(line, factors.work, { skipCoconut: true }),
	);
	const dietBreak = SHOPPING_LIST_DIET_BREAK_WEEK.map((line) =>
		scaleShoppingLine(line, factors.dietBreak, { skipCoconut: true }),
	);
	const blurb = `${profile.weightKg} kg · ${profile.heightCm} cm · ${trainingDays} lift days · portions ×${factors.work.toFixed(2)} (daily plan week) / ×${factors.dietBreak.toFixed(2)} (diet-break). Baseline ${COACH_PLAN_EXAMPLE_PROFILE.weightKg} kg template. Coconut water is 1 L / day inside Pre-workout.`;
	const typicalPlain = formatShoppingListPlain(typical, {
		title: `Woolworths week (7 × daily plan · ${trainingDays} lift days)`,
		blurb,
	});
	const dietBreakPlain = formatShoppingListPlain(dietBreak, {
		title: 'Diet-break week (7× diet-break day)',
		blurb: `${blurb} Use for 1–2 weeks when flat / glycogen depleted (~your maintenance), then return to the typical week list.`,
	});
	return { typical, dietBreak, typicalPlain, dietBreakPlain, blurb, trainingDays, restDays };
}

/** Pre-PDF / QA: unique meal names, coconut once in Pre-workout, day totals reconcile. */
export function auditDailyMealPrescription(plan: CoachDayPlan): NutritionAuditIssue[] {
	const issues = auditDayPlan(plan);
	const names = plan.meals.map((m) => m.name.trim().toLowerCase());
	const dupes = names.filter((n, i) => names.indexOf(n) !== i);
	if (dupes.length) {
		issues.push({
			path: `${plan.id}.meals.duplicate`,
			message: `Duplicate meal structures: ${[...new Set(dupes)].join(', ')}`,
		});
	}
	const coconutMeals = plan.meals.filter((m) =>
		(m.ingredients ?? []).some((i) => i.foodId === 'coconut_water' || /coconut water/i.test(i.name)),
	);
	if (coconutMeals.length === 0) {
		issues.push({
			path: `${plan.id}.coconut`,
			message: 'Coconut water missing from the daily plan',
		});
	} else if (coconutMeals.length > 1) {
		issues.push({
			path: `${plan.id}.coconut`,
			message: `Coconut water appears in ${coconutMeals.length} meals — must be once inside Pre-workout`,
		});
	} else if (!/pre-workout/i.test(coconutMeals[0].name)) {
		issues.push({
			path: `${plan.id}.coconut`,
			message: `Coconut water is in “${coconutMeals[0].name}” — must be prescribed inside Pre-workout`,
		});
	} else {
		const lines = (coconutMeals[0].ingredients ?? []).filter(
			(i) => i.foodId === 'coconut_water' || /coconut water/i.test(i.name),
		);
		if (lines.length !== 1) {
			issues.push({
				path: `${plan.id}.coconut`,
				message: `Coconut water line count ${lines.length} in Pre-workout — expected exactly 1`,
			});
		}
	}
	return issues;
}
