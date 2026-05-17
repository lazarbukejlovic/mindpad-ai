export interface User {
  email: string;
}

export interface BrainDump {
  id: string;
  content: string;
  summary?: string;
  suggestedTasks?: string[];
  organized: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  duration: number;
  completed: boolean;
  createdAt: string;
}

export interface OrganizeResult {
  summary: string;
  tasks: string[];
  priorities: string[];
  focusRecommendation: string;
  reasoning: string;
}

export interface MorningBrief {
  briefText: string;
  topPriority: string;
  suggestedFocusTime: number;
  keyThemesText: string;
}

export interface AnalyticsSummary {
  completedTasks: number;
  totalTasks: number;
  completedSessions: number;
  totalFocusMinutes: number;
  brainDumpsOrganized: number;
  weeklyStreak: number;
  averageSessionLength: number;
}
