import { Task } from '../models/Task';
import { isMongoConnected } from '../config/database';
import { memoryStore } from '../services/memoryStore';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export async function createTask(
  userId: string,
  data: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
  }
) {
  const validated = CreateTaskSchema.parse(data);

  if (isMongoConnected()) {
    const task = new Task({
      userId,
      ...validated,
      completed: false,
    });
    await task.save();

    return {
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      priority: task.priority,
      completed: task.completed,
      createdAt: task.createdAt,
    };
  } else {
    const id = randomUUID();
    memoryStore.saveTask({
      id,
      userId,
      title: validated.title,
      description: validated.description,
      priority: validated.priority,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      id,
      title: validated.title,
      description: validated.description,
      priority: validated.priority,
      completed: false,
      createdAt: new Date(),
    };
  }
}

export async function getTasks(userId: string) {
  if (isMongoConnected()) {
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    return tasks.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      description: t.description,
      priority: t.priority,
      completed: t.completed,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  } else {
    const tasks = memoryStore.getTasksByUserId(userId);
    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      completed: t.completed,
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
    if (!task) {
      throw new Error('Task not found');
    }

    Object.assign(task, data);
    task.updatedAt = new Date();
    await task.save();

    return {
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      priority: task.priority,
      completed: task.completed,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  } else {
    const task = memoryStore.getTaskById(taskId);
    if (!task || task.userId !== userId) {
      throw new Error('Task not found');
    }

    const updated = { ...task, ...data, updatedAt: new Date() };
    memoryStore.saveTask(updated);

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      priority: updated.priority,
      completed: updated.completed,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}

export async function deleteTask(userId: string, taskId: string) {
  if (isMongoConnected()) {
    const result = await Task.deleteOne({ _id: taskId, userId });
    if (result.deletedCount === 0) {
      throw new Error('Task not found');
    }
  } else {
    const task = memoryStore.getTaskById(taskId);
    if (!task || task.userId !== userId) {
      throw new Error('Task not found');
    }
    memoryStore.deleteTask(taskId);
  }
}
