import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  BookOpen,
  CheckCircle,
  FileText,
  Clock,
  Sparkles,
  Flame,
  X,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TimerMode } from '../types';
import {
  formatSecondsToTime,
  formatPersianNumber,
  formatDurationHoursMinutes,
  getTodayISODate,
} from '../utils/jalali';
import { useToast } from '../context/ToastContext';

export const TimerPage: React.FC = () => {
  const {
    subjects,
    todayTasks,
    activeTimer,
    timerSeconds,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    finishSession,
    discardTimer,
    sessionToFinalize,
    sessions,
    settings,
  } = useApp();

  const { info } = useToast();

  // Local selection form when no timer is active
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjects[0]?.id || 'sub_math'
  );
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [timerMode, setTimerMode] = useState<TimerMode>('timer');
  const [targetMinutes, setTargetMinutes] = useState<number>(60);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  // Post-session completion modal form
  const [testsCount, setTestsCount] = useState<string>('');
  const [correctCount, setCorrectCount] = useState<string>('');
  const [incorrectCount, setIncorrectCount] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState<string>('');

  // Quick note during active timer
  const [quickNote, setQuickNote] = useState<string>('');
  const [quickNotesList, setQuickNotesList] = useState<string[]>([]);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Set default topic if not set
  useEffect(() => {
    if (selectedSubject && selectedSubject.topics.length > 0 && !selectedTopic) {
      setSelectedTopic(selectedSubject.topics[0].title);
    }
  }, [selectedSubject, selectedTopic]);

  // Compute today's total minutes studied
  const todayISO = getTodayISODate();
  const todaySessions = sessions.filter((s) => s.date === todayISO);
  const todayTotalMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  const handleStart = () => {
    const topic = selectedTopic || (selectedSubject?.topics[0]?.title || 'مطالعه عمومی');
    const targetSec = timerMode === 'pomodoro' ? settings.pomodoroWorkMinutes * 60 : targetMinutes * 60;
    startTimer(selectedSubjectId, topic, timerMode, selectedTaskId || undefined, targetSec);
  };

  const handleFinalizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    finishSession({
      testsCount: testsCount ? parseInt(testsCount, 10) : 0,
      correctCount: correctCount ? parseInt(correctCount, 10) : 0,
      incorrectCount: incorrectCount ? parseInt(incorrectCount, 10) : 0,
      notes: [sessionNotes, ...quickNotesList].filter(Boolean).join('\n'),
    });
    setTestsCount('');
    setCorrectCount('');
    setIncorrectCount('');
    setSessionNotes('');
    setQuickNotesList([]);
  };

  const addQuickNote = () => {
    if (!quickNote.trim()) return;
    setQuickNotesList((prev) => [...prev, quickNote.trim()]);
    setQuickNote('');
    info('یادداشت به این جلسه اضافه شد');
  };

  // Determine remaining or elapsed time
  let displaySeconds = timerSeconds;
  let progressPercent = 0;

  if (activeTimer) {
    if (activeTimer.mode === 'timer' || activeTimer.mode === 'pomodoro') {
      const targetSec = activeTimer.targetSeconds || 3600;
      progressPercent = Math.min(100, (timerSeconds / targetSec) * 100);
    } else {
      // Stopwatch
      progressPercent = Math.min(100, (timerSeconds / 3600) * 100);
    }
  }

  const activeSub = activeTimer ? subjects.find((s) => s.id === activeTimer.subjectId) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Title & Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800">تایمر و ثبت مطالعه</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            ثبت دقیق زمان، پومودورو، تعداد تست و یادداشت‌های حین مطالعه
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm">
          <Clock className="w-4 h-4 text-[#10584D]" />
          <span>مجموع مطالعه امروز:</span>
          <span className="font-mono text-[#10584D]">
            {formatPersianNumber(formatDurationHoursMinutes(todayTotalMinutes).formatted)}
          </span>
        </div>
      </div>

      {/* Main Timer Display Card */}
      <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-xl relative overflow-hidden flex flex-col items-center text-center">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#A9DCD5]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#10584D]/5 rounded-full blur-2xl pointer-events-none" />

        {/* Current Active info */}
        {activeTimer ? (
          <div className="space-y-2 mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#10584D]/10 text-[#10584D] text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{activeSub?.name || 'درس'}</span>
              <span>•</span>
              <span>{activeTimer.mode === 'pomodoro' ? 'پومودورو' : activeTimer.mode === 'timer' ? 'تایمر هدفمند' : 'کرنومتر آزاد'}</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-800">{activeTimer.topicName}</h3>
          </div>
        ) : (
          <div className="mb-6">
            <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">
              آماده شروع پارت جدید
            </span>
          </div>
        )}

        {/* Big Circular Timer Dial (concept image inspired) */}
        <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center my-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-slate-100"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Progress Bar */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-[#10584D] transition-all duration-500"
              strokeWidth="6"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Time text centered */}
          <div className="absolute flex flex-col items-center justify-center">
            <div className="text-4xl md:text-5xl font-black font-mono tracking-wider text-slate-800 dir-ltr">
              {formatPersianNumber(formatSecondsToTime(displaySeconds))}
            </div>

            {activeTimer && (
              <div className="text-xs text-slate-500 mt-2 font-medium">
                {activeTimer.isPaused ? (
                  <span className="text-amber-600 font-bold">توقف موقت</span>
                ) : (
                  <span className="text-emerald-700 font-bold">در حال ضبط زمان...</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center gap-4 mt-6">
          {!activeTimer ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-[#10584D] hover:bg-[#0c433b] text-white text-base font-extrabold shadow-lg shadow-[#10584D]/25 transition hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>شروع پارت مطالعه</span>
            </button>
          ) : (
            <>
              {activeTimer.isPaused ? (
                <button
                  onClick={resumeTimer}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>ادامه مطالعه</span>
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  <span>توقف موقت</span>
                </button>
              )}

              <button
                onClick={stopTimer}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#10584D] hover:bg-[#0c433b] text-white font-bold text-sm shadow-md transition"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>پایان و ثبت جلسه</span>
              </button>

              <button
                onClick={discardTimer}
                className="p-3 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition"
                title="لغو پارت بدون ذخیره"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Quick note input during active study */}
        {activeTimer && (
          <div className="w-full max-w-md mt-8 pt-6 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-600 mb-2 text-right">
              یادداشت سریع حین مطالعه:
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQuickNote())}
                placeholder="مثلاً: تست شماره ۴۲ نکته داشت..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#10584D]"
              />
              <button
                onClick={addQuickNote}
                className="px-3.5 py-2 rounded-xl bg-[#10584D] text-white text-xs font-bold hover:bg-[#0c433b]"
              >
                افزودن
              </button>
            </div>
            {quickNotesList.length > 0 && (
              <div className="mt-3 space-y-1 text-right">
                {quickNotesList.map((n, i) => (
                  <div key={i} className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    • {n}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Configuration Panel (When Timer is NOT active) */}
      {!activeTimer && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#10584D]" />
            <span>تنظیمات پارت جدید</span>
          </h3>

          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-slate-100">
            <button
              onClick={() => setTimerMode('timer')}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                timerMode === 'timer'
                  ? 'bg-white text-[#10584D] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              تایمر مدت‌دار
            </button>
            <button
              onClick={() => setTimerMode('pomodoro')}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                timerMode === 'pomodoro'
                  ? 'bg-white text-[#10584D] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              پومودورو ({formatPersianNumber(settings.pomodoroWorkMinutes)} د)
            </button>
            <button
              onClick={() => setTimerMode('stopwatch')}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                timerMode === 'stopwatch'
                  ? 'bg-white text-[#10584D] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              کرنومتر آزاد
            </button>
          </div>

          {/* Subject Pills (as seen in concept image) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">انتخاب درس:</label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((sub) => {
                const isSel = sub.id === selectedSubjectId;
                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubjectId(sub.id);
                      if (sub.topics.length > 0) {
                        setSelectedTopic(sub.topics[0].title);
                      }
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                      isSel
                        ? 'bg-[#10584D] text-white border-[#10584D] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: isSel ? '#A9DCD5' : sub.color }}
                    />
                    <span>{sub.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">مبحث درس:</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-[#10584D]"
              >
                {selectedSubject?.topics.map((t) => (
                  <option key={t.id} value={t.title}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Duration if timer mode */}
            {timerMode === 'timer' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">مدت هدف پارت (دقیقه):</label>
                <div className="flex items-center gap-2">
                  {[45, 60, 75, 90].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setTargetMinutes(mins)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border ${
                        targetMinutes === mins
                          ? 'bg-[#10584D] text-white border-[#10584D]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {formatPersianNumber(mins)} د
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Link to scheduled task if any for today */}
          {todayTasks.filter((t) => t.status !== 'completed').length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700">
                اتصال مستقیم به وظیفه برنامه‌ریزی‌شده (اختیاری):
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => {
                  const tId = e.target.value;
                  setSelectedTaskId(tId);
                  const task = todayTasks.find((t) => t.id === tId);
                  if (task) {
                    setSelectedSubjectId(task.subjectId);
                    if (task.topicName) setSelectedTopic(task.topicName);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-[#10584D]"
              >
                <option value="">بدون اتصال به وظیفه (پارت آزاد)</option>
                {todayTasks
                  .filter((t) => t.status !== 'completed')
                  .map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} ({formatPersianNumber(task.targetMinutes)} دقیقه)
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Post-Session Finalize Modal (Section 6: پس از پایان جلسه، خلاصه‌ای از فعالیت نمایش بده و اجازه بده کاربر اطلاعات تکمیلی را ثبت کند) */}
      {sessionToFinalize && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="text-center space-y-2 mb-6">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-[#10584D] flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800">خسته نباشی! پارت مطالعه به پایان رسید</h3>
              <p className="text-xs text-slate-500">
                مدت مطالعه:{' '}
                <strong className="text-[#10584D] font-mono text-sm">
                  {formatPersianNumber(sessionToFinalize.durationMinutes)} دقیقه
                </strong>{' '}
                در مبحث {sessionToFinalize.topicName}
              </p>
            </div>

            <form onSubmit={handleFinalizeSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    کل تست‌ها:
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="۰"
                    value={testsCount}
                    onChange={(e) => setTestsCount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-center font-bold text-sm focus:border-[#10584D]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-emerald-700 block mb-1">
                    درست:
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="۰"
                    value={correctCount}
                    onChange={(e) => setCorrectCount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50/30 text-center font-bold text-sm focus:border-emerald-600 text-emerald-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-rose-700 block mb-1">
                    غلط:
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="۰"
                    value={incorrectCount}
                    onChange={(e) => setIncorrectCount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/30 text-center font-bold text-sm focus:border-rose-600 text-rose-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  یادداشت یا نکته این جلسه (اختیاری):
                </label>
                <textarea
                  rows={3}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="مثلاً: تست‌های مبحث مشتق زنجیره‌ای نیاز به مرور مجدد دارند..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#10584D]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#10584D] hover:bg-[#0c433b] text-white font-bold text-xs md:text-sm shadow-md transition"
                >
                  ثبت در سوابق و آمار
                </button>
                <button
                  type="button"
                  onClick={discardTimer}
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
