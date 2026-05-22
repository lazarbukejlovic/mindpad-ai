import { Task } from '../models/Task';
import { User } from '../models/User';
import { isMongoConnected } from '../config/database';
import { memoryStore } from '../services/memoryStore';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { PLAN_CONFIG, PlanError, Plan } from '../config/plans';

const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300, 'Title too long'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  estimatedMinutes: z.number().int().positive().optional(),
  category: z.string().optional(),
});

const BulkCreateSchema = z.object({
  tasks: z.array(CreateTaskSchema).min(1).max(20),
});

function serializeTask(t: {
  _id?: unknown;
  id?: string;
  title: string;
  description?: string;
  priority: string;
  completed: boolean;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: t._id ? String(t._id) : t.id,
    title: t.title,
    description: t.description,
    priority: t.priority as 'low' | 'medium' | 'high',
    completed: t.completed,
    completedAt: t.completedAt ?? undefined,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export async function createTask(
  userId: string,
  data: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    estimatedMinutes?: number;
    category?: string;
  }
) {
  const validated = CreateTaskSchema.parse(data);

  if (isMongoConnected()) {
    const user = await User.findById(userId);
    const plan = (user?.plan as Plan) || 'free';
    const { maxActiveTasks } = PLAN_CONFIG[plan];
    const activeCount = await Task.countDocuments({ userId, completed: false });
    if (activeCount >= maxActiveTasks) {
      throw new PlanError(
        `Active task limit reached (${maxActiveTasks} on ${plan} plan)`,
        'PLAN_LIMIT_REACHED',
        plan === 'free' ? 'pro' : 'team'
      );
    }
    const task = new Task({ userId, ...validated, completed: false });
    await task.save();
    return serializeTask(task);
  } else {
    const now = new Date();
    const id = randomUUID();
    memoryStore.saveTask({
      id,
      userId,
      title: validated.title,
      description: validated.description,
      priority: validated.priority,
      completed: false,
      createdAt: now,
      updatedAt: now,
    });
    return {
      id,
      title: validated.title,
      description: validated.description,
      priority: validated.priority,
      completed: false,
      completedAt: undefined,
      createdAt: now,
      updatedAt: now,
    };
  }
}

export async function createTasksBulk(
  userId: string,
  rawData: unknown
) {
  const { tasks: items } = BulkCreateSchema.parse(rawData);

  if (isMongoConnected()) {
    const docs = items.map((item) => ({ userId, ...item, completed: false }));
    const created = await Task.insertMany(docs);
    return created.map(serializeTask);
  } else {
    const now = new Date();
    return items.map((item) => {
      const id = randomUUID();
      memoryStore.saveTask({
        id,
        userId,
        title: item.title,
        description: item.description,
        priority: item.priority,
        completed: false,
        createdAt: now,
        updatedAt: now,
      });
      return {
        id,
        title: item.title,
        description: item.description,
        priority: item.priority,
        completed: false,
        completedAt: undefined,
        createdAt: now,
        updatedAt: now,
      };
    });
  }
}

export async function getTasks(userId: string) {
  if (isMongoConnected()) {
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    return tasks.map(serializeTask);
  } else {
    const tasks = memoryStore.getTasksByUserId(userId);
    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      completed: t.completed,
      completedAt: t.completedAt,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }
}

export async function updateTask(
  userId: string,
  taskId: string,
  data: {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    completed?: boolean;
  }
) {
  if (isMongoConnected()) {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) throw new Error('Task not found');

    const wasCompleted = task.completed;
    Object.assign(task, data);

    if (data.completed === true && !wasCompleted) {
      task.completedAt = new Date();
    } else if (data.completed === false && wasCompleted) {
      task.completedAt = undefined;
    }

    task.updatedAt = new Date();
    await task.save();
    return serializeTask(task);
  } else {
    const task = memoryStore.getTaskById(taskId);
    if (!task || task.userId !== userId) throw new Error('Task not found');

    const completedAt =
      data.completed === true && !task.completed
        ? new Date()
        : data.completed === false
        ? undefined
        : task.completedAt;

    const updated = { ...task, ...data, completedAt, updatedAt: new Date() };
    memoryStore.saveTask(updated);
    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      priority: updated.priority,
      completed: updated.completed,
      completedAt: updated.completedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}

export async function deleteTask(userId: string, taskId: string) {
  if (isMongoConnected()) {
    const result = await Task.deleteOne({ _id: taskId, userId });
    if (result.deletedCount === 0) throw new Error('Task not found');
  } else {
    const task = memoryStore.getTaskById(taskId);
    if (!task || task.userId !== userId) throw new Error('Task not found');
    memoryStore.deleteTask(taskId);
  }
}
