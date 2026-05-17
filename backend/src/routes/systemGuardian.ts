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
 * Manual nuclear option route REMOVED in issue #22 (PRD #20 / slice #21).
 *
 * Rationale: the prior `POST /nuke` route called `SystemGuardian.manualNuke`
 * which spawned `git pull && npm install && npm run build && pm2 restart all`
 * via `child_process.exec` from inside the running Node process — a
 * 15%-error-rate / 500ms-DB-latency trigger could fire it ambiently. See
 * `docs/codebase-assessment.md` finding F-OA-1.
 */

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
