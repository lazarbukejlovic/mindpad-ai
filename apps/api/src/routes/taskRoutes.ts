import { Router, Response } from 'express';
import {
  createTask,
  createTasksBulk,
  getTasks,
  updateTask,
  deleteTask,
} from '../controllers/taskController';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/bulk', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const tasks = await createTasksBulk(req.userId, req.body);
    res.status(201).json({ tasks });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create tasks';
    res.status(400).json({ error: message });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const task = await createTask(req.userId, req.body);
    res.status(201).json(task);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create task';
    res.status(400).json({ error: message });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const tasks = await getTasks(req.userId);
    res.status(200).json(tasks);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get tasks';
    res.status(400).json({ error: message });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const task = await updateTask(req.userId, taskId, req.body);
    res.status(200).json(task);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update task';
    res.status(400).json({ error: message });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const taskId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteTask(req.userId, taskId);
    res.status(204).send();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete task';
    res.status(400).json({ error: message });
  }
});

export default router;
