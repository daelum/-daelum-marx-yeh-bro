/**
 * Yeh Bro — $4.99 personalised PDF checkout (+ optional coaching upsell).
 *
 * Live path: Stripe Checkout Session when secrets are bound.
 * Stub path: returns mode "stub" so the funnel UI can unlock the print/PDF plan
 * for preview without charging. Never invent live payment.
 *
 * Coaching is an optional add-on (weekly $150 or 12-week paid-in-full at $110/wk).
 */

interface Env {
	STRIPE_SECRET_KEY?: string;
	STRIPE_PRICE_ID_PDF_AUD?: string;
	STRIPE_PRICE_ID_COACHING_WEEKLY_AUD?: string;
	STRIPE_PRICE_ID_COACHING_12WK_AUD?: string;
	ASSETS?: { fetch: (req: Request) => Promise<Response> };
}

type CoachingTier = 'none' | 'weekly' | 'paid_in_full';

const REQUIRED_PDF = ['STRIPE_SECRET_KEY', 'STRIPE_PRICE_ID_PDF_AUD'] as const;
const REQUIRED_COACHING = [
	'STRIPE_PRICE_ID_COACHING_WEEKLY_AUD',
	'STRIPE_PRICE_ID_COACHING_12WK_AUD',
] as const;

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
	let payload: {
		successUrl?: string;
		cancelUrl?: string;
		coaching?: CoachingTier;
	} = {};
	try {
		payload = (await request.json()) as typeof payload;
	} catch {
		/* empty body ok */
	}

	const coaching: CoachingTier =
		payload.coaching === 'weekly' || payload.coaching === 'paid_in_full'
			? payload.coaching
			: 'none';

	const origin = new URL(request.url).origin;
	const successUrl =
		typeof payload.successUrl === 'string' && payload.successUrl.startsWith(origin)
			? payload.successUrl
			: `${origin}/plan?checkout=success`;
	const cancelUrl =
		typeof payload.cancelUrl === 'string' && payload.cancelUrl.startsWith(origin)
			? payload.cancelUrl
			: `${origin}/#checkout`;

	const secret = env.STRIPE_SECRET_KEY?.trim();
	const pricePdf = env.STRIPE_PRICE_ID_PDF_AUD?.trim();
	const priceWeekly = env.STRIPE_PRICE_ID_COACHING_WEEKLY_AUD?.trim();
	const price12 = env.STRIPE_PRICE_ID_COACHING_12WK_AUD?.trim();

	if (!secret || !pricePdf) {
		return json({
			mode: 'stub',
			ok: true,
			message:
				'Checkout secrets not bound — stub unlock only. Bind STRIPE_SECRET_KEY and STRIPE_PRICE_ID_PDF_AUD for live AUD $4.99 charges. Coaching upsell prices need STRIPE_PRICE_ID_COACHING_WEEKLY_AUD and STRIPE_PRICE_ID_COACHING_12WK_AUD.',
			requiredSecrets: [...REQUIRED_PDF, ...REQUIRED_COACHING],
			priceAud: 4.99,
			currency: 'AUD',
			coaching,
			coachingPricing: {
				weeklyAud: 150,
				paidInFullWeeklyAud: 110,
				weeks: 12,
				paidInFullTotalAud: 1320,
			},
			successUrl,
			cancelUrl,
		});
	}

	if (coaching !== 'none') {
		const needed = coaching === 'weekly' ? priceWeekly : price12;
		if (!needed) {
			return json(
				{
					mode: 'error',
					ok: false,
					message:
						coaching === 'weekly'
							? 'Missing STRIPE_PRICE_ID_COACHING_WEEKLY_AUD for weekly coaching upsell.'
							: 'Missing STRIPE_PRICE_ID_COACHING_12WK_AUD for 12-week paid-in-full coaching upsell.',
					requiredSecrets: [...REQUIRED_COACHING],
				},
				503,
			);
		}
	}

	try {
		const body = new URLSearchParams();
		body.set('mode', coaching === 'weekly' ? 'subscription' : 'payment');
		body.set(
			'success_url',
			`${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
		);
		body.set('cancel_url', cancelUrl);
		body.set('line_items[0][price]', pricePdf);
		body.set('line_items[0][quantity]', '1');

		if (coaching === 'weekly' && priceWeekly) {
			body.set('line_items[1][price]', priceWeekly);
			body.set('line_items[1][quantity]', '1');
		} else if (coaching === 'paid_in_full' && price12) {
			body.set('line_items[1][price]', price12);
			body.set('line_items[1][quantity]', '1');
		}

		body.set('allow_promotion_codes', 'false');
		body.set('billing_address_collection', 'auto');
		body.set('metadata[product]', 'yehbro-personalised-pdf');
		body.set('metadata[coaching]', coaching);

		const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${secret}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body,
		});

		const data = (await stripeRes.json()) as {
			id?: string;
			url?: string;
			error?: { message?: string };
		};
		if (!stripeRes.ok || !data.url) {
			return json(
				{
					mode: 'error',
					ok: false,
					message: data.error?.message || 'Stripe checkout session failed.',
				},
				502,
			);
		}

		return json({
			mode: 'stripe',
			ok: true,
			url: data.url,
			sessionId: data.id,
			coaching,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Checkout request failed';
		return json({ mode: 'error', ok: false, message }, 500);
	}
};
