import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { runJobHunterEngine, cleanupExpiredJobsEngine } from './src/server/jobHunterEngine';
import {
  handleStartSession,
  handleSaveAnswer,
  handleSubmitSession,
  handleLogActivity,
  handleAIGenerateQuestions,
  handleAIEvaluateEssay,
  handleUpgradeSubscription,
  handleVerifyRoomCode,
} from './src/server/interviewEngine';
import { analyzeContentWithAI } from './src/server/moderationEngine';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// 1. Serve static files (logos, splash screen, icons) directly from /public
app.use(express.static(path.join(process.cwd(), 'public')));
app.use(express.json());

const SUPER_ADMIN_EMAIL = 'id.agnesyakartika@gmail.com';

/**
 * Cryptographically verify Firebase ID token using Google Identity Platform
 * Guarantees only id.agnesyakartika@gmail.com can perform Super Admin actions
 */
async function verifySuperAdminToken(authHeader?: string): Promise<{ authorized: boolean; email?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false };
  }
  const idToken = authHeader.replace('Bearer ', '').trim();
  if (!idToken) return { authorized: false };

  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) {
    console.error('[Auth Middleware] VITE_FIREBASE_API_KEY is not configured');
    return { authorized: false };
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!response.ok) {
      console.warn('[Auth Middleware] Token lookup failed with status:', response.status);
      return { authorized: false };
    }

    const data: any = await response.json();
    const verifiedUser = data.users?.[0];
    const email = verifiedUser?.email?.toLowerCase().trim();

    if (email === SUPER_ADMIN_EMAIL) {
      return { authorized: true, email };
    }
    return { authorized: false, email };
  } catch (err) {
    console.error('[Auth Middleware] Error during token verification:', err);
    return { authorized: false };
  }
}

/**
 * Express middleware requiring authenticated Super Admin
 */
async function requireSuperAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const result = await verifySuperAdminToken(authHeader);

  if (!result.authorized) {
    return res.status(403).json({
      error: 'Akses Ditolak: Fitur ini hanya dapat diakses oleh Super Admin (id.agnesyakartika@gmail.com).',
      authorized: false,
    });
  }

  (req as any).verifiedSuperAdminEmail = result.email;
  next();
}

let isJobHunterRunning = false;
let lastRunResult: any = null;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DIGAWE YUK Full-Stack Backend',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Backend Super Admin Verification Endpoint
app.post('/api/admin/verify-super-admin', async (req, res) => {
  const authHeader = req.headers.authorization;
  const result = await verifySuperAdminToken(authHeader);

  if (result.authorized) {
    return res.json({
      isSuperAdmin: true,
      email: result.email,
      role: 'super_admin',
    });
  }

  return res.status(403).json({
    isSuperAdmin: false,
    error: 'Akses ditolak: Hanya id.agnesyakartika@gmail.com yang diizinkan sebagai Super Admin.',
  });
});

// AI Job Hunter Status
app.get('/api/job-hunter/status', (req, res) => {
  res.json({
    isRunning: isJobHunterRunning,
    lastRun: lastRunResult,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Manual Run Trigger for Admin (Strictly protected by backend Super Admin verification)
app.post('/api/job-hunter/run', requireSuperAdminAuth, async (req, res) => {
  if (isJobHunterRunning) {
    return res.status(409).json({
      error: 'AI Job Hunter sedang berjalan. Silakan tunggu hingga proses selesai.',
      isRunning: true,
    });
  }

  isJobHunterRunning = true;

  try {
    const executedBy = req.body?.executedBy || (req as any).verifiedSuperAdminEmail || 'Super Admin Manual Run';
    console.log(`[Job Hunter] Triggered manual execution by: ${executedBy}`);

    const result = await runJobHunterEngine(executedBy);
    lastRunResult = { ...result, completedAt: new Date().toISOString() };

    return res.json({
      success: result.success,
      quotaExceeded: (result as any).quotaExceeded || false,
      discovered: result.discovered,
      inserted: result.inserted,
      updated: result.updated,
      duplicates: result.duplicates,
      rejected: result.rejected,
      rejectedOutsideWestJava: result.rejectedOutsideWestJava,
      rejectedNoAddress: result.rejectedNoAddress,
      rejectedNoContact: result.rejectedNoContact,
      rejectedInvalidCompany: result.rejectedInvalidCompany,
      rejectedInvalidSource: result.rejectedInvalidSource,
      errors: result.errors,
      message: (result as any).message || (result.success
        ? `Proses AI Job Hunter selesai: ${result.inserted} lowongan Jawa Barat valid ditambahkan, ${result.updated} diperbarui.`
        : 'AI Job Hunter tidak dapat menyelesaikan seluruh proses.'),
    });
  } catch (error: any) {
    console.error('[Job Hunter API Error]:', error);
    const isQuota =
      error?.status === 'RESOURCE_EXHAUSTED' ||
      error?.code === 429 ||
      error?.message?.includes('429') ||
      error?.message?.includes('quota') ||
      error?.message?.includes('RESOURCE_EXHAUSTED');

    const msg = isQuota
      ? 'Batas kuota harian Gemini API saat ini telah tercapai (Rate Limit / Quota Exceeded). Periksa status paket dan kuota di Google AI Studio (https://ai.google.dev/gemini-api/docs/rate-limits) atau coba beberapa saat lagi.'
      : (error?.message || 'Gagal menjalankan AI Job Hunter.');

    return res.status(isQuota ? 429 : 500).json({
      error: msg,
      quotaExceeded: isQuota,
      success: false,
    });
  } finally {
    isJobHunterRunning = false;
  }
});

// Manual Cleanup Trigger (Strictly protected by backend Super Admin verification)
app.post('/api/job-hunter/cleanup', requireSuperAdminAuth, async (req, res) => {
  try {
    console.log('[Job Cleanup] Running expired job cleanup by Super Admin...');
    const result = await cleanupExpiredJobsEngine();
    return res.json({
      success: true,
      deletedCount: result.deletedCount,
      closedCount: result.closedCount,
      message: `Berhasil membersihkan ${result.deletedCount} lowongan kadaluarsa.`,
    });
  } catch (error: any) {
    console.error('[Job Cleanup API Error]:', error);
    return res.status(500).json({
      error: error?.message || 'Gagal menjalankan pembersihan lowongan.',
      success: false,
    });
  }
});

// ==========================================
// TAHAP 4: COMPANY & ONLINE INTERVIEW ROUTES
// ==========================================

// Verify Room Code
app.get('/api/interviews/verify-room/:code', async (req, res) => {
  try {
    const code = req.params.code?.toUpperCase().trim();
    if (!code) {
      return res.status(400).json({ message: 'Kode room wajib diisi.' });
    }
    const result = await handleVerifyRoomCode(code);
    return res.json(result);
  } catch (err: any) {
    console.error('[Verify Room Code Error]:', err?.message);
    return res.status(404).json({ message: err?.message || 'Kode room tidak valid.' });
  }
});

// Start or Resume Candidate Interview Session
app.post('/api/interviews/start-session', async (req, res) => {
  try {
    const { interviewId, candidateId, candidateName, candidateEmail } = req.body;
    if (!interviewId || !candidateId) {
      return res.status(400).json({ message: 'interviewId dan candidateId wajib diisi.' });
    }
    const result = await handleStartSession({
      interviewId,
      candidateId,
      candidateName: candidateName || 'Kandidat',
      candidateEmail: candidateEmail || '',
    });
    return res.json(result);
  } catch (err: any) {
    console.error('[Start Session Error]:', err?.message);
    return res.status(400).json({ message: err?.message || 'Gagal memulai sesi interview.' });
  }
});

// Save Answer & Verify Server-Authoritative Timer
app.post('/api/interviews/save-answer', async (req, res) => {
  try {
    const { sessionId, candidateId, questionId, answer } = req.body;
    if (!sessionId || !candidateId || !questionId) {
      return res.status(400).json({ message: 'Data jawaban tidak lengkap.' });
    }
    const result = await handleSaveAnswer({
      sessionId,
      candidateId,
      questionId,
      answer: typeof answer === 'string' ? answer : '',
    });
    return res.json(result);
  } catch (err: any) {
    console.error('[Save Answer Error]:', err?.message);
    return res.status(400).json({ message: err?.message || 'Gagal menyimpan jawaban.' });
  }
});

// Submit Interview Session
app.post('/api/interviews/submit-session', async (req, res) => {
  try {
    const { sessionId, candidateId, answers, isAutoSubmit } = req.body;
    if (!sessionId || !candidateId) {
      return res.status(400).json({ message: 'sessionId dan candidateId wajib diisi.' });
    }
    const result = await handleSubmitSession({
      sessionId,
      candidateId,
      answers: answers || {},
      isAutoSubmit: Boolean(isAutoSubmit),
    });
    return res.json(result);
  } catch (err: any) {
    console.error('[Submit Session Error]:', err?.message);
    return res.status(400).json({ message: err?.message || 'Gagal mengirim jawaban.' });
  }
});

// Log Anti-Cheating Telemetry
app.post('/api/interviews/log-activity', async (req, res) => {
  try {
    const { sessionId, candidateId, event, details } = req.body;
    if (sessionId && candidateId && event) {
      await handleLogActivity({ sessionId, candidateId, event, details });
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(200).json({ success: false });
  }
});

// AI Question Generator (Server-side Gemini)
app.post('/api/interviews/ai-generate-questions', async (req, res) => {
  try {
    const { position, description, requirements, level, count, types, difficulty } = req.body;
    if (!position) {
      return res.status(400).json({ message: 'Posisi lowongan wajib diisi.' });
    }
    const questions = await handleAIGenerateQuestions({
      position,
      description,
      requirements,
      level,
      count,
      types,
      difficulty,
    });
    return res.json({ questions });
  } catch (err: any) {
    console.error('[AI Question Generator Error]:', err?.message);
    return res.status(500).json({ message: err?.message || 'Gagal membuat soal dengan AI.' });
  }
});

// AI Essay Evaluation (Server-side Gemini)
app.post('/api/interviews/ai-evaluate-essay', async (req, res) => {
  try {
    const { question, candidateAnswer, maxPoints, position } = req.body;
    if (!question) {
      return res.status(400).json({ message: 'Pertanyaan wajib disertakan.' });
    }
    const evaluation = await handleAIEvaluateEssay({
      question,
      candidateAnswer: candidateAnswer || '',
      maxPoints: typeof maxPoints === 'number' ? maxPoints : 10,
      position,
    });
    return res.json(evaluation);
  } catch (err: any) {
    console.error('[AI Essay Evaluation Error]:', err?.message);
    return res.status(500).json({ message: err?.message || 'Gagal mengevaluasi essay.' });
  }
});

// Company Subscription Upgrade (Free to Premium)
app.post('/api/company/subscription-upgrade', async (req, res) => {
  try {
    const { companyId, plan } = req.body;
    if (!companyId) {
      return res.status(400).json({ message: 'companyId wajib diisi.' });
    }
    const result = await handleUpgradeSubscription({ companyId, plan });
    return res.json(result);
  } catch (err: any) {
    console.error('[Subscription Upgrade Error]:', err?.message);
    return res.status(400).json({ message: err?.message || 'Gagal mengupgrade langganan.' });
  }
});

// ==========================================
// TAHAP 5: AI CONTENT MODERATION ROUTE
// ==========================================
app.post('/api/moderation/analyze', async (req, res) => {
  try {
    const { text, type, authorName, positionOrContext } = req.body;
    if (!text) {
      return res.status(400).json({ message: 'Teks konten wajib diisi.' });
    }
    const analysis = await analyzeContentWithAI({
      text,
      type: type || 'post',
      authorName,
      positionOrContext,
    });
    return res.json(analysis);
  } catch (err: any) {
    console.error('[AI Moderation Error]:', err?.message);
    return res.status(500).json({ message: err?.message || 'Gagal menganalisis moderasi konten.' });
  }
});

// Background Auto-Scheduler (runs daily without requiring browser to be open)
function startBackgroundScheduler() {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  // Daily interval for background AI Job Hunter and cleanup
  setInterval(async () => {
    if (isJobHunterRunning) return;
    if (!process.env.GEMINI_API_KEY) {
      return;
    }

    try {
      console.log('[Scheduler] Executing daily scheduled AI Job Hunter (Asia/Jakarta)...');
      isJobHunterRunning = true;
      const res = await runJobHunterEngine('Daily Background Scheduler');
      if (res.success) {
        await cleanupExpiredJobsEngine();
        console.log('[Scheduler] Daily scheduled AI Job Hunter completed successfully.');
      } else {
        console.log('[Scheduler] Daily scheduled AI Job Hunter paused or completed with notes.');
      }
    } catch (err: any) {
      console.error('[Scheduler] Error in scheduled run:', err?.message);
    } finally {
      isJobHunterRunning = false;
    }
  }, TWENTY_FOUR_HOURS);
}

// Start Server & mount Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DIGAWE YUK Server running on http://0.0.0.0:${PORT}`);
    startBackgroundScheduler();
  });
}

startServer();
