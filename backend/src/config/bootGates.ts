/**
 * Boot-time gating decisions for `server.ts`.
 *
 * Centralises the env-presence checks for scheduled jobs and singletons that
 * fire on or shortly after `app.listen` so a fresh local clone (no `.env`)
 * doesn't kick off Discord-bound, Stripe-bound, or Firebase-bound work that
 * has nothing useful to do.
 *
 * Each gate is a pure function of `process.env`. The wiring lives in
 * `server.ts`; this module is just the decision logic so it can be unit-
 * tested without spinning up Express. See docs/codebase-assessment.md F-OA-2.
 */

export interface BootGates {
  /**
   * Stripe billing surface: route mounts (`/api/webhooks/stripe`,
   * `/api/v1/payments`, `/api/v1/subscriptions`, `/api/v1/admin/subscriptions`)
   * plus the `SubscriptionMonitor.startDailyMonitoring` boot job.
   */
  stripeBilling: boolean;
  /** DailyNotificationService.startDailyChecks — FCM pushes via Firebase Admin. */
  dailyNotifications: boolean;
  /** Hourly recipe-cache maintenance interval. Production-only. */
  recipeCacheMaintenance: boolean;
  /** SystemGuardian.startMonitoring — periodic health check. Production-only. */
  systemGuardian: boolean;
  /** Mount POST /contact (Resend-backed contact form). */
  contactForm: boolean;
}

/**
 * Read from the supplied env (defaults to `process.env`) and decide which
 * boot-time jobs should activate.
 */
export function computeBootGates(
  env: NodeJS.ProcessEnv = process.env,
): BootGates {
  const isProduction = env.NODE_ENV === 'production';
  const hasStripeSecret = Boolean(env.STRIPE_SECRET_KEY);
  const hasFirebaseServiceAccount = Boolean(env.FIREBASE_SERVICE_ACCOUNT_PATH);
  const hasResendKey = Boolean(env.RESEND_API_KEY);

  return {
    stripeBilling: hasStripeSecret,
    dailyNotifications: hasFirebaseServiceAccount,
    recipeCacheMaintenance: isProduction,
    systemGuardian: isProduction,
    contactForm: hasResendKey,
  };
}
