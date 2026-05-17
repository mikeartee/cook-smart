/**
 * Unit tests for src/config/bootGates.ts.
 *
 * Pins the post-#25 contract: scheduled boot-time jobs are gated behind the
 * env vars they need to do anything useful. On a fresh local clone with no
 * `.env`, none of the Discord-bound or Stripe-bound monitoring should fire.
 *
 * See docs/codebase-assessment.md F-OA-2.
 */

import {computeBootGates, BootGates} from './bootGates';

describe('computeBootGates (issue #25)', () => {
  describe('with an empty environment', () => {
    it('disables every gate', () => {
      const gates = computeBootGates({});

      expect(gates).toEqual({
        healthMonitor: false,
        subscriptionMonitor: false,
        dailyNotifications: false,
        recipeCacheMaintenance: false,
        systemGuardian: false,
      } satisfies BootGates);
    });
  });

  describe('healthMonitor gate', () => {
    it('opens when DISCORD_ERROR_WEBHOOK_URL is set', () => {
      const gates = computeBootGates({
        DISCORD_ERROR_WEBHOOK_URL: 'https://discord.com/api/webhooks/abc',
      });

      expect(gates.healthMonitor).toBe(true);
    });

    it('opens when DISCORD_ERROR_WEBHOOK is set (legacy variant)', () => {
      const gates = computeBootGates({
        DISCORD_ERROR_WEBHOOK: 'https://discord.com/api/webhooks/abc',
      });

      expect(gates.healthMonitor).toBe(true);
    });

    it('stays closed when no Discord webhook env vars are set', () => {
      const gates = computeBootGates({
        STRIPE_SECRET_KEY: 'present-but-irrelevant',
      });

      expect(gates.healthMonitor).toBe(false);
    });

    it('stays closed when the webhook URL is an empty string', () => {
      const gates = computeBootGates({DISCORD_ERROR_WEBHOOK_URL: ''});

      expect(gates.healthMonitor).toBe(false);
    });
  });

  describe('subscriptionMonitor gate', () => {
    it('opens when STRIPE_SECRET_KEY is set', () => {
      const gates = computeBootGates({STRIPE_SECRET_KEY: 'sk_test_abc'});

      expect(gates.subscriptionMonitor).toBe(true);
    });

    it('stays closed when STRIPE_SECRET_KEY is unset or empty', () => {
      expect(computeBootGates({}).subscriptionMonitor).toBe(false);
      expect(
        computeBootGates({STRIPE_SECRET_KEY: ''}).subscriptionMonitor,
      ).toBe(false);
    });
  });

  describe('dailyNotifications gate', () => {
    it('opens when FIREBASE_SERVICE_ACCOUNT_PATH is set', () => {
      const gates = computeBootGates({
        FIREBASE_SERVICE_ACCOUNT_PATH: '/etc/cook-smart/firebase.json',
      });

      expect(gates.dailyNotifications).toBe(true);
    });

    it('stays closed when FIREBASE_SERVICE_ACCOUNT_PATH is unset or empty', () => {
      expect(computeBootGates({}).dailyNotifications).toBe(false);
      expect(
        computeBootGates({FIREBASE_SERVICE_ACCOUNT_PATH: ''})
          .dailyNotifications,
      ).toBe(false);
    });
  });

  describe('recipeCacheMaintenance gate', () => {
    it('opens when NODE_ENV is production', () => {
      const gates = computeBootGates({NODE_ENV: 'production'});

      expect(gates.recipeCacheMaintenance).toBe(true);
    });

    it('stays closed in development and test', () => {
      expect(
        computeBootGates({NODE_ENV: 'development'}).recipeCacheMaintenance,
      ).toBe(false);
      expect(computeBootGates({NODE_ENV: 'test'}).recipeCacheMaintenance).toBe(
        false,
      );
    });
  });

  describe('systemGuardian gate', () => {
    it('opens only when NODE_ENV is production', () => {
      expect(computeBootGates({NODE_ENV: 'production'}).systemGuardian).toBe(
        true,
      );
      expect(computeBootGates({NODE_ENV: 'development'}).systemGuardian).toBe(
        false,
      );
      expect(computeBootGates({NODE_ENV: 'test'}).systemGuardian).toBe(false);
      expect(computeBootGates({}).systemGuardian).toBe(false);
    });
  });

  describe('with a fully-configured production environment', () => {
    it('opens every gate (regression guard for production)', () => {
      const gates = computeBootGates({
        NODE_ENV: 'production',
        DISCORD_ERROR_WEBHOOK_URL: 'https://discord.com/api/webhooks/abc',
        STRIPE_SECRET_KEY: 'sk_live_abc',
        FIREBASE_SERVICE_ACCOUNT_PATH: '/etc/cook-smart/firebase.json',
      });

      expect(gates).toEqual({
        healthMonitor: true,
        subscriptionMonitor: true,
        dailyNotifications: true,
        recipeCacheMaintenance: true,
        systemGuardian: true,
      } satisfies BootGates);
    });
  });
});
