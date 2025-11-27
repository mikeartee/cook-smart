import pool from '../config/database';
import {v4 as uuidv4} from 'uuid';
import fs from 'fs';
import path from 'path';

export class PhotoUploadService {
  private static UPLOAD_DIR = path.join(__dirname, '../../uploads/photos');
  private static MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  /**
   * Initialize upload directory
   */
  static init() {
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, {recursive: true});
    }
  }

  /**
   * Save photo from base64
   */
  static async savePhoto(
    userId: number,
    base64Data: string,
    entityType: 'ingredient' | 'recipe',
    entityId?: number,
  ): Promise<string> {
    try {
      // Remove data URL prefix if present
      const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Image, 'base64');

      if (buffer.length > this.MAX_FILE_SIZE) {
        throw new Error('File size exceeds 5MB limit');
      }

      // Generate unique filename
      const filename = `${uuidv4()}.jpg`;
      const filepath = path.join(this.UPLOAD_DIR, filename);

      // Save file
      fs.writeFileSync(filepath, buffer);

      // Generate URL
      const photoUrl = `/uploads/photos/${filename}`;

      // Track in database
      await pool.query(
        `INSERT INTO uploaded_photos (user_id, photo_url, file_size, mime_type, entity_type, entity_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, photoUrl, buffer.length, 'image/jpeg', entityType, entityId],
      );

      return photoUrl;
    } catch (error) {
      console.error('Error saving photo:', error);
      throw error;
    }
  }

  /**
   * Delete photo
   */
  static async deletePhoto(photoUrl: string, userId: number): Promise<void> {
    try {
      // Verify ownership
      const result = await pool.query(
        'SELECT id FROM uploaded_photos WHERE photo_url = $1 AND user_id = $2',
        [photoUrl, userId],
      );

      if (result.rows.length === 0) {
        throw new Error('Photo not found or unauthorized');
      }

      // Delete file
      const filename = path.basename(photoUrl);
      const filepath = path.join(this.UPLOAD_DIR, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }

      // Delete from database
      await pool.query('DELETE FROM uploaded_photos WHERE photo_url = $1', [
        photoUrl,
      ]);
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  /**
   * Get user's photo count and total size
   */
  static async getUserPhotoStats(userId: number) {
    const result = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size
       FROM uploaded_photos WHERE user_id = $1`,
      [userId],
    );
    return result.rows[0];
  }
}

// Initialize on import
PhotoUploadService.init();
