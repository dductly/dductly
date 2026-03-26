import express from 'express';
import {
  getStripePriceAvailability,
} from '../lib/billingConfig';
import { getStripe } from '../services/stripeService';

const router = express.Router();

/**
 * GET /api/billing/config
 * Public: used on signup success and marketing pages (no auth).
 */
router.get('/config', async (_req, res) => {
  try {
    const stripe = getStripe();
    const availablePlans = getStripePriceAvailability();
    const hasStripeConfig = Boolean(
      stripe && availablePlans.monthly && availablePlans.yearly
    );

    res.json({
      // Paid checkout availability should depend on Stripe configuration, not profile count.
      billingEnabled: true,
      userCount: 0,
      userThreshold: 0,
      hasStripeConfig,
      availablePlans,
    });
  } catch (error) {
    console.error('Billing config error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to load billing configuration',
    });
  }
});

export default router;
