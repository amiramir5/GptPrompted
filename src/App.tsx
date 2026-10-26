/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ToastProvider } from './context/ToastContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';

import { DashboardPage } from './pages/DashboardPage';
import { TimerPage } from './pages/TimerPage';
import { PlannerPage } from './pages/PlannerPage';
import { ExamPage } from './pages/ExamPage';
import { NotebookPage } from './pages/NotebookPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AdvisorPage } from './pages/AdvisorPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { currentTab } = useApp();

  return (
    <Navigation>
      {currentTab === 'dashboard' && <DashboardPage />}
      {currentTab === 'timer' && <TimerPage />}
      {currentTab === 'planner' && <PlannerPage />}
      {currentTab === 'exams' && <ExamPage />}
      {currentTab === 'notebook' && <NotebookPage />}
      {currentTab === 'analytics' && <AnalyticsPage />}
      {currentTab === 'advisor' && <AdvisorPage />}
      {currentTab === 'history' && <HistoryPage />}
      {currentTab === 'settings' && <SettingsPage />}
    </Navigation>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ToastProvider>
  );
}
