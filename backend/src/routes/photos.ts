import {Router} from 'express';
import {PhotoUploadService} from '../services/PhotoUploadService';
import {authenticateToken, AuthRequest} from '../middleware/auth';

const router = Router();

// Upload photo
router.post('/upload', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.user!.id);
    const {photo, entityType, entityId} = req.body;

    if (!photo || !entityType) {
      res.status(400).json({error: 'Photo and entity type are required'});
      return;
    }

    const photoUrl = await PhotoUploadService.savePhoto(
      userId,
      photo,
      entityType,
      entityId,
    );

    res.json({success: true, photoUrl});
  } catch (error: any) {
    console.error('Error uploading photo:', error);
    res.status(500).json({error: error.message || 'Failed to upload photo'});
  }
});

// Delete photo
router.delete(
  '/:photoUrl',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.user!.id);
      const photoUrl = decodeURIComponent(req.params.photoUrl);

      await PhotoUploadService.deletePhoto(photoUrl, userId);

      res.json({success: true, message: 'Photo deleted'});
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      res.status(500).json({error: error.message || 'Failed to delete photo'});
    }
  },
);

// Get user photo stats
router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.user!.id);
    const stats = await PhotoUploadService.getUserPhotoStats(userId);

    res.json({success: true, stats});
  } catch (error) {
    console.error('Error getting photo stats:', error);
    res.status(500).json({error: 'Failed to get photo stats'});
  }
});

export default router;
