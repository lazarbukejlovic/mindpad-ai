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
