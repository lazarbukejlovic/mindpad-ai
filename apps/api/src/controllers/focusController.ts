import { FocusSession } from '../models/FocusSession';
import { isMongoConnected } from '../config/database';
import { memoryStore } from '../services/memoryStore';
import { randomUUID } from 'crypto';

export async function createFocusSession(
  userId: string,
  data: {
    taskId?: string;
    duration?: number;
  }
) {
  const duration = data.duration || 25;

  if (isMongoConnected()) {
    const session = new FocusSession({
      userId,
      taskId: data.taskId,
      duration,
      completed: false,
    });
    await session.save();

    return {
      id: session._id.toString(),
      taskId: session.taskId,
      duration: session.duration,
      completed: session.completed,
      createdAt: session.createdAt,
    };
  } else {
    const id = randomUUID();
    memoryStore.saveFocusSession({
      id,
      userId,
      taskId: data.taskId,
      duration,
      completed: false,
      createdAt: new Date(),
    });

    return {
      id,
      taskId: data.taskId,
      duration,
      completed: false,
      createdAt: new Date(),
    };
  }
}

export async function completeFocusSession(userId: string, sessionId: string) {
  if (isMongoConnected()) {
    const session = await FocusSession.findOne({ _id: sessionId, userId });
    if (!session) throw new Error('Session not found');
    session.completed = true;
    await session.save();
    return {
      id: session._id.toString(),
      taskId: session.taskId,
      duration: session.duration,
      completed: session.completed,
      createdAt: session.createdAt,
    };
  } else {
    const session = memoryStore.getFocusSessionById(sessionId);
    if (!session || session.userId !== userId) throw new Error('Session not found');
    memoryStore.updateFocusSession(sessionId, { completed: true });
    return { ...session, completed: true };
  }
}

export async function deleteFocusSession(userId: string, sessionId: string) {
  if (isMongoConnected()) {
    const { FocusSession } = await import('../models/FocusSession');
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
    const sessions = await FocusSession.find({ userId }).sort({
      createdAt: -1,
    });
    return sessions.map((s) => ({
      id: s._id.toString(),
      taskId: s.taskId,
      duration: s.duration,
      completed: s.completed,
      createdAt: s.createdAt,
    }));
  } else {
    const sessions = memoryStore.getFocusSessionsByUserId(userId);
    return sessions.map((s) => ({
      id: s.id,
      taskId: s.taskId,
      duration: s.duration,
      completed: s.completed,
      createdAt: s.createdAt,
    }));
  }
}
