/**
 * Limitation-aware training personalisation via OpenAI + controlled exercise library.
 * Secret: OPENAI_API_KEY
 * Without the secret, returns deterministic library adaptation (honest mode).
 */

import {
	personaliseTraining,
	type TrainingPersonaliseResult,
} from '../../../src/lib/training-personalise';
import type { EquipmentPref } from '../../../src/data/start-here-system';

interface Env {
	OPENAI_API_KEY?: string;
}

const cors = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

type Body = {
	limitations?: string;
	equipment?: EquipmentPref;
	daysPerWeek?: number;
	experience?: string;
};

export const onRequestOptions: PagesFunction = async () =>
	new Response(null, { status: 204, headers: cors });

export const onRequestPost: PagesFunction<Env> = async (context) => {
	let body: Body;
	try {
		body = (await context.request.json()) as Body;
	} catch {
		return Response.json(
			{ ok: false, mode: 'error', message: 'Invalid JSON body.', adaptations: [], validationIssues: [], limitationKinds: [] },
			{ status: 400, headers: cors },
		);
	}

	const daysPerWeek = [3, 4, 5, 6].includes(Number(body.daysPerWeek))
		? Number(body.daysPerWeek)
		: 3;
	const equipment: EquipmentPref = body.equipment === 'limited' ? 'limited' : 'full-gym';
	const apiKey = context.env.OPENAI_API_KEY?.trim();

	try {
		const result: TrainingPersonaliseResult = await personaliseTraining({
			limitations: typeof body.limitations === 'string' ? body.limitations : '',
			equipment,
			daysPerWeek,
			experience: typeof body.experience === 'string' ? body.experience : undefined,
			apiKey: apiKey || undefined,
		});

		const payload = {
			...result,
			openaiBound: Boolean(apiKey),
			requiredSecrets: apiKey ? undefined : ['OPENAI_API_KEY'],
		};

		return Response.json(payload, {
			status: result.ok || result.mode === 'refused' ? 200 : 200,
			headers: cors,
		});
	} catch (err) {
		return Response.json(
			{
				ok: false,
				mode: 'error',
				message: err instanceof Error ? err.message : 'Personalisation failed',
				adaptations: [],
				validationIssues: [],
				limitationKinds: [],
				openaiBound: Boolean(apiKey),
			},
			{ status: 500, headers: cors },
		);
	}
};
