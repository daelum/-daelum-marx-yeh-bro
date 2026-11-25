/**
 * Audit personalised plan nutrition + calorie math on sample profiles.
 * Validates food-DB line macros, meal = sum(lines), day = sum(meals).
 * Run: npx tsx scripts/audit-plan-nutrition.mjs
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** Independent Mifflin–St Jeor check (must match food-os). */
function expectedBmr(weightKg, heightCm, age, sex) {
	const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
	return sex === 'male' ? base + 5 : base - 161;
}

const ACTIVITY = {
	sedentary: 1.2,
	light: 1.375,
	moderate: 1.55,
	active: 1.725,
	'very-active': 1.9,
};

function expectedCalories(inputs) {
	const bmr = expectedBmr(inputs.weightKg, inputs.heightCm, inputs.age, inputs.sex);
	const tdee = bmr * ACTIVITY[inputs.activity];
	const adj =
		inputs.goal === 'cut'
			? -(inputs.cutPct / 100)
			: inputs.goal === 'lean-bulk'
				? inputs.bulkPct / 100
				: 0;
	return {
		bmr: Math.round(bmr),
		tdee: Math.round(tdee),
		calories: Math.round(tdee * (1 + adj)),
		proteinG: Math.round(inputs.weightKg * 1.8),
		fatG: Math.round(inputs.weightKg * 0.8),
	};
}

/** Founder-reported sample errors — must not reappear. */
const FOOD_SANITY = [
	{ foodId: 'strawberries', amount: '100 g', maxKcal: 50, maxProtein: 2 },
	{ foodId: 'chicken_breast_cooked', amount: '120 g', minProtein: 30, maxCarbs: 1 },
	{ foodId: 'kiwi', amount: '100 g', maxKcal: 80, maxProtein: 3 },
	{ foodId: 'banana', amount: '50 g', maxKcal: 60, maxProtein: 2 },
	{ foodId: 'peanut_butter', amount: '10 g', minKcal: 40, maxKcal: 80, minFat: 4 },
];

async function main() {
	const { calcFoodOs } = await import('../src/lib/food-os.ts');
	const { buildPersonalPlan, findAlternativeWording } = await import('../src/lib/personal-plan.ts');
	const { macrosForFoodAmount, FOOD_DB, foodMacroKcalDelta } = await import('../src/data/food-db.ts');

	let failed = 0;

	console.log('--- Food DB sanity ---');
	for (const [id, food] of Object.entries(FOOD_DB)) {
		const delta = foodMacroKcalDelta(food.per100);
		// Allow generous slack for fibre/rounding on per-100 panels.
		if (delta > 25) {
			console.error(`FAIL food DB ${id}: 4/4/9 delta ${delta} on per100`);
			failed++;
		}
	}
	for (const check of FOOD_SANITY) {
		const m = macrosForFoodAmount(check.foodId, check.amount);
		const problems = [];
		if (check.maxKcal != null && m.kcal > check.maxKcal) problems.push(`kcal ${m.kcal} > ${check.maxKcal}`);
		if (check.minKcal != null && m.kcal < check.minKcal) problems.push(`kcal ${m.kcal} < ${check.minKcal}`);
		if (check.maxProtein != null && m.proteinG > check.maxProtein)
			problems.push(`P ${m.proteinG} > ${check.maxProtein}`);
		if (check.minProtein != null && m.proteinG < check.minProtein)
			problems.push(`P ${m.proteinG} < ${check.minProtein}`);
		if (check.maxCarbs != null && m.carbsG > check.maxCarbs) problems.push(`C ${m.carbsG} > ${check.maxCarbs}`);
		if (check.minFat != null && m.fatG < check.minFat) problems.push(`F ${m.fatG} < ${check.minFat}`);
		if (problems.length) {
			console.error(`FAIL ${check.foodId} ${check.amount}: ${problems.join(', ')}`, m);
			failed++;
		} else {
			console.log(`PASS ${check.foodId} ${check.amount} → ${m.kcal} kcal / P${m.proteinG}`);
		}
	}

	const samples = [
		{
			label: 'A-beginner-fatloss-3d',
			inputs: {
				firstName: 'Alex',
				email: 'alex@example.com',
				weightKg: 92,
				heightCm: 175,
				age: 29,
				sex: 'male',
				activity: 'light',
				goal: 'cut',
				cutPct: 18,
				bulkPct: 10,
				trainingDays: 3,
				experience: 'beginner',
				equipment: 'full-gym',
				stepsBand: '5-8k',
				sleepHours: '6-7',
			},
		},
		{
			label: 'B-recomp-4d',
			inputs: {
				firstName: 'Jordan',
				email: 'jordan@example.com',
				weightKg: 78,
				heightCm: 176,
				age: 34,
				sex: 'male',
				activity: 'moderate',
				goal: 'maintain',
				cutPct: 18,
				bulkPct: 10,
				trainingDays: 4,
				experience: 'intermediate',
				equipment: 'full-gym',
				stepsBand: '8-10k',
				sleepHours: '7-9',
			},
		},
		{
			label: 'C-muscle-experienced-4d',
			inputs: {
				firstName: 'Sam',
				email: 'sam@example.com',
				weightKg: 85,
				heightCm: 182,
				age: 27,
				sex: 'male',
				activity: 'active',
				goal: 'lean-bulk',
				cutPct: 18,
				bulkPct: 10,
				trainingDays: 4,
				experience: 'experienced',
				equipment: 'full-gym',
				stepsBand: '10k-plus',
				sleepHours: '7-9',
			},
		},
		{
			label: 'D-limited-equipment-beginner-3d',
			inputs: {
				firstName: 'Riley',
				email: 'riley@example.com',
				weightKg: 74,
				heightCm: 170,
				age: 41,
				sex: 'female',
				activity: 'light',
				goal: 'cut',
				cutPct: 20,
				bulkPct: 10,
				trainingDays: 3,
				experience: 'beginner',
				equipment: 'limited',
				stepsBand: 'under-5k',
				sleepHours: 'under-6',
				limitations: 'left knee flares on deep flexion',
			},
		},
		{
			label: 'H-one-arm-only-4d',
			inputs: {
				firstName: 'Taylor',
				email: 'taylor@example.com',
				weightKg: 82,
				heightCm: 180,
				age: 33,
				sex: 'male',
				activity: 'moderate',
				goal: 'cut',
				cutPct: 18,
				bulkPct: 10,
				trainingDays: 4,
				experience: 'intermediate',
				equipment: 'full-gym',
				stepsBand: '8-10k',
				sleepHours: '7-9',
				limitations: 'only one arm — cannot use left arm for training',
			},
		},
		{
			label: 'E-founder-cut-4d',
			inputs: {
				firstName: 'Founder',
				email: 'founder@example.com',
				weightKg: 80,
				heightCm: 178,
				age: 36,
				sex: 'male',
				activity: 'moderate',
				goal: 'cut',
				cutPct: 18,
				bulkPct: 10,
				trainingDays: 4,
				experience: 'intermediate',
				equipment: 'full-gym',
			},
		},
		{
			label: 'F-female-beginner-fatloss-3d-lowact',
			inputs: {
				firstName: 'Casey',
				email: 'casey@example.com',
				weightKg: 74,
				heightCm: 165,
				age: 28,
				sex: 'female',
				activity: 'sedentary',
				goal: 'cut',
				cutPct: 18,
				bulkPct: 10,
				trainingDays: 3,
				experience: 'beginner',
				equipment: 'full-gym',
				stepsBand: 'under-5k',
			},
		},
		{
			label: 'G-high-volume-6d',
			inputs: {
				firstName: 'Max',
				email: 'max@example.com',
				weightKg: 90,
				heightCm: 188,
				age: 24,
				sex: 'male',
				activity: 'very-active',
				goal: 'lean-bulk',
				cutPct: 18,
				bulkPct: 10,
				trainingDays: 6,
				experience: 'experienced',
				equipment: 'full-gym',
			},
		},
	];

	console.log('\n--- Plan profiles ---');
	for (const sample of samples) {
		const { inputs, label } = sample;
		const adjustment =
			inputs.goal === 'cut'
				? -(inputs.cutPct / 100)
				: inputs.goal === 'lean-bulk'
					? inputs.bulkPct / 100
					: 0;
		const expected = expectedCalories(inputs);
		const result = calcFoodOs({
			weightKg: inputs.weightKg,
			heightCm: inputs.heightCm,
			age: inputs.age,
			sex: inputs.sex,
			activity: inputs.activity,
			goal: inputs.goal,
			adjustment,
		});
		if (!result) {
			console.error(`FAIL ${label}: calcFoodOs returned null`);
			failed++;
			continue;
		}
		if (result.bmr !== expected.bmr || result.tdee !== expected.tdee || result.calories !== expected.calories) {
			console.error(
				`FAIL ${label}: calorie mismatch engine=${result.bmr}/${result.tdee}/${result.calories} expected=${expected.bmr}/${expected.tdee}/${expected.calories}`,
			);
			failed++;
		}
		if (result.proteinG !== expected.proteinG || result.fatG !== expected.fatG) {
			console.error(
				`FAIL ${label}: macro mismatch P/F engine=${result.proteinG}/${result.fatG} expected=${expected.proteinG}/${expected.fatG}`,
			);
			failed++;
		}

		const doc = buildPersonalPlan(inputs, result);
		const issues = doc.nutritionAudit;
		const shopCount = doc.shopping.lines.length;
		const expectedDays =
			inputs.equipment === 'limited' && inputs.trainingDays >= 4
				? 4
				: inputs.equipment === 'limited'
					? 3
					: inputs.trainingDays;
		const daysOk = doc.training.daysPerWeek === expectedDays;
		const dayNames = new Set(doc.training.days.map((d) => d.label));
		const habitsOk = Array.isArray(doc.dailyHabits) && doc.dailyHabits.length >= 4;
		const stepsOk = /10,?000/.test(JSON.stringify(doc.nonNegotiables) + JSON.stringify(doc.dailyHabits));
		const waterOk = /4\s*(L|litre|liter)/i.test(
			JSON.stringify(doc.nonNegotiables) + JSON.stringify(doc.dailyHabits),
		);
		const nameOk = !inputs.firstName || (doc.firstName && doc.intro.title.includes(doc.firstName));
		const altHits = findAlternativeWording(doc);
		const onePerSlot = doc.training.days.every((d) => d.lifts.every((l) => l.name && !/alternative/i.test(l.cue || '')));
		const hasVideoField = doc.training.days.every((d) =>
			d.lifts.every((l) => 'videoUrl' in l),
		);
		const recoveryOk = Array.isArray(doc.recovery) && doc.recovery.length >= 2;
		const trackingOk = Array.isArray(doc.progressTracking) && doc.progressTracking.length >= 4;
		const actionOk = Array.isArray(doc.actionPlan) && doc.actionPlan.length >= 3;

		// Spot-check strawberries never look like protein powder.
		let foodSpotOk = true;
		for (const day of doc.nutritionDays) {
			for (const meal of day.meals) {
				for (const ing of meal.ingredients ?? []) {
					if (/strawberr/i.test(ing.name) && ((ing.kcal ?? 0) > 80 || (ing.proteinG ?? 0) > 3)) {
						console.log(`  - strawberries look wrong: ${ing.amount} → ${ing.kcal}kcal/${ing.proteinG}P`);
						foodSpotOk = false;
					}
					if (/chicken breast/i.test(ing.name) && (ing.carbsG ?? 0) > 1) {
						console.log(`  - chicken has carbs: ${ing.carbsG}`);
						foodSpotOk = false;
					}
					if (/spag/i.test(meal.name) && ing.foodId === 'lean_mince_5') {
						const amt = parseFloat(ing.amount);
						if (ing.kcal != null && Math.abs(ing.kcal - amt) < 2) {
							console.log(`  - Spag mince macros mirroring quantity (${ing.amount} → ${ing.kcal} kcal)`);
							foodSpotOk = false;
						}
					}
				}
			}
		}

		const ok =
			!issues.length &&
			daysOk &&
			habitsOk &&
			foodSpotOk &&
			shopCount >= 5 &&
			stepsOk &&
			waterOk &&
			nameOk &&
			!altHits.length &&
			onePerSlot &&
			hasVideoField &&
			recoveryOk &&
			trackingOk &&
			actionOk;
		console.log(
			`${ok ? 'PASS' : 'FAIL'} ${label} · target ${result.calories} kcal · P${result.proteinG}/C${result.carbsG}/F${result.fatG} · shop ${shopCount} · train ${doc.training.daysPerWeek}d (${[...dayNames].join('/')}) · habits ${doc.dailyHabits?.length ?? 0} · name ${doc.firstName || '—'}`,
		);
		for (const issue of issues) {
			console.log(`  - ${issue.path}: ${issue.message}`);
			failed++;
		}
		if (!daysOk) failed++;
		if (!habitsOk) {
			console.log('  - missing Daily Habits');
			failed++;
		}
		if (!stepsOk) {
			console.log('  - 10,000 steps not prominent');
			failed++;
		}
		if (!waterOk) {
			console.log('  - ~4 L water not prominent');
			failed++;
		}
		if (!nameOk) {
			console.log('  - first name personalisation missing');
			failed++;
		}
		if (altHits.length) {
			console.log(`  - alternative wording: ${altHits.join('; ')}`);
			failed++;
		}
		if (!onePerSlot || !hasVideoField) {
			console.log('  - exercise slots / videoUrl incomplete');
			failed++;
		}
		if (!recoveryOk || !trackingOk || !actionOk) {
			console.log('  - recovery/tracking/action sections incomplete');
			failed++;
		}
		if (!foodSpotOk) failed++;
		if (shopCount < 5) {
			console.log('  - shopping too short');
			failed++;
		}
		// One daily meal plan should track goal calories (portion rounding slack).
		const daily = doc.nutritionDays.find((d) => d.id === 'training');
		if (!daily) {
			console.log('  - missing daily meal plan (training id)');
			failed++;
		} else if (Math.abs(daily.calories - result.calories) > 60) {
			console.log(
				`  - daily plan kcal ${daily.calories} far from target ${result.calories} (Δ${Math.abs(daily.calories - result.calories)})`,
			);
			failed++;
		} else {
			const mealNames = daily.meals.map((m) => m.name.toLowerCase());
			if (new Set(mealNames).size !== mealNames.length) {
				console.log('  - duplicate meal names in daily plan');
				failed++;
			}
			const coconutMeals = daily.meals.filter((m) =>
				(m.ingredients || []).some((i) => i.foodId === 'coconut_water' || /coconut water/i.test(i.name)),
			);
			if (coconutMeals.length !== 1 || !/pre-workout/i.test(coconutMeals[0].name)) {
				console.log(
					`  - coconut water must appear once inside Pre-workout (found ${coconutMeals.length}: ${coconutMeals.map((m) => m.name).join(', ')})`,
				);
				failed++;
			}
			const optionalCoconut = /optional.*coconut|coconut.*optional/i.test(JSON.stringify(daily));
			if (optionalCoconut) {
				console.log('  - coconut water still marked optional');
				failed++;
			}
			// No separate Intra / around-training meal
			if (daily.meals.some((m) => /around training|intra/i.test(m.name))) {
				console.log('  - separate around-training/intra meal still present');
				failed++;
			}
		}
		if (doc.nutritionDays.filter((d) => d.id === 'training').length !== 1) {
			console.log('  - expected exactly one daily meal plan');
			failed++;
		}
		if (doc.nutritionDays.some((d) => d.id === 'non-training')) {
			console.log('  - duplicate rest-day meal structure should not be prescribed');
			failed++;
		}
		const dietBreak = doc.nutritionDays.find((d) => d.id === 'diet-break');
		if (dietBreak && Math.abs(dietBreak.calories - result.tdee) > 80) {
			console.log(
				`  - diet-break kcal ${dietBreak.calories} far from TDEE ${result.tdee}`,
			);
			failed++;
		}

		// One-arm limitation must adapt bilateral arm lifts away.
		if (/only one arm/i.test(inputs.limitations || '')) {
			const { validateTrainingAgainstLimitations, parseLimitations } = await import(
				'../src/lib/training-personalise.ts'
			);
			const parsed = parseLimitations(inputs.limitations);
			const issues = validateTrainingAgainstLimitations(doc.training, parsed);
			if (issues.length || doc.trainingPersonalisation?.refused) {
				console.log(`  - one-arm validation failed: ${issues.join('; ') || doc.trainingPersonalisation?.message}`);
				failed++;
			} else {
				const bilateral = doc.training.days.flatMap((d) =>
					d.lifts.filter((l) =>
						/\b(barbell|smith|machine chest|lat pulldown|push-up|pushdown|bench press|shoulder press|pec deck)\b/i.test(
							l.name,
						) && !/\bone[- ]arm\b/i.test(l.name),
					),
				);
				if (bilateral.length) {
					console.log(
						`  - one-arm plan still has two-hand lifts: ${bilateral.map((l) => l.name).join(', ')}`,
					);
					failed++;
				} else {
					console.log(`  - one-arm adaptations: ${(doc.trainingPersonalisation?.adaptations || []).length}`);
				}
			}
		}
		const blob = JSON.stringify(doc);
		for (const banned of ['Food Bro', 'Yeh Bro System', 'Start Here', 'portion-weighted']) {
			if (blob.includes(banned)) {
				console.log(`  - public string leak: ${banned}`);
				failed++;
			}
		}
		if (!/Daily Habits|dailyHabits/.test(blob) && !doc.dailyHabits?.length) {
			console.log('  - no daily habits on plan');
			failed++;
		}
	}

	if (failed) {
		console.error(`\n${failed} issue(s)`);
		process.exit(1);
	}
	console.log('\nAll sample audits passed.');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
