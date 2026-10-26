import {
  UserProfile,
  Subject,
  StudyTask,
  StudySession,
  Exam,
  ExamAttempt,
  Notebook,
  ChatConversation,
  AppSettings,
  ActiveTimerState,
} from '../types';
import { getTodayISODate } from '../utils/jalali';

const KEYS = {
  PROFILE: 'konkour_profile_v1',
  SUBJECTS: 'konkour_subjects_v1',
  TASKS: 'konkour_tasks_v1',
  SESSIONS: 'konkour_sessions_v1',
  EXAMS: 'konkour_exams_v1',
  ATTEMPTS: 'konkour_attempts_v1',
  NOTEBOOKS: 'konkour_notebooks_v1',
  CONVERSATIONS: 'konkour_conversations_v1',
  SETTINGS: 'konkour_settings_v1',
  ACTIVE_TIMER: 'konkour_active_timer_v1',
};

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub_math',
    name: 'ریاضیات',
    color: '#D97706',
    accentBg: '#FEF3C7',
    iconName: 'Calculator',
    category: 'تخصصی',
    topics: [
      { id: 't_m1', subjectId: 'sub_math', title: 'تابع و اعمال جبری', importance: 'بالا' },
      { id: 't_m2', subjectId: 'sub_math', title: 'مثلثات و اتحادها', importance: 'بالا' },
      { id: 't_m3', subjectId: 'sub_math', title: 'حد و پیوستگی', importance: 'متوسط' },
      { id: 't_m4', subjectId: 'sub_math', title: 'مشتق و کاربرد مشتق', importance: 'بالا' },
      { id: 't_m5', subjectId: 'sub_math', title: 'معادله درجه دوم و سهمی', importance: 'متوسط' },
    ],
  },
  {
    id: 'sub_physics',
    name: 'فیزیک',
    color: '#7C3AED',
    accentBg: '#EDE9FE',
    iconName: 'Zap',
    category: 'تخصصی',
    topics: [
      { id: 't_p1', subjectId: 'sub_physics', title: 'حرکت‌شناسی در خط راست', importance: 'بالا' },
      { id: 't_p2', subjectId: 'sub_physics', title: 'دینامیک و قوانین نیوتون', importance: 'بالا' },
      { id: 't_p3', subjectId: 'sub_physics', title: 'نوسان، موج و صوت', importance: 'متوسط' },
      { id: 't_p4', subjectId: 'sub_physics', title: 'جریان الکتریکی و مدارهای DC', importance: 'بالا' },
      { id: 't_p5', subjectId: 'sub_physics', title: 'کار، انرژی و توان', importance: 'متوسط' },
    ],
  },
  {
    id: 'sub_chemistry',
    name: 'شیمی',
    color: '#0284C7',
    accentBg: '#E0F2FE',
    iconName: 'FlaskConical',
    category: 'تخصصی',
    topics: [
      { id: 't_c1', subjectId: 'sub_chemistry', title: 'ساختار اتم و جدول دوره‌ای', importance: 'متوسط' },
      { id: 't_c2', subjectId: 'sub_chemistry', title: 'استوکیومتری و واکنش‌های شیمیایی', importance: 'بالا' },
      { id: 't_c3', subjectId: 'sub_chemistry', title: 'شیمی آلی و گروه‌های عاملی', importance: 'بالا' },
      { id: 't_c4', subjectId: 'sub_chemistry', title: 'ترمودینامیک و آنتالپی', importance: 'متوسط' },
      { id: 't_c5', subjectId: 'sub_chemistry', title: 'سینتیک و تعادل‌های اسید و باز', importance: 'بالا' },
    ],
  },
  {
    id: 'sub_biology',
    name: 'زیست‌شناسی',
    color: '#10584D',
    accentBg: '#E6F4F1',
    iconName: 'Dna',
    category: 'تخصصی',
    topics: [
      { id: 't_b1', subjectId: 'sub_biology', title: 'گوارش و جذب مواد', importance: 'بالا' },
      { id: 't_b2', subjectId: 'sub_biology', title: 'تبادل گازها و تنفس', importance: 'متوسط' },
      { id: 't_b3', subjectId: 'sub_biology', title: 'گردش مواد و ساختار قلب', importance: 'بالا' },
      { id: 't_b4', subjectId: 'sub_biology', title: 'ژنتیک و بیان ژن', importance: 'بالا' },
      { id: 't_b5', subjectId: 'sub_biology', title: 'حواس و دستگاه عصبی', importance: 'متوسط' },
    ],
  },
  {
    id: 'sub_literature',
    name: 'ادبیات فارسی',
    color: '#DC2626',
    accentBg: '#FEE2E2',
    iconName: 'BookOpen',
    category: 'عمومی',
    topics: [
      { id: 't_l1', subjectId: 'sub_literature', title: 'قرابت معنایی', importance: 'بالا' },
      { id: 't_l2', subjectId: 'sub_literature', title: 'آرایه‌های ادبی', importance: 'بالا' },
      { id: 't_l3', subjectId: 'sub_literature', title: 'دستور زبان فارسی', importance: 'متوسط' },
      { id: 't_l4', subjectId: 'sub_literature', title: 'لغت و املا', importance: 'متوسط' },
    ],
  },
  {
    id: 'sub_english',
    name: 'زبان انگلیسی',
    color: '#4F46E5',
    accentBg: '#EEF2FF',
    iconName: 'Globe',
    category: 'عمومی',
    topics: [
      { id: 't_e1', subjectId: 'sub_english', title: 'گرامر و ساختار جملات', importance: 'متوسط' },
      { id: 't_e2', subjectId: 'sub_english', title: 'واژگان تخصصی و کلوز تست', importance: 'بالا' },
      { id: 't_e3', subjectId: 'sub_english', title: 'درک مطلب (Reading Comprehension)', importance: 'بالا' },
    ],
  },
];

export const INITIAL_PROFILE: UserProfile = {
  id: 'usr_main',
  name: 'امیرمحمد',
  major: 'تجربی',
  grade: 'دوازدهم',
  dailyTargetMinutes: 360, // 6 hours
  avatar: '🎓',
  isPremium: true,
};

export const INITIAL_SETTINGS: AppSettings = {
  dailyTargetMinutes: 360,
  pomodoroWorkMinutes: 45,
  pomodoroBreakMinutes: 15,
  negativeMarkingEnabled: true,
  showPersianDigits: true,
  darkTheme: false,
  soundAlerts: true,
};

// Initial starter exam
export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam_sample_1',
    title: 'آزمون جامع ریاضی - تابع و معادلات',
    subjectId: 'sub_math',
    subjectName: 'ریاضیات',
    topicName: 'تابع و اعمال جبری',
    difficulty: 'متوسط',
    durationMinutes: 20,
    hasNegativeMarking: true,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q_1',
        text: 'دامنه تابع با ضابطه f(x) = √( (x-2) / (x² - 9) ) شامل چند عدد صحیح نامنفی است؟',
        options: ['۲ عدد', '۳ عدد', 'بی‌شمار', 'هیچ عدد صحیح'],
        correctOption: 2,
        explanation: 'عبارت زیر رادیکال با فرجه زوج باید بزرگتر یا مساوی صفر باشد و مخرج کسر نامساوی صفر باشد: x ∈ (-3, 2] ∪ (3, +∞). در بازه (3, +∞) بی‌شمار عدد صحیح نامنفی (۴، ۵، ۶، ...) وجود دارد.',
        topicName: 'تابع و دامنه',
      },
      {
        id: 'q_2',
        text: 'اگر f(x) = 2x - 3 و g(x) = x² + 1 باشند، مقدار (g ∘ f)(2) کدام است؟',
        options: ['۱', '۲', '۵', '۰'],
        correctOption: 1,
        explanation: 'ابتدا f(2) = 2(2) - 3 = 1 را محاسبه می‌کنیم. سپس g(1) = 1² + 1 = 2 به‌دست می‌آید.',
        topicName: 'ترکیب توابع',
      },
      {
        id: 'q_3',
        text: 'معادله x² - (m+1)x + 4 = 0 دارای دو ریشه حقیقی متمایز است اگر و تنها اگر:',
        options: ['m > 3 یا m < -5', '-5 < m < 3', 'm = 3', 'm ≥ 3'],
        correctOption: 0,
        explanation: 'شرط دو ریشه متمایز Δ > 0 است: Δ = (m+1)² - 16 > 0 => (m+1)² > 16 => |m+1| > 4 => m+1 > 4 یا m+1 < -4 => m > 3 یا m < -5.',
        topicName: 'معادله درجه دوم',
      },
      {
        id: 'q_4',
        text: 'تابع f(x) = x³ + ax در کدام حالت وارون‌پذیر است؟',
        options: ['تنها اگر a > 0', 'به ازای هر a ≥ 0', 'به ازای هر a ≤ 0', 'هیچ مقداری از a'],
        correctOption: 1,
        explanation: 'مشتق تابع f\'(x) = 3x² + a است. اگر a ≥ 0 باشد، f\'(x) همواره بزرگتر یا مساوی صفر بوده و تابع اکیداً صعودی و یک‌به‌یک است، بنابراین وارون‌پذیر خواهد بود.',
        topicName: 'وارون تابع و یک‌به‌یکی',
      },
      {
        id: 'q_5',
        text: 'راس سهمی y = -2x² + 8x - 5 در کدام نقطه قرار دارد؟',
        options: ['(2, 3)', '(2, -3)', '(-2, 3)', '(4, -5)'],
        correctOption: 0,
        explanation: 'طول راس x = -b / (2a) = -8 / (2*(-2)) = 2 است. با جایگذاری در ضابطه: y = -2(4) + 8(2) - 5 = -8 + 16 - 5 = 3.',
        topicName: 'سهمی و نمودارها',
      },
    ],
  },
];

// Initial Tasks
export function getInitialTasks(): StudyTask[] {
  const today = getTodayISODate();
  return [
    {
      id: 'task_1',
      title: 'ریاضی - فصل ۳: تابع و مشتق',
      subjectId: 'sub_math',
      topicId: 't_m4',
      topicName: 'مشتق و کاربرد مشتق',
      date: today,
      startTime: '08:00',
      targetMinutes: 90,
      priority: 'بالا',
      status: 'in_progress',
      completedMinutes: 60,
      notes: 'تست‌های سراسری سال‌های ۱۴۰۰ تا ۱۴۰۲ بررسی شود.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task_2',
      title: 'فیزیک - مبحث حرکت‌شناسی',
      subjectId: 'sub_physics',
      topicId: 't_p1',
      topicName: 'حرکت‌شناسی در خط راست',
      date: today,
      startTime: '10:30',
      targetMinutes: 75,
      priority: 'بالا',
      status: 'todo',
      completedMinutes: 0,
      notes: 'خلاصه‌نویسی نمودارهای مکان-زمان و سرعت-زمان.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task_3',
      title: 'شیمی - استوکیومتری و مسائل بازده',
      subjectId: 'sub_chemistry',
      topicId: 't_c2',
      topicName: 'استوکیومتری و واکنش‌های شیمیایی',
      date: today,
      startTime: '14:00',
      targetMinutes: 60,
      priority: 'متوسط',
      status: 'todo',
      completedMinutes: 0,
      notes: 'حل ۳۰ تست از آزمون‌های آزمایشی.',
      createdAt: new Date().toISOString(),
    },
  ];
}

class StorageRepository {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
    }
  }

  // Profile
  getProfile(): UserProfile {
    return this.get<UserProfile>(KEYS.PROFILE, INITIAL_PROFILE);
  }

  saveProfile(profile: UserProfile): void {
    this.set(KEYS.PROFILE, profile);
  }

  // Settings
  getSettings(): AppSettings {
    return this.get<AppSettings>(KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  saveSettings(settings: AppSettings): void {
    this.set(KEYS.SETTINGS, settings);
  }

  // Subjects
  getSubjects(): Subject[] {
    const list = this.get<Subject[]>(KEYS.SUBJECTS, []);
    if (!list || list.length === 0) {
      this.set(KEYS.SUBJECTS, INITIAL_SUBJECTS);
      return INITIAL_SUBJECTS;
    }
    return list;
  }

  saveSubjects(subjects: Subject[]): void {
    this.set(KEYS.SUBJECTS, subjects);
  }

  // Tasks
  getTasks(): StudyTask[] {
    const list = this.get<StudyTask[]>(KEYS.TASKS, []);
    if (!list || list.length === 0) {
      const initial = getInitialTasks();
      this.set(KEYS.TASKS, initial);
      return initial;
    }
    return list;
  }

  saveTasks(tasks: StudyTask[]): void {
    this.set(KEYS.TASKS, tasks);
  }

  addTask(task: StudyTask): void {
    const tasks = this.getTasks();
    tasks.unshift(task);
    this.saveTasks(tasks);
  }

  updateTask(task: StudyTask): void {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === task.id);
    if (index !== -1) {
      tasks[index] = task;
      this.saveTasks(tasks);
    }
  }

  deleteTask(taskId: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== taskId);
    this.saveTasks(tasks);
  }

  // Sessions
  getSessions(): StudySession[] {
    return this.get<StudySession[]>(KEYS.SESSIONS, []);
  }

  saveSessions(sessions: StudySession[]): void {
    this.set(KEYS.SESSIONS, sessions);
  }

  addSession(session: StudySession): void {
    const sessions = this.getSessions();
    sessions.unshift(session);
    this.saveSessions(sessions);

    // Also update task if linked
    if (session.taskId) {
      const tasks = this.getTasks();
      const task = tasks.find((t) => t.id === session.taskId);
      if (task) {
        task.completedMinutes = (task.completedMinutes || 0) + session.durationMinutes;
        if (task.completedMinutes >= task.targetMinutes) {
          task.status = 'completed';
        } else {
          task.status = 'in_progress';
        }
        if (session.testsCount) {
          task.testsCount = (task.testsCount || 0) + session.testsCount;
        }
        this.saveTasks(tasks);
      }
    }
  }

  deleteSession(sessionId: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== sessionId);
    this.saveSessions(sessions);
  }

  // Active Timer state preservation
  getActiveTimer(): ActiveTimerState | null {
    return this.get<ActiveTimerState | null>(KEYS.ACTIVE_TIMER, null);
  }

  saveActiveTimer(timer: ActiveTimerState | null): void {
    if (!timer) {
      localStorage.removeItem(KEYS.ACTIVE_TIMER);
    } else {
      this.set(KEYS.ACTIVE_TIMER, timer);
    }
  }

  // Exams
  getExams(): Exam[] {
    const list = this.get<Exam[]>(KEYS.EXAMS, []);
    if (!list || list.length === 0) {
      this.set(KEYS.EXAMS, INITIAL_EXAMS);
      return INITIAL_EXAMS;
    }
    return list;
  }

  saveExams(exams: Exam[]): void {
    this.set(KEYS.EXAMS, exams);
  }

  addExam(exam: Exam): void {
    const exams = this.getExams();
    exams.unshift(exam);
    this.saveExams(exams);
  }

  deleteExam(examId: string): void {
    const exams = this.getExams().filter((e) => e.id !== examId);
    this.saveExams(exams);
  }

  // Exam Attempts
  getAttempts(): ExamAttempt[] {
    return this.get<ExamAttempt[]>(KEYS.ATTEMPTS, []);
  }

  saveAttempts(attempts: ExamAttempt[]): void {
    this.set(KEYS.ATTEMPTS, attempts);
  }

  addAttempt(attempt: ExamAttempt): void {
    const attempts = this.getAttempts();
    attempts.unshift(attempt);
    this.saveAttempts(attempts);
  }

  deleteAttempt(attemptId: string): void {
    const attempts = this.getAttempts().filter((a) => a.id !== attemptId);
    this.saveAttempts(attempts);
  }

  // Notebooks
  getNotebooks(): Notebook[] {
    return this.get<Notebook[]>(KEYS.NOTEBOOKS, []);
  }

  saveNotebooks(notebooks: Notebook[]): void {
    this.set(KEYS.NOTEBOOKS, notebooks);
  }

  addNotebook(notebook: Notebook): void {
    const list = this.getNotebooks();
    list.unshift(notebook);
    this.saveNotebooks(list);
  }

  updateNotebook(notebook: Notebook): void {
    const list = this.getNotebooks();
    const idx = list.findIndex((n) => n.id === notebook.id);
    if (idx !== -1) {
      list[idx] = notebook;
      this.saveNotebooks(list);
    }
  }

  deleteNotebook(id: string): void {
    const list = this.getNotebooks().filter((n) => n.id !== id);
    this.saveNotebooks(list);
  }

  // Chat Conversations
  getConversations(): ChatConversation[] {
    return this.get<ChatConversation[]>(KEYS.CONVERSATIONS, []);
  }

  saveConversations(conversations: ChatConversation[]): void {
    this.set(KEYS.CONVERSATIONS, conversations);
  }

  // Backup & Restore
  exportAllData(): string {
    const data = {
      profile: this.getProfile(),
      settings: this.getSettings(),
      subjects: this.getSubjects(),
      tasks: this.getTasks(),
      sessions: this.getSessions(),
      exams: this.getExams(),
      attempts: this.getAttempts(),
      notebooks: this.getNotebooks(),
      conversations: this.getConversations(),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    return JSON.stringify(data, null, 2);
  }

  importAllData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) this.saveProfile(data.profile);
      if (data.settings) this.saveSettings(data.settings);
      if (data.subjects) this.saveSubjects(data.subjects);
      if (data.tasks) this.saveTasks(data.tasks);
      if (data.sessions) this.saveSessions(data.sessions);
      if (data.exams) this.saveExams(data.exams);
      if (data.attempts) this.saveAttempts(data.attempts);
      if (data.notebooks) this.saveNotebooks(data.notebooks);
      if (data.conversations) this.saveConversations(data.conversations);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  resetAll(): void {
    localStorage.clear();
    this.set(KEYS.PROFILE, INITIAL_PROFILE);
    this.set(KEYS.SETTINGS, INITIAL_SETTINGS);
    this.set(KEYS.SUBJECTS, INITIAL_SUBJECTS);
    this.set(KEYS.TASKS, getInitialTasks());
    this.set(KEYS.EXAMS, INITIAL_EXAMS);
  }
}

export const storage = new StorageRepository();
