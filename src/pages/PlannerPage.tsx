import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Trash2,
  Edit2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StudyTask, TaskPriority } from '../types';
import {
  getTodayISODate,
  getJalaliInfo,
  formatPersianNumber,
  formatDurationHoursMinutes,
  getWeekDays,
} from '../utils/jalali';
import { useToast } from '../context/ToastContext';

type ViewMode = 'daily' | 'weekly' | 'calendar';

export const PlannerPage: React.FC = () => {
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    subjects,
    startTimer,
    profile,
  } = useApp();
  const { success, info } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedDateISO, setSelectedDateISO] = useState<string>(getTodayISODate());

  // Task creation/edit modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState<string>('');
  const [formSubjectId, setFormSubjectId] = useState<string>(subjects[0]?.id || 'sub_math');
  const [formTopicName, setFormTopicName] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(getTodayISODate());
  const [formStartTime, setFormStartTime] = useState<string>('08:00');
  const [formDurationMinutes, setFormDurationMinutes] = useState<number>(60);
  const [formPriority, setFormPriority] = useState<TaskPriority>('متوسط');
  const [formNotes, setFormNotes] = useState<string>('');

  // AI smart schedule proposal modal
  const [aiProposalOpen, setAiProposalOpen] = useState<boolean>(false);
  const [proposedTasks, setProposedTasks] = useState<
    Omit<StudyTask, 'id' | 'createdAt' | 'completedMinutes'>[]
  >([]);

  const todayISO = getTodayISODate();
  const weekDays = getWeekDays(new Date(selectedDateISO));

  // Filter tasks
  const tasksForSelectedDate = tasks.filter((t) => t.date === selectedDateISO);
  const overdueTasks = tasks.filter(
    (t) => t.date < todayISO && t.status !== 'completed' && t.status !== 'cancelled'
  );

  const openNewTaskModal = (dateStr?: string) => {
    setEditingTask(null);
    setFormTitle('');
    setFormSubjectId(subjects[0]?.id || 'sub_math');
    const firstSub = subjects[0];
    setFormTopicName(firstSub?.topics[0]?.title || '');
    setFormDate(dateStr || selectedDateISO);
    setFormStartTime('08:30');
    setFormDurationMinutes(75);
    setFormPriority('متوسط');
    setFormNotes('');
    setModalOpen(true);
  };

  const openEditTaskModal = (task: StudyTask) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormSubjectId(task.subjectId);
    setFormTopicName(task.topicName || '');
    setFormDate(task.date);
    setFormStartTime(task.startTime || '08:00');
    setFormDurationMinutes(task.targetMinutes);
    setFormPriority(task.priority);
    setFormNotes(task.notes || '');
    setModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sub = subjects.find((s) => s.id === formSubjectId);
    const title = formTitle.trim() || `${sub?.name || 'درس'} - ${formTopicName || 'مطالعه'}`;

    if (editingTask) {
      updateTask({
        ...editingTask,
        title,
        subjectId: formSubjectId,
        topicName: formTopicName,
        date: formDate,
        startTime: formStartTime,
        targetMinutes: formDurationMinutes,
        priority: formPriority,
        notes: formNotes,
      });
      success('وظیفه ویرایش شد');
    } else {
      addTask({
        title,
        subjectId: formSubjectId,
        topicName: formTopicName,
        date: formDate,
        startTime: formStartTime,
        targetMinutes: formDurationMinutes,
        priority: formPriority,
        status: 'todo',
        notes: formNotes,
      });
    }
    setModalOpen(false);
  };

  // Move overdue task to today
  const rescheduleToToday = (task: StudyTask) => {
    updateTask({
      ...task,
      date: todayISO,
    });
    info('وظیفه به برنامه امروز منتقل شد');
  };

  // Smart Schedule Generator
  const generateSmartPlan = () => {
    const dailyCap = profile.dailyTargetMinutes || 360; // e.g. 6 hours
    const blockDuration = 75; // 75 mins study block
    const numBlocks = Math.floor(dailyCap / (blockDuration + 15)); // with breaks

    const proposal: Omit<StudyTask, 'id' | 'createdAt' | 'completedMinutes'>[] = [];
    const availableSubjects = [...subjects].sort(() => 0.5 - Math.random());

    let startHour = 8;
    let startMin = 0;

    for (let i = 0; i < Math.min(numBlocks, availableSubjects.length); i++) {
      const sub = availableSubjects[i];
      const topic = sub.topics[Math.floor(Math.random() * sub.topics.length)]?.title || 'مرور جامع';
      const timeStr = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;

      proposal.push({
        title: `${sub.name} - ${topic}`,
        subjectId: sub.id,
        topicName: topic,
        date: selectedDateISO,
        startTime: timeStr,
        targetMinutes: blockDuration,
        priority: i === 0 ? 'بالا' : 'متوسط',
        status: 'todo',
        notes: 'پیشنهاد هوشمند متناسب با توازن دروس اختصاصی و ظرفیت روزانه.',
      });

      // advance time by study block + 15 min rest
      const totalMins = startHour * 60 + startMin + blockDuration + 15;
      startHour = Math.floor(totalMins / 60);
      startMin = totalMins % 60;
    }

    setProposedTasks(proposal);
    setAiProposalOpen(true);
  };

  const applyProposedPlan = () => {
    proposedTasks.forEach((t) => addTask(t));
    setAiProposalOpen(false);
    success('برنامه پیشنهادی با موفقیت در تقویم ثبت شد');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & View Modes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800">برنامه‌ریزی و وظایف</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            تقسیم‌بندی هدفمند زمان، برنامه روزانه و هفتگی، و مدیریت عقب‌افتادگی‌ها
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={generateSmartPlan}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F5B52E] hover:bg-[#e0a424] text-slate-900 text-xs font-bold shadow-sm transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>برنامه پیشنهادی هوشمند</span>
          </button>

          <button
            onClick={() => openNewTaskModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10584D] hover:bg-[#0c433b] text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>وظیفه جدید</span>
          </button>
        </div>
      </div>

      {/* Overdue alert banner if any */}
      {overdueTasks.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-xs md:text-sm font-bold text-amber-900">
                شما {formatPersianNumber(overdueTasks.length)} وظیفه عقب‌افتاده دارید
              </h4>
              <p className="text-[11px] text-amber-700 mt-0.5">
                نگران نباشید؛ می‌توانید آن‌ها را به برنامه امروز منتقل کنید یا زمان‌بندی جدیدی تعیین نمایید.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => rescheduleToToday(overdueTasks[0])}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm"
            >
              انتقال اولی به امروز
            </button>
          </div>
        </div>
      )}

      {/* View Mode Tabs: روزانه | هفتگی | تقویم */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              viewMode === 'daily'
                ? 'bg-[#10584D] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            برنامه روزانه
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              viewMode === 'weekly'
                ? 'bg-[#10584D] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            برنامه هفتگی
          </button>
        </div>

        {/* Date navigator */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <button
            onClick={() => {
              const d = new Date(selectedDateISO);
              d.setDate(d.getDate() - 1);
              setSelectedDateISO(
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
              );
            }}
            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="font-mono px-2">
            {formatPersianNumber(getJalaliInfo(new Date(selectedDateISO)).formatted)}
          </span>
          <button
            onClick={() => {
              const d = new Date(selectedDateISO);
              d.setDate(d.getDate() + 1);
              setSelectedDateISO(
                `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
              );
            }}
            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {selectedDateISO !== todayISO && (
            <button
              onClick={() => setSelectedDateISO(todayISO)}
              className="text-[#10584D] text-xs underline mr-2"
            >
              برو به امروز
            </button>
          )}
        </div>
      </div>

      {/* Daily View */}
      {viewMode === 'daily' && (
        <div className="space-y-4">
          {tasksForSelectedDate.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
              <CalendarIcon className="w-12 h-12 mx-auto text-slate-300" />
              <h4 className="text-base font-bold text-slate-700">هیچ وظیفه‌ای برای این روز ثبت نشده است</h4>
              <p className="text-xs text-slate-400">
                می‌توانید وظیفه دستی اضافه کنید یا از پیشنهاد هوشمند برنامه استفاده نمایید.
              </p>
              <button
                onClick={() => openNewTaskModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10584D] text-white text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن وظیفه به این روز</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasksForSelectedDate.map((task) => {
                const sub = subjects.find((s) => s.id === task.subjectId);
                const isCompleted = task.status === 'completed';

                return (
                  <div
                    key={task.id}
                    className={`bg-white rounded-2xl p-4 border transition shadow-sm flex items-center justify-between gap-3 ${
                      isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 hover:border-[#10584D]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition ${
                          isCompleted
                            ? 'bg-[#10584D] border-[#10584D] text-white'
                            : 'border-slate-300 text-transparent hover:border-[#10584D]'
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
                              اولویت بالا
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="font-mono flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {task.startTime ? formatPersianNumber(task.startTime) : 'ساعت آزاد'}
                          </span>
                          <span>•</span>
                          <span>{formatPersianNumber(task.targetMinutes)} دقیقه</span>
                          {task.notes && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-xs">{task.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isCompleted && (
                        <button
                          onClick={() =>
                            startTimer(
                              task.subjectId,
                              task.topicName || task.title,
                              'timer',
                              task.id,
                              task.targetMinutes * 60
                            )
                          }
                          className="p-2 rounded-xl bg-[#10584D]/10 hover:bg-[#10584D] text-[#10584D] hover:text-white transition"
                          title="شروع مطالعه با تایمر"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                      )}
                      <button
                        onClick={() => openEditTaskModal(task)}
                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Weekly View */}
      {viewMode === 'weekly' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayTasks = tasks.filter((t) => t.date === day.isoDate);
            const isSelected = day.isoDate === selectedDateISO;

            return (
              <div
                key={day.isoDate}
                onClick={() => setSelectedDateISO(day.isoDate)}
                className={`bg-white rounded-2xl p-3 border transition cursor-pointer flex flex-col justify-between min-h-[160px] ${
                  isSelected
                    ? 'border-[#10584D] ring-2 ring-[#10584D]/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700">{day.jalali.dayName}</span>
                    <span
                      className={`text-xs font-black font-mono px-2 py-0.5 rounded-full ${
                        day.isToday ? 'bg-[#10584D] text-white' : 'text-slate-500'
                      }`}
                    >
                      {formatPersianNumber(day.jalali.jd)}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    {dayTasks.slice(0, 3).map((t) => {
                      const sub = subjects.find((s) => s.id === t.subjectId);
                      return (
                        <div
                          key={t.id}
                          className="text-[11px] p-1.5 rounded-lg border border-slate-100 bg-slate-50/70 truncate flex items-center gap-1.5"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: sub?.color || '#10584D' }}
                          />
                          <span
                            className={`truncate ${
                              t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700 font-medium'
                            }`}
                          >
                            {t.title}
                          </span>
                        </div>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-slate-400 text-center font-bold">
                        +{formatPersianNumber(dayTasks.length - 3)} وظیفه دیگر
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openNewTaskModal(day.isoDate);
                  }}
                  className="mt-3 w-full py-1 text-[11px] font-bold text-slate-500 hover:text-[#10584D] hover:bg-[#10584D]/5 rounded-lg flex items-center justify-center gap-1 border border-dashed border-slate-200"
                >
                  <Plus className="w-3 h-3" />
                  <span>ثبت</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-extrabold text-slate-800">
                {editingTask ? 'ویرایش وظیفه مطالعه' : 'تعریف وظیفه مطالعه جدید'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  عنوان وظیفه (اختیاری - خودکار ساخته می‌شود):
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: فیزیک - تست‌های حرکت‌شناسی..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#10584D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">درس:</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => {
                      const sid = e.target.value;
                      setFormSubjectId(sid);
                      const s = subjects.find((sub) => sub.id === sid);
                      if (s?.topics.length) setFormTopicName(s.topics[0].title);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">مبحث:</label>
                  <input
                    type="text"
                    value={formTopicName}
                    onChange={(e) => setFormTopicName(e.target.value)}
                    placeholder="مثال: تابع و حد"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">تاریخ (میلادی/ISO):</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ساعت شروع:</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">مدت (دقیقه):</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={formDurationMinutes}
                    onChange={(e) => setFormDurationMinutes(parseInt(e.target.value, 10) || 60)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">اولویت:</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    <option value="بالا">بالا (ضروری)</option>
                    <option value="متوسط">متوسط (عادی)</option>
                    <option value="پایین">پایین (مرور اختیاری)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">یادداشت:</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="مثلاً: حل تست‌های زوج..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#10584D] hover:bg-[#0c433b] text-white text-xs font-bold shadow transition"
                >
                  {editingTask ? 'ذخیره تغییرات' : 'افزودن به برنامه'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Smart Proposal Review Modal (Section 7: امکان اصلاح برنامه پیشنهادی قبل از ذخیره، هیچ برنامه تولیدشده‌ای بدون تایید قطعی ذخیره نشود) */}
      {aiProposalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F5B52E]" />
                <h3 className="text-base font-extrabold text-slate-800">
                  برنامه پیشنهادی هوشمند برای {formatPersianNumber(getJalaliInfo(new Date(selectedDateISO)).formatted)}
                </h3>
              </div>
              <button
                onClick={() => setAiProposalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              این برنامه بر اساس ظرفیت روزانه ({formatPersianNumber((profile.dailyTargetMinutes / 60).toFixed(0))} ساعت)
              و با در نظر گرفتن پارت‌های استاندارد ۷۵ دقیقه‌ای و زمان استراحت طراحی شده است. می‌توانید هر آیتم را قبل از ذخیره بازبینی کنید:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {proposedTasks.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{item.title}</div>
                    <div className="text-slate-500 font-mono mt-0.5">
                      ساعت {formatPersianNumber(item.startTime || '08:00')} • {formatPersianNumber(item.targetMinutes)} دقیقه
                    </div>
                  </div>
                  <button
                    onClick={() => setProposedTasks((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-1 rounded text-rose-500 hover:bg-rose-50"
                    title="حذف این پارت"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={applyProposedPlan}
                className="flex-1 py-2.5 rounded-xl bg-[#10584D] hover:bg-[#0c433b] text-white text-xs font-bold shadow flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>تایید و ثبت قطعی در برنامه</span>
              </button>
              <button
                onClick={() => setAiProposalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
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
