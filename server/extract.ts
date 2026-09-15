/** Text extraction for resumes: PDF (pdfjs) and DOCX (mammoth). Server-side only. */

export async function extractPdfText(buf: Buffer): Promise<string> {
  const pdfjs = await getPDFJS();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buf),
    useSystemFonts: true,
    verbosity: 0,
  }).promise;

  const pages: string[] = [];
  const max = Math.min(doc.numPages, 6);
  for (let i = 1; i <= max; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(line);
    page.cleanup();
  }
  await doc.destroy();
  return pages.join("\n\n");
}

async function getPDFJS() {
  // Dynamic import so Next bundles the legacy build only here
  const mod = await import("pdfjs-dist/legacy/build/pdf.js");
  return mod;
}

export async function extractDocxText(buf: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: buf });
  return result.value;
}
