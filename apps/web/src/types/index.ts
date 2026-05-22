export interface User {
  email: string;
  name?: string;
  avatarUrl?: string;
  authProvider?: 'email' | 'google' | 'mixed';
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
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  duration: number;
  completed: boolean;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface OrganizeResult {
  summary: string;
  tasks: string[];
  priorities: string[];
  categories: string[];
  estimatedMinutes: number[];
  focusRecommendation: string;
  reasoning: string;
  dailyPlanSuggestion?: string;
  mode: 'ai' | 'offline';
}

export interface MorningBrief {
  mainPriority: string;
  topActions: string[];
  suggestedFocusBlock: string;
  warning: string;
  message: string;
  mode: 'ai' | 'offline';
}

export interface AskResult {
  answer: string;
  sections: Array<{ title: string; content: string }>;
  suggestedActions: string[];
  mode: 'ai' | 'offline';
}

export interface FocusRecommendation {
  suggestedTask: string | null;
  why: string;
  sessionLength: number;
  firstStep: string;
  warning: string | null;
  mode: 'ai' | 'offline';
}

export interface TaskCleanupResult {
  nextAction: string;
  highPriority: string[];
  vague: string[];
  recommendation: string;
  mode: 'ai' | 'offline';
}

export interface EveningSummary {
  summary: string;
  accomplishments: string[];
  unfinished: string[];
  tomorrowPriority: string;
  improvement: string;
  mode: 'ai' | 'offline';
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

export interface PlanEntitlements {
  maxActiveTasks: number;
  dailyBrainDumpExtractions: number;
  focusHistoryDays: number;
  analyticsLevel: 'basic' | 'advanced' | 'team';
  canExportReports: boolean;
  canUseAdvancedPlanning: boolean;
  canUseTeamWorkspace: boolean;
  canSaveExecutionPlans: boolean;
  canUseWeeklyReview: boolean;
  canUseTeamReports: boolean;
  maxTeamMembers: number;
}

export interface BillingStatus {
  plan: 'free' | 'pro' | 'team';
  subscriptionStatus?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  stripeConfigured: boolean;
  entitlements: PlanEntitlements;
  usage: {
    activeTasks: number;
    dailyExtractionsUsed: number;
  };
}

export interface SavedExecutionPlan {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReview {
  completedWork: string[];
  unfinishedPriorities: string[];
  focusConsistency: string;
  executionScore: number;
  suggestedNextSteps: string[];
  summary: string;
}

export interface ExportSummary {
  markdown: string;
}

export interface SharedProject {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
}

export interface TeamWorkspace {
  id: string;
  name: string;
  invitedEmails: string[];
  memberIds: string[];
  memberCount: number;
  sharedProjects: SharedProject[];
  activityFeed: ActivityEntry[];
  createdAt: string;
}

export interface TeamWorkspaceState {
  exists: boolean;
  plan: string;
  upgradeRequired: boolean;
  entitlements?: PlanEntitlements;
  workspace?: TeamWorkspace;
}

export interface TeamWeeklyReport {
  activitySummary: string;
  sharedPriorities: string[];
  executionRisks: string[];
  suggestedNextActions: string[];
  memberCount: number;
  projectCount: number;
}
