# Implementation Plan

- [x] 1. Set up database schema and migrations



  - Create migration file for subscription_plans table with columns: id, plan_name, stripe_product_id, promotional_price_id, standard_price_id, billing_interval, available_in_beta, trial_days, timestamps
  - Create migration file for app_configuration table with columns: id, config_key, config_value, updated_by, updated_at
  - Add columns to subscriptions table: promotional_price_used (BOOLEAN), referral_code_used (VARCHAR), initial_price (DECIMAL), renewal_price (DECIMAL)
  - Add database indexes on subscriptions (user_id, stripe_subscription_id, status)
  - _Requirements: 5.1, 6.1, 6.2, 6.3_

- [x] 2. Initialize Stripe products and prices


  - Create Stripe product for yearly subscription with name "Cook Smart Premium - Yearly"
  - Create promotional price ($24.99/year) for yearly product
  - Create standard price ($34.99/year) for yearly product
  - Create Stripe product for monthly subscription with name "Cook Smart Premium - Monthly" and price ($6.99/month)
  - Create Stripe product for weekly subscription with name "Cook Smart Premium - Weekly" and price ($2.99/week)
  - Create setup script to initialize products and store IDs in database
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 3. Implement PhaseManagementService


  - Create PhaseManagementService class with methods: isBetaPhase(), setPhase(), getPhaseConfig()
  - Implement database queries to read/write app_configuration table
  - Add caching layer for phase status with 5-minute TTL
  - Implement admin authorization check for setPhase method
  - Add logging for phase status changes with admin ID and timestamp
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4. Implement SubscriptionPricingService core logic


  - Create SubscriptionPricingService class with determinePricing method
  - Implement pricing logic for beta phase (always $24.99 → $34.99 for yearly)
  - Implement pricing logic for post-beta with referral code ($24.99 → $34.99 for yearly)
  - Implement pricing logic for post-beta without referral (standard prices)
  - Implement getAvailablePlans method that filters plans based on phase
  - Add validation to ensure monthly/weekly plans are not available in beta
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3, 5.3, 5.4_

- [x] 5. Extend StripeService for promotional pricing


  - Add createSubscriptionWithPromotion method to StripeService
  - Implement Stripe Subscription Schedule creation for promotional → standard price transition
  - Configure schedule with two phases: promotional price (1 iteration) and standard price (recurring)
  - Add updateSubscriptionRenewalPrice method for manual renewal price updates
  - Implement setupSubscriptionProducts method to create/retrieve Stripe products
  - Add error handling for Stripe API failures with proper error types
  - _Requirements: 6.4, 6.5, 4.1, 4.2_

- [x] 6. Implement subscription creation flow



  - Create createSubscription method in SubscriptionPricingService
  - Validate referral code if provided using existing ReferralService
  - Call determinePricing to get correct price IDs
  - Create or retrieve Stripe customer for user
  - Call createSubscriptionWithPromotion with appropriate price IDs and trial days
  - Store subscription in database with promotional_price_used, referral_code_used, initial_price, renewal_price
  - Return SubscriptionResult with client secret for payment confirmation
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.4, 3.4, 6.4_

- [x] 7. Create API endpoints for subscription management


  - Create GET /api/subscriptions/plans endpoint that returns available plans based on phase
  - Create POST /api/subscriptions/create endpoint for subscription creation
  - Create GET /api/subscriptions/phase endpoint to return current phase status
  - Create POST /api/admin/subscriptions/phase endpoint for admin phase updates (with auth middleware)
  - Add request validation middleware for all endpoints
  - Add error handling middleware with proper error responses
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.5_

- [x] 8. Implement Stripe webhook handlers for subscription events


  - Add webhook handler for customer.subscription.created event
  - Add webhook handler for customer.subscription.updated event
  - Add webhook handler for invoice.payment_succeeded event (activate subscription)
  - Add webhook handler for invoice.payment_failed event (notify user, suspend access)
  - Add webhook handler for customer.subscription.deleted event (cancel subscription)
  - Add webhook handler for customer.subscription.trial_will_end event (notify user)
  - Implement webhook signature verification for security
  - Add async processing for webhook events to prevent timeouts
  - _Requirements: 4.5_

- [x] 9. Update Subscription model with new fields and methods


  - Add fields to Subscription model: promotionalPriceUsed, referralCodeUsed, initialPrice, renewalPrice
  - Implement updateRenewalPrice method on Subscription model
  - Implement applyPromotion method to mark subscription as promotional
  - Add validation to ensure renewal price is always set correctly
  - Update existing subscription queries to include new fields
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 10. Create SubscriptionPlan model and seed data



  - Create SubscriptionPlan model class with fields from design
  - Implement static method getAvailablePlans that filters by phase
  - Implement static method findByName for plan lookup
  - Create seed script to populate subscription_plans table with Stripe product/price IDs
  - Add validation to ensure plan data integrity
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 11. Build mobile app subscription UI components


  - Create SubscriptionPlansScreen to display available plans
  - Implement plan cards showing initial price, renewal price, and trial information
  - Add promotional badge for beta/referral discounted plans
  - Create referral code input field with validation
  - Implement Stripe payment sheet integration for subscription purchase
  - Add loading states and error handling for subscription creation
  - Display clear pricing information per requirements (initial, renewal, trial)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 12. Implement subscription management in mobile app


  - Create SubscriptionContext to manage subscription state
  - Add API service methods for fetching plans and creating subscriptions
  - Implement subscription status checking and premium feature gating
  - Add subscription cancellation flow
  - Create subscription details screen showing current plan, next billing date, and pricing
  - Handle subscription renewal notifications
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 13. Add admin dashboard phase management UI


  - Create phase management section in admin dashboard
  - Add toggle or button to switch between beta and post-beta phases
  - Display current phase status and last updated information
  - Show warning before phase changes about impact on available plans
  - Implement API calls to update phase status
  - Add audit log display for phase changes
  - _Requirements: 5.1, 5.2, 5.5_

- [x] 14. Implement caching and performance optimizations

  - Add Redis/in-memory cache for phase status with 5-minute TTL
  - Add cache for available subscription plans with 10-minute TTL
  - Implement cache invalidation on phase status changes
  - Add database query optimization with proper indexes
  - Implement connection pooling for database queries
  - _Requirements: 5.2_

- [x] 15. Add comprehensive error handling and logging

  - Create custom error classes: InvalidPhaseError, InvalidReferralCodeError, StripeProductSetupError, SubscriptionCreationError, RenewalPriceUpdateError
  - Implement error response formatting with error codes
  - Add logging for all subscription creation attempts
  - Add logging for pricing decisions and promotional applications
  - Log all Stripe API calls and responses
  - Implement error notification to Discord for critical subscription failures
  - _Requirements: 4.5_

- [x] 16. Create database migration runner and rollback scripts

  - Implement migration runner to execute all subscription pricing migrations
  - Create rollback scripts for each migration
  - Add migration status tracking in database
  - Test migrations on development database
  - Document migration process for production deployment
  - _Requirements: 5.1_

- [x] 17. Write integration tests for subscription flows

  - Test beta user subscription creation with $24.99 → $34.99 pricing
  - Test post-beta user with referral code subscription flow
  - Test post-beta user without referral subscription flow
  - Test phase switching and plan availability changes
  - Test subscription renewal with correct pricing
  - Test webhook event processing for all subscription events
  - Mock Stripe API calls for testing
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_

- [x] 18. Deploy and configure production Stripe products



  - Create production Stripe products and prices matching test setup
  - Update environment variables with production Stripe keys and product IDs
  - Run database migrations on production database
  - Seed subscription_plans table with production Stripe IDs
  - Set initial phase to 'beta' in production
  - Configure Stripe webhook endpoint for production
  - Test end-to-end subscription flow in production
  - _Requirements: 6.1, 6.2, 6.3, 5.1_
