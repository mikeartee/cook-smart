import express from 'express';
import { ReferralModel } from '../models/Referral';

const router = express.Router();

// Create new referral
router.post('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.body;
    
    const referralCode = await ReferralModel.createReferral(userId, email);
    res.json({ success: true, referralCode });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create referral' });
  }
});

// Get user's referrals
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const referrals = await ReferralModel.getUserReferrals(userId);
    res.json(referrals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get referrals' });
  }
});

// Get referral stats
router.get('/user/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await ReferralModel.getReferralStats(userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get referral stats' });
  }
});

// Complete referral (called during signup)
router.post('/complete', async (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;
    
    if (!referralCode || !newUserId) {
      return res.status(400).json({ error: 'Referral code and user ID required' });
    }
    
    const success = await ReferralModel.completeReferral(referralCode, newUserId);
    
    if (success) {
      res.json({ success: true, message: 'Referral completed successfully' });
    } else {
      res.status(400).json({ error: 'Invalid or expired referral code' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete referral' });
  }
});

// Validate referral code
router.get('/validate/:referralCode', async (req, res) => {
  try {
    const { referralCode } = req.params;
    const referral = await ReferralModel.getReferralByCode(referralCode);
    
    if (!referral) {
      return res.status(404).json({ error: 'Referral code not found' });
    }
    
    if (referral.status !== 'pending') {
      return res.status(400).json({ error: 'Referral code is not valid' });
    }
    
    res.json({ 
      valid: true, 
      referrerId: referral.referrerId,
      message: 'Valid referral code' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate referral code' });
  }
});

export default router;