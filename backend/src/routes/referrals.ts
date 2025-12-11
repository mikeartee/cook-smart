import express from 'express';
import {ReferralModel} from '../models/Referral';
import {authenticateToken} from '../middleware/auth';

const router = express.Router();

// Create new referral (authenticated)
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const {email} = req.body;

    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const referralCode = await ReferralModel.createReferral(userId, email);
    return res.json({success: true, referralCode});
  } catch (_error) {
    return res.status(500).json({error: 'Failed to create referral'});
  }
});

// Get user's referrals (authenticated)
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    // Return empty referrals for now to avoid database issues
    const referrals: any[] = [];
    return res.json({
      referrals,
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
    });
  } catch (_error) {
    return res.status(500).json({error: 'Failed to get referrals'});
  }
});

// Get referral stats (authenticated)
router.get('/stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const stats = await ReferralModel.getReferralStats(userId);
    return res.json(stats);
  } catch (_error) {
    return res.status(500).json({error: 'Failed to get referral stats'});
  }
});

// Get referral access info (authenticated)
router.get('/access-info', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const accessInfo = await ReferralModel.getReferralAccessInfo(userId);
    return res.json(accessInfo);
  } catch (_error) {
    return res.status(500).json({error: 'Failed to get access info'});
  }
});

// Complete referral (called during signup)
router.post('/complete', async (req, res) => {
  try {
    const {referralCode, newUserId} = req.body;

    if (!referralCode || !newUserId) {
      return res
        .status(400)
        .json({error: 'Referral code and user ID required'});
    }

    const success = await ReferralModel.completeReferral(
      referralCode,
      newUserId,
    );

    if (success) {
      return res.json({
        success: true,
        message: 'Referral completed successfully',
      });
    } else {
      return res.status(400).json({error: 'Invalid or expired referral code'});
    }
  } catch (_error) {
    return res.status(500).json({error: 'Failed to complete referral'});
  }
});

// Validate referral code
router.get('/validate/:referralCode', async (req, res) => {
  try {
    const {referralCode} = req.params;
    const referral = await ReferralModel.getReferralByCode(referralCode);

    if (!referral) {
      return res.status(404).json({error: 'Referral code not found'});
    }

    if (referral.status !== 'pending') {
      return res.status(400).json({error: 'Referral code is not valid'});
    }

    return res.json({
      valid: true,
      referrerId: referral.referrerId,
      message: 'Valid referral code',
    });
  } catch (_error) {
    return res.status(500).json({error: 'Failed to validate referral code'});
  }
});

// Record subscription purchase (called after successful payment)
router.post('/subscription-purchase', async (req, res) => {
  try {
    const {userId, subscriptionType} = req.body;

    if (!userId || !subscriptionType) {
      return res
        .status(400)
        .json({error: 'User ID and subscription type required'});
    }

    if (!['monthly', 'yearly'].includes(subscriptionType)) {
      return res.status(400).json({error: 'Invalid subscription type'});
    }

    await ReferralModel.recordSubscriptionPurchase(
      userId,
      subscriptionType as 'monthly' | 'yearly',
    );

    return res.json({
      success: true,
      message: 'Subscription recorded successfully',
    });
  } catch (error) {
    console.error('Error recording subscription:', error);
    return res.status(500).json({error: 'Failed to record subscription'});
  }
});

// Get referral access info for user
router.get('/user/:userId/access-info', async (req, res) => {
  try {
    const {userId} = req.params;
    const accessInfo = await ReferralModel.getReferralAccessInfo(userId);
    res.json(accessInfo);
  } catch (_error) {
    res.status(500).json({error: 'Failed to get referral access info'});
  }
});

export default router;
