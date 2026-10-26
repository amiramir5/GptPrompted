import React, { useState } from 'react';
import {
  Settings,
  User,
  Clock,
  Download,
  Upload,
  RotateCcw,
  BookOpen,
  Bell,
  Palette,
  ShieldCheck,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MajorType } from '../types';
import { storage } from '../services/storage';
import { formatPersianNumber } from '../utils/jalali';
import { useToast } from '../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const { profile, setProfile, settings, setSettings, subjects, resetAllData } = useApp();
  const { success, error, info } = useToast();

  const [name, setName] = useState<string>(profile.name);
  const [major, setMajor] = useState<MajorType>(profile.major);
  const [grade, setGrade] = useState<string>(profile.grade);
  const [dailyTargetHours, setDailyTargetHours] = useState<number>(
    Math.round(profile.dailyTargetMinutes / 60)
  );

  const [pomoWork, setPomoWork] = useState<number>(settings.pomodoroWorkMinutes);
  const [pomoBreak, setPomoBreak] = useState<number>(settings.pomodoroBreakMinutes);
  const [negativeMarking, setNegativeMarking] = useState<boolean>(settings.negativeMarkingEnabled);
  const [soundAlerts, setSoundAlerts] = useState<boolean>(settings.soundAlerts);

  const [resetConfirmOpen, setResetConfirmOpen] = useState<boolean>(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({
      ...profile,
      name: name.trim() || 'داوطلب کنکور',
      major,
      grade,
      dailyTargetMinutes: dailyTargetHours * 60,
    });
    setSettings({
      ...settings,
      dailyTargetMinutes: dailyTargetHours * 60,
      pomodoroWorkMinutes: pomoWork,
      pomodoroBreakMinutes: pomoBreak,
      negativeMarkingEnabled: negativeMarking,
      soundAlerts,
    });
    success('تنظیمات با موفقیت ذخیره شد');
  };

  const handleExportBackup = () => {
    const jsonStr = storage.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `konkour-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success('فایل پشتیبان با موفقیت دانلود شد');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = storage.importAllData(content);
      if (ok) {
        window.location.reload();
      } else {
        error('فایل واردشده نامعتبر است');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-slate-800">تنظیمات و مدیریت برنامه</h2>
        <p className="text-xs md:text-sm text-slate-500 mt-0.5">
          مشخصات داوطلب، هدف‌گذاری ساعات مطالعه، پشتیبان‌گیری و دروس
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-[#10584D]" />
            <h3 className="text-base font-extrabold text-slate-800">مشخصات تحصیلی داوطلب</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">نام یا نام‌مستعار:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:border-[#10584D]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">رشته تحصیلی کنکور:</label>
              <select
                value={major}
                onChange={(e) => setMajor(e.target.value as MajorType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              >
                <option value="تجربی">علوم تجربی</option>
                <option value="ریاضی">ریاضی و فیزیک</option>
                <option value="انسانی">علوم انسانی</option>
                <option value="هنر">هنر</option>
                <option value="زبان">زبان‌های خارجی</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">پایه تحصیلی:</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              >
                <option value="دوازدهم">پایه دوازدهم</option>
                <option value="یازدهم">پایه یازدهم</option>
                <option value="دهم">پایه دهم</option>
                <option value="پشت‌کنکوری">فارغ‌التحصیل / پشت‌کنکوری</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                هدف ساعت مطالعه روزانه (ساعت):
              </label>
              <input
                type="number"
                min="1"
                max="18"
                value={dailyTargetHours}
                onChange={(e) => setDailyTargetHours(parseInt(e.target.value, 10) || 6)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:border-[#10584D]"
              />
            </div>
          </div>
        </div>

        {/* Timer Preferences */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-5 h-5 text-[#10584D]" />
            <h3 className="text-base font-extrabold text-slate-800">تنظیمات تایمر و آزمون</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                مدت پارت پومودورو (دقیقه):
              </label>
              <input
                type="number"
                min="15"
                max="120"
                value={pomoWork}
                onChange={(e) => setPomoWork(parseInt(e.target.value, 10) || 45)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                مدت استراحت پومودورو (دقیقه):
              </label>
              <input
                type="number"
                min="5"
                max="45"
                value={pomoBreak}
                onChange={(e) => setPomoBreak(parseInt(e.target.value, 10) || 15)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={negativeMarking}
                onChange={(e) => setNegativeMarking(e.target.checked)}
                className="w-4 h-4 rounded text-[#10584D]"
              />
              <span className="text-xs font-bold text-slate-700">
                محاسبه نمره منفی کنکور در آزمون‌ها به صورت پیش‌فرض (۱/۳ نمره منفی)
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={soundAlerts}
                onChange={(e) => setSoundAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-[#10584D]"
              />
              <span className="text-xs font-bold text-slate-700">
                پخش صدای زنگ پایان پارت مطالعه و اعلان‌ها
              </span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-[#10584D] hover:bg-[#0c433b] text-white font-extrabold text-sm shadow-md transition"
        >
          ذخیره تغییرات تنظیمات
        </button>
      </form>

      {/* Data Management & Backup */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <ShieldCheck className="w-5 h-5 text-[#10584D]" />
          <h3 className="text-base font-extrabold text-slate-800">مدیریت داده‌ها و پشتیبان‌گیری</h3>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          تمام سوابق مطالعه، وظایف، کارنامه‌ها و آزمون‌های شما در مرورگر ذخیره شده است. برای جلوگیری از پاک شدن داده‌ها هنگام حذف سابقه مرورگر، می‌توانید نسخه پشتیبان JSON دانلود کنید.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow transition"
          >
            <Download className="w-4 h-4" />
            <span>دانلود نسخه پشتیبان (JSON)</span>
          </button>

          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              id="import-backup"
              className="hidden"
            />
            <label
              htmlFor="import-backup"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition"
            >
              <Upload className="w-4 h-4" />
              <span>بازیابی از فایل پشتیبان</span>
            </label>
          </div>
        </div>

        {/* Reset Database Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-rose-700">بازنشانی داده‌ها</div>
            <div className="text-[11px] text-slate-400">بازگردانی اطلاعات به نمونه اولیه اولیه</div>
          </div>

          <button
            onClick={() => setResetConfirmOpen(true)}
            className="px-3.5 py-1.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold transition"
          >
            بازنشانی همه
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-slate-800">آیا از بازنشانی داده‌ها مطمئن هستید؟</h4>
            <p className="text-xs text-slate-500">
              با این کار تمام سوابق و جلسات فعلی پاک شده و به داده‌های اولیه تبدیل می‌شوند.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  resetAllData();
                  setResetConfirmOpen(false);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                بله، بازنشانی شود
              </button>
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
