import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI if key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health & AI status check
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey),
    model: 'gemini-3.8-flash',
  });
});

// Advisor chat endpoint
app.post('/api/advisor/chat', async (req: Request, res: Response) => {
  const { message, context, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'پیام الزامی است' });
  }

  if (!ai) {
    return res.json({
      reply: 'دستیار هوشمند در حالت محلی فعال است (کلید Gemini در سرور تنظیم نشده است). تحلیل بر اساس الگوریتم‌های استاندارد مشاوره‌ای انجام می‌شود.',
      isFallback: true,
    });
  }

  try {
    const systemPrompt = `تو مشاور ارشد و متخصص کنکور سراسری ایران به نام «کنکوریار هوشمند» هستی.
لحن تو: همدلانه، دقیق، انگیزه‌بخش و مبتنی بر واقعیت‌های علمی و آماری کنکور سراسری.
پاسخ‌هایت باید ساختاریافته، عملیاتی، بدون شعارهای توخالی و با زبان فارسی روان باشد.
در صورت نیاز، راه‌حل‌های گام‌به‌گام و جدول زمانی پیشنهاد بده.
اطلاعات عملکرد فعلی داوطلب:
${JSON.stringify(context || {})}
`;

    const chatContents = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        chatContents.push(`${h.role === 'user' ? 'داوطلب' : 'مشاور'}: ${h.text}`);
      }
    }
    chatContents.push(`داوطلب: ${message}`);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${systemPrompt}\n\nتاریخچه و پیام داوطلب:\n${chatContents.join('\n')}`,
    });

    const reply = response.text || 'پاسخی دریافت نشد. لطفاً مجدداً تلاش کنید.';
    res.json({ reply, isFallback: false });
  } catch (err: any) {
    console.error('Gemini chat error:', err);
    res.status(500).json({
      error: 'خطا در ارتباط با مدل هوش مصنوعی',
      details: err?.message,
      isFallback: true,
    });
  }
});

// Question generation endpoint
app.post('/api/exam/generate', async (req: Request, res: Response) => {
  const { subject, topic, count = 5, difficulty = 'متوسط' } = req.body;

  if (!ai) {
    return res.json({
      isFallback: true,
      questions: [],
      message: 'کلید سرویس هوش مصنوعی موجود نیست. از بانک سؤالات محلی یا ساخت دستی استفاده نمایید.',
    });
  }

  try {
    const prompt = `شما طراح سؤال کنکور سراسری هستید.
برای درس: "${subject}" و مبحث: "${topic}"، دقیقاً ${count} سؤال چهارگزینه‌ای استاندارد در سطح دشواری "${difficulty}" تولید کنید.
خروجی باید صرفاً یک JSON معتبر باشد با آرایه‌ای از اشیاء به فرمت:
[
  {
    "id": "q1",
    "text": "متن سؤال",
    "options": ["گزینه ۱", "گزینه ۲", "گزینه ۳", "گزینه ۴"],
    "correctOption": 0, // عدد صفر تا ۳ که نشان‌دهنده گزینه درست است
    "explanation": "تشریح کامل و مستند پاسخ"
  }
]
هیچ متن اضافه یا توضیحی خارج از آرایه JSON ارسال نکن.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text || '[]';
    let questions = [];
    try {
      questions = JSON.parse(raw);
    } catch {
      questions = [];
    }
    res.json({ questions, isFallback: false });
  } catch (err: any) {
    console.error('Exam generator error:', err);
    res.status(500).json({ error: 'خطا در تولید سؤالات با هوش مصنوعی', isFallback: true });
  }
});

// Notebook text analysis & summary endpoint
app.post('/api/notebook/analyze', async (req: Request, res: Response) => {
  const { title, content, type } = req.body;

  if (!ai) {
    return res.json({
      isFallback: true,
      message: 'سرویس هوش مصنوعی فعال نیست. تحلیل محلی ساده اعمال شد.',
      summary: content ? content.slice(0, 150) + '...' : '',
    });
  }

  try {
    const prompt = `متن درسی زیر با عنوان "${title}" را برای داوطلب کنکور سراسری تحلیل کن.
نوع درخواست: ${type} (خلاصه‌سازی، استخراج نکات کلیدی و فرمول‌ها، یا فلش‌کارت)
متن:
${content}

خروجی باید تمیز، با فرمت Markdown، و دربرگیرنده مهم‌ترین نکات تستی باشد.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({
      result: response.text,
      isFallback: false,
    });
  } catch (err: any) {
    console.error('Notebook analysis error:', err);
    res.status(500).json({ error: 'خطا در تحلیل متن', isFallback: true });
  }
});

// Vite middleware for dev or static serving for prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`کنکوریار هوشمند server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
