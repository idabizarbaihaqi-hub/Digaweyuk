import { GoogleGenAI } from '@google/genai';

/**
 * Server-side AI Moderation Analyzer
 * Inspects candidate posts, comments, or report details for scams, toxicity, harassment, or fraudulent fees.
 */
export async function analyzeContentWithAI(payload: {
  text: string;
  type: 'post' | 'comment' | 'report';
  authorName?: string;
  positionOrContext?: string;
}): Promise<{
  isSuspicious: boolean;
  flags: string[];
  confidence: number;
  summary: string;
  suggestedAction: 'APPROVE' | 'FLAG_FOR_REVIEW' | 'WARN';
}> {
  const { text, type, authorName, positionOrContext } = payload;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Fallback if no API key
    const lower = (text || '').toLowerCase();
    const hasScamWords =
      lower.includes('biaya pendaftaran') ||
      lower.includes('transfer uang') ||
      lower.includes('biaya seragam') ||
      lower.includes('biaya interview') ||
      lower.includes('uang jaminan');

    return {
      isSuspicious: hasScamWords,
      flags: hasScamWords ? ['Potensi Scam: Permintaan Biaya'] : [],
      confidence: hasScamWords ? 0.85 : 0.1,
      summary: hasScamWords
        ? 'Terdeteksi frasa berisiko terkait permintaan pembayaran atau uang muka.'
        : 'Konten normal tidak mengandung kata-kata berbahaya.',
      suggestedAction: hasScamWords ? 'FLAG_FOR_REVIEW' : 'APPROVE',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Anda adalah sistem AI Content Moderation & Scam Protection untuk aplikasi rekrutmen kerja "DIGAWE YUK" (Jawa Barat, Indonesia).
Tugas Anda menganalisis teks yang diposting oleh pengguna untuk mendeteksi:
1. SCAM / PENIPUAN KERJA: meminta transfer uang, biaya interview, biaya seragam, tes berbayar, skema piramida/MLM terselubung.
2. TOXIC / HARASSMENT: ujaran kebencian, pelecehan seksual, penghinaan SARA, spam berulang.
3. DATA PRIVASI: mempublikasikan nomor KTP, nomor rekening, atau informasi pribadi sensitif orang lain.

Tipe Konten: ${type}
Penulis: ${authorName || 'Pengguna'}
Konteks / Posisi: ${positionOrContext || '-'}
Teks Konten:
"""
${text}
"""

Kembalikan respon DALAM FORMAT JSON SAJA (tanpa markdown backtick):
{
  "isSuspicious": boolean,
  "flags": string[],
  "confidence": number, // 0.0 sampai 1.0
  "summary": string, // penjelasan ringkas dalam Bahasa Indonesia
  "suggestedAction": "APPROVE" | "FLAG_FOR_REVIEW" | "WARN"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
      },
    });

    const outputText = response.text || '';
    const cleanJson = outputText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error('[AI Moderation Engine Error]:', err);
    return {
      isSuspicious: false,
      flags: [],
      confidence: 0.5,
      summary: 'Analisis AI tidak dapat diselesaikan. Menggunakan verifikasi standar.',
      suggestedAction: 'APPROVE',
    };
  }
}
