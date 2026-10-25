// lib/pdf-extract.ts
// PDF text extraction for claim documents
// Routes: text-native PDF → pdf-parse, scanned PDF → Tesseract OCR

import { execFile } from 'child_process';
import { writeFile, unlink, mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export interface ExtractedText {
  rawText: string;
  totalPages: number;
  method: 'pdf-parse' | 'ocr';
}

const MIN_USEFUL_TEXT_LENGTH = 50; // threshold to consider text extraction useful

/**
 * Extract text from a text-native PDF using pdf-parse.
 */
export async function extractPdfText(buffer: Buffer): Promise<ExtractedText> {
  const pdfParseMod = await import('pdf-parse');
  const PDFParseClass = (pdfParseMod as any).PDFParse || (pdfParseMod as any).default?.PDFParse || (pdfParseMod as any).default;
  const parser = new PDFParseClass(new Uint8Array(buffer));
  await (parser as any).load();
  const textResult = await parser.getText();

  const rawText = textResult.text || '';
  const totalPages = textResult.total || 1;

  // Detect scanned/image-only PDFs
  if (rawText.trim().length < MIN_USEFUL_TEXT_LENGTH) {
    // Fall back to OCR
    return runOcrOnPdf(buffer);
  }

  return { rawText, totalPages, method: 'pdf-parse' };
}

/**
 * Run Tesseract OCR on an image file buffer.
 * Assumes tesseract is installed on PATH with eng+nep language data.
 * Uses execFile with argument array (no shell interpolation).
 * Uses temporary files with cleanup in finally block.
 */
export async function runOcr(
  buffer: Buffer,
  extension: string = '.png'
): Promise<ExtractedText> {
  const tempDir = await mkdtemp(join(tmpdir(), 'claimsetu-ocr-'));
  const inputPath = join(tempDir, `input${extension}`);
  const outputBase = join(tempDir, 'output');
  const outputPath = `${outputBase}.txt`;

  try {
    await writeFile(inputPath, buffer);

    await new Promise<void>((resolve, reject) => {
      execFile(
        'tesseract',
        [inputPath, outputBase, '-l', 'eng+nep', '--psm', '6'],
        { timeout: 60000 },
        (error, _stdout, stderr) => {
          if (error) {
            reject(new Error(`Tesseract OCR failed: ${error.message}\n${stderr}`));
          } else {
            resolve();
          }
        }
      );
    });

    const { readFile } = await import('fs/promises');
    const rawText = await readFile(outputPath, 'utf-8');

    return { rawText, totalPages: 1, method: 'ocr' };
  } finally {
    // Cleanup temporary files
    try { await unlink(inputPath); } catch {}
    try { await unlink(outputPath); } catch {}
    try {
      const { rmdir } = await import('fs/promises');
      await rmdir(tempDir);
    } catch {}
  }
}

/**
 * OCR a scanned PDF: render each page to image, then OCR each page.
 * For the MVP, use pdf-lib to count pages and attempt Tesseract directly on the PDF.
 */
async function runOcrOnPdf(buffer: Buffer): Promise<ExtractedText> {
  // Tesseract can handle multi-page PDFs natively if the input is a valid PDF
  const tempDir = await mkdtemp(join(tmpdir(), 'claimsetu-ocr-'));
  const inputPath = join(tempDir, 'input.pdf');
  const outputBase = join(tempDir, 'output');
  const outputPath = `${outputBase}.txt`;

  try {
    await writeFile(inputPath, buffer);

    await new Promise<void>((resolve, reject) => {
      execFile(
        'tesseract',
        [inputPath, outputBase, '-l', 'eng+nep', '--psm', '6'],
        { timeout: 120000 },
        (error, _stdout, stderr) => {
          if (error) {
            reject(new Error(`Tesseract PDF OCR failed: ${error.message}\n${stderr}`));
          } else {
            resolve();
          }
        }
      );
    });

    const { readFile } = await import('fs/promises');
    const rawText = await readFile(outputPath, 'utf-8');

    // Count pages from the original PDF buffer
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(buffer);
    const totalPages = pdfDoc.getPageCount();

    return { rawText, totalPages, method: 'ocr' };
  } finally {
    try { await unlink(inputPath); } catch {}
    try { await unlink(outputPath); } catch {}
    try {
      const { rmdir } = await import('fs/promises');
      await rmdir(tempDir);
    } catch {}
  }
}

/**
 * Route a file to the appropriate text extraction method based on MIME type.
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string,
  originalFilename?: string
): Promise<ExtractedText> {
  if (mimeType === 'application/pdf') {
    return extractPdfText(buffer);
  }

  if (mimeType.startsWith('image/')) {
    // Determine extension from MIME or filename
    const extMap: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/tiff': '.tiff',
      'image/bmp': '.bmp',
    };
    const ext = extMap[mimeType] || '.png';
    return runOcr(buffer, ext);
  }

  throw new Error(`Unsupported file type for text extraction: ${mimeType}`);
}
