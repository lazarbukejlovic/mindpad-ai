import { Router, Response } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await register(email, password);
    res.status(201).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await login(email, password);
    res.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await getMe(req.userId);
    res.status(200).json(user);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    res.status(400).json({ error: message });
  }
});

export default router;
