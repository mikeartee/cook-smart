import express from 'express';
import SystemGuardian from '../services/SystemGuardian';
import {authenticateToken} from '../middleware/auth';

const router = express.Router();

/**
 * Get System Guardian status
 * GET /api/v1/system-guardian/status
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = SystemGuardian.getStatus();
    const history = SystemGuardian.getRepairHistory();

    res.json({
      status,
      recentRepairs: history.slice(-10), // Last 10 repairs
    });
  } catch (error) {
    console.error('Error getting System Guardian status:', error);
    res.status(500).json({
      error: 'Failed to get status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Start monitoring
 * POST /api/v1/system-guardian/start
 */
router.post('/start', authenticateToken, async (req, res) => {
  try {
    SystemGuardian.startMonitoring();

    res.json({
      message: 'System Guardian monitoring started',
      status: SystemGuardian.getStatus(),
    });
  } catch (error) {
    console.error('Error starting System Guardian:', error);
    res.status(500).json({
      error: 'Failed to start monitoring',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Stop monitoring
 * POST /api/v1/system-guardian/stop
 */
router.post('/stop', authenticateToken, async (req, res) => {
  try {
    SystemGuardian.stopMonitoring();

    res.json({
      message: 'System Guardian monitoring stopped',
      status: SystemGuardian.getStatus(),
    });
  } catch (error) {
    console.error('Error stopping System Guardian:', error);
    res.status(500).json({
      error: 'Failed to stop monitoring',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Manual nuclear option (emergency use only)
 * POST /api/v1/system-guardian/nuke
 */
router.post('/nuke', authenticateToken, async (req, res) => {
  try {
    const {reason} = req.body;

    if (!reason) {
      return res.status(400).json({
        error: 'Reason required',
        message: 'You must provide a reason for initiating nuclear option',
      });
    }

    // This is async but we respond immediately
    SystemGuardian.manualNuke(reason);

    return res.json({
      message: 'Nuclear option initiated',
      reason,
      warning:
        'System will rebuild and restart. This may take several minutes.',
    });
  } catch (error) {
    console.error('Error initiating nuclear option:', error);
    return res.status(500).json({
      error: 'Failed to initiate nuclear option',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get repair history
 * GET /api/v1/system-guardian/history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const history = SystemGuardian.getRepairHistory();

    res.json({
      total: history.length,
      repairs: history,
    });
  } catch (error) {
    console.error('Error getting repair history:', error);
    res.status(500).json({
      error: 'Failed to get history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
