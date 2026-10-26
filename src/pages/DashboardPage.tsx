import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  Clock,
  Flame,
  PlusCircle,
  FileCheck2,
  Bot,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getJalaliInfo,
  formatPersianNumber,
  formatDurationHoursMinutes,
  getTodayISODate,
} from '../utils/jalali';

export const DashboardPage: React.FC = () => {
  const {
    profile,
    todayTasks,
    toggleTaskStatus,
    startTimer,
    setCurrentTab,
    sessions,
    attempts,
    subjects,
  } = useApp();

  const todayInfo = getJalaliInfo();
  const todayISO = getTodayISODate();

  // Compute today's actual study time from sessions
  const todaySessions = sessions.filter((s) => s.date === todayISO);
  const todayStudiedMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const targetMinutes = profile.dailyTargetMinutes || 360;
  const progressPercent = Math.min(100, Math.round((todayStudiedMinutes / targetMinutes) * 100));

  const totalTestsToday = todaySessions.reduce((acc, s) => acc + (s.testsCount || 0), 0);
  const completedTasksCount = todayTasks.filter((t) => t.status === 'completed').length;

  const studiedHours = Math.floor(todayStudiedMinutes / 60);
  const studiedMins = todayStudiedMinutes % 60;
  const targetHours = Math.round(targetMinutes / 60);

  // Motivational messages based on progress
  const getMotivationalMessage = () => {
    if (progressPercent >= 100) return 'فوق‌العاده بود! هدف روزانه‌ات رو با موفقیت پشت سر گذاشتی 🎯';
    if (progressPercent >= 50) return 'بیش از نصف راه رو رفتی، همین فرمون رو با تمرکز ادامه بده! 💪';
    if (todayStudiedMinutes > 0) return 'روزت عالی شروع شده، پارت بعدی رو با انرژی کلید بزن ✨';
    return 'امروز هم می‌تونی بهترین رکوردت رو ثبت کنی، فقط شروع کن...';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Welcome & Today Study Progress Card (as seen in concept image) */}
      <div className="bg-gradient-to-br from-[#10584D] to-[#0c433b] text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#A9DCD5]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#F5B52E]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#A9DCD5] text-xs font-semibold backdrop-blur-sm">
              <Flame className="w-3.5 h-3.5 text-[#F5B52E]" />
              <span>رشته {profile.major} • {profile.grade}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              سلام، {profile.name} ✨
            </h2>
            <p className="text-sm md:text-base text-white/85 font-medium max-w-xl">
              {getMotivationalMessage()}
            </p>
          </div>

          {/* Stat Circular Progress */}
          <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md p-4 md:p-5 rounded-2xl border border-white/15">
            <div>
              <div className="text-xs text-[#A9DCD5] font-semibold mb-1">زمان مطالعه امروز</div>
              <div className="text-2xl md:text-3xl font-black font-mono tracking-tight text-white">
                {formatPersianNumber(`${studiedHours}:${String(studiedMins).padStart(2, '0')}`)}
              </div>
              <div className="text-xs text-white/70 mt-0.5">
                از هدف {formatPersianNumber(targetHours)} ساعت
              </div>
            </div>

            {/* Circular Progress Indicator */}
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#A9DCD5]"
                  strokeDasharray={`${progressPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-base font-black text-white">
                  {formatPersianNumber(progressPercent)}٪
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick action buttons row */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <button
            onClick={() => setCurrentTab('timer')}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-[#10584D] font-bold text-xs md:text-sm hover:bg-[#A9DCD5] transition shadow-md"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>شروع مطالعه</span>
          </button>

          <button
            onClick={() => setCurrentTab('planner')}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/15 text-white font-bold text-xs md:text-sm hover:bg-white/25 transition border border-white/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>برنامه‌ریزی</span>
          </button>

          <button
            onClick={() => setCurrentTab('exams')}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/15 text-white font-bold text-xs md:text-sm hover:bg-white/25 transition border border-white/20"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>آزمون‌ساز</span>
          </button>

          <button
            onClick={() => setCurrentTab('advisor')}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#F5B52E] text-slate-900 font-bold text-xs md:text-sm hover:bg-[#e0a424] transition shadow-md"
          >
            <Bot className="w-4 h-4" />
            <span>مشاور تحصیلی</span>
          </button>
        </div>
      </div>

      {/* Grid: Today's Tasks & Schedule (Left) + Stats & Insights (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks (2 Columns on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#10584D]" />
              <h3 className="text-lg font-extrabold text-slate-800">برنامه امروز شما</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#10584D]/10 text-[#10584D] font-bold">
                {formatPersianNumber(completedTasksCount)} از {formatPersianNumber(todayTasks.length)} انجام شد
              </span>
            </div>
            <button
              onClick={() => setCurrentTab('planner')}
              className="text-xs font-bold text-[#10584D] hover:underline flex items-center gap-1"
            >
              <span>مشاهده و ویرایش همه</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>

          {todayTasks.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#E6F4F1] text-[#10584D] flex items-center justify-center">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800">برنامه‌ای برای امروز ثبت نشده است</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  با تنظیم وظایف امروز، مطالعه هدفمند و منظم‌تری داشته باشید یا از پیشنهاد خودکار هوشمند استفاده کنید.
                </p>
              </div>
              <button
                onClick={() => setCurrentTab('planner')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10584D] text-white text-xs font-bold hover:bg-[#0c433b] transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>تنظیم وظایف امروز</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task) => {
                const sub = subjects.find((s) => s.id === task.subjectId);
                const isCompleted = task.status === 'completed';
                const durationFormatted = formatDurationHoursMinutes(task.targetMinutes).formatted;

                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-2xl p-4 border transition-all shadow-sm flex items-center justify-between gap-3 ${
                      isCompleted
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : 'border-slate-200/80 hover:border-[#A9DCD5]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition shrink-0 ${
                          isCompleted
                            ? 'bg-[#10584D] border-[#10584D] text-white'
                            : 'border-slate-300 hover:border-[#10584D] text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sub?.color || '#10584D' }}
                          />
                          <h4
                            className={`text-sm font-bold truncate ${
                              isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.title}
                          </h4>
                          {task.priority === 'بالا' && !isCompleted && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                              مهم
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {task.startTime ? formatPersianNumber(task.startTime) : 'زمان آزاد'}
                          </span>
                          <span>•</span>
                          <span>{formatPersianNumber(durationFormatted)}</span>
                          {task.completedMinutes > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-[#10584D] font-medium">
                                {formatPersianNumber(task.completedMinutes)} دقیقه خوانده شده
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick action button */}
                    <div className="shrink-0 flex items-center gap-2">
                      {!isCompleted && (
                        <button
                          onClick={() =>
                            startTimer(task.subjectId, task.topicName || task.title, 'timer', task.id, task.targetMinutes * 60)
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10584D]/10 hover:bg-[#10584D] text-[#10584D] hover:text-white transition text-xs font-bold"
                          title="شروع مطالعه با تایمر"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span className="hidden sm:inline">شروع پارت</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Performance Summary & Quick Metrics */}
        <div className="space-y-4">
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#10584D]" />
            <span>خلاصه وضعیت کنکوری</span>
          </h3>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100">
                <div className="text-xs text-amber-800 font-medium">تست‌های امروز</div>
                <div className="text-2xl font-black text-amber-900 font-mono mt-1">
                  {formatPersianNumber(totalTestsToday)}
                </div>
                <div className="text-[11px] text-amber-700/80 mt-0.5">تست ثبت‌شده</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div className="text-xs text-emerald-800 font-medium">آزمون‌های انجام‌شده</div>
                <div className="text-2xl font-black text-emerald-900 font-mono mt-1">
                  {formatPersianNumber(attempts.length)}
                </div>
                <div className="text-[11px] text-emerald-700/80 mt-0.5">کارنامه کامل</div>
              </div>
            </div>

            {/* Subject study breakdown */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between">
                <span>توزیع مطالعه دروس</span>
                <button
                  onClick={() => setCurrentTab('analytics')}
                  className="text-[#10584D] hover:underline text-[11px]"
                >
                  نمودار کامل
                </button>
              </div>

              <div className="space-y-2.5">
                {subjects.slice(0, 4).map((sub) => {
                  const subMinutes = sessions
                    .filter((s) => s.subjectId === sub.id)
                    .reduce((a, b) => a + b.durationMinutes, 0);
                  const subHours = (subMinutes / 60).toFixed(1);

                  return (
                    <div key={sub.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{sub.name}</span>
                        <span className="font-mono text-slate-500">
                          {formatPersianNumber(subHours)} ساعت
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (subMinutes / 600) * 100)}%`,
                            backgroundColor: sub.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smart reminder note */}
            <div className="p-3.5 rounded-2xl bg-[#10584D]/5 border border-[#10584D]/15 text-xs text-slate-700 space-y-1">
              <div className="font-bold text-[#10584D] flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#10584D]" />
                <span>توصیه هوشمند مشاور</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                حل تست‌های زمان‌دار در دروس محاسباتی سرعت پردازش ذهن شما را در آزمون‌های آزمایشی تا ۴۰٪ افزایش می‌دهد.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
