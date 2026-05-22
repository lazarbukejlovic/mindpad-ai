import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getBillingStatus, createCheckoutSession, createPortalSession } from '../controllers/billingController';

const router = Router();

router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const status = await getBillingStatus(req.userId!);
    res.json(status);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to get billing status';
    res.status(500).json({ error: msg });
  }
});

router.post('/create-checkout-session', async (req: AuthRequest, res: Response) => {
  const { plan } = req.body as { plan?: string };
  if (plan !== 'pro' && plan !== 'team') {
    res.status(400).json({ error: 'Plan must be "pro" or "team"' });
    return;
  }

  try {
    const result = await createCheckoutSession(req.userId!, plan);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create checkout session';
    const status = msg === 'Billing not configured' ? 503 : 500;
    res.status(status).json({ error: msg });
  }
});

router.post('/create-portal-session', async (req: AuthRequest, res: Response) => {
  try {
    const result = await createPortalSession(req.userId!);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create portal session';
    const status = msg.includes('No billing account') || msg === 'Billing not configured' ? 400 : 500;
    res.status(status).json({ error: msg });
  }
});

export default router;
