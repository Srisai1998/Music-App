import { Router } from 'express';
import * as subsCtrl from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const r = (fn: any) => fn;

router.post('/checkout', r(authenticate), r(subsCtrl.createCheckoutSession));
router.post('/webhook', r(subsCtrl.handleWebhook));
router.get('/me', r(authenticate), r(subsCtrl.getSubscription));
router.delete('/cancel', r(authenticate), r(subsCtrl.cancelSubscription));

export default router;
