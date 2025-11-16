# Requirements Document

## Introduction

The Cook Smart subscription pricing system provides tiered pricing options for users during beta and post-beta phases. The system manages promotional pricing for early adopters and referrals while ensuring all subscriptions renew at standard rates. The pricing structure incentivizes early adoption and referrals while maintaining sustainable long-term revenue through standardized renewal pricing.

## Glossary

- **Subscription_System**: The backend service that manages user subscription plans, pricing, and billing through Stripe
- **Beta_Phase**: The initial testing period where only yearly subscriptions are available at promotional pricing
- **Post_Beta_Phase**: The period after beta ends when all subscription tiers become available with free trials
- **Referral_Discount**: A promotional price applied to yearly subscriptions when a user signs up via a referral code
- **Auto_Renewal**: The automatic charging of a subscription at the end of its billing period
- **Standard_Rate**: The full-price renewal rate of $34.99/year for all yearly subscriptions
- **Free_Trial**: A 7-day period where users can access premium features without payment
- **Stripe_Product**: A product entity in Stripe representing a subscription tier
- **Price_ID**: A unique identifier in Stripe for a specific price point of a product

## Requirements

### Requirement 1

**User Story:** As a beta user, I want to purchase a yearly subscription at a discounted rate, so that I can support the app early and save money

#### Acceptance Criteria

1. WHILE THE Subscription_System is in Beta_Phase, THE Subscription_System SHALL offer yearly subscriptions at $24.99
2. WHEN a beta user purchases a yearly subscription, THE Subscription_System SHALL set the renewal price to $34.99
3. WHEN a beta yearly subscription reaches its renewal date, THE Subscription_System SHALL charge $34.99
4. WHILE THE Subscription_System is in Beta_Phase, THE Subscription_System SHALL NOT display monthly or weekly subscription options
5. WHEN a user views subscription options during Beta_Phase, THE Subscription_System SHALL display only the yearly $24.99 option

### Requirement 2

**User Story:** As a user with a referral code, I want to get a discounted yearly subscription, so that I can benefit from being referred by an existing user

#### Acceptance Criteria

1. WHEN a user provides a valid referral code during signup, THE Subscription_System SHALL offer a yearly subscription at $24.99
2. WHEN a referred user purchases a yearly subscription, THE Subscription_System SHALL set the renewal price to $34.99
3. WHEN a referred yearly subscription reaches its renewal date, THE Subscription_System SHALL charge $34.99
4. WHEN a user provides a referral code in Post_Beta_Phase, THE Subscription_System SHALL apply the $24.99 promotional price
5. WHEN a user provides a referral code in Beta_Phase, THE Subscription_System SHALL apply the $24.99 promotional price

### Requirement 3

**User Story:** As a post-beta user, I want to choose between yearly, monthly, or weekly subscriptions with a free trial, so that I can select the payment frequency that works best for me

#### Acceptance Criteria

1. WHEN THE Subscription_System enters Post_Beta_Phase, THE Subscription_System SHALL offer yearly subscriptions at $34.99
2. WHEN THE Subscription_System enters Post_Beta_Phase, THE Subscription_System SHALL offer monthly subscriptions at $6.99
3. WHEN THE Subscription_System enters Post_Beta_Phase, THE Subscription_System SHALL offer weekly subscriptions at $2.99
4. WHEN a post-beta user selects any subscription tier, THE Subscription_System SHALL provide a 7-day Free_Trial
5. WHEN a Free_Trial expires without cancellation, THE Subscription_System SHALL charge the user at their selected subscription rate

### Requirement 4

**User Story:** As a user with any subscription type, I want my subscription to auto-renew at the appropriate rate, so that I maintain uninterrupted access to premium features

#### Acceptance Criteria

1. WHEN a yearly subscription (purchased at $24.99) reaches renewal, THE Subscription_System SHALL charge $34.99
2. WHEN a yearly subscription (purchased at $34.99) reaches renewal, THE Subscription_System SHALL charge $34.99
3. WHEN a monthly subscription reaches renewal, THE Subscription_System SHALL charge $6.99
4. WHEN a weekly subscription reaches renewal, THE Subscription_System SHALL charge $2.99
5. WHEN any subscription renewal fails, THE Subscription_System SHALL notify the user and suspend premium access

### Requirement 5

**User Story:** As a system administrator, I want to manage beta phase status and subscription availability, so that I can control which subscription tiers are available to users

#### Acceptance Criteria

1. THE Subscription_System SHALL maintain a configuration flag indicating Beta_Phase or Post_Beta_Phase status
2. WHEN an administrator changes the phase status, THE Subscription_System SHALL update available subscription options within 60 seconds
3. WHEN THE Subscription_System is in Beta_Phase, THE Subscription_System SHALL return only yearly subscription options via API
4. WHEN THE Subscription_System is in Post_Beta_Phase, THE Subscription_System SHALL return all subscription options via API
5. THE Subscription_System SHALL log all phase status changes with administrator identification and timestamp

### Requirement 6

**User Story:** As a developer integrating with Stripe, I want the system to create and manage appropriate Stripe products and prices, so that billing is handled correctly

#### Acceptance Criteria

1. THE Subscription_System SHALL create a Stripe_Product for yearly subscriptions with two Price_IDs ($24.99 and $34.99)
2. THE Subscription_System SHALL create a Stripe_Product for monthly subscriptions with one Price_ID ($6.99)
3. THE Subscription_System SHALL create a Stripe_Product for weekly subscriptions with one Price_ID ($2.99)
4. WHEN creating a subscription for a beta or referred user, THE Subscription_System SHALL use the $24.99 Price_ID with $34.99 renewal Price_ID
5. WHEN creating a subscription for a post-beta user without referral, THE Subscription_System SHALL use the Standard_Rate Price_ID

### Requirement 7

**User Story:** As a user, I want to see clear pricing information before subscribing, so that I understand what I will be charged initially and upon renewal

#### Acceptance Criteria

1. WHEN a user views subscription options, THE Subscription_System SHALL display the initial price
2. WHEN a user views a promotional subscription option, THE Subscription_System SHALL display the renewal price
3. WHEN a user views post-beta subscription options, THE Subscription_System SHALL display the 7-day Free_Trial information
4. THE Subscription_System SHALL display all prices in USD with two decimal places
5. WHEN a user selects a subscription, THE Subscription_System SHALL show a confirmation screen with initial and renewal pricing details
