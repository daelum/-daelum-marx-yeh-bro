/**
 * Limitation-aware training personalisation.
 * Numbers / templates stay in code; AI (or deterministic fallback) only selects
 * from the controlled exercise library. Always validate before approve.
 */

import {
	EXERCISE_LIBRARY,
	exerciseLibraryForPrompt,
	libraryById,
	libraryByName,
	liftFromLibrary,
	type LibraryExercise,
} from '../data/exercise-library';
import type { EquipmentPref, Lift, TrainingDay, TrainingTemplate } from '../data/start-here-system';
import { resolveTrainingTemplate } from '../data/start-here-system';
import { videoUrlForExercise } from '../data/exercise-videos';

export type LimitationKind =
	| 'one-arm'
	| 'knee-flexion'
	| 'generic'
	| 'unsafe-refuse'
	| 'none';

export interface ParsedLimitations {
	raw: string;
	kinds: LimitationKind[];
	/** e.g. left / right when detectable. */
	side?: 'left' | 'right' | 'unspecified';
	notes: string[];
}

export interface TrainingPersonaliseResult {
	ok: boolean;
	mode: 'openai' | 'deterministic' | 'template' | 'refused';
	training?: TrainingTemplate;
	message?: string;
	adaptations: string[];
	validationIssues: string[];
	limitationKinds: LimitationKind[];
}

export interface AiTrainingProposal {
	status: 'ok' | 'need_more_info' | 'refuse';
	message?: string;
	adaptations?: string[];
	days: Array<{
		id: string;
		label: string;
		lifts: Array<{
			exerciseId: string;
			sets?: string;
			reps?: string;
			rest?: string;
			cue?: string;
		}>;
	}>;
}

const UNSAFE_PATTERNS =
	/\b(paralys|parapleg|quadripleg|spinal cord|recent surgery|post[- ]op|fracture|broken bone|uncontrolled|doctor said (no|avoid) (all )?exercis|cardiac event|heart attack)\b/i;

export function parseLimitations(raw?: string): ParsedLimitations {
	const text = (raw ?? '').trim();
	if (!text) return { raw: '', kinds: ['none'], notes: [] };

	if (UNSAFE_PATTERNS.test(text)) {
		return {
			raw: text,
			kinds: ['unsafe-refuse'],
			notes: ['Limitation language suggests clinical risk beyond this product’s scope.'],
		};
	}

	const kinds: LimitationKind[] = [];
	let side: ParsedLimitations['side'];
	const notes: string[] = [];

	const oneArm =
		/\b(only one arm|one arm only|single arm|can'?t use (my )?(left|right) arm|no use of (my )?(left|right) arm|amputat\w* arm|missing (an? )?(left|right)?\s*arm|one[- ]armed|unilateral arm)\b/i.test(
			text,
		) ||
		(/\b(left|right)\s+arm\b/i.test(text) &&
			/\b(only|can'?t|cannot|unable|don'?t use|amputat|missing|injured badly)\b/i.test(text));

	if (oneArm || /\bonly one arm\b/i.test(text)) {
		kinds.push('one-arm');
		const m = text.match(/\b(left|right)\s+arm\b/i);
		side = m ? (m[1].toLowerCase() as 'left' | 'right') : 'unspecified';
		notes.push('Program must not require two working arms on the same lift.');
	}

	if (/\bknee\b/i.test(text) && /\b(flare|pain|deep|flexion|squat|lunge)\b/i.test(text)) {
		kinds.push('knee-flexion');
		notes.push('Avoid forcing deep knee flexion past a comfortable range.');
	}

	if (!kinds.length) kinds.push('generic');
	return { raw: text, kinds, side, notes };
}

function isForbiddenForKinds(ex: LibraryExercise, kinds: LimitationKind[]): boolean {
	if (kinds.includes('one-arm')) {
		if (ex.requiresTwoHands) return true;
		if (ex.limbDemand === 'bilateral-arms') return true;
	}
	if (kinds.includes('knee-flexion') && ex.deepKneeFlexion) return true;
	return false;
}

function replacementFor(
	current: LibraryExercise | undefined,
	kinds: LimitationKind[],
	equipment: EquipmentPref,
	usedIds: Set<string>,
): LibraryExercise | null {
	const pool =
		equipment === 'limited'
			? EXERCISE_LIBRARY.filter((e) => e.homeOk)
			: EXERCISE_LIBRARY;
	const safe = pool.filter((e) => !isForbiddenForKinds(e, kinds));
	const unused = safe.filter((e) => !usedIds.has(e.id));

	const pick = (list: LibraryExercise[]) => {
		if (!current) return list[0] ?? null;
		return list.find((e) => e.pattern === current.pattern) ?? null;
	};

	const affinity: Record<string, string[]> = {
		'horizontal-press': ['incline-press', 'chest-fly', 'shoulder-press'],
		'incline-press': ['horizontal-press', 'chest-fly', 'shoulder-press'],
		'chest-fly': ['horizontal-press', 'incline-press'],
		'shoulder-press': ['lateral-raise', 'horizontal-press'],
		'lateral-raise': ['shoulder-press', 'rear-delt'],
		tricep: ['horizontal-press'],
		'horizontal-row': ['vertical-pull', 'rear-delt', 'bicep'],
		'vertical-pull': ['horizontal-row', 'rear-delt'],
		'rear-delt': ['horizontal-row', 'lateral-raise'],
		bicep: ['horizontal-row'],
		'knee-dominant': ['leg-extension', 'leg-curl', 'hip-hinge'],
		'leg-curl': ['hip-hinge', 'knee-dominant'],
		'leg-extension': ['knee-dominant'],
		'hip-hinge': ['leg-curl', 'knee-dominant'],
		calf: ['knee-dominant'],
		core: ['hip-hinge'],
	};

	// 1) Unused same-pattern match
	const unusedSame = pick(unused);
	if (unusedSame) return unusedSame;
	// 2) Unused affine pattern
	if (current && unused.length) {
		const related = affinity[current.pattern] || [];
		for (const pat of related) {
			const hit = unused.find((e) => e.pattern === pat);
			if (hit) return hit;
		}
		if (kinds.includes('one-arm')) {
			const uni = unused.find((e) => e.limbDemand === 'unilateral-arm');
			if (uni) return uni;
		}
		return unused[0] ?? null;
	}
	// 3) Repeat a same-pattern safe lift rather than inventing outside the library
	const repeatSame = pick(safe);
	if (repeatSame) return repeatSame;
	return safe[0] ?? null;
}

function materializeLift(
	ex: LibraryExercise,
	overrides?: { sets?: string; reps?: string; rest?: string; cue?: string },
): Lift {
	const lift = liftFromLibrary(ex, overrides);
	return {
		...lift,
		videoUrl: videoUrlForExercise(lift.name),
	};
}

/** Deterministic adapter — used when OpenAI is unbound, and as a safety net. */
export function adaptTrainingDeterministic(
	base: TrainingTemplate,
	parsed: ParsedLimitations,
	equipment: EquipmentPref,
): TrainingPersonaliseResult {
	if (parsed.kinds.includes('none')) {
		return {
			ok: true,
			mode: 'template',
			training: base,
			adaptations: [],
			validationIssues: [],
			limitationKinds: parsed.kinds,
		};
	}
	if (parsed.kinds.includes('unsafe-refuse')) {
		return {
			ok: false,
			mode: 'refused',
			message:
				'Based on what you wrote, we can’t safely build a training plan in this product. Please get clearance from a qualified clinician, then come back with clearer exercise limits — or leave limitations blank if you’re cleared for normal gym training.',
			adaptations: [],
			validationIssues: parsed.notes,
			limitationKinds: parsed.kinds,
		};
	}

	const adaptations: string[] = [];
	const days: TrainingDay[] = base.days.map((day) => {
		const usedIds = new Set<string>();
		const lifts: Lift[] = day.lifts.map((lift) => {
			const lib = libraryByName(lift.name);
			if (!lib) {
				// Unknown name vs library — keep only if clearly unilateral / non-arm when one-arm.
				if (parsed.kinds.includes('one-arm') && /\b(barbell|smith|machine chest|lat pulldown|push-up|pushdown|bench press|shoulder press)\b/i.test(lift.name) && !/\bone[- ]arm\b/i.test(lift.name)) {
					const repl = replacementFor(undefined, parsed.kinds, equipment, usedIds);
					if (!repl) throw new Error('No safe replacement in library');
					usedIds.add(repl.id);
					adaptations.push(`${day.label}: ${lift.name} → ${repl.name}`);
					return materializeLift(repl, { sets: lift.sets, reps: lift.reps, rest: lift.rest });
				}
				usedIds.add(lift.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
				return lift;
			}
			if (!isForbiddenForKinds(lib, parsed.kinds)) {
				usedIds.add(lib.id);
				return lift;
			}
			const repl = replacementFor(lib, parsed.kinds, equipment, usedIds);
			if (!repl) {
				throw new Error(`No safe library replacement for ${lift.name}`);
			}
			usedIds.add(repl.id);
			adaptations.push(`${day.label}: ${lift.name} → ${repl.name}`);
			const cueExtra =
				parsed.kinds.includes('one-arm')
					? ` One-arm constraint: use the working arm only${parsed.side && parsed.side !== 'unspecified' ? ` (protect the ${parsed.side})` : ''}.`
					: parsed.kinds.includes('knee-flexion')
						? ' Stay above a painful knee depth.'
						: '';
			return materializeLift(repl, {
				sets: lift.sets,
				reps: lift.reps,
				rest: lift.rest,
				cue: `${repl.cue}${cueExtra}`,
			});
		});
		return { ...day, lifts };
	});

	const training: TrainingTemplate = {
		...base,
		blurb: `${base.blurb} Adapted for your stated limitation: ${parsed.raw}.`,
		days,
		progression: [
			...base.progression,
			'Limitation rule: never force a lift that loads the restricted limb beyond what you flagged. Pain ≠ normal training soreness — stop and regress.',
		],
	};

	const validationIssues = validateTrainingAgainstLimitations(training, parsed);
	if (validationIssues.length) {
		return {
			ok: false,
			mode: 'refused',
			message:
				'We couldn’t build a safe adapted program from the library for that limitation. Please add more detail (which side, what movements are cleared) or get qualified assistance before training.',
			adaptations,
			validationIssues,
			limitationKinds: parsed.kinds,
		};
	}

	return {
		ok: true,
		mode: 'deterministic',
		training,
		adaptations,
		validationIssues: [],
		limitationKinds: parsed.kinds,
		message: adaptations.length
			? `Adapted ${adaptations.length} lift(s) for your limitation.`
			: 'Limitation noted; base template already compatible.',
	};
}

export function validateTrainingAgainstLimitations(
	training: TrainingTemplate,
	parsed: ParsedLimitations,
): string[] {
	const issues: string[] = [];
	if (parsed.kinds.includes('none')) return issues;
	if (parsed.kinds.includes('unsafe-refuse')) {
		issues.push('Clinical-risk limitation cannot be approved as a training program.');
		return issues;
	}

	for (const day of training.days) {
		for (const lift of day.lifts) {
			const lib = libraryByName(lift.name);
			if (!lib) {
				issues.push(`${day.label}: “${lift.name}” is not in the controlled exercise library.`);
				continue;
			}
			if (isForbiddenForKinds(lib, parsed.kinds)) {
				issues.push(
					`${day.label}: “${lift.name}” conflicts with limitation (${parsed.kinds.join(', ')}).`,
				);
			}
			if (/\balternative/i.test(lift.cue || '') || /\balternative/i.test(lift.name)) {
				issues.push(`${day.label}: alternative wording not allowed — one prescribed lift only.`);
			}
		}
	}
	return issues;
}

export function proposalToTraining(
	base: TrainingTemplate,
	proposal: AiTrainingProposal,
	parsed: ParsedLimitations,
): TrainingPersonaliseResult {
	if (proposal.status === 'refuse' || proposal.status === 'need_more_info') {
		return {
			ok: false,
			mode: 'refused',
			message:
				proposal.message ||
				(proposal.status === 'need_more_info'
					? 'Need clearer limitation detail before building a safe program.'
					: 'Cannot safely accommodate that limitation in this product.'),
			adaptations: proposal.adaptations ?? [],
			validationIssues: [],
			limitationKinds: parsed.kinds,
		};
	}

	if (!proposal.days?.length) {
		return {
			ok: false,
			mode: 'refused',
			message: 'AI returned an empty training proposal.',
			adaptations: [],
			validationIssues: ['empty days'],
			limitationKinds: parsed.kinds,
		};
	}

	const days: TrainingDay[] = proposal.days.map((d, i) => {
		const baseDay = base.days[i] ?? base.days[0];
		const lifts: Lift[] = (d.lifts || []).map((slot) => {
			const entry = libraryById(slot.exerciseId) || libraryByName(slot.exerciseId);
			if (!entry) {
				throw new Error(`Unknown exercise id: ${slot.exerciseId}`);
			}
			return materializeLift(entry, {
				sets: slot.sets,
				reps: slot.reps,
				rest: slot.rest,
				cue: slot.cue,
			});
		});
		return {
			id: d.id || baseDay?.id || `day-${i + 1}`,
			label: d.label || baseDay?.label || `Day ${i + 1}`,
			lifts,
		};
	});

	const training: TrainingTemplate = {
		...base,
		blurb: `${base.blurb} Adapted for your stated limitation: ${parsed.raw}.`,
		days,
		progression: [
			...base.progression,
			'Limitation rule: never force a lift that loads the restricted limb beyond what you flagged.',
		],
	};

	const validationIssues = validateTrainingAgainstLimitations(training, parsed);
	if (validationIssues.length) {
		return {
			ok: false,
			mode: 'refused',
			message:
				'AI proposal failed safety validation against your limitations. We will not deliver an unsafe program.',
			adaptations: proposal.adaptations ?? [],
			validationIssues,
			limitationKinds: parsed.kinds,
		};
	}

	return {
		ok: true,
		mode: 'openai',
		training,
		adaptations: proposal.adaptations ?? [],
		validationIssues: [],
		limitationKinds: parsed.kinds,
		message: proposal.message,
	};
}

export function buildPersonalisePrompt(input: {
	limitations: string;
	equipment: EquipmentPref;
	daysPerWeek: number;
	experience?: string;
	base: TrainingTemplate;
}): { system: string; user: string } {
	const catalogue = exerciseLibraryForPrompt({ equipment: input.equipment });
	const system = `You are a cautious strength coach for Yeh Bro. You ONLY select exercises from the provided library JSON (by id). Never invent exercises, medical advice, or video URLs. If the user's limitation cannot be safely trained with the library (e.g. only one usable arm must not get two-hand/bilateral-arm lifts), either adapt every conflicting slot to a unilateral library exercise or return status "refuse" / "need_more_info". Numbers for sets/reps may follow the base template. Respond with JSON only matching the schema.`;

	const user = JSON.stringify(
		{
			limitations: input.limitations,
			equipment: input.equipment,
			daysPerWeek: input.daysPerWeek,
			experience: input.experience ?? null,
			baseTemplate: {
				id: input.base.id,
				name: input.base.name,
				days: input.base.days.map((d) => ({
					id: d.id,
					label: d.label,
					lifts: d.lifts.map((l) => ({ name: l.name, sets: l.sets, reps: l.reps, rest: l.rest })),
				})),
			},
			library: catalogue,
			responseSchema: {
				status: 'ok | need_more_info | refuse',
				message: 'string optional',
				adaptations: ['string'],
				days: [
					{
						id: 'string',
						label: 'string',
						lifts: [{ exerciseId: 'library id', sets: 'string', reps: 'string', rest: 'string', cue: 'string' }],
					},
				],
			},
		},
		null,
		2,
	);
	return { system, user };
}

export async function personaliseTrainingWithOpenAI(opts: {
	apiKey: string;
	limitations: string;
	equipment: EquipmentPref;
	daysPerWeek: number;
	experience?: string;
	model?: string;
}): Promise<TrainingPersonaliseResult> {
	const parsed = parseLimitations(opts.limitations);
	const base = resolveTrainingTemplate(opts.daysPerWeek, opts.equipment);

	if (parsed.kinds.includes('none')) {
		return {
			ok: true,
			mode: 'template',
			training: base,
			adaptations: [],
			validationIssues: [],
			limitationKinds: ['none'],
		};
	}
	if (parsed.kinds.includes('unsafe-refuse')) {
		return adaptTrainingDeterministic(base, parsed, opts.equipment);
	}

	const { system, user } = buildPersonalisePrompt({
		limitations: opts.limitations,
		equipment: opts.equipment,
		daysPerWeek: opts.daysPerWeek,
		experience: opts.experience,
		base,
	});

	const res = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${opts.apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model: opts.model || 'gpt-4o-mini',
			temperature: 0.2,
			response_format: { type: 'json_object' },
			messages: [
				{ role: 'system', content: system },
				{ role: 'user', content: user },
			],
		}),
	});

	if (!res.ok) {
		const detail = await res.text().catch(() => '');
		// Fall back to deterministic adapter rather than inventing lifts.
		const fallback = adaptTrainingDeterministic(base, parsed, opts.equipment);
		fallback.message = `OpenAI unavailable (${res.status}). Used deterministic library adapter. ${detail.slice(0, 120)}`;
		return fallback;
	}

	const data = (await res.json()) as {
		choices?: Array<{ message?: { content?: string } }>;
	};
	const content = data.choices?.[0]?.message?.content;
	if (!content) {
		return adaptTrainingDeterministic(base, parsed, opts.equipment);
	}

	let proposal: AiTrainingProposal;
	try {
		proposal = JSON.parse(content) as AiTrainingProposal;
	} catch {
		return adaptTrainingDeterministic(base, parsed, opts.equipment);
	}

	try {
		const result = proposalToTraining(base, proposal, parsed);
		if (!result.ok) {
			// Safety net: try deterministic one-arm / knee adapter before hard refuse,
			// unless the model explicitly refused for clinical reasons.
			if (proposal.status === 'ok') {
				const fallback = adaptTrainingDeterministic(base, parsed, opts.equipment);
				if (fallback.ok) {
					fallback.message = `AI proposal failed validation; delivered deterministic library adaptation instead.`;
					return fallback;
				}
			}
		}
		return result;
	} catch {
		return adaptTrainingDeterministic(base, parsed, opts.equipment);
	}
}

/** Client/server helper: personalise from limitations with optional API key. */
export async function personaliseTraining(opts: {
	limitations?: string;
	equipment?: EquipmentPref;
	daysPerWeek: number;
	experience?: string;
	apiKey?: string;
}): Promise<TrainingPersonaliseResult> {
	const equipment: EquipmentPref = opts.equipment === 'limited' ? 'limited' : 'full-gym';
	const base = resolveTrainingTemplate(opts.daysPerWeek, equipment);
	const parsed = parseLimitations(opts.limitations);

	if (parsed.kinds.includes('none')) {
		return {
			ok: true,
			mode: 'template',
			training: base,
			adaptations: [],
			validationIssues: [],
			limitationKinds: ['none'],
		};
	}

	if (opts.apiKey) {
		return personaliseTrainingWithOpenAI({
			apiKey: opts.apiKey,
			limitations: opts.limitations || '',
			equipment,
			daysPerWeek: opts.daysPerWeek,
			experience: opts.experience,
		});
	}

	return adaptTrainingDeterministic(base, parsed, equipment);
}
