/**
 * Food Bro — calorie + macro estimates for lifters.
 * Mifflin–St Jeor BMR × activity, then goal adjustment.
 * Educational starting point — not medical advice.
 */

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
		label: 'Cut',
		defaultAdj: -0.18,
		blurb: '~15–20% below maintenance — fat loss without torching lifts.',
	},
	maintain: {
		label: 'Maintain',
		defaultAdj: 0,
		blurb: 'Hold weight while training quality and habits rise.',
	},
	'lean-bulk': {
		label: 'Lean bulk',
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

export type TrainingDaysPref = 3 | 4;

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
	name: string;
	/** Portion as logged — e.g. "60 g", "15 ml", "1 bar". */
	amount: string;
	/** Shopping / brand note (Coles → WW, etc.). Never invent SKUs. */
	note?: string;
}

export interface CoachMealSlot {
	name: string;
	kcal: number;
	proteinG: number;
	carbsG: number;
	fatG: number;
	/** True for Intra Workout — carbs-only training fuel. */
	intra?: boolean;
	/** Present when founder has sent the recipe dump for this meal. */
	ingredients?: CoachIngredient[];
}

export interface CoachDayPlan {
	id: 'non-training' | 'training' | 'diet-break';
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

const MEAL_OATS: CoachMealSlot = {
	name: 'Walnut & Maple Protein Oats',
	kcal: 449,
	proteinG: 35.7,
	carbsG: 51.5,
	fatG: 11.1,
	ingredients: [
		{ name: 'Oats', amount: '60 g' },
		{ name: 'Whey Protein Isolate Vanilla Creamy', amount: '30 g' },
		{ name: 'Walnuts', amount: '10 g' },
		{ name: 'Sugar Free Maple Syrup By Queen', amount: '15 ml' },
		{ name: 'Strawberries', amount: '100 g' },
	],
};

const MEAL_DESSERT: CoachMealSlot = {
	name: 'Dessert',
	kcal: 176,
	proteinG: 16.2,
	carbsG: 25.2,
	fatG: 1.2,
	ingredients: [
		{ name: 'Yopro Salted Caramel Yoghurt By Danone', amount: '150 g' },
		{ name: 'Frozen Mixed Berries', amount: '150 g' },
		{ name: 'Maple Syrup Sugar Free', amount: '15 g' },
	],
};

/** Shared base meals (non-training + training). */
const COACH_BASE_MEALS: CoachMealSlot[] = [
	MEAL_OATS,
	{
		name: 'Peri Chicken & Mexican Rice',
		kcal: 577,
		proteinG: 47.9,
		carbsG: 65.4,
		fatG: 13.8,
		ingredients: [
			{ name: 'Chicken Breast Cooked', amount: '120 g' },
			{ name: "Express Mexican Style Rice By Uncle Ben's", amount: '175 g' },
			{ name: 'Australian Carrots Peas & Corn', amount: '100 g' },
			{ name: "Perinaise By Nando's", amount: '15 ml' },
		],
	},
	{
		name: 'Snack',
		kcal: 169,
		proteinG: 3.0,
		carbsG: 29.3,
		fatG: 4.4,
		ingredients: [
			{ name: 'Uncle Tobys Kit Kat Muesli Bar', amount: '1 bar' },
			{ name: 'Kiwi', amount: '100 g' },
		],
	},
	{
		name: 'Pre Workout',
		kcal: 406,
		proteinG: 23.1,
		carbsG: 65.0,
		fatG: 6.0,
		ingredients: [
			{ name: "Rice Bubbles by Kellogg's", amount: '60 g' },
			{ name: 'Whey Protein Isolate Smooth Milk Chocolate', amount: '20 g' },
			{ name: 'Banana', amount: '50 g' },
			{ name: "Smooth Peanut Butter by Mayver's", amount: '10 g' },
		],
	},
	{
		name: 'Spag Bowl',
		kcal: 438,
		proteinG: 38.3,
		carbsG: 53.7,
		fatG: 7.8,
		ingredients: [
			{ name: '5% Fat Extra Lean Mince Beef', amount: '120 g' },
			{ name: 'Spirals Pasta By Woolworths', amount: '60 g' },
			{ name: 'Italian Tomato Passata By Woolworths', amount: '100 ml' },
			{ name: 'Zucchini', amount: '75 g' },
			{ name: 'Mushrooms', amount: '75 g' },
		],
	},
	MEAL_DESSERT,
];
const INTRA_WORKOUT: CoachMealSlot = {
	name: 'Intra Workout',
	kcal: 148,
	proteinG: 0,
	carbsG: 37.0,
	fatG: 0,
	intra: true,
	ingredients: [
		{ name: '100% Pure Coconut Water By Woolworths', amount: '1000 ml' },
	],
};

/**
 * Recommended Food Bro day templates from founder coach screenshots.
 * Scale via calculator + judgment — totals are for the example profile above.
 */
export const COACH_DAY_PLANS: CoachDayPlan[] = [
	{
		id: 'non-training',
		title: 'Non-training day',
		when: 'Rest days / no hard lifting. Skip Intra.',
		calories: 2216,
		proteinG: 164.2,
		carbsG: 290.1,
		fatG: 44.3,
		fibreG: 33.6,
		proteinPct: 30,
		carbsPct: 52,
		fatPct: 18,
		recipesReady: true,
		meals: COACH_BASE_MEALS,
	},
	{
		id: 'training',
		title: 'Training day',
		when: 'Lift / hard session days. Same base meals as non-training + Intra (carbs only).',
		calories: 2364,
		proteinG: 164.2,
		carbsG: 327.1,
		fatG: 44.3,
		fibreG: 33.6,
		proteinPct: 28,
		carbsPct: 55,
		fatPct: 17,
		recipesReady: true,
		meals: [...COACH_BASE_MEALS, INTRA_WORKOUT],
	},
	{
		id: 'diet-break',
		title: 'Diet break',
		when: '~Maintenance calories for the example profile. Run 1–2 weeks when flat / glycogen depleted — not a forever surplus. Bigger carb portions + Intra daily.',
		calories: 2738,
		proteinG: 172.3,
		carbsG: 401.2,
		fatG: 49.4,
		fibreG: 38.4,
		proteinPct: 25,
		carbsPct: 59,
		fatPct: 16,
		recipesReady: true,
		meals: [
			MEAL_OATS,
			{
				name: 'Peri Chicken & Mexican Rice',
				kcal: 655,
				proteinG: 49.7,
				carbsG: 80.9,
				fatG: 14.8,
				ingredients: [
					{ name: 'Chicken Breast Cooked', amount: '120 g' },
					{ name: "Express Mexican Style Rice By Uncle Ben's", amount: '225 g' },
					{ name: 'Australian Carrots Peas & Corn', amount: '100 g' },
					{ name: "Perinaise By Nando's", amount: '15 ml' },
				],
			},
			{
				name: 'Snack',
				kcal: 277,
				proteinG: 4.8,
				carbsG: 46.7,
				fatG: 7.9,
				ingredients: [
					{ name: 'Uncle Tobys Kit Kat Muesli Bar', amount: '2 bars' },
					{ name: 'Kiwi', amount: '100 g' },
				],
			},
			{
				name: 'Pre Workout',
				kcal: 521,
				proteinG: 25.0,
				carbsG: 91.4,
				fatG: 6.2,
				ingredients: [
					{ name: "Rice Bubbles by Kellogg's", amount: '90 g' },
					{ name: 'Whey Protein Isolate Smooth Milk Chocolate', amount: '20 g' },
					{ name: 'Banana', amount: '50 g' },
					{ name: "Smooth Peanut Butter by Mayver's", amount: '10 g' },
				],
			},
			{
				name: 'Spag Bowl',
				kcal: 511,
				proteinG: 40.9,
				carbsG: 68.5,
				fatG: 8.2,
				ingredients: [
					{ name: '5% Fat Extra Lean Mince Beef', amount: '120 g' },
					{ name: 'Spirals Pasta By Woolworths', amount: '80 g' },
					{ name: 'Italian Tomato Passata By Woolworths', amount: '100 ml' },
					{ name: 'Zucchini', amount: '75 g' },
					{ name: 'Mushrooms', amount: '75 g' },
				],
			},
			MEAL_DESSERT,
			INTRA_WORKOUT,
		],
	},
];

/** Default shopping week: 4 training + 3 non-training (rest). */
export const SHOPPING_WEEK_TRAINING_DAYS = 4;
export const SHOPPING_WEEK_REST_DAYS = 3;

/**
 * Typical week Woolworths list (4 lift / 3 rest). Phone-copyable totals.
 * No invented SKUs — product names as listed on the templates.
 */
export const SHOPPING_LIST_TYPICAL_WEEK: ShoppingListLine[] = [
	{ name: 'Oats', amount: '420 g', note: '60 g × 7 days' },
	{ name: 'Whey Protein Isolate Vanilla Creamy', amount: '210 g', note: '30 g × 7' },
	{ name: 'Walnuts', amount: '70 g', note: '10 g × 7' },
	{ name: 'Sugar Free Maple Syrup By Queen', amount: '105 ml', note: '15 ml × 7 (oats)' },
	{ name: 'Strawberries', amount: '700 g', note: '100 g × 7' },
	{ name: 'Chicken Breast Cooked', amount: '840 g', note: '120 g × 7' },
	{
		name: "Express Mexican Style Rice By Uncle Ben's",
		amount: '1225 g',
		note: '175 g × 7 (base days)',
	},
	{ name: 'Australian Carrots Peas & Corn', amount: '700 g', note: '100 g × 7' },
	{ name: "Perinaise By Nando's", amount: '105 ml', note: '15 ml × 7' },
	{ name: 'Uncle Tobys Kit Kat Muesli Bar', amount: '7 bars', note: '1 × 7' },
	{ name: 'Kiwi', amount: '700 g', note: '100 g × 7' },
	{ name: "Rice Bubbles by Kellogg's", amount: '420 g', note: '60 g × 7' },
	{ name: 'Whey Protein Isolate Smooth Milk Chocolate', amount: '140 g', note: '20 g × 7' },
	{ name: 'Banana', amount: '350 g', note: '50 g × 7' },
	{ name: "Smooth Peanut Butter by Mayver's", amount: '70 g', note: '10 g × 7' },
	{ name: '5% Fat Extra Lean Mince Beef', amount: '840 g', note: '120 g × 7' },
	{ name: 'Spirals Pasta By Woolworths', amount: '420 g', note: '60 g × 7' },
	{ name: 'Italian Tomato Passata By Woolworths', amount: '700 ml', note: '100 ml × 7' },
	{ name: 'Zucchini', amount: '525 g', note: '75 g × 7' },
	{ name: 'Mushrooms', amount: '525 g', note: '75 g × 7' },
	{ name: 'Yopro Salted Caramel Yoghurt By Danone', amount: '1050 g', note: '150 g × 7' },
	{ name: 'Frozen Mixed Berries', amount: '1050 g', note: '150 g × 7' },
	{ name: 'Maple Syrup Sugar Free', amount: '105 g', note: '15 g × 7 (dessert)' },
	{
		name: '100% Pure Coconut Water By Woolworths',
		amount: '4 L',
		note: '1000 ml × 4 training days — skip rest days',
	},
];

/**
 * Diet-break week (7× diet-break day). Intra every day. Swap in when running the 1–2 week break.
 */
export const SHOPPING_LIST_DIET_BREAK_WEEK: ShoppingListLine[] = [
	{ name: 'Oats', amount: '420 g', note: '60 g × 7' },
	{ name: 'Whey Protein Isolate Vanilla Creamy', amount: '210 g', note: '30 g × 7' },
	{ name: 'Walnuts', amount: '70 g', note: '10 g × 7' },
	{ name: 'Sugar Free Maple Syrup By Queen', amount: '105 ml', note: '15 ml × 7 (oats)' },
	{ name: 'Strawberries', amount: '700 g', note: '100 g × 7' },
	{ name: 'Chicken Breast Cooked', amount: '840 g', note: '120 g × 7' },
	{
		name: "Express Mexican Style Rice By Uncle Ben's",
		amount: '1575 g',
		note: '225 g × 7 (diet-break portion)',
	},
	{ name: 'Australian Carrots Peas & Corn', amount: '700 g', note: '100 g × 7' },
	{ name: "Perinaise By Nando's", amount: '105 ml', note: '15 ml × 7' },
	{ name: 'Uncle Tobys Kit Kat Muesli Bar', amount: '14 bars', note: '2 × 7' },
	{ name: 'Kiwi', amount: '700 g', note: '100 g × 7' },
	{ name: "Rice Bubbles by Kellogg's", amount: '630 g', note: '90 g × 7' },
	{ name: 'Whey Protein Isolate Smooth Milk Chocolate', amount: '140 g', note: '20 g × 7' },
	{ name: 'Banana', amount: '350 g', note: '50 g × 7' },
	{ name: "Smooth Peanut Butter by Mayver's", amount: '70 g', note: '10 g × 7' },
	{ name: '5% Fat Extra Lean Mince Beef', amount: '840 g', note: '120 g × 7' },
	{ name: 'Spirals Pasta By Woolworths', amount: '560 g', note: '80 g × 7' },
	{ name: 'Italian Tomato Passata By Woolworths', amount: '700 ml', note: '100 ml × 7' },
	{ name: 'Zucchini', amount: '525 g', note: '75 g × 7' },
	{ name: 'Mushrooms', amount: '525 g', note: '75 g × 7' },
	{ name: 'Yopro Salted Caramel Yoghurt By Danone', amount: '1050 g', note: '150 g × 7' },
	{ name: 'Frozen Mixed Berries', amount: '1050 g', note: '150 g × 7' },
	{ name: 'Maple Syrup Sugar Free', amount: '105 g', note: '15 g × 7 (dessert)' },
	{
		name: '100% Pure Coconut Water By Woolworths',
		amount: '7 L',
		note: '1000 ml × 7 — Intra every diet-break day',
	},
];

/** @deprecated Use SHOPPING_LIST_TYPICAL_WEEK — kept as alias for older imports. */
export const SHOPPING_LIST_PARTIAL = SHOPPING_LIST_TYPICAL_WEEK;

/** Plain-text block for phone copy → Woolworths / notes. */
export function formatShoppingListPlain(
	lines: ShoppingListLine[] = SHOPPING_LIST_TYPICAL_WEEK,
	opts?: { title?: string; blurb?: string },
): string {
	const header = [
		opts?.title ?? 'Food Bro — Woolworths week (4 training / 3 rest)',
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
		title: 'Food Bro — diet-break week (7× diet-break day)',
		blurb:
			'Use for 1–2 weeks when flat / glycogen depleted (~maintenance for example profile). Then return to the typical week list.',
	});
}

/** Baseline day kcal the founder templates were logged at. */
export const COACH_BASELINE_KCAL = {
	'non-training': 2216,
	training: 2364,
	'diet-break': 2738,
} as const;

const INTRA_KCAL = INTRA_WORKOUT.kcal;

export interface CoachScaleFactors {
	/** Applied to non-training + training base meals (Intra stays fixed). */
	work: number;
	/** Applied to diet-break non-Intra meals (Intra stays fixed). */
	dietBreak: number;
	workTargetKcal: number;
	dietBreakTargetKcal: number;
}

/**
 * Map calculator output → day-type scales.
 * Work days (non-training / training) track goal calories; diet-break tracks TDEE (maintenance).
 * Intra coconut water stays a practical 1 L / ~148 kcal so training = scaled rest + Intra.
 */
export function coachScaleFactors(result: Pick<FoodOsResult, 'calories' | 'tdee'>): CoachScaleFactors {
	const workTargetKcal = Math.max(1200, Math.round(result.calories));
	const dietBreakTargetKcal = Math.max(1200, Math.round(result.tdee));
	const work = workTargetKcal / COACH_BASELINE_KCAL['non-training'];
	const dietBreakBase = COACH_BASELINE_KCAL['diet-break'] - INTRA_KCAL;
	const dietBreak = Math.max(0.35, (dietBreakTargetKcal - INTRA_KCAL) / dietBreakBase);
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

function scaleIngredient(ing: CoachIngredient, scale: number, fixedIntra: boolean): CoachIngredient {
	if (fixedIntra) return { ...ing };
	return {
		...ing,
		amount: scalePortionAmount(ing.amount, scale),
	};
}

function scaleMeal(meal: CoachMealSlot, scale: number): CoachMealSlot {
	if (meal.intra) {
		// Keep 1 L coconut water as a practical fixed serve.
		return {
			...meal,
			ingredients: meal.ingredients?.map((ing) => ({ ...ing })),
		};
	}
	const kcal = Math.round(meal.kcal * scale);
	const proteinG = Math.round(meal.proteinG * scale * 10) / 10;
	const carbsG = Math.round(meal.carbsG * scale * 10) / 10;
	const fatG = Math.round(meal.fatG * scale * 10) / 10;
	return {
		...meal,
		kcal,
		proteinG,
		carbsG,
		fatG,
		ingredients: meal.ingredients?.map((ing) => scaleIngredient(ing, scale, false)),
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

function scaleDayPlan(plan: CoachDayPlan, scale: number): CoachDayPlan {
	const meals = plan.meals.map((m) => scaleMeal(m, scale));
	const proteinG = Math.round(meals.reduce((s, m) => s + m.proteinG, 0) * 10) / 10;
	const carbsG = Math.round(meals.reduce((s, m) => s + m.carbsG, 0) * 10) / 10;
	const fatG = Math.round(meals.reduce((s, m) => s + m.fatG, 0) * 10) / 10;
	const calories = Math.round(meals.reduce((s, m) => s + m.kcal, 0));
	const fibreG = Math.round(plan.fibreG * scale * 10) / 10;
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

/** Scale all three recommended day templates from a calculator result + body inputs. */
export function scaleCoachDayPlans(
	result: Pick<FoodOsResult, 'calories' | 'tdee' | 'goal'>,
	profile: { weightKg: number; heightCm: number; age?: number },
): ScaledCoachBundle {
	const factors = coachScaleFactors(result);
	const plans = COACH_DAY_PLANS.map((plan) => {
		const scale = plan.id === 'diet-break' ? factors.dietBreak : factors.work;
		const scaled = scaleDayPlan(plan, scale);
		if (plan.id === 'non-training') {
			scaled.when = 'Rest / no hard lifting. Skip Intra.';
		} else if (plan.id === 'training') {
			scaled.when = 'Lift days — same base meals as rest, plus 1 L coconut water Intra.';
		} else {
			scaled.when =
				result.goal === 'maintain'
					? 'Settle week at estimated maintenance. Bigger carb portions + Intra daily — not a forever surplus.'
					: '1–2 weeks at estimated maintenance when flat / glycogen depleted, then return to your cut or training week.';
		}
		return scaled;
	});

	const { age, weightKg, heightCm } = COACH_PLAN_EXAMPLE_PROFILE;
	const { profileLine, profileNote } = coachProfileCopy(result, factors, profile);
	const lede = `Day structures from the coach templates (baseline ${age} / ${weightKg} kg / ${heightCm} cm). Your calculator sets the kcal and portions — pick a day type below.`;

	return { plans, factors, profileLine, profileNote, lede };
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
}

/** Scale Woolworths weekly lists with the same factors as the day templates. */
export function scaleShoppingLists(
	result: Pick<FoodOsResult, 'calories' | 'tdee'>,
	profile: { weightKg: number; heightCm: number },
): ScaledShoppingBundle {
	const factors = coachScaleFactors(result);
	const typical = SHOPPING_LIST_TYPICAL_WEEK.map((line) =>
		scaleShoppingLine(line, factors.work, { skipCoconut: true }),
	);
	const dietBreak = SHOPPING_LIST_DIET_BREAK_WEEK.map((line) =>
		scaleShoppingLine(line, factors.dietBreak, { skipCoconut: true }),
	);
	const blurb = `${profile.weightKg} kg · ${profile.heightCm} cm · portions ×${factors.work.toFixed(2)} (work week) / ×${factors.dietBreak.toFixed(2)} (diet-break). Baseline ${COACH_PLAN_EXAMPLE_PROFILE.weightKg} kg template. Coconut water stays 1 L per Intra day.`;
	const typicalPlain = formatShoppingListPlain(typical, {
		title: 'Food Bro — Woolworths week (4 training / 3 rest)',
		blurb,
	});
	const dietBreakPlain = formatShoppingListPlain(dietBreak, {
		title: 'Food Bro — diet-break week (7× diet-break day)',
		blurb: `${blurb} Use for 1–2 weeks when flat / glycogen depleted (~your maintenance), then return to the typical week list.`,
	});
	return { typical, dietBreak, typicalPlain, dietBreakPlain, blurb };
}
