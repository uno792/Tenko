// src/lib/pdf.ts
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

// required for Vite + pdfjs
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorker;

export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    text += strings.join(" ") + "\n";
  }

  return text;
}
