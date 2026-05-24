const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiClient {
  private static getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private static getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private static async request<T>(
    endpoint: string,
    options?: RequestInit,
    timeoutMs = 4000
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    // Add a short timeout so the UI can fall back quickly if the API is down
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options?.headers || {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `HTTP ${response.status}`,
        }));

        if (response.status === 401) {
          const isAuthEndpoint = endpoint === '/auth/login' || endpoint === '/auth/register';
          if (!isAuthEndpoint && typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('md:me');
            window.location.href = '/login';
          }
        }

        throw new Error(error.error || 'API request failed');
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      const message =
        error instanceof Error ? error.message : 'API request failed';
      throw new Error(message);
    }
  }

  // Auth
  static register(email: string, password: string) {
    return this.request<{ token: string; user: {
      id: string; _id: string; email: string; name: string | null;
      avatarUrl: string | null; authProvider: string; plan: string;
      subscriptionStatus: string | null; emailVerified: boolean;
    } }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
  }

  static login(email: string, password: string) {
    return this.request<{ token: string; user: {
      id: string; _id: string; email: string; name: string | null;
      avatarUrl: string | null; authProvider: string; plan: string;
      subscriptionStatus: string | null; emailVerified: boolean;
    } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
  }

  static getMe() {
    return this.request<{
      id: string; _id: string; email: string; name?: string | null;
      avatarUrl?: string | null; authProvider?: string; plan?: string;
      subscriptionStatus?: string | null; emailVerified?: boolean;
    }>('/auth/me').catch(() => {
      if (typeof window === 'undefined') return { id: '', _id: '', email: '' } as any;
      const me = JSON.parse(localStorage.getItem('md:me') || 'null');
      return me || { id: '', _id: '', email: '' };
    });
  }

  static forgotPassword(email: string) {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  static resetPassword(token: string, password: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  static sendVerificationEmail() {
    return this.request<{ message: string }>('/auth/send-verification-email', {
      method: 'POST',
    });
  }

  // Brain Dumps
  static createBrainDump(content: string) {
    return this.request<{
      id: string;
      content: string;
      organized: boolean;
      createdAt: string;
    }>('/brain-dumps', {
      method: 'POST',
      body: JSON.stringify({ content }),
    }).catch(() => {
      // Fallback to localStorage when API is unavailable
      if (typeof window === 'undefined') throw new Error('No fallback available');
      const key = 'md:brain_dumps';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const item = { id: Date.now().toString(), content, organized: false, createdAt: new Date().toISOString() };
      existing.unshift(item);
      localStorage.setItem(key, JSON.stringify(existing));
      return item;
    });
  }

  static getBrainDumps() {
    return this.request<
      Array<{
        id: string;
        content: string;
        summary?: string;
        suggestedTasks?: string[];
        organized: boolean;
        createdAt: string;
      }>
    >('/brain-dumps').catch(() => {
      if (typeof window === 'undefined') return [] as any;
      const key = 'md:brain_dumps';
      return JSON.parse(localStorage.getItem(key) || '[]');
    });
  }

  // AI
  private static normalizeTaskPhrase(phrase: string) {
    let text = phrase
      .replace(/\s+/g, ' ')
      .replace(/^(?:first|then|next|after that|also|finally)\b[,\s]*/i, '')
      .replace(/^I\s+need\s+to\s+/i, '')
      .replace(/^Need\s+to\s+/i, '')
      .replace(/^Please\s+/i, '')
      .replace(/^[^a-zA-Z0-9]+/g, '')
      .replace(/[.!?]+$/, '')
      .trim();

    text = text.replace(/^(?:and|then|also)\s+/i, '');
    text = text.replace(/\s+(?:to|and|the|with|for|after|before|or|but|so|then|first)$/i, '');
    return text.trim();
  }

  private static splitActionClauses(text: string) {
    return text
      .split(/,\s*(?:and\s+)?|;\s*/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  private static extractTasksFromContent(content: string) {
    const cleaned = content.replace(/\s+/g, ' ').trim();
    if (!cleaned) return [];

    const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
    const tasks: string[] = [];

    for (const sentence of sentences) {
      const clauses = this.splitActionClauses(sentence.replace(/[.!?]+$/, '').trim());
      for (const clause of clauses) {
        if (tasks.length >= 6) break;
        const normalized = this.normalizeTaskPhrase(clause);
        if (!normalized) continue;
        if (normalized.length < 3) continue;
        if (tasks.includes(normalized)) continue;
        tasks.push(normalized);
      }
      if (tasks.length >= 6) break;
    }

    if (tasks.length === 0) {
      const fallback = cleaned
        .split(/[\n;]+/)
        .map((part) => this.normalizeTaskPhrase(part))
        .filter(Boolean);
      for (const phrase of fallback) {
        if (tasks.length >= 6) break;
        if (!tasks.includes(phrase)) tasks.push(phrase);
      }
    }

    return tasks.slice(0, 6);
  }

  static organizeBrainDump(content: string) {
    return this.request<{
      id: string;
      summary: string;
      tasks: string[];
      priorities: string[];
      categories: string[];
      estimatedMinutes: number[];
      focusRecommendation: string;
      reasoning: string;
      dailyPlanSuggestion?: string;
      mode: 'ai' | 'offline';
    }>('/ai/organize', {
      method: 'POST',
      body: JSON.stringify({ content }),
    }).catch(() => {
      const tasks = this.extractTasksFromContent(content);
      const priorities = tasks.map(() => 'Medium');
      const summary = tasks.length
        ? `Extracted ${tasks.length} actionable task${tasks.length !== 1 ? 's' : ''}.`
        : 'No tasks could be extracted from the input.';
      return {
        id: Date.now().toString(),
        summary,
        tasks,
        priorities,
        categories: tasks.map(() => 'General'),
        estimatedMinutes: tasks.map(() => 25),
        focusRecommendation: tasks.length ? `Start with: ${tasks[0]}` : 'No recommendation',
        reasoning: 'Extracted using sentence analysis.',
        mode: 'offline' as const,
      };
    });
  }

  static getMorningBrief(workspaceContext?: object) {
    return this.request<{
      mainPriority: string;
      topActions: string[];
      suggestedFocusBlock: string;
      warning: string;
      message: string;
      mode: 'ai' | 'offline';
    }>('/ai/morning-brief', {
      method: 'POST',
      body: JSON.stringify({ workspaceContext }),
    }).catch(() => ({
      mainPriority: 'Review your active tasks and pick the most important one',
      topActions: ['Start a brain dump', 'Prioritize your top task', 'Begin a focus session'],
      suggestedFocusBlock: 'Start with a 25-minute focused session',
      warning: '',
      message: 'Clarity beats hustle. Start by picking one thing.',
      mode: 'offline' as const,
    }));
  }

  static getEveningSummary(accomplishments: string[], workspaceContext?: object) {
    return this.request<{
      summary: string;
      accomplishments: string[];
      unfinished: string[];
      tomorrowPriority: string;
      improvement: string;
      mode: 'ai' | 'offline';
    }>('/ai/evening-summary', {
      method: 'POST',
      body: JSON.stringify({ accomplishments, workspaceContext }),
    }).catch(() => ({
      summary: accomplishments.length > 0
        ? `You completed ${accomplishments.length} task${accomplishments.length !== 1 ? 's' : ''} today.`
        : 'No tasks completed today.',
      accomplishments,
      unfinished: [],
      tomorrowPriority: 'Review your tasks and pick a top priority',
      improvement: 'Start tomorrow with a single clear intention.',
      mode: 'offline' as const,
    }));
  }

  static async getAIStatus(): Promise<{ configured: boolean; available: boolean; mode: 'ai' | 'offline'; reason?: string }> {
    // Uses a longer timeout because this endpoint makes a real AI test call.
    const url = `${API_URL}/ai/status`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch(url, { headers: this.getHeaders(), signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } catch {
      clearTimeout(timeout);
      return { configured: false, available: false, mode: 'offline' as const };
    }
  }

  static askMindPad(question: string, workspaceContext: object) {
    return this.request<{
      answer: string;
      sections: Array<{ title: string; content: string }>;
      suggestedActions: string[];
      mode: 'ai' | 'offline';
    }>('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question, workspaceContext }),
    }).catch(() => ({
      answer: 'Your request could not be completed. Check your connection and try again.',
      sections: [],
      suggestedActions: [],
      mode: 'offline' as const,
    }));
  }

  static getFocusRecommendation(workspaceContext: object) {
    return this.request<{
      suggestedTask: string | null;
      why: string;
      sessionLength: number;
      firstStep: string;
      warning: string | null;
      mode: 'ai' | 'offline';
    }>('/ai/focus-recommendation', {
      method: 'POST',
      body: JSON.stringify({ workspaceContext }),
    }).catch(() => null);
  }

  static getTaskCleanup(tasks: Array<{ title: string; priority: string; completed: boolean }>) {
    return this.request<{
      nextAction: string;
      highPriority: string[];
      vague: string[];
      recommendation: string;
      mode: 'ai' | 'offline';
    }>('/ai/task-cleanup', {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    }).catch(() => null);
  }

  // Tasks
  static createTask(data: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
  }) {
    return this.request<{
      id: string;
      title: string;
      description?: string;
      priority: 'low' | 'medium' | 'high';
      completed: boolean;
      createdAt: string;
    }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }).catch(() => {
      if (typeof window === 'undefined') throw new Error('No fallback available');
      const key = 'md:tasks';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const item = { id: Date.now().toString(), title: data.title, description: data.description, priority: data.priority || 'medium', completed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      existing.unshift(item);
      localStorage.setItem(key, JSON.stringify(existing));
      return item;
    });
  }

  static createTasksBulk(tasks: Array<{
    title: string;
    priority?: 'low' | 'medium' | 'high';
    description?: string;
    estimatedMinutes?: number;
    category?: string;
  }>) {
    return this.request<{ tasks: Array<{
      id: string;
      title: string;
      description?: string;
      priority: 'low' | 'medium' | 'high';
      completed: boolean;
      completedAt?: string;
      createdAt: string;
      updatedAt: string;
    }> }>('/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    }).catch(async () => {
      // Fallback: create individually via localStorage path
      if (typeof window === 'undefined') throw new Error('No fallback available');
      const key = 'md:tasks';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const created = tasks.map((t) => ({
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        title: t.title,
        description: t.description,
        priority: t.priority || 'medium',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      localStorage.setItem(key, JSON.stringify([...created, ...existing]));
      return { tasks: created };
    });
  }

  static getTasks() {
    return this.request<
      Array<{
        id: string;
        title: string;
        description?: string;
        priority: 'low' | 'medium' | 'high';
        completed: boolean;
        completedAt?: string;
        createdAt: string;
        updatedAt: string;
      }>
    >('/tasks').catch(() => {
      if (typeof window === 'undefined') return [] as any;
      const key = 'md:tasks';
      return JSON.parse(localStorage.getItem(key) || '[]');
    });
  }

  static updateTask(id: string, data: Partial<{ title: string; description: string; priority: 'low' | 'medium' | 'high'; completed: boolean }>) {
    return this.request<{
      id: string;
      title: string;
      description?: string;
      priority: 'low' | 'medium' | 'high';
      completed: boolean;
      createdAt: string;
      updatedAt: string;
    }>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).catch(() => {
      if (typeof window === 'undefined') throw new Error('No fallback available');
      const key = 'md:tasks';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const next = existing.map((t: any) => (t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t));
      localStorage.setItem(key, JSON.stringify(next));
      return next.find((t: any) => t.id === id);
    });
  }

  static deleteTask(id: string) {
    return this.request<void>(`/tasks/${id}`, { method: 'DELETE' }).catch(() => {
      if (typeof window === 'undefined') throw new Error('No fallback available');
      const key = 'md:tasks';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const next = existing.filter((t: any) => t.id !== id);
      localStorage.setItem(key, JSON.stringify(next));
      return undefined as void;
    });
  }

  // Focus Sessions
  static createFocusSession(data: { taskId?: string; duration?: number }) {
    return this.request<{
      id: string;
      taskId?: string;
      duration: number;
      completed: boolean;
      startedAt: string;
      completedAt?: string;
      createdAt: string;
    }>('/focus-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }).catch(() => {
      if (typeof window === 'undefined') throw new Error('No fallback available');
      const key = 'md:focus_sessions';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const now = new Date().toISOString();
      const item = { id: Date.now().toString(), taskId: data.taskId, duration: data.duration || 25, completed: false, startedAt: now, createdAt: now };
      existing.unshift(item);
      localStorage.setItem(key, JSON.stringify(existing));
      return item;
    });
  }

  static getFocusSessions() {
    return this.request<
      Array<{
        id: string;
        taskId?: string;
        duration: number;
        completed: boolean;
        createdAt: string;
      }>
    >('/focus-sessions').catch(() => {
      if (typeof window === 'undefined') return [] as any;
      const key = 'md:focus_sessions';
      return JSON.parse(localStorage.getItem(key) || '[]');
    });
  }

  static deleteFocusSession(id: string) {
    return this.request<void>(`/focus-sessions/${id}`, { method: 'DELETE' }).catch(() => {
      if (typeof window === 'undefined') return undefined as void;
      const key = 'md:focus_sessions';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(existing.filter((s: any) => s.id !== id)));
      return undefined as void;
    });
  }

  static completeFocusSession(id: string) {
    return this.request<{
      id: string;
      taskId?: string;
      duration: number;
      completed: boolean;
      startedAt: string;
      completedAt?: string;
      createdAt: string;
    }>(`/focus-sessions/${id}/complete`, { method: 'PATCH' }).catch(() => {
      if (typeof window === 'undefined') throw new Error('No fallback available');
      const key = 'md:focus_sessions';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const next = existing.map((s: any) => (s.id === id ? { ...s, completed: true } : s));
      localStorage.setItem(key, JSON.stringify(next));
      return next.find((s: any) => s.id === id);
    });
  }

  static deleteBrainDump(id: string) {
    return this.request<void>(`/brain-dumps/${id}`, { method: 'DELETE' }).catch(() => {
      if (typeof window === 'undefined') throw new Error('No fallback available');
      const key = 'md:brain_dumps';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const next = existing.filter((d: any) => d.id !== id);
      localStorage.setItem(key, JSON.stringify(next));
      return undefined as void;
    });
  }

  // Billing
  static getBillingStatus() {
    return this.request<import('@/types/index').BillingStatus>('/billing/status');
  }

  static createCheckoutSession(plan: 'pro' | 'team') {
    return this.request<{ url: string | null }>('/billing/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  static createPortalSession() {
    return this.request<{ url: string }>('/billing/create-portal-session', {
      method: 'POST',
    });
  }

  // Team
  static getTeamWorkspace() {
    return this.request<import('@/types/index').TeamWorkspaceState>('/team');
  }

  static createTeamWorkspace(name: string) {
    return this.request<import('@/types/index').TeamWorkspace>('/team', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  static updateTeamWorkspace(name: string) {
    return this.request<import('@/types/index').TeamWorkspace>('/team', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  }

  static inviteTeamMember(email: string) {
    return this.request<{ invitedEmails: string[] }>('/team/invite', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  static removeTeamInvite(email: string) {
    return this.request<{ invitedEmails: string[] }>('/team/invite', {
      method: 'DELETE',
      body: JSON.stringify({ email }),
    });
  }

  // Execution Plans
  static getExecutionPlans() {
    return this.request<import('@/types/index').SavedExecutionPlan[]>('/execution-plans');
  }

  static saveExecutionPlan(data: { title: string; summary?: string; steps?: string[]; source?: string }) {
    return this.request<import('@/types/index').SavedExecutionPlan>('/execution-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static deleteExecutionPlan(id: string) {
    return this.request<void>(`/execution-plans/${id}`, { method: 'DELETE' });
  }

  // Reports (longer timeout)
  static generateExportSummary() {
    return this.request<import('@/types/index').ExportSummary>('/reports/export-summary', { method: 'POST' }, 30000);
  }

  static generateWeeklyReview() {
    return this.request<import('@/types/index').WeeklyReview>('/reports/weekly-review', { method: 'POST' }, 30000);
  }

  // Team extended
  static addSharedProject(name: string, description?: string) {
    return this.request<{ sharedProjects: import('@/types/index').SharedProject[] }>('/team/shared-projects', {
      method: 'POST',
      body: JSON.stringify({ name, description: description || '' }),
    });
  }

  static deleteSharedProject(id: string) {
    return this.request<{ sharedProjects: import('@/types/index').SharedProject[] }>(`/team/shared-projects/${id}`, {
      method: 'DELETE',
    });
  }

  static generateTeamWeeklyReport() {
    return this.request<import('@/types/index').TeamWeeklyReport>('/team/weekly-report', { method: 'POST' }, 30000);
  }

  // Analytics
  static getAnalyticsSummary() {
    return this.request<{
      completedTasks: number;
      totalTasks: number;
      completedSessions: number;
      totalFocusMinutes: number;
      brainDumpsOrganized: number;
      weeklyStreak: number;
      averageSessionLength: number;
    }>('/analytics/summary').catch(() => {
      // Compute a basic summary from localStorage fallbacks
      if (typeof window === 'undefined') return {
        completedTasks: 0,
        totalTasks: 0,
        completedSessions: 0,
        totalFocusMinutes: 0,
        brainDumpsOrganized: 0,
        weeklyStreak: 0,
        averageSessionLength: 0,
      };
      const tasks = JSON.parse(localStorage.getItem('md:tasks') || '[]');
      const sessions = JSON.parse(localStorage.getItem('md:focus_sessions') || '[]');
      const dumps = JSON.parse(localStorage.getItem('md:brain_dumps') || '[]');
      const completedTasks = tasks.filter((t: any) => t.completed === true || t.completed === 'true').length;
      const totalTasks = tasks.length;
      const completedSessions = sessions.filter((s: any) => s.completed === true || s.completed === 'true').length;
      const totalFocusMinutes = sessions
        .filter((s: any) => s.completed === true || s.completed === 'true')
        .reduce((sum: number, s: any) => sum + (Number(s.duration) || 0), 0);
      return {
        completedTasks,
        totalTasks,
        completedSessions,
        totalFocusMinutes,
        brainDumpsOrganized: dumps.filter((d: any) => d.organized === true || d.organized === 'true').length,
        weeklyStreak: 0,
        averageSessionLength: completedSessions > 0 ? Math.round(totalFocusMinutes / completedSessions) : 0,
      };
    });
  }
}
