import { FocusSession } from '../models/FocusSession';
import { isMongoConnected } from '../config/database';
import { memoryStore } from '../services/memoryStore';
import { randomUUID } from 'crypto';

// Sessions can be completed when 90% of the duration has elapsed.
// This gives a ~2.5 min grace window on a 25-min session and catches
// anyone calling PATCH immediately after POST.
const COMPLETION_THRESHOLD = 0.9;

function serializeSession(s: {
  _id?: unknown;
  id?: string;
  taskId?: string;
  duration: number;
  completed: boolean;
  startedAt: Date;
  completedAt?: Date | null;
  createdAt: Date;
}) {
  return {
    id: s._id ? String(s._id) : s.id,
    taskId: s.taskId,
    duration: s.duration,
    completed: s.completed,
    startedAt: s.startedAt,
    completedAt: s.completedAt ?? undefined,
    createdAt: s.createdAt,
  };
}

export async function createFocusSession(
  userId: string,
  data: {
    taskId?: string;
    duration?: number;
  }
) {
  const duration = data.duration || 25;
  const startedAt = new Date();

  if (isMongoConnected()) {
    const session = new FocusSession({
      userId,
      taskId: data.taskId,
      duration,
      completed: false,
      startedAt,
    });
    await session.save();
    return serializeSession(session);
  } else {
    const id = randomUUID();
    memoryStore.saveFocusSession({
      id,
      userId,
      taskId: data.taskId,
      duration,
      completed: false,
      startedAt,
      createdAt: new Date(),
    });
    return {
      id,
      taskId: data.taskId,
      duration,
      completed: false,
      startedAt,
      completedAt: undefined,
      createdAt: startedAt,
    };
  }
}

export async function completeFocusSession(userId: string, sessionId: string) {
  if (isMongoConnected()) {
    const session = await FocusSession.findOne({ _id: sessionId, userId });
    if (!session) throw new Error('Session not found');

    const elapsedMs = Date.now() - session.startedAt.getTime();
    const requiredMs = session.duration * 60 * 1000 * COMPLETION_THRESHOLD;
    if (elapsedMs < requiredMs) {
      const remainingSec = Math.ceil((requiredMs - elapsedMs) / 1000);
      throw new Error(`Session cannot be completed yet — ${remainingSec}s remaining.`);
    }

    session.completed = true;
    session.completedAt = new Date();
    await session.save();
    return serializeSession(session);
  } else {
    const session = memoryStore.getFocusSessionById(sessionId);
    if (!session || session.userId !== userId) throw new Error('Session not found');

    const elapsedMs = Date.now() - session.startedAt.getTime();
    const requiredMs = session.duration * 60 * 1000 * COMPLETION_THRESHOLD;
    if (elapsedMs < requiredMs) {
      const remainingSec = Math.ceil((requiredMs - elapsedMs) / 1000);
      throw new Error(`Session cannot be completed yet — ${remainingSec}s remaining.`);
    }

    const completedAt = new Date();
    memoryStore.updateFocusSession(sessionId, { completed: true, completedAt });
    return {
      ...session,
      completed: true,
      completedAt,
    };
  }
}

export async function deleteFocusSession(userId: string, sessionId: string) {
  if (isMongoConnected()) {
    const session = await FocusSession.findOne({ _id: sessionId, userId });
    if (!session) return;
    await FocusSession.deleteOne({ _id: sessionId, userId });
  } else {
    const session = memoryStore.getFocusSessionById(sessionId);
    if (!session || session.userId !== userId) return;
    memoryStore.deleteFocusSession(sessionId);
  }
}

export async function getFocusSessions(userId: string) {
  if (isMongoConnected()) {
    const sessions = await FocusSession.find({ userId }).sort({ createdAt: -1 });
    return sessions.map(serializeSession);
  } else {
    const sessions = memoryStore.getFocusSessionsByUserId(userId);
    return sessions.map((s) => ({
      id: s.id,
      taskId: s.taskId,
      duration: s.duration,
      completed: s.completed,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      createdAt: s.createdAt,
    }));
  }
}
