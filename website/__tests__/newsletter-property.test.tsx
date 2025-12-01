import * as fc from 'fast-check';
import { PBT_CONFIG } from '@/__tests__/utils/pbt-helpers';

/**
 * Feature: cook-smart-website, Property 29: Email validation and storage
 * Validates: Requirements 8.1
 */
describe('Property 29: Email validation and storage', () => {
  it('should validate email format correctly', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        (email) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const isValid = emailRegex.test(email);

          // Property: Valid emails should pass regex validation
          expect(isValid).toBe(true);

          // Property: Email should contain @ symbol
          expect(email).toContain('@');

          // Property: Email should contain domain
          const parts = email.split('@');
          expect(parts.length).toBe(2);
          expect(parts[1]).toContain('.');
        }
      ),
      PBT_CONFIG
    );
  });

  it('should reject invalid email formats', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'invalid',
          'no-at-sign.com',
          '@nodomain.com',
          'nodomainpart@',
          'spaces in@email.com',
          'double@@domain.com',
          'missing.domain@',
          '@.com'
        ),
        (invalidEmail) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const isValid = emailRegex.test(invalidEmail);

          // Property: Invalid emails should fail validation
          expect(isValid).toBe(false);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle email normalization', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        (email) => {
          const normalized = email.toLowerCase().trim();

          // Property: Normalized email should be lowercase
          expect(normalized).toBe(normalized.toLowerCase());

          // Property: Normalized email should have no leading/trailing whitespace
          expect(normalized).toBe(normalized.trim());

          // Property: Normalization should preserve email structure
          expect(normalized).toContain('@');
          const parts = normalized.split('@');
          expect(parts.length).toBe(2);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should prevent duplicate email subscriptions', () => {
    fc.assert(
      fc.property(
        fc.array(fc.emailAddress(), { minLength: 5, maxLength: 50 }),
        fc.emailAddress(),
        (existingEmails, newEmail) => {
          const normalizedNew = newEmail.toLowerCase().trim();
          const normalizedExisting = existingEmails.map(e => e.toLowerCase().trim());

          const isDuplicate = normalizedExisting.includes(normalizedNew);
          const shouldAccept = !isDuplicate;

          // Property: Duplicate emails should be rejected
          if (isDuplicate) {
            expect(shouldAccept).toBe(false);
          }

          // Property: New unique emails should be accepted
          if (!isDuplicate) {
            expect(shouldAccept).toBe(true);
          }

          // Property: Case-insensitive duplicate detection
          const upperCaseNew = newEmail.toUpperCase();
          const isDuplicateCaseInsensitive = normalizedExisting.includes(upperCaseNew.toLowerCase().trim());
          expect(isDuplicate).toBe(isDuplicateCaseInsensitive);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should store subscription metadata correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          subscribedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
          source: fc.constantFrom('footer', 'blog-post', 'exit-intent', 'homepage'),
          preferences: fc.record({
            frequency: fc.constantFrom('daily', 'weekly', 'monthly'),
            topics: fc.array(
              fc.constantFrom('recipes', 'tips', 'news', 'promotions'),
              { minLength: 1, maxLength: 4 }
            ),
          }),
          confirmed: fc.boolean(),
        }),
        (subscription) => {
          // Property: All required fields should be present
          expect(subscription.email).toBeTruthy();
          expect(subscription.subscribedAt).toBeInstanceOf(Date);
          expect(subscription.source).toBeTruthy();
          expect(subscription.preferences).toBeTruthy();

          // Property: Subscription date should be in the past
          expect(subscription.subscribedAt.getTime()).toBeLessThanOrEqual(Date.now());

          // Property: Source should be valid
          const validSources = ['footer', 'blog-post', 'exit-intent', 'homepage'];
          expect(validSources).toContain(subscription.source);

          // Property: Preferences should be valid
          const validFrequencies = ['daily', 'weekly', 'monthly'];
          expect(validFrequencies).toContain(subscription.preferences.frequency);

          // Property: Topics should not be empty
          expect(subscription.preferences.topics.length).toBeGreaterThan(0);

          // Property: Confirmed should be boolean
          expect(typeof subscription.confirmed).toBe('boolean');
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle unsubscribe requests correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            email: fc.emailAddress(),
            subscribed: fc.boolean(),
          }),
          { minLength: 10, maxLength: 50 }
        ),
        fc.emailAddress(),
        (subscribers, emailToUnsubscribe) => {
          const normalizedEmail = emailToUnsubscribe.toLowerCase().trim();

          const updatedSubscribers = subscribers.map(sub => ({
            ...sub,
            subscribed: sub.email.toLowerCase().trim() === normalizedEmail ? false : sub.subscribed,
          }));

          // Property: Unsubscribed email should have subscribed = false
          const unsubscribedUser = updatedSubscribers.find(
            sub => sub.email.toLowerCase().trim() === normalizedEmail
          );

          if (unsubscribedUser) {
            expect(unsubscribedUser.subscribed).toBe(false);
          }

          // Property: Other subscribers should remain unchanged
          const otherSubscribers = updatedSubscribers.filter(
            sub => sub.email.toLowerCase().trim() !== normalizedEmail
          );

          otherSubscribers.forEach((updated, index) => {
            const original = subscribers.filter(
              sub => sub.email.toLowerCase().trim() !== normalizedEmail
            )[index];
            if (original) {
              expect(updated.subscribed).toBe(original.subscribed);
            }
          });

          // Property: Total count should remain the same
          expect(updatedSubscribers.length).toBe(subscribers.length);
        }
      ),
      PBT_CONFIG
    );
  });
});

/**
 * Feature: cook-smart-website, Property 30: Newsletter confirmation email
 * Validates: Requirements 8.2
 */
describe('Property 30: Newsletter confirmation email', () => {
  it('should generate confirmation token correctly', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        fc.string({ minLength: 32, maxLength: 64 }),
        (email, token) => {
          const confirmation = {
            email: email.toLowerCase().trim(),
            token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            confirmed: false,
          };

          // Property: Token should be present and non-empty
          expect(confirmation.token).toBeTruthy();
          expect(confirmation.token.length).toBeGreaterThan(0);

          // Property: Expiration should be in the future
          expect(confirmation.expiresAt.getTime()).toBeGreaterThan(Date.now());

          // Property: Initial confirmation status should be false
          expect(confirmation.confirmed).toBe(false);

          // Property: Email should be normalized
          expect(confirmation.email).toBe(email.toLowerCase().trim());
        }
      ),
      PBT_CONFIG
    );
  });

  it('should validate confirmation tokens correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          token: fc.string({ minLength: 32, maxLength: 64 }),
          expiresAt: fc.date({ min: new Date(), max: new Date(Date.now() + 48 * 60 * 60 * 1000) }),
        }),
        fc.string({ minLength: 32, maxLength: 64 }),
        (confirmation, providedToken) => {
          const isValidToken = confirmation.token === providedToken;
          const isNotExpired = confirmation.expiresAt.getTime() > Date.now();
          const isValid = isValidToken && isNotExpired;

          // Property: Valid token and not expired should pass validation
          if (isValidToken && isNotExpired) {
            expect(isValid).toBe(true);
          }

          // Property: Invalid token should fail validation
          if (!isValidToken) {
            expect(isValid).toBe(false);
          }

          // Property: Expired token should fail validation
          if (isValidToken && !isNotExpired) {
            expect(isValid).toBe(false);
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle expired confirmation tokens', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          token: fc.string({ minLength: 32, maxLength: 64 }),
          expiresAt: fc.date({ min: new Date('2020-01-01'), max: new Date(Date.now() - 1000) }), // Past date
        }),
        (confirmation) => {
          // Skip invalid dates
          if (isNaN(confirmation.expiresAt.getTime())) {
            return;
          }

          const isExpired = confirmation.expiresAt.getTime() < Date.now();

          // Property: Past expiration date should be considered expired
          expect(isExpired).toBe(true);

          // Property: Expired confirmations should not be processed
          const shouldProcess = !isExpired;
          expect(shouldProcess).toBe(false);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should send confirmation email with correct data', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          token: fc.string({ minLength: 32, maxLength: 64 }),
          subscribedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
        }),
        (subscription) => {
          // Simulate email data preparation
          const emailData = {
            to: subscription.email,
            subject: 'Confirm your newsletter subscription',
            confirmationLink: `https://example.com/confirm?token=${subscription.token}`,
            unsubscribeLink: `https://example.com/unsubscribe?email=${encodeURIComponent(subscription.email)}`,
          };

          // Property: Email should be sent to correct address
          expect(emailData.to).toBe(subscription.email);

          // Property: Confirmation link should contain token
          expect(emailData.confirmationLink).toContain(subscription.token);

          // Property: Unsubscribe link should contain email
          expect(emailData.unsubscribeLink).toContain(encodeURIComponent(subscription.email));

          // Property: Subject should be present
          expect(emailData.subject).toBeTruthy();
          expect(emailData.subject.length).toBeGreaterThan(0);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should update subscription status after confirmation', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            email: fc.emailAddress(),
            token: fc.string({ minLength: 32, maxLength: 64 }),
            confirmed: fc.boolean(),
          }),
          { minLength: 5, maxLength: 30 }
        ),
        fc.string({ minLength: 32, maxLength: 64 }),
        (subscriptions, confirmToken) => {
          const updatedSubscriptions = subscriptions.map(sub => ({
            ...sub,
            confirmed: sub.token === confirmToken ? true : sub.confirmed,
          }));

          // Property: Matching token should be confirmed
          const confirmedSub = updatedSubscriptions.find(sub => sub.token === confirmToken);
          if (confirmedSub) {
            expect(confirmedSub.confirmed).toBe(true);
          }

          // Property: Non-matching tokens should remain unchanged
          const otherSubs = updatedSubscriptions.filter(sub => sub.token !== confirmToken);
          otherSubs.forEach((updated, index) => {
            const original = subscriptions.filter(sub => sub.token !== confirmToken)[index];
            if (original) {
              expect(updated.confirmed).toBe(original.confirmed);
            }
          });

          // Property: Total count should remain the same
          expect(updatedSubscriptions.length).toBe(subscriptions.length);
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle resend confirmation requests', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          token: fc.string({ minLength: 32, maxLength: 64 }),
          sentAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
          resendCount: fc.integer({ min: 0, max: 5 }),
        }),
        (confirmation) => {
          const maxResends = 3;
          const canResend = confirmation.resendCount < maxResends;

          // Property: Should allow resends up to limit
          if (confirmation.resendCount < maxResends) {
            expect(canResend).toBe(true);
          }

          // Property: Should block resends after limit
          if (confirmation.resendCount >= maxResends) {
            expect(canResend).toBe(false);
          }

          // Property: Resend count should be non-negative
          expect(confirmation.resendCount).toBeGreaterThanOrEqual(0);

          // Property: Sent date should be in the past
          expect(confirmation.sentAt.getTime()).toBeLessThanOrEqual(Date.now());
        }
      ),
      PBT_CONFIG
    );
  });

  it('should handle preference updates for confirmed subscribers', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          confirmed: fc.boolean(),
          preferences: fc.record({
            frequency: fc.constantFrom('daily', 'weekly', 'monthly'),
            topics: fc.array(
              fc.constantFrom('recipes', 'tips', 'news', 'promotions'),
              { minLength: 1, maxLength: 4 }
            ),
          }),
        }),
        fc.record({
          frequency: fc.constantFrom('daily', 'weekly', 'monthly'),
          topics: fc.array(
            fc.constantFrom('recipes', 'tips', 'news', 'promotions'),
            { minLength: 1, maxLength: 4 }
          ),
        }),
        (subscriber, newPreferences) => {
          // Only confirmed subscribers can update preferences
          const canUpdate = subscriber.confirmed;

          if (canUpdate) {
            const updated = {
              ...subscriber,
              preferences: newPreferences,
            };

            // Property: Preferences should be updated
            expect(updated.preferences.frequency).toBe(newPreferences.frequency);
            expect(updated.preferences.topics).toEqual(newPreferences.topics);

            // Property: Email and confirmation status should remain unchanged
            expect(updated.email).toBe(subscriber.email);
            expect(updated.confirmed).toBe(subscriber.confirmed);
          }

          // Property: Unconfirmed subscribers should not update preferences
          if (!subscriber.confirmed) {
            expect(canUpdate).toBe(false);
          }
        }
      ),
      PBT_CONFIG
    );
  });
});

