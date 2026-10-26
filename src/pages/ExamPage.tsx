import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  BookOpen,
  Check,
  X,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Exam, ExamQuestion } from '../types';
import { api } from '../services/api';
import { formatPersianNumber, formatSecondsToTime, getTodayISODate } from '../utils/jalali';
import { useToast } from '../context/ToastContext';

type ExamView = 'list' | 'create' | 'taking' | 'result';

export const ExamPage: React.FC = () => {
  const { exams, addExam, addAttempt, subjects, attempts } = useApp();
  const { success, error, info } = useToast();

  const [currentView, setCurrentView] = useState<ExamView>('list');
  const [activeExam, setActiveExam] = useState<Exam | null>(null);

  // Creation State
  const [createStep, setCreateStep] = useState<number>(1);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || 'sub_math');
  const [topicName, setTopicName] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'ساده' | 'متوسط' | 'سخت' | 'کنکوری'>('متوسط');
  const [examDurationMins, setExamDurationMins] = useState<number>(15);
  const [hasNegativeMarking, setHasNegativeMarking] = useState<boolean>(true);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [draftQuestions, setDraftQuestions] = useState<ExamQuestion[]>([]);

  // Manual Question entry fields
  const [manualQText, setManualQText] = useState<string>('');
  const [manualOpt0, setManualOpt0] = useState<string>('');
  const [manualOpt1, setManualOpt1] = useState<string>('');
  const [manualOpt2, setManualOpt2] = useState<string>('');
  const [manualOpt3, setManualOpt3] = useState<string>('');
  const [manualCorrect, setManualCorrect] = useState<number>(0);
  const [manualExplanation, setManualExplanation] = useState<string>('');

  // Active Taking State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
  const [examSecondsLeft, setExamSecondsLeft] = useState<number>(0);

  // Result State
  const [lastResult, setLastResult] = useState<{
    correct: number;
    incorrect: number;
    unanswered: number;
    percentage: number;
    durationUsed: number;
  } | null>(null);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  useEffect(() => {
    if (selectedSubject?.topics.length && !topicName) {
      setTopicName(selectedSubject.topics[0].title);
    }
  }, [selectedSubject, topicName]);

  // Exam Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentView === 'taking' && examSecondsLeft > 0) {
      timer = setInterval(() => {
        setExamSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            finishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentView, examSecondsLeft]);

  // Start exam
  const startExam = (exam: Exam) => {
    setActiveExam(exam);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setFlaggedQuestions([]);
    setExamSecondsLeft(exam.durationMinutes * 60);
    setCurrentView('taking');
  };

  // Answer selection
  const selectOption = (questionId: string, optionIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };

  // Finish and compute Konkur score
  const finishExam = () => {
    if (!activeExam) return;

    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    activeExam.questions.forEach((q) => {
      const ans = userAnswers[q.id];
      if (ans === undefined) {
        unanswered++;
      } else if (ans === q.correctOption) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const total = activeExam.questions.length;
    let percentage = 0;
    if (total > 0) {
      if (activeExam.hasNegativeMarking) {
        // Konkur formula: (3 * C - W) / (3 * Total) * 100
        const rawScore = (3 * correct - incorrect) / (3 * total);
        percentage = Math.max(-33.33, Math.min(100, Math.round(rawScore * 1000) / 10));
      } else {
        percentage = Math.round((correct / total) * 1000) / 10;
      }
    }

    const durationUsed = Math.max(1, Math.round((activeExam.durationMinutes * 60 - examSecondsLeft) / 60));

    // Save attempt
    addAttempt({
      examId: activeExam.id,
      examTitle: activeExam.title,
      subjectId: activeExam.subjectId,
      subjectName: activeExam.subjectName,
      date: getTodayISODate(),
      durationMinutes: durationUsed,
      totalQuestions: total,
      correctCount: correct,
      incorrectCount: incorrect,
      unansweredCount: unanswered,
      scorePercentage: percentage,
      userAnswers,
      flaggedQuestionIds: flaggedQuestions,
    });

    setLastResult({
      correct,
      incorrect,
      unanswered,
      percentage,
      durationUsed,
    });

    setCurrentView('result');
  };

  // AI question generation
  const handleAiGenerate = async () => {
    setIsGeneratingAi(true);
    const sub = subjects.find((s) => s.id === selectedSubjectId);
    try {
      const res = await api.generateQuestions(
        sub?.name || 'ریاضیات',
        topicName || 'مباحث منتخب',
        questionCount,
        difficulty
      );
      if (res.questions && res.questions.length > 0) {
        setDraftQuestions(
          res.questions.map((q: any, i: number) => ({
            id: 'q_gen_' + Date.now() + '_' + i,
            text: q.text,
            options: q.options as [string, string, string, string],
            correctOption: typeof q.correctOption === 'number' ? q.correctOption : 0,
            explanation: q.explanation || 'تشریح پاسخ بر اساس نکات کنکوری.',
            topicName,
          }))
        );
        success('سؤالات با موفقیت آماده شد', res.isFallback ? 'استخراج از بانک محلی' : 'طراحی با Gemini');
        setCreateStep(4); // Move to review step
      } else {
        error('امکان دریافت سؤال وجود نداشت. لطفاً به صورت دستی سؤالات را وارد کنید.');
      }
    } catch (e) {
      error('خطا در تولید سؤالات');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const addManualQuestion = () => {
    if (!manualQText.trim() || !manualOpt0.trim() || !manualOpt1.trim()) {
      error('لطفاً صورت سؤال و حداقل دو گزینه اول را پر کنید');
      return;
    }

    const newQ: ExamQuestion = {
      id: 'q_man_' + Date.now(),
      text: manualQText.trim(),
      options: [
        manualOpt0.trim(),
        manualOpt1.trim(),
        manualOpt2.trim() || 'هیچ‌کدام',
        manualOpt3.trim() || 'سایر موارد',
      ],
      correctOption: manualCorrect,
      explanation: manualExplanation.trim() || 'پاسخ صحیح گزینه ' + (manualCorrect + 1) + ' است.',
      topicName,
    };

    setDraftQuestions((prev) => [...prev, newQ]);
    setManualQText('');
    setManualOpt0('');
    setManualOpt1('');
    setManualOpt2('');
    setManualOpt3('');
    setManualExplanation('');
    success('سؤال به آزمون اضافه شد');
  };

  const handleSaveExam = () => {
    if (draftQuestions.length === 0) {
      error('حداقل یک سؤال برای آزمون الزامی است');
      return;
    }

    const sub = subjects.find((s) => s.id === selectedSubjectId);
    const subName = sub ? sub.name : 'درس عمومی';
    const title = `آزمون ${subName} - ${topicName || 'مبحث کنکوری'}`;

    const newExamId = addExam({
      title,
      subjectId: selectedSubjectId,
      subjectName: subName,
      topicName: topicName || 'مبحث کنکوری',
      difficulty,
      durationMinutes: examDurationMins,
      hasNegativeMarking,
      questions: draftQuestions,
    });

    const created = exams.find((e) => e.id === newExamId) || {
      id: newExamId,
      title,
      subjectId: selectedSubjectId,
      subjectName: subName,
      topicName: topicName || 'مبحث کنکوری',
      difficulty,
      durationMinutes: examDurationMins,
      hasNegativeMarking,
      questions: draftQuestions,
      createdAt: new Date().toISOString(),
    };

    setActiveExam(created);
    setDraftQuestions([]);
    setCurrentView('list');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* View: Exam List */}
      {currentView === 'list' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800">آزمون‌ساز هوشمند کنکور</h2>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                طراحی آزمون، سنجش زمان‌دار با نمره منفی، و تحلیل کارنامه تستی
              </p>
            </div>

            <button
              onClick={() => {
                setCreateStep(1);
                setDraftQuestions([]);
                setCurrentView('create');
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10584D] hover:bg-[#0c433b] text-white text-xs font-bold shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>ساخت آزمون جدید</span>
            </button>
          </div>

          {/* List of Available Exams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => {
              const sub = subjects.find((s) => s.id === exam.subjectId);
              const pastAttempts = attempts.filter((a) => a.examId === exam.id);
              const lastScore = pastAttempts.length > 0 ? pastAttempts[0].scorePercentage : null;

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-[#10584D]/40 transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: sub?.accentBg || '#E6F4F1',
                          color: sub?.color || '#10584D',
                        }}
                      >
                        {exam.subjectName}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {formatPersianNumber(exam.questions.length)} سؤال • {formatPersianNumber(exam.durationMinutes)} دقیقه
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-800 leading-snug">
                      {exam.title}
                    </h3>
                    <div className="text-xs text-slate-500">
                      مبحث: <strong className="text-slate-700">{exam.topicName}</strong>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {lastScore !== null ? (
                        <span className="text-xs font-bold text-[#10584D]">
                          آخرین درصد: {formatPersianNumber(lastScore.toFixed(1))}٪
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">هنوز آزمون داده نشده</span>
                      )}
                    </div>

                    <button
                      onClick={() => startExam(exam)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10584D] hover:bg-[#0c433b] text-white text-xs font-bold shadow-sm transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>شرکت در آزمون</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View: Create Exam (6-step guided wizard) */}
      {currentView === 'create' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-lg space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#10584D]" />
              <h3 className="text-base md:text-lg font-black text-slate-800">
                ساخت آزمون جدید - مرحله {formatPersianNumber(createStep)} از ۴
              </h3>
            </div>
            <button
              onClick={() => setCurrentView('list')}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step 1: Subject & Topic */}
          {createStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">انتخاب درس آزمون:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {subjects.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setSelectedSubjectId(sub.id);
                        if (sub.topics.length) setTopicName(sub.topics[0].title);
                      }}
                      className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                        selectedSubjectId === sub.id
                          ? 'bg-[#10584D] text-white border-[#10584D] shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>{sub.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">مبحث یا فصل مورد آزمون:</label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  placeholder="مثلاً: مشتق و کاربرد مشتق"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-[#10584D]"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setCreateStep(2)}
                  className="px-6 py-2.5 rounded-xl bg-[#10584D] text-white text-xs font-bold hover:bg-[#0c433b]"
                >
                  ادامه (تنظیمات آزمون)
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Settings (Count, Difficulty, Duration, Negative Marking) */}
          {createStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">تعداد سؤالات:</label>
                  <div className="flex gap-2">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        onClick={() => setQuestionCount(num)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border ${
                          questionCount === num
                            ? 'bg-[#10584D] text-white border-[#10584D]'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {formatPersianNumber(num)} تست
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">سطح دشواری:</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  >
                    <option value="ساده">ساده (آموزشی)</option>
                    <option value="متوسط">متوسط (آزمونی)</option>
                    <option value="سخت">سخت (چالشی)</option>
                    <option value="کنکوری">سطح کنکور سراسری</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">زمان کل آزمون (دقیقه):</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={examDurationMins}
                    onChange={(e) => setExamDurationMins(parseInt(e.target.value, 10) || 15)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                    <input
                      type="checkbox"
                      checked={hasNegativeMarking}
                      onChange={(e) => setHasNegativeMarking(e.target.checked)}
                      className="rounded text-[#10584D]"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      محاسبه نمره منفی کنکور (هر ۳ غلط، ۱ درست را حذف می‌کند)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setCreateStep(1)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold"
                >
                  مرحله قبل
                </button>
                <button
                  onClick={() => setCreateStep(3)}
                  className="px-6 py-2.5 rounded-xl bg-[#10584D] text-white text-xs font-bold hover:bg-[#0c433b]"
                >
                  ادامه (تولید یا ورود سؤال)
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Choose method: Smart AI or Manual Questions */}
          {createStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AI Generation Box */}
                <div className="p-5 rounded-2xl border-2 border-dashed border-[#10584D]/40 bg-[#10584D]/5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#10584D]">
                      <Sparkles className="w-5 h-5 text-[#F5B52E]" />
                      <h4 className="text-sm font-extrabold">تولید هوشمند با هوش مصنوعی</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      طراحی خودکار {formatPersianNumber(questionCount)} سؤال چهارگزینه‌ای متناسب با مبحث «{topicName}» با پاسخ‌نامه تشریحی.
                    </p>
                  </div>
                  <button
                    disabled={isGeneratingAi}
                    onClick={handleAiGenerate}
                    className="w-full py-2.5 rounded-xl bg-[#10584D] hover:bg-[#0c433b] text-white text-xs font-bold shadow flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGeneratingAi ? (
                      <span>در حال طراحی سؤالات...</span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>تولید خودکار سؤالات</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Manual Box */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-800">
                      <BookOpen className="w-5 h-5 text-[#10584D]" />
                      <h4 className="text-sm font-extrabold">ورود دستی سؤالات</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      سؤالات جزوه، کتاب تست یا آزمون‌های آزمایشی را با گزینه‌ها تایپ و ثبت کنید.
                    </p>
                  </div>
                  <div className="text-xs font-bold text-slate-500">
                    تعداد ثبت‌شده تا الان: {formatPersianNumber(draftQuestions.length)} سؤال
                  </div>
                </div>
              </div>

              {/* Manual Question Form */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                <h5 className="text-xs font-bold text-slate-700">فرم افزودن سؤال دستی:</h5>
                <textarea
                  rows={2}
                  value={manualQText}
                  onChange={(e) => setManualQText(e.target.value)}
                  placeholder="متن کامل صورت سؤال را اینجا وارد کنید..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#10584D]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={manualOpt0}
                    onChange={(e) => setManualOpt0(e.target.value)}
                    placeholder="گزینه ۱"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    value={manualOpt1}
                    onChange={(e) => setManualOpt1(e.target.value)}
                    placeholder="گزینه ۲"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    value={manualOpt2}
                    onChange={(e) => setManualOpt2(e.target.value)}
                    placeholder="گزینه ۳"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    value={manualOpt3}
                    onChange={(e) => setManualOpt3(e.target.value)}
                    placeholder="گزینه ۴"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={manualCorrect}
                    onChange={(e) => setManualCorrect(parseInt(e.target.value, 10))}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#10584D]"
                  >
                    <option value={0}>گزینه ۱ صحیح است</option>
                    <option value={1}>گزینه ۲ صحیح است</option>
                    <option value={2}>گزینه ۳ صحیح است</option>
                    <option value={3}>گزینه ۴ صحیح است</option>
                  </select>
                  <input
                    type="text"
                    value={manualExplanation}
                    onChange={(e) => setManualExplanation(e.target.value)}
                    placeholder="توضیح پاسخ تشریحی (اختیاری)"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={addManualQuestion}
                  className="w-full py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900"
                >
                  افزودن این سؤال به لیست
                </button>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setCreateStep(2)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold"
                >
                  مرحله قبل
                </button>
                {draftQuestions.length > 0 && (
                  <button
                    onClick={() => setCreateStep(4)}
                    className="px-6 py-2.5 rounded-xl bg-[#10584D] text-white text-xs font-bold hover:bg-[#0c433b]"
                  >
                    مشاهده و مرور {formatPersianNumber(draftQuestions.length)} سؤال
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review Questions & Final Save */}
          {createStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700">
                  سؤالات آماده ذخیره ({formatPersianNumber(draftQuestions.length)} مورد):
                </h4>
                <button
                  onClick={() => setCreateStep(3)}
                  className="text-xs font-bold text-[#10584D] underline"
                >
                  + افزودن سؤال بیشتر
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {draftQuestions.map((q, idx) => (
                  <div key={q.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        {formatPersianNumber(idx + 1)}. {q.text}
                      </span>
                      <button
                        onClick={() => setDraftQuestions((prev) => prev.filter((item) => item.id !== q.id))}
                        className="text-rose-500 hover:text-rose-700 p-1 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-1.5 rounded-lg border ${
                            oIdx === q.correctOption
                              ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-800'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          {formatPersianNumber(oIdx + 1)}) {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setCreateStep(3)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold"
                >
                  مرحله قبل
                </button>
                <button
                  onClick={handleSaveExam}
                  className="px-6 py-2.5 rounded-xl bg-[#10584D] hover:bg-[#0c433b] text-white text-xs font-bold shadow"
                >
                  تأیید نهایی و ذخیره آزمون
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View: Taking Exam (Step 5: اجرای آزمون با تایمر، رفتن به قبل/بعد، پرچم‌گذاری، ثبت پاسخ) */}
      {currentView === 'taking' && activeExam && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xl space-y-6">
          {/* Top Bar: Exam Title, Remaining Time, Question Counter */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">{activeExam.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                سؤال {formatPersianNumber(currentQuestionIndex + 1)} از {formatPersianNumber(activeExam.questions.length)}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-mono font-bold text-sm border border-rose-200">
                <Clock className="w-4 h-4" />
                <span>{formatPersianNumber(formatSecondsToTime(examSecondsLeft))}</span>
              </div>

              <button
                onClick={finishExam}
                className="px-3.5 py-1.5 rounded-xl bg-[#10584D] hover:bg-[#0c433b] text-white text-xs font-bold shadow-sm"
              >
                پایان آزمون
              </button>
            </div>
          </div>

          {/* Question Palette Navigation Bar */}
          <div className="flex flex-wrap gap-1.5 py-2">
            {activeExam.questions.map((q, idx) => {
              const isAnswered = userAnswers[q.id] !== undefined;
              const isCurrent = idx === currentQuestionIndex;
              const isFlagged = flaggedQuestions.includes(q.id);

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold font-mono transition relative ${
                    isCurrent
                      ? 'ring-2 ring-[#10584D] bg-[#10584D] text-white shadow-sm'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {formatPersianNumber(idx + 1)}
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Current Question Body */}
          {(() => {
            const q = activeExam.questions[currentQuestionIndex];
            if (!q) return null;
            const chosen = userAnswers[q.id];
            const isFlagged = flaggedQuestions.includes(q.id);

            return (
              <div className="space-y-6 pt-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-base font-extrabold text-slate-800 leading-relaxed">
                    <span className="text-[#10584D] ml-2 font-mono">
                      {formatPersianNumber(currentQuestionIndex + 1)}.
                    </span>
                    {q.text}
                  </div>
                  <button
                    onClick={() => toggleFlag(q.id)}
                    className={`p-2 rounded-xl transition shrink-0 ${
                      isFlagged
                        ? 'bg-amber-100 text-amber-700'
                        : 'text-slate-400 hover:bg-slate-100'
                    }`}
                    title="علامت‌گذاری برای بازگشت"
                  >
                    <Bookmark className="w-5 h-5 fill-current" />
                  </button>
                </div>

                {/* 4 Options */}
                <div className="space-y-2.5">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = chosen === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => selectOption(q.id, optIdx)}
                        className={`w-full text-right p-4 rounded-2xl border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#10584D]/10 border-[#10584D] text-[#10584D] font-bold shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                              isSelected
                                ? 'bg-[#10584D] text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {formatPersianNumber(optIdx + 1)}
                          </span>
                          <span className="text-sm">{opt}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#10584D]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Navigation: Prev / Next */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>سؤال قبلی</span>
                  </button>

                  <div className="text-xs text-slate-400">
                    پاسخ‌داده‌شده: {formatPersianNumber(Object.keys(userAnswers).length)} از{' '}
                    {formatPersianNumber(activeExam.questions.length)}
                  </div>

                  {currentQuestionIndex < activeExam.questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#10584D] text-white text-xs font-bold hover:bg-[#0c433b]"
                    >
                      <span>سؤال بعدی</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={finishExam}
                      className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow"
                    >
                      ثبت و مشاهده کارنامه
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* View: Exam Result (Step 6: کارنامه آزمون، درصد، نمره منفی، پاسخ‌نامه تشریحی) */}
      {currentView === 'result' && activeExam && lastResult && (
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-xl space-y-8 animate-in zoom-in-95">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#10584D]/10 text-[#10584D] text-xs font-extrabold">
              <Award className="w-4 h-4" />
              <span>کارنامه رسمی آزمون</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-800">{activeExam.title}</h3>
            <p className="text-xs text-slate-500">
              مدت زمان مصرف‌شده: {formatPersianNumber(lastResult.durationUsed)} دقیقه • محاسبه نمره منفی کنکور
            </p>
          </div>

          {/* Big Score Dial (concept image style) */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-slate-100"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className={lastResult.percentage >= 50 ? 'text-[#10584D]' : 'text-rose-500'}
                  strokeWidth="8"
                  strokeDasharray="263.89"
                  strokeDashoffset={263.89 - (263.89 * Math.max(0, lastResult.percentage)) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-3xl font-black font-mono text-slate-800">
                  {formatPersianNumber(lastResult.percentage.toFixed(1))}٪
                </div>
                <div className="text-[11px] text-slate-500 font-bold mt-0.5">درصد تراز نهایی</div>
              </div>
            </div>
          </div>

          {/* Breakdown cards: درست، نادرست، نزده */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-xs font-bold text-emerald-800">درست</div>
              <div className="text-2xl font-black text-emerald-900 font-mono mt-1">
                {formatPersianNumber(lastResult.correct)}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
              <div className="text-xs font-bold text-rose-800">نادرست</div>
              <div className="text-2xl font-black text-rose-900 font-mono mt-1">
                {formatPersianNumber(lastResult.incorrect)}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-xs font-bold text-slate-600">بی‌پاسخ</div>
              <div className="text-2xl font-black text-slate-700 font-mono mt-1">
                {formatPersianNumber(lastResult.unanswered)}
              </div>
            </div>
          </div>

          {/* Review Answer Key */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-sm font-black text-slate-800">پاسخ‌نامه تشریحی سؤالات:</h4>
            <div className="space-y-4">
              {activeExam.questions.map((q, idx) => {
                const userChoice = userAnswers[q.id];
                const isCorrect = userChoice === q.correctOption;
                const isUnanswered = userChoice === undefined;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border space-y-2.5 ${
                      isCorrect
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : isUnanswered
                        ? 'border-slate-200 bg-slate-50/40'
                        : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 leading-relaxed">
                        {formatPersianNumber(idx + 1)}. {q.text}
                      </span>
                      <span className="shrink-0 text-xs font-bold">
                        {isCorrect && <span className="text-emerald-700">✓ درست</span>}
                        {!isCorrect && !isUnanswered && <span className="text-rose-700">✗ نادرست</span>}
                        {isUnanswered && <span className="text-slate-400">نزده</span>}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {q.options.map((opt, oIdx) => {
                        const isCorrectOpt = oIdx === q.correctOption;
                        const isUserChoice = oIdx === userChoice;

                        return (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-xl border ${
                              isCorrectOpt
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                                : isUserChoice
                                ? 'bg-rose-100 border-rose-300 text-rose-900'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            {formatPersianNumber(oIdx + 1)}) {opt}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                        <strong className="text-slate-800">پاسخ تشریحی:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => startExam(activeExam)}
              className="flex-1 py-3 rounded-xl bg-[#10584D] hover:bg-[#0c433b] text-white text-xs font-bold shadow flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>تکرار مجدد آزمون</span>
            </button>
            <button
              onClick={() => setCurrentView('list')}
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              بازگشت به لیست آزمون‌ها
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
