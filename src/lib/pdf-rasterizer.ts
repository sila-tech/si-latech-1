/**
 * @fileOverview Client-side PDF-to-Image Rasterizer.
 * 
 * Renders the first page of architectural PDF blueprints to high-resolution
 * HTML5 Canvas / PNG data URIs completely locally in the browser ($0 cloud cost).
 */

export async function isPdfSource(source: string | File): Promise<boolean> {
  if (source instanceof File) {
    return source.type === 'application/pdf' || source.name.toLowerCase().endsWith('.pdf');
  }
  if (typeof source === 'string') {
    return source.startsWith('data:application/pdf') || source.toLowerCase().includes('.pdf');
  }
  return false;
}

export async function convertPdfToImageUri(
  pdfSource: File | string | ArrayBuffer,
  targetScale = 2.0
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('PDF rasterization must run in a browser environment.');
  }

  // Dynamic import of PDF.js client build
  const pdfjsLib = await import('pdfjs-dist');

  // Configure local worker to avoid external dependencies
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  }

  let data: Uint8Array | ArrayBuffer;

  if (typeof pdfSource === 'string') {
    if (pdfSource.startsWith('data:')) {
      const base64 = pdfSource.split(',')[1];
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      data = bytes;
    } else {
      const res = await fetch(pdfSource);
      data = await res.arrayBuffer();
    }
  } else if (pdfSource instanceof File) {
    data = await pdfSource.arrayBuffer();
  } else {
    data = pdfSource;
  }

  const loadingTask = pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  // Render at target scale (2.0 gives ~200-300 DPI clarity for architectural plans)
  const viewport = page.getViewport({ scale: targetScale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create 2D canvas context for PDF blueprint rendering.');
  }

  // Fill crisp white background behind transparent PDF layers
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport: viewport,
  }).promise;

  return canvas.toDataURL('image/png');
}
