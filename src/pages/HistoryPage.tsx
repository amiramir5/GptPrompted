import React, { useState } from 'react';
import {
  History,
  Timer,
  FileCheck2,
  CheckCircle,
  Calendar,
  Trash2,
  Clock,
  Filter,
  Check,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatPersianNumber,
  formatDurationHoursMinutes,
  getJalaliInfo,
} from '../utils/jalali';
import { useToast } from '../context/ToastContext';

type HistoryFilterType = 'all' | 'sessions' | 'attempts' | 'tasks';

export const HistoryPage: React.FC = () => {
  const { sessions, attempts, tasks, subjects, deleteSession, deleteTask } = useApp();
  const { success, info } = useToast();

  const [activeFilter, setActiveFilter] = useState<HistoryFilterType>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Combine into a chronological activity feed
  const feedItems: {
    id: string;
    type: 'session' | 'attempt' | 'task';
    title: string;
    subtitle: string;
    subjectId: string;
    date: string;
    timestamp: number;
    details: string;
    badge: string;
    extra?: any;
  }[] = [];

  // Add study sessions
  sessions.forEach((s) => {
    feedItems.push({
      id: s.id,
      type: 'session',
      title: `پارت مطالعه: ${s.topicName}`,
      subtitle: s.subjectName,
      subjectId: s.subjectId,
      date: s.date,
      timestamp: s.startTime,
      details: `${formatDurationHoursMinutes(s.durationMinutes).formatted} ${
        s.testsCount ? `• ${formatPersianNumber(s.testsCount)} تست حل‌شده` : ''
      }`,
      badge: 'مطالعه',
      extra: s,
    });
  });

  // Add exam attempts
  attempts.forEach((a) => {
    feedItems.push({
      id: a.id,
      type: 'attempt',
      title: `کارنامه آزمون: ${a.examTitle}`,
      subtitle: a.subjectName,
      subjectId: a.subjectId,
      date: a.date,
      timestamp: new Date(a.createdAt).getTime(),
      details: `درصد: ${formatPersianNumber(a.scorePercentage.toFixed(1))}٪ • ${formatPersianNumber(a.correctCount)} درست، ${formatPersianNumber(a.incorrectCount)} غلط`,
      badge: 'آزمون',
      extra: a,
    });
  });

  // Add completed tasks
  tasks
    .filter((t) => t.status === 'completed')
    .forEach((t) => {
      const sub = subjects.find((s) => s.id === t.subjectId);
      feedItems.push({
        id: t.id,
        type: 'task',
        title: `تکمیل وظیفه: ${t.title}`,
        subtitle: sub?.name || 'برنامه مطالعاتی',
        subjectId: t.subjectId,
        date: t.date,
        timestamp: new Date(t.createdAt).getTime(),
        details: `${formatPersianNumber(t.targetMinutes)} دقیقه هدف‌گذاری‌شده`,
        badge: 'وظیفه',
        extra: t,
      });
    });

  // Sort descending by timestamp
  feedItems.sort((a, b) => b.timestamp - a.timestamp);

  // Filter
  const filteredFeed = feedItems.filter((item) => {
    if (activeFilter !== 'all') {
      if (activeFilter === 'sessions' && item.type !== 'session') return false;
      if (activeFilter === 'attempts' && item.type !== 'attempt') return false;
      if (activeFilter === 'tasks' && item.type !== 'task') return false;
    }
    if (selectedSubject !== 'all' && item.subjectId !== selectedSubject) {
      return false;
    }
    return true;
  });

  const handleDeleteItem = (item: (typeof feedItems)[0]) => {
    if (item.type === 'session') {
      deleteSession(item.id);
    } else if (item.type === 'task') {
      deleteTask(item.id);
    }
    setDeleteConfirmId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800">تاریخچه کامل فعالیت‌ها</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            مرور جلسات مطالعه، کارنامه‌های ثبت‌شده و وظایف تکمیل‌شده با جزئیات
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
          >
            <option value="all">همه درس‌ها</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'همه فعالیت‌ها' },
          { id: 'sessions', label: 'جلسات مطالعه' },
          { id: 'attempts', label: 'آزمون‌ها و کارنامه‌ها' },
          { id: 'tasks', label: 'وظایف تکمیل‌شده' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeFilter === tab.id
                ? 'bg-[#10584D] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed List */}
      <div className="space-y-3">
        {filteredFeed.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
            <History className="w-12 h-12 mx-auto text-slate-300" />
            <h4 className="text-base font-bold text-slate-700">هیچ فعالیتی در این بازه یافت نشد</h4>
            <p className="text-xs text-slate-400">
              با شروع پارت‌های مطالعه یا شرکت در آزمون، لاگ کامل پیشرفت اینجا نمایش داده می‌شود.
            </p>
          </div>
        ) : (
          filteredFeed.map((item) => {
            const jalaliDate = getJalaliInfo(new Date(item.timestamp));
            const sub = subjects.find((s) => s.id === item.subjectId);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-slate-300 transition flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.type === 'session'
                        ? 'bg-[#10584D]/10 text-[#10584D]'
                        : item.type === 'attempt'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {item.type === 'session' && <Timer className="w-5 h-5" />}
                    {item.type === 'attempt' && <Award className="w-5 h-5" />}
                    {item.type === 'task' && <CheckCircle className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                        style={{
                          backgroundColor: sub?.accentBg || '#F1F5F9',
                          color: sub?.color || '#475569',
                        }}
                      >
                        {item.subtitle}
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-800 truncate">{item.title}</h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="font-mono">{formatPersianNumber(jalaliDate.formatted)}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-700">{formatPersianNumber(item.details)}</span>
                    </div>

                    {item.extra?.notes && (
                      <div className="text-[11px] text-slate-500 mt-1 truncate max-w-md">
                        یادداشت: {item.extra.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete button (with confirm) */}
                <div className="shrink-0 flex items-center gap-2">
                  {deleteConfirmId === item.id ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in">
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                      >
                        تایید حذف
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold"
                      >
                        لغو
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="حذف از تاریخچه"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
