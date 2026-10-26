export type MajorType = 'تجربی' | 'ریاضی' | 'انسانی' | 'هنر' | 'زبان';

export interface UserProfile {
  id: string;
  name: string;
  major: MajorType;
  grade: string;
  dailyTargetMinutes: number; // e.g. 360 (6 hours)
  avatar?: string;
  isPremium?: boolean;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  accentBg: string;
  iconName: string;
  category: 'تخصصی' | 'عمومی';
  topics: Topic[];
}

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  importance: 'بالا' | 'متوسط' | 'پایین';
}

export type TaskPriority = 'بالا' | 'متوسط' | 'پایین';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export interface StudyTask {
  id: string;
  title: string;
  subjectId: string;
  topicId?: string;
  topicName?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  targetMinutes: number;
  priority: TaskPriority;
  status: TaskStatus;
  completedMinutes: number;
  testsCount?: number;
  notes?: string;
  createdAt: string;
}

export type TimerMode = 'timer' | 'pomodoro' | 'stopwatch';

export interface ActiveTimerState {
  isActive: boolean;
  isPaused: boolean;
  mode: TimerMode;
  subjectId: string;
  topicName: string;
  taskId?: string;
  startedAt: number; // timestamp ms
  accumulatedSeconds: number; // seconds spent before pause
  lastResumedAt: number; // timestamp ms of when running resumed
  targetSeconds: number; // for countdown / pomodoro
  isBreak?: boolean;
}

export interface StudySession {
  id: string;
  taskId?: string;
  subjectId: string;
  subjectName: string;
  topicName: string;
  date: string; // YYYY-MM-DD
  startTime: number; // timestamp
  endTime: number; // timestamp
  durationMinutes: number;
  testsCount: number;
  correctCount: number;
  incorrectCount: number;
  notes?: string;
  mode: TimerMode;
  createdAt: string;
}

export interface ExamQuestion {
  id: string;
  text: string;
  options: [string, string, string, string];
  correctOption: number; // 0, 1, 2, 3
  explanation?: string;
  topicName?: string;
}

export interface Exam {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  topicName: string;
  difficulty: 'ساده' | 'متوسط' | 'سخت' | 'کنکوری';
  durationMinutes: number;
  hasNegativeMarking: boolean; // 3 incorrect cancel 1 correct
  questions: ExamQuestion[];
  createdAt: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  subjectId: string;
  subjectName: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  scorePercentage: number; // calculated accurately with or without negative marking
  userAnswers: Record<string, number>; // questionId -> chosenOptionIndex
  flaggedQuestionIds: string[];
  createdAt: string;
}

export interface NotebookOutput {
  id: string;
  type: 'summary' | 'flashcards' | 'key_points' | 'slides';
  title: string;
  content: string;
  createdAt: string;
}

export interface Notebook {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  topicName: string;
  rawText: string;
  fileName?: string;
  fileSizeMb?: number;
  outputs: NotebookOutput[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isFallback?: boolean;
  suggestedAction?: {
    type: 'create_task' | 'start_timer';
    label: string;
    payload: any;
  };
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface AppSettings {
  dailyTargetMinutes: number;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  negativeMarkingEnabled: boolean;
  showPersianDigits: boolean;
  darkTheme: boolean;
  soundAlerts: boolean;
}
