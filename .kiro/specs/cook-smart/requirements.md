# Cook Smart - Formal Requirements Document

## Core Functional Requirements

### R1: Ingredient Inventory Management
- **R1.1**: The system SHALL provide a comprehensive prepopulated ingredient database with 500+ common ingredients
- **R1.2**: The system SHALL categorize ingredients (proteins, vegetables, fruits, grains, dairy, spices, etc.)
- **R1.3**: The system SHALL provide searchable ingredient selection with autocomplete
- **R1.4**: The system SHALL allow manual ingredient entry via "Add Custom Ingredient" option
- **R1.5**: The system SHALL save user-added custom ingredients for future selection
- **R1.6**: The system SHALL integrate barcode scanning for automatic ingredient identification
- **R1.7**: The system SHALL maintain user ingredient inventory persistently
- **R1.8**: The system SHALL allow ingredient quantity and expiration date tracking (optional)
- **R1.9**: The system SHALL provide ingredient synonyms and alternate names for better matching

### R2: Recipe Generation
- **R2.1**: The system SHALL generate recipes based on available ingredients
- **R2.2**: The system SHALL allow users to specify desired number of servings
- **R2.3**: The system SHALL provide exact match recipes
- **R2.4**: The system SHALL provide near-match recipes with missing ingredients highlighted in yellow
- **R2.5**: The system SHALL support multiple recipe APIs for reliability
- **R2.6**: The system SHALL filter recipes by difficulty level
- **R2.7**: The system SHALL filter recipes by cooking time duration
- **R2.8**: The system SHALL suggest complementary recipes based on user's recent cooking activity

### R3: Dietary Restrictions & Allergies
- **R3.1**: The system SHALL provide common dietary restriction options
- **R3.2**: The system SHALL allow custom dietary restriction entry
- **R3.3**: The system SHALL provide common food allergy options
- **R3.4**: The system SHALL allow custom allergy entry
- **R3.5**: The system SHALL allow users to hide or show conflicting recipes
- **R3.6**: The system SHALL highlight conflicting recipes in red with conflicting ingredients in red
- **R3.7**: The system SHALL provide ingredient substitution suggestions for dietary restrictions
- **R3.8**: The system SHALL provide ingredient substitution suggestions for allergies
- **R3.9**: The system SHALL allow users to request alternate ingredients for specific recipe ingredients
- **R3.10**: The system SHALL maintain a database of common ingredient substitutions

### R4: Shopping List Integration
- **R4.1**: The system SHALL allow users to add missing ingredients to shopping list
- **R4.2**: The system SHALL maintain persistent shopping lists per user

### R5: User Account Management
- **R5.1**: The system SHALL support email-based user registration
- **R5.2**: The system SHALL maintain user sessions securely
- **R5.3**: The system SHALL store user preferences and data
- **R5.4**: The system SHALL detect Co-Founder email (brianaolszewski1@gmail.com) during registration
- **R5.5**: The system SHALL display special welcome message for Co-Founder before app access
- **R5.6**: The system SHALL automatically assign Co-Founder badge to Briana Olszewski
- **R5.7**: The system SHALL grant lifetime subscription to Co-Founder account
- **R5.8**: The system SHALL display "Inspired by Briana Olszewski" credit in app About section

### R6: Recipe Management
- **R6.1**: The system SHALL allow users to save favorite recipes
- **R6.2**: The system SHALL maintain user recipe collections
- **R6.3**: The system SHALL provide recipe difficulty ratings (Easy/Medium/Hard)
- **R6.4**: The system SHALL provide cooking time filters (Under 30min, 30-60min, 60+ min)
- **R6.5**: The system SHALL provide recipe scaling calculator for serving size adjustment
- **R6.6**: The system SHALL provide unit conversion tools (Metric/Imperial)
- **R6.7**: The system SHALL provide built-in cooking timers for recipe steps
- **R6.8**: The system SHALL provide leftover recipe suggestions based on recent cooking history
- **R6.9**: The system SHALL provide print-friendly recipe formatting
- **R6.10**: The system SHALL provide offline storage for favorited recipes
- **R6.11**: The system SHALL display ingredient substitution suggestions within recipe view
- **R6.12**: The system SHALL allow users to save recipes with their preferred substitutions
- **R6.13**: The system SHALL display basic nutrition information per serving (calories, protein, carbs, fat)
- **R6.14**: The system SHALL automatically adjust nutrition values when recipes are scaled
- **R6.15**: The system SHALL update nutrition information when ingredient substitutions are made
- **R6.16**: The system SHALL allow users to show/hide nutrition information based on preferences

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

### R11: Subscription System
- **R11.1**: The system SHALL implement Stripe payment processing
- **R11.2**: The system SHALL support pricing tiers: $2.99/week, $6.99/month, $34.99/year (POST-BETA)
- **R11.3**: The system SHALL offer $24.99 yearly pricing for ALL users during BETA period (FIRST PURCHASE ONLY)
- **R11.4**: The system SHALL display "Most Popular" badge on yearly subscription option
- **R11.5**: The system SHALL show savings calculator displaying exact dollar savings for yearly option
- **R11.6**: The system SHALL exempt BETA purchasers from trial system (already paid $24.99)
- **R11.7**: The system SHALL renew BETA purchasers at $34.99 yearly after initial subscription expires
- **R11.8**: The system SHALL support promotional discount codes for special sales

### R12: Referral System
- **R12.1**: The system SHALL generate unique referral links per user
- **R12.2**: The system SHALL support referral sharing via email, social media, SMS
- **R12.3**: The system SHALL track referral conversions
- **R12.4**: The system SHALL reward 1 month free per successful yearly subscription referral
- **R12.5**: The system SHALL support unlimited referrals per user

### R12A: Universal Trial System (POST-BETA)
- **R12A.1**: The system SHALL provide 7-day free trial for ALL non-paying users
- **R12A.2**: The system SHALL offer $24.99 yearly pricing during ANY 7-day trial period (FIRST PURCHASE ONLY)
- **R12A.3**: The system SHALL revert to $34.99 yearly pricing after trial expires
- **R12A.4**: The system SHALL apply to BETA users who didn't purchase, referral users, and organic users
- **R12A.5**: The system SHALL renew ALL subscriptions at $34.99 yearly (regardless of initial purchase price)
- **R12A.6**: The system SHALL allow manual discount application for promotional sales

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
- **R14.7**: The system SHALL support badge management (co-founder, founders, legacy, loyalty)
- **R14.8**: The system SHALL protect Co-Founder account from subscription modifications

## Technical Requirements

### R15: Performance & Scalability
- **R15.1**: The system SHALL support 250 concurrent BETA users
- **R15.2**: The system SHALL scale to handle growth beyond 250 users
- **R15.3**: The system SHALL support 1000+ recipe requests per day

### R16: API Integration
- **R16.1**: The system SHALL use free/low-cost barcode scanning API
- **R16.2**: The system SHALL integrate multiple recipe APIs for reliability
- **R16.3**: The system SHALL fetch actual recipe results (no mock data)
- **R16.4**: The system SHALL integrate USDA nutrition database API for ingredient nutrition data
- **R16.5**: The system SHALL calculate recipe nutrition totals from ingredient nutrition data

### R17: Mobile Transition
- **R17.1**: The system SHALL be built to easily convert to native mobile apps
- **R17.2**: The system SHALL maintain feature parity across web and future mobile versions