import React, { useState, ReactNode } from 'react';
import {
  LayoutDashboard,
  Timer,
  Calendar,
  FileCheck2,
  BookMarked,
  BarChart3,
  Bot,
  History,
  Settings,
  Menu,
  X,
  Play,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useApp, TabType } from '../context/AppContext';
import { getJalaliInfo, formatSecondsToTime, formatPersianNumber } from '../utils/jalali';

export const Navigation: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentTab, setCurrentTab, profile, activeTimer, timerSeconds } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const todayInfo = getJalaliInfo();

  const navItems: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'timer', label: 'تایمر مطالعه', icon: Timer },
    { id: 'planner', label: 'برنامه‌ریزی', icon: Calendar },
    { id: 'exams', label: 'آزمون‌ساز', icon: FileCheck2 },
    { id: 'notebook', label: 'دفترچه هوشمند', icon: BookMarked },
    { id: 'analytics', label: 'آمار و تحلیل', icon: BarChart3 },
    { id: 'advisor', label: 'مشاور هوش مصنوعی', icon: Bot },
    { id: 'history', label: 'تاریخچه', icon: History },
    { id: 'settings', label: 'تنظیمات', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F6F7F2] text-slate-800">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#10584D] text-white p-5 shrink-0 shadow-xl border-l border-[#0c433b]">
        {/* Brand */}
        <div className="flex items-center gap-3 pb-6 border-b border-white/10">
          <div className="w-11 h-11 rounded-2xl bg-[#A9DCD5] text-[#10584D] flex items-center justify-center font-black text-xl shadow-md shadow-black/10">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
              کنکوریار هوشمند
            </h1>
            <p className="text-xs text-[#A9DCD5] font-medium">همراه هوشمند کنکور</p>
          </div>
        </div>

        {/* Active Timer quick widget if running */}
        {activeTimer && (
          <div
            onClick={() => setCurrentTab('timer')}
            className="mt-4 p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-[#A9DCD5]/30 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-xs text-[#A9DCD5]">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                در حال مطالعه
              </span>
              <span>{activeTimer.isPaused ? 'متوقف' : 'فعال'}</span>
            </div>
            <div className="mt-1 text-lg font-black tracking-wider text-white font-mono">
              {formatPersianNumber(formatSecondsToTime(timerSeconds))}
            </div>
            <div className="text-xs text-white/80 truncate mt-0.5">{activeTimer.topicName}</div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-[#10584D] shadow-md font-bold'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#10584D]' : 'text-[#A9DCD5]'}`} />
                <span>{item.label}</span>
                {item.id === 'advisor' && (
                  <span className="mr-auto text-[10px] px-1.5 py-0.5 rounded-full bg-[#F5B52E] text-slate-900 font-black">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Mini Profile */}
        <div
          onClick={() => setCurrentTab('settings')}
          className="pt-4 border-t border-white/10 flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition"
        >
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-lg border border-white/20">
            {profile.avatar || '🎓'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate text-white">{profile.name}</div>
            <div className="text-xs text-[#A9DCD5] truncate">رشته {profile.major} • پایه {profile.grade}</div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#F6F7F2]/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              aria-label="منو"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xs font-medium text-slate-500">امروز</div>
              <div className="text-sm md:text-base font-bold text-slate-800">
                {formatPersianNumber(todayInfo.formatted)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Active timer badge */}
            {activeTimer && (
              <button
                onClick={() => setCurrentTab('timer')}
                className="flex items-center gap-2 bg-[#10584D] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-[#0c433b] transition"
              >
                <span className="w-2 h-2 rounded-full bg-[#A9DCD5] animate-ping" />
                <span className="font-mono">{formatPersianNumber(formatSecondsToTime(timerSeconds))}</span>
                <span className="hidden sm:inline text-white/80">({activeTimer.topicName})</span>
              </button>
            )}

            <button
              onClick={() => setCurrentTab('advisor')}
              className="flex items-center gap-1.5 bg-[#A9DCD5]/30 hover:bg-[#A9DCD5]/50 text-[#10584D] border border-[#A9DCD5]/60 px-3 py-1.5 rounded-full text-xs font-bold transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#10584D]" />
              <span>مشاور هوشمند</span>
            </button>

            <button
              onClick={() => setCurrentTab('settings')}
              className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-sm font-bold text-[#10584D]"
            >
              {profile.avatar || '🎓'}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1.5 shadow-lg flex items-center justify-around">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-xs font-semibold ${
              currentTab === 'dashboard' ? 'text-[#10584D] font-bold' : 'text-slate-500'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>خانه</span>
          </button>

          <button
            onClick={() => setCurrentTab('timer')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-xs font-semibold relative ${
              currentTab === 'timer' ? 'text-[#10584D] font-bold' : 'text-slate-500'
            }`}
          >
            {activeTimer && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#10584D] animate-ping" />
            )}
            <Timer className="w-5 h-5 mb-0.5" />
            <span>مطالعه</span>
          </button>

          <button
            onClick={() => setCurrentTab('exams')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-xs font-semibold ${
              currentTab === 'exams' ? 'text-[#10584D] font-bold' : 'text-slate-500'
            }`}
          >
            <FileCheck2 className="w-5 h-5 mb-0.5" />
            <span>آزمون</span>
          </button>

          <button
            onClick={() => setCurrentTab('analytics')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-xs font-semibold ${
              currentTab === 'analytics' ? 'text-[#10584D] font-bold' : 'text-slate-500'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span>آمار</span>
          </button>

          <button
            onClick={() => setCurrentTab('advisor')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-xs font-semibold ${
              currentTab === 'advisor' ? 'text-[#10584D] font-bold' : 'text-slate-500'
            }`}
          >
            <Bot className="w-5 h-5 mb-0.5" />
            <span>مشاور</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center py-1 px-2.5 rounded-xl text-xs font-semibold text-slate-500"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span>بیشتر</span>
          </button>
        </div>

        {/* Mobile Full Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-start">
            <div className="w-72 bg-[#10584D] text-white h-full flex flex-col p-6 animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#A9DCD5] text-[#10584D] flex items-center justify-center font-bold text-lg">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm text-white">کنکوریار هوشمند</h2>
                    <p className="text-[11px] text-[#A9DCD5]">منوی کامل صفحات</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/80"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 py-4 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                        isActive
                          ? 'bg-white text-[#10584D] font-bold shadow'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-[#10584D]' : 'text-[#A9DCD5]'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-white/10 text-xs text-white/60 text-center">
                نسخه آزمایشی ۱.۰.۰ • کنکوریار
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
};
