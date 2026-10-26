import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  Flame,
  Award,
  AlertTriangle,
  Calendar,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatPersianNumber,
  formatDurationHoursMinutes,
  getWeekDays,
  getTodayISODate,
} from '../utils/jalali';

type TimeRange = 'week' | 'month' | 'all';

export const AnalyticsPage: React.FC = () => {
  const { sessions, tasks, attempts, subjects, profile } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  const todayISO = getTodayISODate();
  const weekDays = getWeekDays();

  // Filter sessions based on range
  const filteredSessions = sessions.filter((s) => {
    if (timeRange === 'all') return true;
    if (timeRange === 'week') {
      const weekDates = weekDays.map((d) => d.isoDate);
      return weekDates.includes(s.date);
    }
    // month: simple 30 day filter
    const diffDays = (Date.now() - s.startTime) / (1000 * 3600 * 24);
    return diffDays <= 30;
  });

  const totalMinutesStudied = filteredSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalHoursStudied = (totalMinutesStudied / 60).toFixed(1);
  const totalTests = filteredSessions.reduce((acc, s) => acc + (s.testsCount || 0), 0);
  const totalCorrect = filteredSessions.reduce((acc, s) => acc + (s.correctCount || 0), 0);
  const totalIncorrect = filteredSessions.reduce((acc, s) => acc + (s.incorrectCount || 0), 0);

  const testAccuracy =
    totalTests > 0 ? Math.round((totalCorrect / totalTests) * 100) : 0;

  // Study hours for each day of the current week (matching bar chart in concept image)
  const weekChartData = weekDays.map((day) => {
    const daySessions = sessions.filter((s) => s.date === day.isoDate);
    const dayMins = daySessions.reduce((a, b) => a + b.durationMinutes, 0);
    return {
      dayName: day.jalali.dayName,
      mins: dayMins,
      hours: Math.round((dayMins / 60) * 10) / 10,
      isToday: day.isToday,
    };
  });

  const maxDayMins = Math.max(120, ...weekChartData.map((d) => d.mins));

  // Subject-wise performance
  const subjectStats = subjects.map((sub) => {
    const subSessions = filteredSessions.filter((s) => s.subjectId === sub.id);
    const subMinutes = subSessions.reduce((a, b) => a + b.durationMinutes, 0);
    const subTests = subSessions.reduce((a, b) => a + (b.testsCount || 0), 0);
    const subCorrect = subSessions.reduce((a, b) => a + (b.correctCount || 0), 0);

    // Also look at exam attempts for this subject
    const subAttempts = attempts.filter((a) => a.subjectId === sub.id);
    const avgExamPercentage =
      subAttempts.length > 0
        ? Math.round(
            subAttempts.reduce((acc, a) => acc + a.scorePercentage, 0) / subAttempts.length
          )
        : null;

    const accuracy = subTests > 0 ? Math.round((subCorrect / subTests) * 100) : avgExamPercentage || 0;

    return {
      sub,
      minutes: subMinutes,
      hours: (subMinutes / 60).toFixed(1),
      tests: subTests,
      accuracy,
      hasData: subMinutes > 0 || subAttempts.length > 0,
    };
  });

  // Identify weak spots based on low accuracy or high overdue
  const weakSubjects = subjectStats.filter((s) => s.hasData && s.accuracy < 60);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Bar with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800">آمار و تحلیل تحصیلی</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            روند پیشرفت مطالعاتی، تحلیل تست‌ها و شناسایی نقاط قوت و ضعف
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              timeRange === 'week' ? 'bg-[#10584D] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            هفته جاری
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              timeRange === 'month' ? 'bg-[#10584D] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ۳۰ روز گذشته
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              timeRange === 'all' ? 'bg-[#10584D] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            کل سوابق
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#10584D]" />
            <span>کل ساعت مطالعه</span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-800 font-mono">
            {formatPersianNumber(totalHoursStudied)}
          </div>
          <div className="text-[11px] text-[#10584D] font-bold">
            {timeRange === 'week' ? 'در این هفته' : 'مجموع بازه انتخابی'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>تست‌های پاسخ‌داده‌شده</span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-800 font-mono">
            {formatPersianNumber(totalTests)}
          </div>
          <div className="text-[11px] text-slate-400">تست استاندارد و کنکوری</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>درصد درستی تست‌ها</span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-800 font-mono">
            {formatPersianNumber(testAccuracy)}٪
          </div>
          <div className="text-[11px] text-slate-400">
            {formatPersianNumber(totalCorrect)} درست • {formatPersianNumber(totalIncorrect)} غلط
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span>تعداد آزمون‌ها</span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-800 font-mono">
            {formatPersianNumber(attempts.length)}
          </div>
          <div className="text-[11px] text-amber-700 font-bold">کارنامه ثبت‌شده</div>
        </div>
      </div>

      {/* Grid: Weekly Bar Chart (concept image inspired) + Subject Performance Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#10584D]" />
              <h3 className="text-base font-extrabold text-slate-800">نمودار ساعت مطالعه هفتگی</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              کل: {formatPersianNumber(totalHoursStudied)} ساعت
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-56 flex items-end justify-between gap-2 pt-6 px-2">
            {weekChartData.map((d, i) => {
              const heightPercent = Math.max(8, Math.round((d.mins / maxDayMins) * 100));

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[11px] font-mono font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition">
                    {formatPersianNumber(d.hours)}h
                  </span>
                  <div className="w-full max-w-[36px] bg-slate-100 rounded-t-xl overflow-hidden h-full flex items-end">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        d.isToday ? 'bg-[#10584D]' : 'bg-[#A9DCD5] hover:bg-[#10584D]/70'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span
                    className={`text-[11px] truncate ${
                      d.isToday ? 'font-black text-[#10584D]' : 'text-slate-500'
                    }`}
                  >
                    {d.dayName}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-100">
            شنبه تا جمعه • ثبت‌شده از جلسات واقعی مطالعه شما
          </div>
        </div>

        {/* Subject Performance Breakdown (matching concept image) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#10584D]" />
              <h3 className="text-base font-extrabold text-slate-800">عملکرد و تسلط به تفکیک درس</h3>
            </div>
            <span className="text-xs text-slate-400">تست و آزمون</span>
          </div>

          <div className="space-y-4">
            {subjectStats.map(({ sub, hours, tests, accuracy, hasData }) => (
              <div key={sub.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span>{sub.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <span>{formatPersianNumber(hours)} ساعت</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {hasData ? `${formatPersianNumber(accuracy)}٪` : 'بدون داده'}
                    </span>
                  </div>
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${hasData ? Math.max(5, accuracy) : 0}%`,
                      backgroundColor: sub.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Weak spots card (as highlighted on concept image) */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <div className="font-extrabold flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>نقاط تمرکز و نیازمند تقویت:</span>
            </div>
            {weakSubjects.length > 0 ? (
              <p className="leading-relaxed">
                درس‌های{' '}
                <strong>{weakSubjects.map((w) => w.sub.name).join(' و ')}</strong>{' '}
                درصد تسلط پایین‌تری دارند. پیشنهاد می‌شود ۲ پارت تستی مروری در برنامه این هفته اختصاص دهید.
              </p>
            ) : (
              <p className="leading-relaxed">
                توازن مطالعاتی مناسب است. برای دروس با درصد بالای ۷۵٪ تست‌های آزمون‌های جامع زمان‌دار را فعال نگه دارید.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
