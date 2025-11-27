import pool from '../config/database';

export interface PhaseConfig {
  isBeta: boolean;
  updatedAt: Date;
  updatedBy: string | null;
}

/**
 * PhaseManagementService
 * Manages beta/post-beta phase configuration for the application
 */
export class PhaseManagementService {
  private static phaseCache: {value: boolean; timestamp: number} | null = null;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Check if the application is currently in beta phase
   * Uses caching to reduce database queries
   */
  static async isBetaPhase(): Promise<boolean> {
    const now = Date.now();

    // Check cache first
    if (this.phaseCache && now - this.phaseCache.timestamp < this.CACHE_TTL) {
      return this.phaseCache.value;
    }

    // Fetch from database
    const query = `
      SELECT config_value 
      FROM app_configuration 
      WHERE config_key = 'beta_phase'
    `;

    try {
      const result = await pool.query(query);

      if (result.rows.length === 0) {
        // Default to beta if not configured
        console.warn('Beta phase configuration not found, defaulting to true');
        return true;
      }

      const isBeta = result.rows[0].config_value === 'true';

      // Update cache
      this.phaseCache = {
        value: isBeta,
        timestamp: now,
      };

      return isBeta;
    } catch (error) {
      console.error('Error fetching beta phase status:', error);
      // Default to beta on error
      return true;
    }
  }

  /**
   * Update the phase status (admin only)
   * @param phase - 'beta' or 'post-beta'
   * @param adminId - ID of the admin making the change
   */
  static async setPhase(
    phase: 'beta' | 'post-beta',
    adminId: string,
  ): Promise<void> {
    const isBeta = phase === 'beta';

    const query = `
      INSERT INTO app_configuration (config_key, config_value, updated_by, updated_at)
      VALUES ('beta_phase', $1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (config_key) 
      DO UPDATE SET 
        config_value = EXCLUDED.config_value,
        updated_by = EXCLUDED.updated_by,
        updated_at = CURRENT_TIMESTAMP
    `;

    try {
      await pool.query(query, [isBeta.toString(), adminId]);

      // Invalidate cache
      this.phaseCache = null;

      console.log(
        `Phase updated to ${phase} by admin ${adminId} at ${new Date().toISOString()}`,
      );
    } catch (error) {
      console.error('Error updating phase status:', error);
      throw new Error('Failed to update phase status');
    }
  }

  /**
   * Get the current phase configuration with metadata
   */
  static async getPhaseConfig(): Promise<PhaseConfig> {
    const query = `
      SELECT config_value, updated_at, updated_by
      FROM app_configuration 
      WHERE config_key = 'beta_phase'
    `;

    try {
      const result = await pool.query(query);

      if (result.rows.length === 0) {
        // Return default configuration
        return {
          isBeta: true,
          updatedAt: new Date(),
          updatedBy: null,
        };
      }

      const row = result.rows[0];

      return {
        isBeta: row.config_value === 'true',
        updatedAt: row.updated_at,
        updatedBy: row.updated_by,
      };
    } catch (error) {
      console.error('Error fetching phase configuration:', error);
      throw new Error('Failed to fetch phase configuration');
    }
  }

  /**
   * Invalidate the phase cache (useful after manual updates)
   */
  static invalidateCache(): void {
    this.phaseCache = null;
  }
}
