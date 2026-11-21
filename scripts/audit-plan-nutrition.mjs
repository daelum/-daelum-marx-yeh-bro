/**
 * Audit personalised plan nutrition math on sample profiles.
 * Run: node scripts/audit-plan-nutrition.mjs
 * (Uses dynamic import of compiled? — prefer tsx.)
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

async function main() {
	const { calcFoodOs } = await import('../src/lib/food-os.ts');
	const { buildPersonalPlan } = await import('../src/lib/personal-plan.ts');

	const samples = [
		{
			label: 'founder-baseline',
			inputs: {
				weightKg: 80,
				heightCm: 178,
				age: 36,
				sex: 'male',
				activity: 'moderate',
				goal: 'cut',
				cutPct: 18,
				bulkPct: 10,
				trainingDays: 4,
			},
		},
		{
			label: 'lean-bulk-3day',
			inputs: {
				weightKg: 70,
				heightCm: 170,
				age: 28,
				sex: 'female',
				activity: 'active',
				goal: 'lean-bulk',
				cutPct: 18,
				bulkPct: 10,
				trainingDays: 3,
			},
		},
		{
			label: 'maintain-desk',
			inputs: {
				weightKg: 95,
				heightCm: 185,
				age: 42,
				sex: 'male',
				activity: 'sedentary',
				goal: 'maintain',
				cutPct: 18,
				bulkPct: 10,
				trainingDays: 3,
			},
		},
	];

	let failed = 0;
	for (const sample of samples) {
		const { inputs, label } = sample;
		const adjustment =
			inputs.goal === 'cut'
				? -(inputs.cutPct / 100)
				: inputs.goal === 'lean-bulk'
					? inputs.bulkPct / 100
					: 0;
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
		const doc = buildPersonalPlan(inputs, result);
		const issues = doc.nutritionAudit;
		const shopCount = doc.shopping.lines.length;
		const daysOk = doc.training.daysPerWeek === inputs.trainingDays;
		console.log(
			`${issues.length ? 'FAIL' : 'PASS'} ${label} · target ${result.calories} kcal · shop ${shopCount} lines · train ${doc.training.daysPerWeek}d${daysOk ? '' : ' MISMATCH'}`,
		);
		for (const issue of issues) {
			console.log(`  - ${issue.path}: ${issue.message}`);
			failed++;
		}
		if (!daysOk) failed++;
		if (shopCount < 5) {
			console.log('  - shopping too short');
			failed++;
		}
		// Public naming check on rendered strings
		const blob = JSON.stringify(doc);
		for (const banned of ['Food Bro', 'Yeh Bro System', 'Start Here']) {
			if (blob.includes(banned)) {
				console.log(`  - public string leak: ${banned}`);
				failed++;
			}
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
