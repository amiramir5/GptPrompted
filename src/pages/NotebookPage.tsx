import React, { useState } from 'react';
import {
  BookMarked,
  Plus,
  Upload,
  FileText,
  Sparkles,
  Layers,
  Presentation,
  Trash2,
  Edit3,
  Search,
  CheckCircle,
  Copy,
  BookOpen,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Notebook, NotebookOutput } from '../types';
import { api } from '../services/api';
import { formatPersianNumber, getJalaliInfo } from '../utils/jalali';
import { useToast } from '../context/ToastContext';

type OutputTab = 'all' | 'summary' | 'flashcards' | 'key_points' | 'slides';

export const NotebookPage: React.FC = () => {
  const { notebooks, addNotebook, updateNotebook, deleteNotebook, subjects } = useApp();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<OutputTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Modal State for New Resource / Note
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteSubjectId, setNoteSubjectId] = useState<string>(subjects[0]?.id || 'sub_math');
  const [noteTopic, setNoteTopic] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileSizeMb, setFileSizeMb] = useState<number>(0);

  // Active Notebook being viewed/processed
  const [activeNotebook, setActiveNotebook] = useState<Notebook | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processType, setProcessType] = useState<'summary' | 'flashcards' | 'key_points' | 'slides'>('summary');

  const filteredNotebooks = notebooks.filter((n) => {
    const matchSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.rawText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject = selectedSubjectFilter === 'all' || n.subjectId === selectedSubjectFilter;
    return matchSearch && matchSubject;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      error('حداکثر حجم مجاز فایل ۱۰ مگابایت است');
      return;
    }

    setFileName(file.name);
    setFileSizeMb(Math.round((file.size / (1024 * 1024)) * 10) / 10);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setNoteContent(text || 'فایل متنی با موفقیت خوانده شد.');
      if (!noteTitle) setNoteTitle(file.name.replace(/\.[^/.]+$/, ''));
    };
    reader.readAsText(file);
    info('فایل انتخاب شد و آماده ذخیره است');
  };

  const handleCreateNotebook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) {
      error('لطفاً عنوان دفترچه را وارد نمایید');
      return;
    }

    const sub = subjects.find((s) => s.id === noteSubjectId);
    addNotebook({
      title: noteTitle.trim(),
      subjectId: noteSubjectId,
      subjectName: sub?.name || 'عمومی',
      topicName: noteTopic.trim() || 'نکات کلی',
      rawText: noteContent.trim() || 'متن پیش‌فرض برای یادداشت‌برداری و خلاصه‌نویسی.',
      fileName: fileName || undefined,
      fileSizeMb: fileSizeMb || undefined,
    });

    setModalOpen(false);
    setNoteTitle('');
    setNoteTopic('');
    setNoteContent('');
    setFileName('');
    setFileSizeMb(0);
  };

  // Run AI processing on current notebook
  const handleProcessAi = async (type: 'summary' | 'flashcards' | 'key_points' | 'slides') => {
    if (!activeNotebook) return;
    setIsProcessing(true);
    setProcessType(type);

    try {
      const res = await api.analyzeNotebook(activeNotebook.title, activeNotebook.rawText, type);
      const titleMap = {
        summary: 'خلاصه مفهومی و تستی',
        flashcards: 'فلش‌کارت‌های مرور فعال',
        key_points: 'نکات کلیدی و فرمول‌های طلایی',
        slides: 'اسلایدهای مرور سریع',
      };

      const newOutput: NotebookOutput = {
        id: 'out_' + Date.now(),
        type,
        title: titleMap[type],
        content: res.result,
        createdAt: new Date().toISOString(),
      };

      const updated = {
        ...activeNotebook,
        outputs: [newOutput, ...activeNotebook.outputs],
        updatedAt: new Date().toISOString(),
      };

      updateNotebook(updated);
      setActiveNotebook(updated);
      success('خروجی هوشمند با موفقیت ساخته شد', res.isFallback ? 'پردازش محلی' : 'تحلیل با Gemini');
    } catch {
      error('خطا در پردازش هوشمند');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800">دفترچه هوشمند و منابع درسی</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            ذخیره جزوه‌ها، خلاصه‌سازی هوشمند، تولید فلش‌کارت و استخراج نکات تستی
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10584D] hover:bg-[#0c433b] text-white text-xs font-bold shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن جزوه / متن جدید</span>
        </button>
      </div>

      {/* Categories Toolbar (matching concept image tabs: فایل‌ها | خلاصه‌سازی | فلش‌کارت | اسلاید) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'همه فایل‌ها' },
            { id: 'summary', label: 'خلاصه‌ها' },
            { id: 'flashcards', label: 'فلش‌کارت‌ها' },
            { id: 'key_points', label: 'نکات کلیدی' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-[#10584D] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در جزوه‌ها..."
              className="w-full pr-9 pl-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:border-[#10584D]"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
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

      {/* Grid: List of Notebooks (Left) + Detailed View & AI Output Generator (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notebook List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500">
            فهرست جزوه‌ها و منابع ({formatPersianNumber(filteredNotebooks.length)})
          </h3>

          {filteredNotebooks.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
              <BookMarked className="w-10 h-10 mx-auto text-slate-300" />
              <div className="text-xs font-bold text-slate-600">هنوز منبعی ثبت نشده است</div>
              <button
                onClick={() => setModalOpen(true)}
                className="text-xs font-bold text-[#10584D] underline"
              >
                + افزودن اولین جزوه
              </button>
            </div>
          ) : (
            filteredNotebooks.map((nb) => {
              const isSelected = activeNotebook?.id === nb.id;
              const sub = subjects.find((s) => s.id === nb.subjectId);

              return (
                <div
                  key={nb.id}
                  onClick={() => setActiveNotebook(nb)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-2 shadow-sm ${
                    isSelected
                      ? 'bg-white border-[#10584D] ring-2 ring-[#10584D]/20 shadow-md'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: sub?.color || '#10584D' }}
                        />
                        <span className="text-[11px] font-bold text-slate-500">
                          {nb.subjectName} • {nb.topicName}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-800 truncate">{nb.title}</h4>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotebook(nb.id);
                        if (activeNotebook?.id === nb.id) setActiveNotebook(null);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                    <span>{formatPersianNumber(nb.outputs.length)} خروجی هوشمند</span>
                    {nb.fileName && <span>{nb.fileName}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Notebook Detailed Viewer & AI Tool actions (2 columns) */}
        <div className="lg:col-span-2">
          {activeNotebook ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              {/* Note Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold text-[#10584D] mb-0.5">
                    {activeNotebook.subjectName} • {activeNotebook.topicName}
                  </div>
                  <h3 className="text-lg font-black text-slate-800">{activeNotebook.title}</h3>
                </div>

                {/* AI Trigger Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    disabled={isProcessing}
                    onClick={() => handleProcessAi('summary')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10584D]/10 hover:bg-[#10584D] text-[#10584D] hover:text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>خلاصه‌سازی</span>
                  </button>

                  <button
                    disabled={isProcessing}
                    onClick={() => handleProcessAi('flashcards')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>فلش‌کارت</span>
                  </button>

                  <button
                    disabled={isProcessing}
                    onClick={() => handleProcessAi('key_points')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>نکات کلیدی</span>
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {isProcessing && (
                <div className="p-4 rounded-2xl bg-[#10584D]/5 border border-[#10584D]/20 text-center space-y-2 animate-pulse">
                  <Sparkles className="w-6 h-6 mx-auto text-[#10584D] animate-spin" />
                  <div className="text-xs font-bold text-[#10584D]">
                    در حال تحلیل متن و تولید {processType === 'summary' ? 'خلاصه' : processType === 'flashcards' ? 'فلش‌کارت' : 'نکات کلیدی'}...
                  </div>
                </div>
              )}

              {/* AI Outputs Sections */}
              {activeNotebook.outputs.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-700">خروجی‌های هوشمند این مبحث:</h4>
                  <div className="space-y-3">
                    {activeNotebook.outputs.map((out) => (
                      <div
                        key={out.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#10584D]">{out.title}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(out.content);
                              info('متن کپی شد');
                            }}
                            className="text-slate-400 hover:text-slate-700 p-1 flex items-center gap-1"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>کپی</span>
                          </button>
                        </div>
                        <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                          {out.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Content Viewer */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500">متن اصلی جزوه یا منبع:</h4>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {activeNotebook.rawText}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
              <BookOpen className="w-12 h-12 mx-auto text-slate-300" />
              <h4 className="text-base font-bold text-slate-700">یک جزوه را برای مشاهده یا تحلیل انتخاب کنید</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                از ستون سمت راست روی هر کدام کلیک کنید تا متن اصلی، خلاصه‌ها و فلش‌کارت‌های استخراج‌شده را بررسی نمایید.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload & Note Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-800">افزودن منبع یا جزوه جدید</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateNotebook} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">عنوان منبع:</label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="مثلاً: فصل دوم فیزیک - نمودارهای سرعت"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#10584D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">درس:</label>
                  <select
                    value={noteSubjectId}
                    onChange={(e) => setNoteSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">فصل یا مبحث:</label>
                  <input
                    type="text"
                    value={noteTopic}
                    onChange={(e) => setNoteTopic(e.target.value)}
                    placeholder="مثال: حرکت‌شناسی"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Upload file box */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center space-y-2">
                <Upload className="w-6 h-6 mx-auto text-slate-400" />
                <div className="text-xs font-bold text-slate-700">
                  {fileName ? `فایل انتخاب‌شده: ${fileName} (${fileSizeMb}MB)` : 'بارگذاری فایل متنی / جزوه'}
                </div>
                <p className="text-[11px] text-slate-400">فایل‌های .txt یا .md (حداکثر ۱۰ مگابایت)</p>
                <input
                  type="file"
                  accept=".txt,.md,.text"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="notebook-upload"
                />
                <label
                  htmlFor="notebook-upload"
                  className="inline-block px-4 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100"
                >
                  انتخاب فایل از دستگاه
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  یا متن جزوه را مستقیم اینجا تایپ/پیست کنید:
                </label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="نکات مهم درس، فرمول‌ها یا توضیحات استاد..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#10584D]"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#10584D] hover:bg-[#0c433b] text-white text-xs font-bold shadow"
                >
                  ذخیره در دفترچه
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold"
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
