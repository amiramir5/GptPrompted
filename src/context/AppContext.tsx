import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import {
  UserProfile,
  Subject,
  StudyTask,
  StudySession,
  Exam,
  ExamAttempt,
  Notebook,
  AppSettings,
  ActiveTimerState,
  TimerMode,
} from '../types';
import { storage } from '../services/storage';
import { getTodayISODate } from '../utils/jalali';
import { useToast } from './ToastContext';

export type TabType =
  | 'dashboard'
  | 'timer'
  | 'planner'
  | 'exams'
  | 'notebook'
  | 'analytics'
  | 'advisor'
  | 'history'
  | 'settings';

interface AppContextType {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  subjects: Subject[];
  setSubjects: (s: Subject[]) => void;
  tasks: StudyTask[];
  todayTasks: StudyTask[];
  sessions: StudySession[];
  exams: Exam[];
  attempts: ExamAttempt[];
  notebooks: Notebook[];
  settings: AppSettings;
  setSettings: (s: AppSettings) => void;

  // Task actions
  addTask: (task: Omit<StudyTask, 'id' | 'createdAt' | 'completedMinutes'>) => void;
  updateTask: (task: StudyTask) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskStatus: (taskId: string) => void;

  // Timer actions
  activeTimer: ActiveTimerState | null;
  timerSeconds: number; // dynamically computed from timestamps
  startTimer: (subjectId: string, topicName: string, mode?: TimerMode, taskId?: string, targetSeconds?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  finishSession: (details: { testsCount?: number; correctCount?: number; incorrectCount?: number; notes?: string }) => void;
  discardTimer: () => void;
  sessionToFinalize: { durationMinutes: number; subjectId: string; topicName: string; taskId?: string; mode: TimerMode } | null;
  setSessionToFinalize: (val: any) => void;

  // Exam actions
  addExam: (exam: Omit<Exam, 'id' | 'createdAt'>) => string;
  deleteExam: (examId: string) => void;
  addAttempt: (attempt: Omit<ExamAttempt, 'id' | 'createdAt'>) => void;

  // Notebook actions
  addNotebook: (notebook: Omit<Notebook, 'id' | 'createdAt' | 'updatedAt' | 'outputs'>) => void;
  updateNotebook: (notebook: Notebook) => void;
  deleteNotebook: (id: string) => void;

  // Session & Data actions
  deleteSession: (id: string) => void;
  refreshData: () => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { success, error } = useToast();
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [profile, setProfileState] = useState<UserProfile>(() => storage.getProfile());
  const [subjects, setSubjectsState] = useState<Subject[]>(() => storage.getSubjects());
  const [tasks, setTasksState] = useState<StudyTask[]>(() => storage.getTasks());
  const [sessions, setSessionsState] = useState<StudySession[]>(() => storage.getSessions());
  const [exams, setExamsState] = useState<Exam[]>(() => storage.getExams());
  const [attempts, setAttemptsState] = useState<ExamAttempt[]>(() => storage.getAttempts());
  const [notebooks, setNotebooksState] = useState<Notebook[]>(() => storage.getNotebooks());
  const [settings, setSettingsState] = useState<AppSettings>(() => storage.getSettings());

  // Active Timer state
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(() => storage.getActiveTimer());
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [sessionToFinalize, setSessionToFinalize] = useState<{
    durationMinutes: number;
    subjectId: string;
    topicName: string;
    taskId?: string;
    mode: TimerMode;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync timerSeconds from activeTimer timestamps
  useEffect(() => {
    const calculateSeconds = () => {
      if (!activeTimer) {
        setTimerSeconds(0);
        return;
      }
      if (activeTimer.isPaused) {
        setTimerSeconds(activeTimer.accumulatedSeconds);
      } else {
        const now = Date.now();
        const runDiff = Math.max(0, Math.floor((now - activeTimer.lastResumedAt) / 1000));
        setTimerSeconds(activeTimer.accumulatedSeconds + runDiff);
      }
    };

    calculateSeconds();

    if (activeTimer && !activeTimer.isPaused) {
      timerRef.current = setInterval(calculateSeconds, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTimer]);

  // Persist activeTimer changes
  const updateActiveTimer = (val: ActiveTimerState | null) => {
    setActiveTimer(val);
    storage.saveActiveTimer(val);
  };

  const startTimer = (
    subjectId: string,
    topicName: string,
    mode: TimerMode = 'timer',
    taskId?: string,
    targetSeconds: number = 45 * 60
  ) => {
    const now = Date.now();
    const newTimer: ActiveTimerState = {
      isActive: true,
      isPaused: false,
      mode,
      subjectId,
      topicName,
      taskId,
      startedAt: now,
      accumulatedSeconds: 0,
      lastResumedAt: now,
      targetSeconds,
    };
    updateActiveTimer(newTimer);
    setCurrentTab('timer');
    success('تایمر مطالعه آغاز شد', `${topicName}`);
  };

  const pauseTimer = () => {
    if (!activeTimer || activeTimer.isPaused) return;
    const now = Date.now();
    const currentDiff = Math.max(0, Math.floor((now - activeTimer.lastResumedAt) / 1000));
    const totalAccumulated = activeTimer.accumulatedSeconds + currentDiff;

    const paused: ActiveTimerState = {
      ...activeTimer,
      isPaused: true,
      accumulatedSeconds: totalAccumulated,
      lastResumedAt: now,
    };
    updateActiveTimer(paused);
  };

  const resumeTimer = () => {
    if (!activeTimer || !activeTimer.isPaused) return;
    const now = Date.now();
    const resumed: ActiveTimerState = {
      ...activeTimer,
      isPaused: false,
      lastResumedAt: now,
    };
    updateActiveTimer(resumed);
  };

  const stopTimer = () => {
    if (!activeTimer) return;
    const now = Date.now();
    const finalSeconds = activeTimer.isPaused
      ? activeTimer.accumulatedSeconds
      : activeTimer.accumulatedSeconds + Math.max(0, Math.floor((now - activeTimer.lastResumedAt) / 1000));

    const durationMinutes = Math.max(1, Math.round(finalSeconds / 60));

    setSessionToFinalize({
      durationMinutes,
      subjectId: activeTimer.subjectId,
      topicName: activeTimer.topicName,
      taskId: activeTimer.taskId,
      mode: activeTimer.mode,
    });

    updateActiveTimer(null);
  };

  const discardTimer = () => {
    updateActiveTimer(null);
    setSessionToFinalize(null);
  };

  const finishSession = (details: {
    testsCount?: number;
    correctCount?: number;
    incorrectCount?: number;
    notes?: string;
  }) => {
    if (!sessionToFinalize) return;

    const sub = subjects.find((s) => s.id === sessionToFinalize.subjectId);
    const subName = sub ? sub.name : 'درس عمومی';

    const newSession: StudySession = {
      id: 'sess_' + Date.now(),
      taskId: sessionToFinalize.taskId,
      subjectId: sessionToFinalize.subjectId,
      subjectName: subName,
      topicName: sessionToFinalize.topicName,
      date: getTodayISODate(),
      startTime: Date.now() - sessionToFinalize.durationMinutes * 60 * 1000,
      endTime: Date.now(),
      durationMinutes: sessionToFinalize.durationMinutes,
      testsCount: details.testsCount || 0,
      correctCount: details.correctCount || 0,
      incorrectCount: details.incorrectCount || 0,
      notes: details.notes || '',
      mode: sessionToFinalize.mode,
      createdAt: new Date().toISOString(),
    };

    storage.addSession(newSession);
    setSessionsState(storage.getSessions());
    setTasksState(storage.getTasks()); // In case task was updated
    setSessionToFinalize(null);
    success('جلسه مطالعه با موفقیت ثبت شد', `${sessionToFinalize.durationMinutes} دقیقه مطالعه در ${subName}`);
  };

  // Profile actions
  const setProfile = (p: UserProfile) => {
    setProfileState(p);
    storage.saveProfile(p);
  };

  // Subject actions
  const setSubjects = (s: Subject[]) => {
    setSubjectsState(s);
    storage.saveSubjects(s);
  };

  // Settings actions
  const setSettings = (s: AppSettings) => {
    setSettingsState(s);
    storage.saveSettings(s);
  };

  // Task actions
  const addTask = (taskData: Omit<StudyTask, 'id' | 'createdAt' | 'completedMinutes'>) => {
    const newTask: StudyTask = {
      ...taskData,
      id: 'task_' + Date.now(),
      completedMinutes: 0,
      createdAt: new Date().toISOString(),
    };
    storage.addTask(newTask);
    setTasksState(storage.getTasks());
    success('وظیفه جدید ثبت شد', newTask.title);
  };

  const updateTask = (task: StudyTask) => {
    storage.updateTask(task);
    setTasksState(storage.getTasks());
  };

  const deleteTask = (taskId: string) => {
    storage.deleteTask(taskId);
    setTasksState(storage.getTasks());
    success('وظیفه حذف شد');
  };

  const toggleTaskStatus = (taskId: string) => {
    const t = tasks.find((item) => item.id === taskId);
    if (!t) return;
    const nextStatus = t.status === 'completed' ? 'todo' : 'completed';
    const updated: StudyTask = {
      ...t,
      status: nextStatus,
      completedMinutes: nextStatus === 'completed' ? t.targetMinutes : 0,
    };
    storage.updateTask(updated);
    setTasksState(storage.getTasks());
    if (nextStatus === 'completed') {
      success('آفرین! وظیفه با موفقیت تیک خورد ✨');
    }
  };

  // Exam actions
  const addExam = (examData: Omit<Exam, 'id' | 'createdAt'>): string => {
    const newExam: Exam = {
      ...examData,
      id: 'exam_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    storage.addExam(newExam);
    setExamsState(storage.getExams());
    success('آزمون جدید با موفقیت ایجاد شد', newExam.title);
    return newExam.id;
  };

  const deleteExam = (examId: string) => {
    storage.deleteExam(examId);
    setExamsState(storage.getExams());
    success('آزمون حذف شد');
  };

  const addAttempt = (attemptData: Omit<ExamAttempt, 'id' | 'createdAt'>) => {
    const newAttempt: ExamAttempt = {
      ...attemptData,
      id: 'att_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    storage.addAttempt(newAttempt);
    setAttemptsState(storage.getAttempts());
    success('کارنامه آزمون ثبت گردید', `درصد کسب شده: ${newAttempt.scorePercentage.toFixed(1)}%`);
  };

  // Notebook actions
  const addNotebook = (notebookData: Omit<Notebook, 'id' | 'createdAt' | 'updatedAt' | 'outputs'>) => {
    const newNote: Notebook = {
      ...notebookData,
      id: 'note_' + Date.now(),
      outputs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.addNotebook(newNote);
    setNotebooksState(storage.getNotebooks());
    success('منبع جدید به دفترچه اضافه شد', newNote.title);
  };

  const updateNotebook = (note: Notebook) => {
    storage.updateNotebook(note);
    setNotebooksState(storage.getNotebooks());
  };

  const deleteNotebook = (id: string) => {
    storage.deleteNotebook(id);
    setNotebooksState(storage.getNotebooks());
    success('منبع از دفترچه حذف شد');
  };

  const deleteSession = (id: string) => {
    storage.deleteSession(id);
    setSessionsState(storage.getSessions());
    success('جلسه مطالعه از تاریخچه حذف شد');
  };

  const refreshData = () => {
    setProfileState(storage.getProfile());
    setSubjectsState(storage.getSubjects());
    setTasksState(storage.getTasks());
    setSessionsState(storage.getSessions());
    setExamsState(storage.getExams());
    setAttemptsState(storage.getAttempts());
    setNotebooksState(storage.getNotebooks());
    setSettingsState(storage.getSettings());
  };

  const resetAllData = () => {
    storage.resetAll();
    refreshData();
    success('داده‌های آزمایشی بازنشانی شدند');
  };

  const todayISO = getTodayISODate();
  const todayTasks = tasks.filter((t) => t.date === todayISO);

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        profile,
        setProfile,
        subjects,
        setSubjects,
        tasks,
        todayTasks,
        sessions,
        exams,
        attempts,
        notebooks,
        settings,
        setSettings,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        activeTimer,
        timerSeconds,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        finishSession,
        discardTimer,
        sessionToFinalize,
        setSessionToFinalize,
        addExam,
        deleteExam,
        addAttempt,
        addNotebook,
        updateNotebook,
        deleteNotebook,
        deleteSession,
        refreshData,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
