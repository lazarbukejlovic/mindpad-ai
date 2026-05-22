export type Plan = 'free' | 'pro' | 'team';

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

export const PLAN_CONFIG: Record<Plan, PlanEntitlements> = {
  free: {
    maxActiveTasks: 10,
    dailyBrainDumpExtractions: 3,
    focusHistoryDays: 7,
    analyticsLevel: 'basic',
    canExportReports: false,
    canUseAdvancedPlanning: false,
    canUseTeamWorkspace: false,
    canSaveExecutionPlans: false,
    canUseWeeklyReview: false,
    canUseTeamReports: false,
    maxTeamMembers: 1,
  },
  pro: {
    maxActiveTasks: 100,
    dailyBrainDumpExtractions: 50,
    focusHistoryDays: 90,
    analyticsLevel: 'advanced',
    canExportReports: true,
    canUseAdvancedPlanning: true,
    canUseTeamWorkspace: false,
    canSaveExecutionPlans: true,
    canUseWeeklyReview: true,
    canUseTeamReports: false,
    maxTeamMembers: 1,
  },
  team: {
    maxActiveTasks: 500,
    dailyBrainDumpExtractions: 200,
    focusHistoryDays: 365,
    analyticsLevel: 'team',
    canExportReports: true,
    canUseAdvancedPlanning: true,
    canUseTeamWorkspace: true,
    canSaveExecutionPlans: true,
    canUseWeeklyReview: true,
    canUseTeamReports: true,
    maxTeamMembers: 10,
  },
};

export class PlanError extends Error {
  constructor(
    message: string,
    public readonly code: 'PLAN_LIMIT_REACHED' | 'UPGRADE_REQUIRED' | 'TEAM_PLAN_REQUIRED' | 'BILLING_NOT_CONFIGURED',
    public readonly requiredPlan?: Plan
  ) {
    super(message);
    this.name = 'PlanError';
  }
}
