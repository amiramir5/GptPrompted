import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle,
  HelpCircle,
  Flame,
  ArrowRight,
  Plus,
  RefreshCw,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ChatMessage } from '../types';
import { api, ApiStatus } from '../services/api';
import { formatPersianNumber, getTodayISODate } from '../utils/jalali';
import { useToast } from '../context/ToastContext';

export const AdvisorPage: React.FC = () => {
  const { profile, todayTasks, sessions, attempts, subjects, addTask, setCurrentTab } = useApp();
  const { success, info } = useToast();

  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg_init',
        sender: 'assistant',
        text: `سلام ${profile.name} عزیز! 🎓 من «کنکوریار هوشمند» هستم؛ مشاور تخصصی تو برای برنامه‌ریزی کنکور، مدیریت زمان و تحلیل نتایج آزمون‌ها. امروز چطور می‌تونم به پیشرفتت کمک کنم؟`,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    api.getStatus().then((st) => setApiStatus(st));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickPrompts = [
    'برنامه امروز من را بررسی کن.',
    'چطور عقب‌ماندگی‌ام را جبران کنم؟',
    'نتیجه آزمون اخیرم را تحلیل کن.',
    'این مبحث را ساده توضیح بده.',
    'برای مرور این فصل برنامه بده.',
  ];

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    // Compute real context to pass to advisor
    const todayISO = getTodayISODate();
    const todayMins = sessions
      .filter((s) => s.date === todayISO)
      .reduce((a, b) => a + b.durationMinutes, 0);

    const context = {
      studentName: profile.name,
      major: profile.major,
      grade: profile.grade,
      targetDailyMinutes: profile.dailyTargetMinutes,
      todayStudyMinutes: todayMins,
      todayTasksCount: todayTasks.length,
      todayCompletedTasksCount: todayTasks.filter((t) => t.status === 'completed').length,
      totalExamsCount: attempts.length,
      lastExamScore: attempts[0]?.scorePercentage ?? null,
      subjectsList: subjects.map((s) => s.name),
    };

    const historyForAi = messages.slice(-6).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      text: m.text,
    }));

    try {
      const res = await api.askAdvisor(text, context, historyForAi);

      const assistantMsg: ChatMessage = {
        id: 'ast_' + Date.now(),
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        isFallback: res.isFallback,
        suggestedAction:
          text.includes('برنامه') || text.includes('مرور')
            ? {
                type: 'create_task',
                label: 'تبدیل این توصیه به وظیفه در برنامه مطالعه',
                payload: {
                  title: 'پارت مروری پیشنهادی مشاور',
                  subjectId: subjects[0]?.id || 'sub_math',
                  targetMinutes: 75,
                },
              }
            : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'assistant',
          text: 'متأسفانه در برقراری ارتباط خطایی رخ داد. لطفاً مجدداً امتحان کنید.',
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToAction = (action: any) => {
    if (action.type === 'create_task') {
      addTask({
        title: action.payload.title,
        subjectId: action.payload.subjectId,
        topicName: 'مرور طبق برنامه مشاور',
        date: getTodayISODate(),
        startTime: '17:00',
        targetMinutes: action.payload.targetMinutes || 75,
        priority: 'متوسط',
        status: 'todo',
        notes: 'ایجادشده توسط مشاور هوشمند',
      });
      success('وظیفه به برنامه امروز شما اضافه شد');
      setCurrentTab('planner');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Advisor Header & Server Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#10584D] text-[#A9DCD5] flex items-center justify-center font-bold text-xl shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <span>مشاور تخصصی کنکوریار</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10584D]/10 text-[#10584D] font-bold">
                پشتیبان هوشمند
              </span>
            </h2>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>وضعیت موتور:</span>
              {apiStatus?.hasGeminiKey ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  مدل هوش مصنوعی Gemini 3.8 فعال است
                </span>
              ) : (
                <span className="text-slate-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  موتور هوشمند محلی و مشاوره‌ای (آفلاین)
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: 'msg_new',
                sender: 'assistant',
                text: 'گفت‌وگوی جدید آغاز شد. چه سوالی داری؟',
                timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
            info('مکالمه بازنشانی شد');
          }}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 self-end sm:self-auto"
          title="شروع گفت‌وگوی جدید"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompts (concept image style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(p)}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#10584D] text-slate-700 hover:text-white border border-slate-200 text-xs font-semibold whitespace-nowrap transition shadow-sm"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white rounded-3xl p-4 md:p-6 border border-slate-200 shadow-sm min-h-[420px] max-h-[540px] overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === 'user';

          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  isUser
                    ? 'bg-slate-800 text-white'
                    : 'bg-[#10584D] text-[#A9DCD5]'
                }`}
              >
                {isUser ? profile.avatar || '👤' : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 space-y-2 text-xs md:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#10584D] text-white rounded-tr-none'
                    : 'bg-slate-100/80 text-slate-800 border border-slate-200/60 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {m.suggestedAction && (
                  <div className="pt-2 border-t border-slate-200">
                    <button
                      onClick={() => handleConvertToAction(m.suggestedAction)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10584D] text-white text-xs font-bold hover:bg-[#0c433b] shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{m.suggestedAction.label}</span>
                    </button>
                  </div>
                )}

                <div
                  className={`text-[10px] font-mono ${
                    isUser ? 'text-white/70 text-left' : 'text-slate-400 text-right'
                  }`}
                >
                  {m.timestamp}
                  {m.isFallback && ' • تحلیل محلی'}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#10584D] text-[#A9DCD5] flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10584D] animate-ping" />
              <span>مشاور در حال بررسی وضعیت و نگارش پاسخ است...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Chat Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="سؤال، درخواست برنامه‌ریزی یا راهنمایی تحصیلی‌ات را بنویس..."
          className="flex-1 px-4 py-2.5 text-xs md:text-sm bg-transparent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="p-3 rounded-xl bg-[#10584D] hover:bg-[#0c433b] text-white transition disabled:opacity-40"
        >
          <Send className="w-4 h-4 rotate-180" />
        </button>
      </form>
    </div>
  );
};
