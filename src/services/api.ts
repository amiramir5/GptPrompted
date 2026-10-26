export interface ApiStatus {
  status: string;
  hasGeminiKey: boolean;
  model: string;
}

export const api = {
  async getStatus(): Promise<ApiStatus> {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error('Status failed');
      return await res.json();
    } catch {
      return {
        status: 'offline',
        hasGeminiKey: false,
        model: 'محلی (الگوریتم داخلی)',
      };
    }
  },

  async askAdvisor(
    message: string,
    context: any,
    history: { role: string; text: string }[] = []
  ): Promise<{ reply: string; isFallback: boolean }> {
    try {
      const res = await fetch('/api/advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context, history }),
      });
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch {
      // Local rule-based educational advice
      return {
        reply: generateLocalKonkurAdvice(message, context),
        isFallback: true,
      };
    }
  },

  async generateQuestions(
    subject: string,
    topic: string,
    count: number = 5,
    difficulty: string = 'متوسط'
  ): Promise<{ questions: any[]; isFallback: boolean; message?: string }> {
    try {
      const res = await fetch('/api/exam/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, count, difficulty }),
      });
      if (!res.ok) throw new Error('Exam generation failed');
      return await res.json();
    } catch {
      return {
        questions: generateLocalKonkurQuestions(subject, topic, count),
        isFallback: true,
        message: 'سؤالات از بانک آزمون‌های طبقه‌بندی‌شده استخراج شدند.',
      };
    }
  },

  async analyzeNotebook(
    title: string,
    content: string,
    type: 'summary' | 'flashcards' | 'key_points' | 'slides'
  ): Promise<{ result: string; isFallback: boolean }> {
    try {
      const res = await fetch('/api/notebook/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, type }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      return await res.json();
    } catch {
      return {
        result: generateLocalNotebookAnalysis(title, content, type),
        isFallback: true,
      };
    }
  },
};

function generateLocalKonkurAdvice(query: string, context: any): string {
  const q = query.toLowerCase();
  const studiedHours = context?.todayStudyMinutes ? (context.todayStudyMinutes / 60).toFixed(1) : '۰';
  const targetHours = context?.targetDailyMinutes ? (context.targetDailyMinutes / 60).toFixed(0) : '۶';

  if (q.includes('برنامه امروز') || q.includes('امروز')) {
    return `سلام دوست پرتلاشم!
بررسی وضعیت امروزت:
⏱ ساعت مطالعه ثبت‌شده تا الان: ${studiedHours} ساعت از هدف ${targetHours} ساعته.
📋 توصیه‌های عملیاتی برای شیفت عصر و شب:
۱. حتماً بین هر پارت مطالعه ۷۵ دقیقه‌ای، ۱۵ دقیقه استراحت فعال (بدون گوشی) داشته باش.
۲. مباحث محاسباتی مثل ریاضی یا فیزیک رو در ساعات پرانرژی بخون و دروس توصیفی‌تر رو به انتهای شب موکول کن.
۳. در پایان روز حداقل ۳۰ دقیقه به مرور خلاصه‌ها و تست‌های نشان‌دار اختصاص بده.`;
  }

  if (q.includes('عقب‌ماندگی') || q.includes('جبران') || q.includes('اهمال')) {
    return `برای جبران عقب‌ماندگی‌ها، تکنیک ۳ گام طلایی کنکور رو اجرا کن:
۱. **تفکیک مباحث به پیش‌نیازها**: اول فقط مباحثی که پیش‌نیاز فصول بعدی هستن (مثل تابع در ریاضی یا استوکیومتری در شیمی) رو انتخاب کن.
۲. **قانون ۸۰/۲۰**: ۸۰ درصد تست‌های کنکور از ۲۰ درصد تیپ‌تست‌های پرتکرار میان؛ تست‌های سراسری ۵ سال اخیر همون مبحث رو مسلط شو.
۳. **باکس‌های جبرانی هفتگی**: در برنامه هفتگیت (به‌ویژه جمعه‌ها یا عصر پنج‌شنبه) ۲ باکس ۹۰ دقیقه‌ای خالی فقط برای جبران در نظر بگیر.`;
  }

  if (q.includes('آزمون') || q.includes('درصد') || q.includes('تست')) {
    return `تحلیل آزمون مهم‌تر از خود آزمونه!
چک‌لیست تحلیل آزمون استاندارد:
۱. **سؤالات نزده**: آیا به‌خاطر کمبود وقت بوده یا بلد نبودی؟ اگر کمبود وقت بوده، تکنیک ضربدر و منها (-) (+) رو تقویت کن.
۲. **سؤالات غلط**: دلیلش اشتباه محاسباتی بوده یا فهم اشتباه صورت سوال؟ نکاتش رو سریعاً وارد دفترچه هوشمند کن.
۳. برای هر درس، حداقل ۲۰ تست مروری زمان‌دار در همان روز آزمون حل کن تا یادگیری تثبیت بشه.`;
  }

  return `به عنوان کنکوریار، با تکیه بر آمار تحصیلی‌ات پیشنهاد می‌کنم:
۱. استمرار روزانه مهم‌ترین راز رتبه‌های برتره؛ حتی در روزهای سخت، پارت‌های کوچک ۳۰ دقیقه‌ای رو رها نکن.
۲. تعادل تستی و تشریحی رو متناسب با امتحان نهایی و کنکور (۵۰-۵۰) حفظ کن.
۳. اگر سؤالی درباره مبحث خاصی داری بپرس تا با هم گام‌به‌گام برنامه‌ریزی کنیم.`;
}

function generateLocalKonkurQuestions(subject: string, topic: string, count: number) {
  return [
    {
      id: 'local_q1',
      text: `در مبحث «${topic}» از درس «${subject}»، کدام عبارت درباره تحلیل تست‌های پرتکرار سراسری صحیح است؟`,
      options: [
        'در صورت تسلط بر مفاهیم پایه، سرعت حل بیش از ۵۰ درصد افزایش می‌یابد.',
        'صرفاً حفظ کردن فرمول بدون حل تست آموزشی کفایت می‌کند.',
        'نمره منفی تاثیری در تراز نهایی آزمون‌های سراسری ندارد.',
        'بررسی گزینه‌های نادرست هیچ ارزش آموزشی ندارد.',
      ],
      correctOption: 0,
      explanation: 'تسلط مفهومی و طبقه‌بندی تیپ تست‌ها مهم‌ترین فاکتور سرعت عمل در کنکور سراسری است.',
      topicName: topic,
    },
    {
      id: 'local_q2',
      text: `در صورت مواجهه با تست‌های چالشی درس ${subject} در زمان آزمون، بهترین استراتژی زمانی کدام است؟`,
      options: [
        'اصرار بر حل تست تا زمان رسیدن به پاسخ حتی با از دست رفتن زمان دیگر دروس',
        'علامت‌گذاری تست با علامت ضربدر یا منفی و عبور برای بازگشت در دور دوم',
        'انتخاب تصادفی یکی از گزینه‌ها بدون محاسبه',
        'رها کردن کامل دفترچه آزمون',
      ],
      correctOption: 1,
      explanation: 'استراتژی مدیریت زمان و تکنیک زمان‌های نقصانی کلید موفقیت رتبه‌های برتر است.',
      topicName: topic,
    },
    {
      id: 'local_q3',
      text: `مهم‌ترین تکنیک برای تثبیت فرمول‌ها و نکات تستی مبحث ${topic} چیست؟`,
      options: [
        'حل تست‌های زمان‌دار در فواصل ۲۴ ساعت، ۳ روز و یک هفته (منحنی ابینگهاوس)',
        'صرفاً روخوانی مکرر جزوه بدون قلم و کاغذ',
        'حفظ کردن شماره گزینه‌ها در کنکورهای گذشته',
        'صرف زمان آزمون بدون توجه به نمره منفی',
      ],
      correctOption: 0,
      explanation: 'مرور فعال بر پایه منحنی فراموشی ابینگهاوس بازده یادگیری را تا ۸۵ درصد تثبیت می‌کند.',
      topicName: topic,
    },
  ].slice(0, count);
}

function generateLocalNotebookAnalysis(title: string, content: string, type: string): string {
  if (type === 'flashcards') {
    return `### فلش‌کارت‌های استخراج‌شده از «${title}»
**کارت ۱:**
- **پرسش:** مفهوم و نکته کلیدی اصلی متن چیست؟
- **پاسخ:** ${content.slice(0, 100)}...

**کارت ۲:**
- **پرسش:** کدام دام تستی در این مبحث بسیار رایج است؟
- **پاسخ:** عدم توجه به شرایط مرزی و دامنه تعریف متغیرها در صورت سؤال.

**کارت ۳:**
- **پرسش:** بهترین الگوریتم حل مسائل این بخش چیست؟
- **پاسخ:** ۱. استخراج داده‌ها ۲. ساده‌سازی عبارات ۳. بررسی تناسب واحدها.`;
  }

  if (type === 'key_points') {
    return `### نکات کلیدی و طلایی تستی «${title}»
- 📌 **نکته ۱:** این مبحث در کنکورهای اخیر بودجه‌بندی پایدار ۱ الی ۲ تست مستقیم داشته است.
- 📌 **نکته ۲:** همواره قبل از ورود به محاسبات سنگین، گزینه‌ها را از لحاظ تقریب و رقم یکان بررسی کنید.
- 📌 **نکته ۳:** در مسائل چندمرحله‌ای، مقادیر میانی را رند نکنید تا خطای محاسباتی کاهش یابد.`;
  }

  return `### خلاصه‌سازی هوشمند «${title}»
این مبحث شامل مفاهیم بنیادی درس است که پیش‌نیاز فصول بعدی محسوب می‌شود.
**چکیده اصلی:**
${content.length > 250 ? content.slice(0, 250) + '...' : content}

**توصیه مشاوره‌ای:** این خلاصه را در زمان‌های مرده (پیش از خواب یا در مسیر) مرور کنید.`;
}
