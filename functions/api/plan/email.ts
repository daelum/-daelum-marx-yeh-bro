/**
 * Email the personalised plan PDF after generate.
 *
 * Secrets (document in report; never invent “sent”):
 *   RESEND_API_KEY, PLAN_EMAIL_FROM [, PLAN_EMAIL_REPLY_TO]
 *
 * Prefers the dedicated coaching PDF (pdf-lib) when planDoc is posted.
 * Stub/unbound: returns sent:false with clear message. Download still works client-side.
 */

import {
	PLAN_EMAIL_REQUIRED_SECRETS,
	type PlanEmailPayload,
	type PlanEmailResponse,
} from '../../../src/lib/plan-pdf-email';
import { buildPlanPdfBytes } from '../../../src/lib/plan-pdf-doc';
import type { PersonalPlanDoc } from '../../../src/lib/personal-plan';

interface Env {
	RESEND_API_KEY?: string;
	PLAN_EMAIL_FROM?: string;
	PLAN_EMAIL_REPLY_TO?: string;
}

const cors = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: PlanEmailResponse, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json', ...cors },
	});
}

function looksLikeEmail(raw: string): boolean {
	return raw.length >= 5 && raw.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
}

/** Minimal fallback PDF if planDoc is missing (should be rare). */
function buildSimplePdf(title: string, body: string): Uint8Array {
	const lines = body
		.replace(/\r\n/g, '\n')
		.split('\n')
		.map((l) => l.slice(0, 95));
	const maxLinesPerPage = 48;
	const pages: string[][] = [];
	for (let i = 0; i < lines.length; i += maxLinesPerPage) {
		pages.push(lines.slice(i, i + maxLinesPerPage));
	}
	if (!pages.length) pages.push(['(empty plan)']);

	const objects: string[] = [];
	const add = (s: string) => {
		objects.push(s);
		return objects.length;
	};

	add('<< /Type /Catalog /Pages 2 0 R >>');
	const kids: string[] = [];
	const pageObjNumbers: number[] = [];

	const escapePdf = (t: string) =>
		t.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

	const contentIds: number[] = [];
	for (let p = 0; p < pages.length; p++) {
		const pageLines = pages[p];
		let stream = 'BT /F1 11 Tf 14 TL 48 792 Td\n';
		if (p === 0) {
			stream += `/F1 16 Tf (${escapePdf(title.slice(0, 80))}) Tj T*\n/F1 11 Tf\n`;
		} else {
			stream += `/F1 10 Tf (${escapePdf(`Yeh Bro plan · continued (${p + 1}/${pages.length})`)}) Tj T*\n/F1 11 Tf\n`;
		}
		for (const line of pageLines) {
			stream += `(${escapePdf(line)}) Tj T*\n`;
		}
		stream += 'ET';
		const content = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
		contentIds.push(add(content));
	}

	const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

	for (let p = 0; p < pages.length; p++) {
		const pageId = add(
			`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentIds[p]} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`,
		);
		pageObjNumbers.push(pageId);
		kids.push(`${pageId} 0 R`);
	}

	objects[1] = `<< /Type /Pages /Count ${pages.length} /Kids [${kids.join(' ')}] >>`;

	const encoder = new TextEncoder();
	const chunks: Uint8Array[] = [encoder.encode('%PDF-1.4\n')];
	const offsets: number[] = [0];
	let size = chunks[0].length;
	for (let i = 0; i < objects.length; i++) {
		offsets.push(size);
		const chunk = encoder.encode(`${i + 1} 0 obj\n${objects[i]}\nendobj\n`);
		chunks.push(chunk);
		size += chunk.length;
	}
	const xrefStart = size;
	let xref = `xref\n0 ${objects.length + 1}\n`;
	xref += '0000000000 65535 f \n';
	for (let i = 1; i <= objects.length; i++) {
		xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
	}
	xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
	chunks.push(encoder.encode(xref));
	size += chunks[chunks.length - 1].length;
	const out = new Uint8Array(size);
	let offset = 0;
	for (const c of chunks) {
		out.set(c, offset);
		offset += c.length;
	}
	return out;
}

function uint8ToBase64(bytes: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary);
}

export const onRequestOptions: PagesFunction = async () =>
	new Response(null, { status: 204, headers: cors });

export const onRequestPost: PagesFunction<Env> = async (context) => {
	const { request, env } = context;
	let payload: Partial<PlanEmailPayload> = {};
	try {
		payload = (await request.json()) as Partial<PlanEmailPayload>;
	} catch {
		return json(
			{ ok: false, sent: false, mode: 'error', message: 'Invalid JSON body.' },
			400,
		);
	}

	const email = typeof payload.email === 'string' ? payload.email.trim() : '';
	const planText = typeof payload.planText === 'string' ? payload.planText.trim() : '';
	const planDoc =
		payload.planDoc && typeof payload.planDoc === 'object'
			? (payload.planDoc as PersonalPlanDoc)
			: null;
	const firstName =
		typeof payload.firstName === 'string' ? payload.firstName.trim() : undefined;
	const dedupeKey =
		typeof payload.dedupeKey === 'string' ? payload.dedupeKey.trim() : '';
	const filename =
		typeof payload.filename === 'string' && payload.filename.endsWith('.pdf')
			? payload.filename
			: 'yeh-bro-plan.pdf';

	if (!looksLikeEmail(email) || (!planDoc && !planText) || !dedupeKey) {
		return json(
			{
				ok: false,
				sent: false,
				mode: 'error',
				message: 'email, planDoc (or planText), and dedupeKey are required.',
			},
			400,
		);
	}

	const apiKey = env.RESEND_API_KEY?.trim();
	const from = env.PLAN_EMAIL_FROM?.trim();
	if (!apiKey || !from) {
		return json({
			ok: true,
			sent: false,
			mode: 'unbound',
			message:
				'Email not sent — plan email secrets are not bound yet. Download still works. Bind RESEND_API_KEY and PLAN_EMAIL_FROM for live delivery.',
			requiredSecrets: [...PLAN_EMAIL_REQUIRED_SECRETS],
			dedupeKey,
		});
	}

	let pdfBytes: Uint8Array;
	try {
		if (planDoc) {
			pdfBytes = await buildPlanPdfBytes(planDoc);
		} else {
			const title = firstName ? `${firstName} — Yeh Bro plan` : 'Your Yeh Bro plan';
			pdfBytes = buildSimplePdf(title, planText);
		}
	} catch (err) {
		return json(
			{
				ok: false,
				sent: false,
				mode: 'error',
				message: `PDF build failed: ${err instanceof Error ? err.message : 'unknown'}. Download still works.`,
				dedupeKey,
			},
			500,
		);
	}
	const pdfB64 = uint8ToBase64(pdfBytes);

	const greeting = firstName ? `Hey ${firstName},` : 'Hey,';
	const html = `<p>${greeting}</p>
<p>Your personalised Yeh Bro training &amp; nutrition plan is attached as a PDF.</p>
<p>Save it, follow the non-negotiables (10,000+ steps · ~4&nbsp;L fluids), and run the prescribed lifts — one exercise per slot.</p>
<p>If you want deeper accountability later, coaching is optional — the PDF stands on its own.</p>
<p>— Yeh Bro</p>`;

	const body: Record<string, unknown> = {
		from,
		to: [email],
		subject: firstName ? `${firstName}, your Yeh Bro plan` : 'Your Yeh Bro plan',
		html,
		attachments: [
			{
				filename,
				content: pdfB64,
			},
		],
	};
	const replyTo = env.PLAN_EMAIL_REPLY_TO?.trim();
	if (replyTo) body.reply_to = replyTo;

	try {
		const res = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});
		if (!res.ok) {
			const errText = await res.text();
			return json(
				{
					ok: false,
					sent: false,
					mode: 'error',
					message: `Email provider rejected the send (${res.status}). Download still works. ${errText.slice(0, 180)}`,
					dedupeKey,
				},
				502,
			);
		}
		return json({
			ok: true,
			sent: true,
			mode: 'live',
			message: `Plan PDF emailed to ${email}.`,
			dedupeKey,
		});
	} catch {
		return json(
			{
				ok: false,
				sent: false,
				mode: 'error',
				message: 'Could not reach the email provider. Download still works.',
				dedupeKey,
			},
			502,
		);
	}
};
