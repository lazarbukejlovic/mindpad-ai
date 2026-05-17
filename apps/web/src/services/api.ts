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

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options?.headers || {}),
        },
      });

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
    return this.request<{ email: string }>('/auth/me');
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
    >('/brain-dumps');
  }

  // AI
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
    >('/tasks');
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
    });
  }

  static deleteTask(id: string) {
    return this.request<void>(`/tasks/${id}`, { method: 'DELETE' });
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
    >('/focus-sessions');
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
    }>('/analytics/summary');
  }
}
