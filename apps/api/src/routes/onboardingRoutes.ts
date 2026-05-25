import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  getOnboardingStatus,
  updateOnboardingStatus,
  completeOnboarding,
  restartOnboarding,
} from '../controllers/onboardingController';

const router = Router();

router.get('/status', (req, res: Response) => getOnboardingStatus(req as AuthRequest, res));
router.patch('/status', (req, res: Response) => updateOnboardingStatus(req as AuthRequest, res));
router.post('/complete', (req, res: Response) => completeOnboarding(req as AuthRequest, res));
router.post('/restart', (req, res: Response) => restartOnboarding(req as AuthRequest, res));

export default router;
