/**
 * Verify a Stripe Checkout session before unlocking the PDF.
 * Stub mode (no STRIPE_SECRET_KEY) returns mode "stub" for preview only.
 */

interface Env {
	STRIPE_SECRET_KEY?: string;
}

const cors = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json', ...cors },
	});
}

export const onRequestOptions: PagesFunction = async () =>
	new Response(null, { status: 204, headers: cors });

export const onRequestPost: PagesFunction<Env> = async (context) => {
	const { request, env } = context;
	let payload: { sessionId?: string } = {};
	try {
		payload = (await request.json()) as typeof payload;
	} catch {
		return json({ mode: 'error', ok: false, message: 'Invalid JSON body.' }, 400);
	}

	const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId.trim() : '';
	const secret = env.STRIPE_SECRET_KEY?.trim();

	if (!secret) {
		return json({
			mode: 'stub',
			ok: true,
			paid: false,
			message:
				'Checkout secrets not bound — stub verify only. Bind STRIPE_SECRET_KEY for live payment verification.',
		});
	}

	if (!sessionId || !sessionId.startsWith('cs_')) {
		return json({ mode: 'error', ok: false, paid: false, message: 'Missing checkout session.' }, 400);
	}

	try {
		const stripeRes = await fetch(
			`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
			{
				method: 'GET',
				headers: { Authorization: `Bearer ${secret}` },
			},
		);
		const data = (await stripeRes.json()) as {
			id?: string;
			payment_status?: string;
			status?: string;
			metadata?: { product?: string; coaching?: string };
			error?: { message?: string };
		};

		if (!stripeRes.ok) {
			return json(
				{
					mode: 'error',
					ok: false,
					paid: false,
					message: data.error?.message || 'Could not verify checkout session.',
				},
				502,
			);
		}

		const paid =
			data.payment_status === 'paid' ||
			data.payment_status === 'no_payment_required' ||
			(data.status === 'complete' && data.payment_status === 'paid');

		if (!paid) {
			return json(
				{
					mode: 'stripe',
					ok: false,
					paid: false,
					message: 'Payment not completed yet. Finish checkout, then open your plan.',
					paymentStatus: data.payment_status,
					sessionStatus: data.status,
				},
				402,
			);
		}

		return json({
			mode: 'stripe',
			ok: true,
			paid: true,
			sessionId: data.id,
			coaching: data.metadata?.coaching || 'none',
			product: data.metadata?.product || 'yehbro-personalised-pdf',
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Verify request failed';
		return json({ mode: 'error', ok: false, paid: false, message }, 500);
	}
};
