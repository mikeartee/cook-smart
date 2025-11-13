# Cook Smart - Formal Requirements Document

## Core Functional Requirements

### R1: Ingredient Inventory Management
- **R1.1**: The system SHALL provide a prepopulated ingredient list for user selection
- **R1.2**: The system SHALL allow manual ingredient entry via "other ingredient" option
- **R1.3**: The system SHALL integrate barcode scanning for automatic ingredient identification
- **R1.4**: The system SHALL maintain user ingredient inventory persistently

### R2: Recipe Generation
- **R2.1**: The system SHALL generate recipes based on available ingredients
- **R2.2**: The system SHALL allow users to specify desired number of servings
- **R2.3**: The system SHALL provide exact match recipes
- **R2.4**: The system SHALL provide near-match recipes with missing ingredients highlighted in yellow
- **R2.5**: The system SHALL support multiple recipe APIs for reliability

### R3: Dietary Restrictions & Allergies
- **R3.1**: The system SHALL provide common dietary restriction options
- **R3.2**: The system SHALL allow custom dietary restriction entry
- **R3.3**: The system SHALL provide common food allergy options
- **R3.4**: The system SHALL allow custom allergy entry
- **R3.5**: The system SHALL allow users to hide or show conflicting recipes
- **R3.6**: The system SHALL highlight conflicting recipes in red with conflicting ingredients in red

### R4: Shopping List Integration
- **R4.1**: The system SHALL allow users to add missing ingredients to shopping list
- **R4.2**: The system SHALL maintain persistent shopping lists per user

### R5: User Account Management
- **R5.1**: The system SHALL support email-based user registration
- **R5.2**: The system SHALL maintain user sessions securely
- **R5.3**: The system SHALL store user preferences and data

### R6: Recipe Management
- **R6.1**: The system SHALL allow users to save favorite recipes
- **R6.2**: The system SHALL maintain user recipe collections

## Discord Integration Requirements

### R7: Feedback System
- **R7.1**: The system SHALL provide feedback button with predefined issue categories
- **R7.2**: The system SHALL provide custom text feedback option
- **R7.3**: The system SHALL send feedback to Discord webhook

### R8: Beta Activity Monitoring
- **R8.1**: The system SHALL send Discord notifications for new user signups
- **R8.2**: The system SHALL track and report user activity metrics

### R9: System Health Monitoring
- **R9.1**: The system SHALL integrate automatic repair/healer bot
- **R9.2**: The system SHALL send Discord alerts for system issues and repairs

## Monetization Requirements

### R10: Beta Access
- **R10.1**: The system SHALL provide free access to all working features during BETA
- **R10.2**: The system SHALL clearly display BETA status throughout application
- **R10.3**: The system SHALL mark non-working features as "Under Development"

### R11: Pre-Purchase System
- **R11.1**: The system SHALL offer pre-purchase options for full release
- **R11.2**: The system SHALL implement Stripe payment processing
- **R11.3**: The system SHALL support pricing tiers: $2.99/week, $6.99/month, $34.99/year (POST-BETA)
- **R11.4**: The system SHALL offer $24.99 yearly pricing for ALL users during BETA period
- **R11.5**: The system SHALL display "Most Popular" badge on yearly subscription option
- **R11.6**: The system SHALL show savings calculator displaying exact dollar savings for yearly option

### R12: Referral System
- **R12.1**: The system SHALL generate unique referral links per user
- **R12.2**: The system SHALL support referral sharing via email, social media, SMS
- **R12.3**: The system SHALL track referral conversions
- **R12.4**: The system SHALL reward 1 month free per successful yearly subscription referral
- **R12.5**: The system SHALL support unlimited referrals per user
- **R12.6**: The system SHALL provide 7-day free trial for referred users (POST-BETA only)
- **R12.7**: The system SHALL offer $24.99 yearly pricing during 7-day trial period (POST-BETA only)
- **R12.8**: The system SHALL revert to $34.99 yearly pricing after trial expires (POST-BETA only)

### R13: Points System
- **R13.1**: The system SHALL assign unique point values to user actions
- **R13.2**: The system SHALL track cumulative user points
- **R13.3**: The system SHALL reward free month subscription at 500 points
- **R13.4**: The system SHALL maintain point history per user

## Administrative Requirements

### R14: Admin Dashboard
- **R14.1**: The system SHALL provide separate admin URL with secure login
- **R14.2**: The system SHALL use default credentials: admin/admin123 with forced change
- **R14.3**: The system SHALL track system health and status
- **R14.4**: The system SHALL display user metrics (total, active, new signups, growth)
- **R14.5**: The system SHALL support password reset functionality
- **R14.6**: The system SHALL support subscription management (alter, gift, revoke, cancel)
- **R14.7**: The system SHALL support badge management (founders, legacy, loyalty)

## Technical Requirements

### R15: Performance & Scalability
- **R15.1**: The system SHALL support 250 concurrent BETA users
- **R15.2**: The system SHALL scale to handle growth beyond 250 users
- **R15.3**: The system SHALL support 1000+ recipe requests per day

### R16: API Integration
- **R16.1**: The system SHALL use free/low-cost barcode scanning API
- **R16.2**: The system SHALL integrate multiple recipe APIs for reliability
- **R16.3**: The system SHALL fetch actual recipe results (no mock data)

### R17: Mobile Transition
- **R17.1**: The system SHALL be built to easily convert to native mobile apps
- **R17.2**: The system SHALL maintain feature parity across web and future mobile versions