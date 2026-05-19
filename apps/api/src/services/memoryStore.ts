/**
 * In-memory data store for development when MongoDB is not available.
 * This is NOT for production use.
 */

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

interface StoredBrainDump {
  id: string;
  userId: string;
  content: string;
  summary?: string;
  suggestedTasks?: string[];
  createdAt: Date;
}

interface StoredTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

interface StoredFocusSession {
  id: string;
  userId: string;
  taskId?: string;
  duration: number; // in minutes
  completed: boolean;
  createdAt: Date;
}

class MemoryStore {
  private users: Map<string, StoredUser> = new Map();
  private brainDumps: Map<string, StoredBrainDump> = new Map();
  private tasks: Map<string, StoredTask> = new Map();
  private focusSessions: Map<string, StoredFocusSession> = new Map();
  private usersByEmail: Map<string, string> = new Map(); // email -> userId

  // Users
  saveUser(user: StoredUser): void {
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user.id);
  }

  getUserById(id: string): StoredUser | null {
    return this.users.get(id) || null;
  }

  getUserByEmail(email: string): StoredUser | null {
    const userId = this.usersByEmail.get(email);
    return userId ? (this.users.get(userId) || null) : null;
  }

  // Brain Dumps
  saveBrainDump(brainDump: StoredBrainDump): void {
    this.brainDumps.set(brainDump.id, brainDump);
  }

  getBrainDumpsByUserId(userId: string): StoredBrainDump[] {
    return Array.from(this.brainDumps.values())
      .filter((bd) => bd.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Tasks
  saveTask(task: StoredTask): void {
    this.tasks.set(task.id, task);
  }

  getTasksByUserId(userId: string): StoredTask[] {
    return Array.from(this.tasks.values())
      .filter((t) => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getTaskById(id: string): StoredTask | null {
    return this.tasks.get(id) || null;
  }

  deleteTask(id: string): void {
    this.tasks.delete(id);
  }

  // Focus Sessions
  saveFocusSession(session: StoredFocusSession): void {
    this.focusSessions.set(session.id, session);
  }

  getFocusSessionsByUserId(userId: string): StoredFocusSession[] {
    return Array.from(this.focusSessions.values())
      .filter((fs) => fs.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Focus session update
  updateFocusSession(id: string, data: Partial<StoredFocusSession>): void {
    const session = this.focusSessions.get(id);
    if (session) {
      this.focusSessions.set(id, { ...session, ...data });
    }
  }

  getFocusSessionById(id: string): StoredFocusSession | null {
    return this.focusSessions.get(id) || null;
  }

  deleteFocusSession(id: string): void {
    this.focusSessions.delete(id);
  }

  // Brain dump delete
  deleteBrainDump(id: string): void {
    this.brainDumps.delete(id);
  }

  getBrainDumpById(id: string): StoredBrainDump | null {
    return this.brainDumps.get(id) || null;
  }

  // Analytics
  getAnalyticsSummary(userId: string) {
    const userTasks = this.getTasksByUserId(userId);
    const userSessions = this.getFocusSessionsByUserId(userId);
    const userBrainDumps = this.getBrainDumpsByUserId(userId);

    const completedTasks = userTasks.filter((t) => t.completed).length;
    const completedSessions = userSessions.filter((s) => s.completed).length;
    const totalFocusMinutes = userSessions.filter((s) => s.completed).reduce((sum, s) => sum + s.duration, 0);
    const averageSessionLength =
      completedSessions > 0 ? Math.round(totalFocusMinutes / completedSessions) : 0;

    // Compute streak: count consecutive days (from today backwards) with at least one task completed
    const now = new Date();
    let weeklyStreak = 0;
    for (let i = 0; i < 7; i++) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const dayStr = day.toISOString().slice(0, 10);
      const hasActivity = userTasks.some(
        (t) => t.completed && t.updatedAt.toISOString().slice(0, 10) === dayStr
      );
      if (hasActivity) weeklyStreak++;
      else if (i > 0) break;
    }

    return {
      completedTasks,
      totalTasks: userTasks.length,
      completedSessions,
      totalFocusMinutes,
      brainDumpsOrganized: userBrainDumps.filter((bd) => !!bd.summary).length,
      weeklyStreak,
      averageSessionLength,
    };
  }
}

export const memoryStore = new MemoryStore();
