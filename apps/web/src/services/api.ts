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
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    // Add a short timeout so the UI can fall back quickly if the API is down
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

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
        throw new Error(error.error || 'API request failed');
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeout);
      const message =
        error instanceof Error ? error.message : 'API request failed';
      throw new Error(message);
    }
  }

  // Auth
  static register(email: string, password: string) {
    return this.request<{ token: string; user: { email: string } }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
  }

  static login(email: string, password: string) {
    return this.request<{ token: string; user: { email: string } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
  }

  static getMe() {
    return this.request<{ email: string }>('/auth/me').catch(() => {
      if (typeof window === 'undefined') return { email: '' } as any;
      const me = JSON.parse(localStorage.getItem('md:me') || 'null');
      return me || { email: '' };
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
      focusRecommendation: string;
      reasoning: string;
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
        focusRecommendation: tasks.length ? `Start with: ${tasks[0]}` : 'No recommendation',
        reasoning: 'Fallback organizer: sentence-based extraction',
      } as any;
    });
  }

   static getMorningBrief(context?: string) {
    return this.request<{
      briefText: string;
      topPriority: string;
      suggestedFocusTime: number;
      keyThemesText: string;
    }>('/ai/morning-brief', {
      method: 'POST',
      body: JSON.stringify({ context }),
    }).catch(() => {
      const briefText = context ? `Brief based on: ${context}` : 'No tasks available to summarize.';
      return { briefText, topPriority: '', suggestedFocusTime: 25, keyThemesText: '' } as any;
    });
  }

  static getEveningSummary(accomplishments: string[]) {
    return this.request<{
      summary: string;
      accomplishments: string[];
      lessonsLearned: string[];
      tomorrowPreview: string;
    }>('/ai/evening-summary', {
      method: 'POST',
      body: JSON.stringify({ accomplishments }),
    });
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

  static getTasks() {
    return this.request<
      Array<{
        id: string;
        title: string;
        description?: string;
        priority: 'low' | 'medium' | 'high';
        completed: boolean;
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
      createdAt: string;
    }>('/focus-sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }).catch(() => {
      if (typeof window === 'undefined') throw new Error('No fallback available');
      const key = 'md:focus_sessions';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const item = { id: Date.now().toString(), taskId: data.taskId, duration: data.duration || 25, completed: false, createdAt: new Date().toISOString() };
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
