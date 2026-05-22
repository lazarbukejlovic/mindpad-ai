import { Router, Request, Response } from 'express';
import { handleStripeWebhook } from '../controllers/billingController';

const router = Router();

router.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];

  if (!signature || typeof signature !== 'string') {
    res.status(400).json({ error: 'Missing Stripe-Signature header' });
    return;
  }

  try {
    const result = await handleStripeWebhook(req.body as Buffer, signature);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Webhook handling failed';
    console.error('[MindPad AI] Webhook error:', msg);
    res.status(400).json({ error: msg });
  }
});

export default router;
