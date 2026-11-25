/**
 * Rasterise each page of a coaching PDF for visual QA.
 * Usage: npx tsx scripts/rasterise-pdf-pages.mjs /path/to/file.pdf /path/to/out-prefix
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createCanvas } from '@napi-rs/canvas';

const require = createRequire(import.meta.url);

async function main() {
	const pdfPath = process.argv[2];
	const outPrefix = process.argv[3];
	if (!pdfPath || !outPrefix) {
		console.error('Usage: rasterise-pdf-pages.mjs <pdf> <out-prefix>');
		process.exit(1);
	}

	// pdfjs legacy build works in Node
	const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
	const data = new Uint8Array(readFileSync(pdfPath));
	const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
	console.log(`${pdfPath}: ${doc.numPages} pages`);

	for (let i = 1; i <= doc.numPages; i++) {
		const page = await doc.getPage(i);
		const viewport = page.getViewport({ scale: 1.6 });
		const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		await page.render({ canvasContext: ctx, viewport }).promise;
		const out = `${outPrefix}-${String(i).padStart(2, '0')}.png`;
		const png = canvas.toBuffer('image/png');
		await import('node:fs').then((fs) => fs.writeFileSync(out, png));
		console.log('wrote', out, `${canvas.width}x${canvas.height}`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
