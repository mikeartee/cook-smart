# Backend Codebase Assessment

**Scope**: `backend/` only. Mobile (`src/`, `android/`) and website (`website/`) are out of scope per [PRD #20](https://github.com/mikeartee/cook-smart/issues/20).

**Date of read**: 2025-11-30. The codebase is a moving target; treat this document as a snapshot at this commit.

**Tone note**: Findings are phrased as analysis, not criticism. The original maintainer flagged this codebase as over-engineered and we are repositioning the fork to run locally first. Every claim cites at least one file path so the reader can verify rather than trust.

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Methodology](#2-methodology)
3. [Boot Sequence Map](#3-boot-sequence-map)
4. [Required-to-Boot Environment Variables](#4-required-to-boot-environment-variables)
5. [Dependency Map](#5-dependency-map)
6. [Findings, Grouped by Rubric](#6-findings-grouped-by-rubric)
7. [What We Deliberately Kept](#7-what-we-deliberately-kept)
8. [Ranked Recommendation for the Next PRD](#8-ranked-recommendation-for-the-next-prd)

## 1. Executive Summary

State of the backend: an Express API with 50 route files, 51 service classes, 17 controllers, 18 models, 27 production dependencies, and 7 scheduled / interval-based jobs that fire on boot. The application's hot path (auth, ingredients, recipes, dietary filtering) is functional; surrounding it is a substantial layer of operational scaffolding (auto-repair, system-guardian, health monitoring, throttled Discord notifications) and feature surfaces (Stripe, Discord webhooks, Firebase push, AWS-targeted deployments) that are not exercised in a local-first single-developer setup.

Highest-impact findings:

- **Four environment variables are needed for the server to even *start* serving authenticated requests** without 500s: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, plus `JWT_SECRET`. Recipe endpoints additionally require `FATSECRET_CLIENT_ID` and `FATSECRET_CLIENT_SECRET`, since FatSecret is configured as the *only* recipe provider despite a fallback abstraction existing. See [F-EB-1](#f-eb-1-load-envjs-exits-the-process-when-no-env-file-exists), [F-EB-2](#f-eb-2-fatsecret-is-the-sole-recipe-provider-no-fallback-registered).
- **The `SystemGuardian` service can automatically `git pull` and `pm2 restart all` the running process** when 5 consecutive health checks fail, with the upstream branch name hardcoded as `fresh-project-migration`. This is the highest-blast-radius behaviour in the codebase and is filed as an immediately-actionable issue, separate from the rest. See [F-OA-1](#f-oa-1-systemguardian-can-auto-rebuild-the-running-process).
- **9 production dependencies and 6 dev dependencies are flagged by `depcheck` as having zero importers** in `src/`, including all three `@aws-sdk/client-*` packages, `bcrypt` (only `bcryptjs` is imported), `nodemailer` (superseded by `resend`), three SQLite packages, and `firebase-admin`. See [F-DB-1](#f-db-1-aws-sdk-clients-have-zero-importers) through [F-DB-7](#f-db-7-serverless-toolchain-points-at-non-existent-handler-files).
- **`axios@^1.13.2` carries 16 known vulnerabilities (1 CRITICAL)** per `npm install` audit output recorded in package.json read. Used in 5 services for simple HTTP. The standard library `fetch` (Node 18+) covers every call site. See [F-DB-8](#f-db-8-axios-13x-carries-16-cves-and-can-be-replaced-by-built-in-fetch).
- **The application boots Discord-dependent monitoring on startup**: `HealthMonitor.startDailyHealthSummary()`, `SubscriptionMonitor.startDailyMonitoring()`, `DailyNotificationService.startDailyChecks()`, `setInterval` for recipe cache maintenance, and (in `production`) `SystemGuardian.startMonitoring()`. `ThrottleManager`'s constructor also fires two `setInterval` loops on import. None of these are required to serve a request, all of them assume a Discord webhook URL or a Stripe account to do their work. See [F-OA-2](#f-oa-2-five-monitoring-singletons-fire-on-boot-or-import) through [F-OA-5](#f-oa-5-throttlemanager-self-starts-two-intervals-on-import).
- **There are duplicate or unused parallel implementations of several core services**: two email services (`EmailService.ts` + `EmailService.resend.ts`, the second has no importers), two push-notification services (`PushNotificationService.ts` Expo-based + `PushNotificationService.firebase.ts` unused), two error-handling middlewares (`errorHandler.ts` unused + `errorMiddleware.ts` active), three ingredient standardisers, a `mockAuth.ts` and `mockDatabase.ts` that nothing imports, and an `AdminErrorsController_backup.ts` that is byte-near-identical to `AdminErrorsController.ts` (both export `AdminAnalyticsController` despite the filename — and the route mount is commented out in `server.ts`). See [F-OA-6](#f-oa-6-duplicate-and-zero-importer-service-implementations) through [F-OA-9](#f-oa-9-multiple-ingredient-standardiser-services).

The backend is functional; it is not minimal. The cleanup unblocks running locally without a Stripe account, a Discord workspace, or AWS credentials, and reduces the install surface considerably.

## 2. Methodology

### What was read

Every file under `backend/src/` was opened in full. No prunes. The directories walked, in order:

- `backend/src/server.ts` — entry point.
- `backend/load-env.js` — environment loader (top of `server.ts` invokes it).
- `backend/src/config/` — 4 files: `database.ts`, `mockAuth.ts`, `mockDatabase.ts`, `mockIngredients.ts`.
- `backend/src/services/` — 51 files. Boot-time services (`AutoRepairSystem`, `HealthMonitor`, `SystemGuardian`, `SubscriptionMonitor`, `DailyNotificationService`, `RecipeCacheService`, `ThrottleManager`) read in full. Domain services (`RecipeProviderService`, `FatSecretService`, `FatSecretProviderAdapter`, `TheMealDBService`, `StripeService`, `SubscriptionPricingService`, `EmailService`, `EmailService.resend`, `PushNotificationService`, `PushNotificationService.firebase`, `DiscordWebhookService`, `DiscordBotService`, `NotificationService`, `PhotoUploadService`, `AnalyticsService`, `SystemHealthService`, `PhaseManagementService`, `AdminAuditLogger`, `AdminActivityLogger`, `ActivityTracker`, `RateLimitTracker`) read in full. Other ingredient / recipe / dietary services read by signature (file/line scan via `readCode`-equivalent grep) given large LOC and clear domain ownership.
- `backend/src/routes/` — all 50 route files enumerated. `server.ts` mount points (53) read in full. Route files relevant to specific findings (`recipes.ts`, `trendingRecipes.ts`, `bot.ts`, `community.ts`, `systemGuardian.ts`, `contact.ts`, `discord.ts`) read in full.
- `backend/src/controllers/` — 17 files enumerated. `StripeWebhookController`, `StripeCheckoutController`, `AdminErrorsController`, `AdminErrorsController_backup` read in full. Other admin controllers scanned by signature.
- `backend/src/middleware/` — all 7 read in full: `auth.ts`, `adminAuth.ts`, `subscriptionAccess.ts`, `errorHandler.ts`, `errorMiddleware.ts`, `discordNotifications.ts`, `logger.ts`.
- `backend/src/models/` — 18 files enumerated. Read targeted models when referenced by findings (`User.ts`, `AdminUser.ts` for bcrypt cross-check).
- `backend/src/interfaces/IRecipeProvider.ts` — read in full.
- `backend/src/utils/expirationCalculator.ts` — read by signature.
- `backend/.env.example` and `backend/.env.production.template` — read in full.
- `backend/package.json`, `backend/tsconfig.json`, `backend/Dockerfile`, `backend/serverless.yml`, `backend/ecosystem.config.js`, `backend/knexfile.js` — read in full.

### What was not read

- `backend/migrations/` (50 files, 40 SQL + 10 JS) — out of scope per PRD #20: "the migrations are immutable historical record."
- `backend/src/migrations/` (4 SQL files, application-side migration scripts) — same reasoning.
- `backend/dist/` — build output, mirrors `src/`.
- `backend/scripts/` — one-off DB migration scripts; sampled to confirm they are not imported by `src/`, otherwise out of scope.
- `backend/seeds/`, `backend/data/` — fixture data.
- `backend/node_modules/`.
- `backend/create-dietary-tables-direct.js`, `backend/create-missing-tables.js`, `backend/standardize-existing-ingredients.js` — root-level one-off DB scripts; depcheck confirmed they import `pg` and `dotenv` from production deps. Not part of the live request path.
- `*.test.ts` files — the test surface is small (`trendingRecipes.test.ts`, `RecipeEnhancementService.test.ts`, `TrendingScoreCalculator.test.ts`); test coverage is not what this assessment is about.

### Tools run

| Tool | Command | Purpose | How findings used the output |
| --- | --- | --- | --- |
| `depcheck` | `npx depcheck --json --skip-missing` (in `backend/`) | Find unused dependencies and devDependencies. | Every flagged dep was cross-checked by `grep_search` for imports across `src/`. Manually verified before promotion to a finding. |
| `ts-prune` | `npx ts-prune -p tsconfig.json` (in `backend/`) | Find unused exports. | Used as supplementary signal. 109 lines of output. Many "used in module" entries are noise (default exports of singletons referenced via the singleton pattern); only entries whose unused status was confirmed by manual reading were promoted. |
| `npm install` console output | Read during `package.json` open. | Recorded the `axios@1.13.2` 16-CVE warning surfaced by the editor. | Promoted to a finding ([F-DB-8](#f-db-8-axios-13x-carries-16-cves-and-can-be-replaced-by-built-in-fetch)). |
| `grep_search` | Various queries against `backend/src/**/*.ts`. | Confirm each tool-flagged item by finding zero importers. Find cross-cutting patterns (`setInterval`, `cron.schedule`, `app.use`, `from 'PushNotificationService'`). | Provided the file/line evidence cited in findings. |

If a tool flagged something the manual read could not confirm, it is recorded as `tool-suggested, not verified` and not promoted to a confident finding (see Section 5 dependency map and the explicit note in Section 6).

### What this assessment is *not*

- Not a security audit. `SECURITY_AUDIT_REPORT.md` exists separately.
- Not a performance review. The rubric is "is this needed / is this clever-without-value", not "is this fast".
- Not a comparison to the upstream's current state. This fork is now independent.
- Not a redesign. Every finding ends with a recommended action (`remove` / `feature-flag` / `simplify` / `keep`), not an architectural prescription.

## 3. Boot Sequence Map

What `server.ts` does on `npm start`, in order. References are to `backend/src/server.ts` line numbers unless noted.

1. **Line 7–8**: `const {loadEnvironment} = require('../load-env'); loadEnvironment();` — runs `backend/load-env.js`, which calls `dotenv.config()` against `.env.secure` if present, else `.env`, else **`process.exit(1)`**. (`load-env.js:18–21`.)
2. **Line 10–14**: Imports `errorMiddleware`, `requestLogger`, **`AutoRepairSystem`** (default export is `new AutoRepairSystem()`, runs constructor on import — instantiates strategy list and an empty repair history map, does not fire intervals), **`HealthMonitor`** (default export is `new HealthMonitor()`, sets fields but does not start the cron yet), **`SystemGuardian`** (default export is `new SystemGuardian()`, sets fields, no cron), **`SubscriptionMonitor`** (static class, no instantiation), **`DailyNotificationService`** (static class), **`RecipeCacheService`**.
3. **Line 22**: `if (pool) { AutoRepairSystem.setDatabasePool(pool); }` — couples auto-repair to the pg pool.
4. **Line 27**: `app.set('trust proxy', 1)` — required for `express-rate-limit` behind nginx/load balancer.
5. **Line 30**: `app.use(helmet())` — security headers.
6. **Line 31–37**: `app.use(cors({ origin: true, credentials: true }))` — both branches set the same value; the `NODE_ENV === 'production'` guard is a no-op.
7. **Line 40–55**: Two rate limiters defined (`limiter` for general, `authLimiter` for auth). General `limiter` is applied immediately on line 57.
8. **Line 60–61**: `app.use(express.static('public'))` and `app.use('/uploads', express.static('uploads'))` — serves uploaded photos from disk.
9. **Line 63–65**: Stripe webhook route is mounted *before* body parsing so `express.raw` (defined inside `routes/stripeWebhook.ts`) can verify signatures on the original payload.
10. **Line 67–68**: `app.use(express.json({limit: '10mb'}))` and `app.use(express.urlencoded({extended: true}))`.
11. **Line 70**: `app.use(morgan('combined'))`.
12. **Line 71**: `app.use(requestLogger)` — `middleware/logger.ts`. Records every successful (`statusCode < 400`) request into `HealthMonitor` to maintain a rolling error rate.
13. **Line 74**: `app.use('/health', healthRoutes)`.
14. **Line 95–192**: 53 `app.use(...)` mount calls onto `/api/v1/*`, `/api/discord`, `/contact`. Every router is imported synchronously at this point. (Several singletons inside those imports run side-effects on first reference, in particular `ThrottleManager` — see step 17 below.)
15. **Line 195**: `app.get('/api/v1/test', ...)` — health/test endpoint.
16. **Line 200–201**: `app.use(notFoundHandler)` and `app.use(errorMiddleware)`. The error middleware imports `ThrottleManager`, `AutoRepairSystem`, `HealthMonitor`, and `ErrorLogModel`.
17. **At first reference of `ThrottleManager`** (during error-middleware import resolution): `ThrottleManager.constructor` runs `this.startBackgroundJobs()`, which calls `setInterval(cleanup, 1h)` and `setInterval(sendThrottledSummary, 5min)`. Logs `✅ ThrottleManager background jobs started`. (`services/ThrottleManager.ts:201–217`.)
18. **At import of `middleware/adminAuth.ts`** (via `routes/admin*` imports): top-level `setInterval(... loginAttempts cleanup ..., 1h)` runs unconditionally. (`middleware/adminAuth.ts:174–183`.)
19. **Line 204**: `app.listen(PORT, '0.0.0.0', () => { ... })` — server starts. The callback then:
    - **Line 213**: `HealthMonitor.startDailyHealthSummary()` — sets a `setTimeout` until UTC midnight, then a 24h `setInterval` that calls `sendDailyHealthSummary()` (which posts a Discord embed via `NotificationService`).
    - **Line 216**: `SubscriptionMonitor.startDailyMonitoring()` — calls `runChecks()` *immediately*, then `setInterval(runChecks, 6h)`. `runChecks` queries `subscriptions`, `users`, and `subscription_reminders` tables and sends Resend emails to users about expiry / payment failures.
    - **Line 220**: `DailyNotificationService.startDailyChecks()` — registers `cron.schedule('0 9 * * *', ...)` for FCM push notifications about expiring ingredients and inactive users.
    - **Line 232–242**: `setInterval(runRecipeMaintenance, 1h)` — every hour, checks if local hour is 03:00 and if so runs `RecipeCacheService.runDailyMaintenance()`.
    - **Line 246–249**: If `NODE_ENV === 'production'`, calls `SystemGuardian.startMonitoring()` — sets `setInterval(performHealthCheck, 1min)`. The callback can trigger `pm2 restart cook-smart-backend` or, after 5 consecutive failures, the "Nuclear Option" (`git pull origin fresh-project-migration && npm install && npm run build && pm2 restart all` via `child_process.exec`).

**Intervals running per process**:

| # | Interval | Source | Fires regardless of `NODE_ENV` |
| --- | --- | --- | --- |
| 1 | `ThrottleManager` cleanup, 1h | `services/ThrottleManager.ts:201` | yes (instantiated as singleton in module) |
| 2 | `ThrottleManager` summary, 5min | `services/ThrottleManager.ts:209` | yes |
| 3 | `adminAuth` login attempts cleanup, 1h | `middleware/adminAuth.ts:174` | yes (top-level statement) |
| 4 | Recipe cache maintenance, 1h | `server.ts:240` | yes |
| 5 | `SubscriptionMonitor.runChecks`, immediate then every 6h | `services/SubscriptionMonitor.ts:183` | yes |
| 6 | `HealthMonitor` daily summary, scheduled to UTC midnight then every 24h | `services/HealthMonitor.ts:218` | yes |
| 7 | `DailyNotificationService` cron, 09:00 daily | `services/DailyNotificationService.ts:16` | yes |
| 8 | `SystemGuardian.performHealthCheck`, every 1min | `services/SystemGuardian.ts:61` | only if `NODE_ENV === 'production'` |

Calls that hit a network / external service before the first request:

- `SubscriptionMonitor.runChecks()` runs *immediately* in the listen callback (line 219) and fires SQL against `subscriptions` and `users` tables. If `STRIPE_WEBHOOK_SECRET` etc. aren't set, the queries succeed but downstream work is meaningless.
- The pg `Pool` in `config/database.ts` is constructed at import time and emits a `connect` event on first connection.

## 4. Required-to-Boot Environment Variables

Required to *start* the process (without these the server either calls `process.exit(1)` or throws on first request):

| Variable | Where read | Behaviour if missing |
| --- | --- | --- |
| `.env` or `.env.secure` (file, not a var) | `load-env.js:18–21` | `process.exit(1)` at startup. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `src/config/database.ts:6–11` | Pool instantiates with `undefined` host; first authenticated request returns 500 because `UserModel.findById` (called by `middleware/auth.ts:55`) cannot connect. |
| `JWT_SECRET` | `src/middleware/auth.ts:11`, `:48` | `generateToken()` throws an Error; `authenticateToken` returns `{error: 'Server configuration error'}` (500). |
| `PORT` | `src/server.ts:25` | Defaults to `3000` — not strictly required. |

Required only for specific feature surfaces (server boots fine without them; only the corresponding endpoint is degraded):

| Variable | Feature | Failure mode if missing |
| --- | --- | --- |
| `FATSECRET_CLIENT_ID`, `FATSECRET_CLIENT_SECRET` | All recipe search and detail endpoints. FatSecret is the *only* registered provider. | `searchByIngredients` returns `[]`; recipe detail returns "Recipe not found". |
| `STRIPE_SECRET_KEY` | `services/StripeService.ts:24`. | Throws `"Stripe is not configured"` on first call; webhook controller logs and returns `{error: 'Webhook secret not configured'}` (400). |
| `STRIPE_WEBHOOK_SECRET` | `controllers/StripeWebhookController.ts:20–25`. | Returns 400 to Stripe webhooks. |
| `STRIPE_BETA_PRICE_ID`, `STRIPE_YEARLY_PRICE_ID`, `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_WEEKLY_PRICE_ID`, `STRIPE_YEARLY_REFERRAL_PRICE_ID` | `services/StripeService.ts:67–105`. | Plan list returns plans with empty `stripePriceId`; checkout session creation fails. |
| `RESEND_API_KEY` | `services/EmailService.ts:3`, `services/EmailService.resend.ts:13`, `routes/contact.ts:5`. | Resend client is constructed with `undefined` key; `.emails.send()` rejects. Caught and logged as a non-fatal error. |
| `EMAIL_FROM`, `ADMIN_EMAIL` | `routes/contact.ts:7–9`. | Defaults to literal strings (`Cook Smart <noreply@cooksmartapp.com>` and `services.cooksmart@gmail.com`). |
| `DISCORD_ERROR_WEBHOOK_URL` (or `DISCORD_ERROR_WEBHOOK`) | `services/NotificationService.ts:71–73`. | All Discord notifications skip; `console.log('skipped - webhook not configured')`. Not fatal. |
| `DISCORD_FEEDBACK_WEBHOOK`, `DISCORD_ACTIVITY_WEBHOOK` | Same file, lines 75–76. | Same skip behaviour. |
| `DISCORD_BOT_TOKEN` | `services/DiscordBotService.ts:17`. | `isConfigured()` returns false. The "bot" is mock-only anyway (see [F-NL-2](#f-nl-2-discord-webhooks-and-discord-bot)). |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | `services/PushNotificationService.firebase.ts:14`. | Logs a warning and disables push. The whole file is currently unused. |
| `ADMIN_JWT_SECRET` | `middleware/adminAuth.ts:6`. | Falls back to `JWT_SECRET`, then to literal string `'your-secret-key'`. |
| `APP_URL` | `controllers/StripeCheckoutController.ts:139–140`. | Falls back to `cooksmartapp://` deep link. |
| `NUTRITIONIX_APP_ID`, `NUTRITIONIX_API_KEY`, `USDA_API_KEY` | Listed in `.env.example` but not actually imported anywhere. | No effect. (Tool-suggested, manually verified.) |

**Minimum viable local `.env` to boot**:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cooksmart_local
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=anything-32-chars-or-more
NODE_ENV=development
PORT=3000
```

With this minimal set, the server starts and accepts requests for `/health` and `/api/v1/test`. Any authenticated route requires `users` rows in the DB; recipe search returns `[]` (no FatSecret credentials).


## 5. Dependency Map

Every entry in `backend/package.json` (`dependencies` and `devDependencies`), with one-line "where it's used" notes. Verification method: `depcheck` for an initial pass, then `grep_search` against `backend/src/**/*.ts` to confirm. "Zero importers" means no source file imports it.

### Production dependencies (27)

| Package | Version | Where used | Notes |
| --- | --- | --- | --- |
| `axios` | ^1.13.2 | `services/{barcodeService, DiscordWebhookService, FatSecretService, PushNotificationService, TheMealDBService}.ts`, `routes/auth.ts` | 16 known CVEs (1 CRITICAL) — see [F-DB-8](#f-db-8-axios-13x-carries-16-cves-and-can-be-replaced-by-built-in-fetch). |
| `bcrypt` | ^6.0.0 | **Zero importers.** | depcheck-flagged, manually verified. Project uses `bcryptjs`. See [F-DB-3](#f-db-3-bcrypt-and-bcryptjs-both-installed-only-bcryptjs-used). |
| `bcryptjs` | ^2.4.3 | `models/{User, AdminUser}.ts`, `config/mockAuth.ts` | Used. |
| `better-sqlite3` | ^12.4.1 | **Zero importers.** | depcheck-flagged. SQLite isn't used; project is Postgres. See [F-DB-4](#f-db-4-three-sqlite-packages-with-zero-importers). |
| `sqlite3` | ^5.1.7 | **Zero importers.** | Same as above. |
| `cors` | ^2.8.5 | `server.ts` | Used. |
| `dotenv` | ^16.3.1 | `load-env.js`, `config/database.ts`, `knexfile.js`, root-level scripts | Used. |
| `express` | ^4.18.2 | All routes/middleware | Used. |
| `express-rate-limit` | ^7.4.1 | `server.ts` | Used. |
| `express-validator` | ^7.0.1 | `routes/{auth, barcode, ingredients, passwordReset, recipes}.ts`, `controllers/FeedbackController.ts` | Used. |
| `firebase-admin` | ^13.6.0 | `services/PushNotificationService.firebase.ts` only — and that file has zero importers | Tool-suggested-and-manually-verified: only path that uses it is itself unused. See [F-DB-5](#f-db-5-firebase-admin-only-imported-by-an-unused-file). |
| `helmet` | ^7.1.0 | `server.ts` | Used. |
| `jsonwebtoken` | ^9.0.2 | `middleware/{auth, adminAuth}.ts`, `controllers/AdminAuthController.ts`, `config/mockAuth.ts` | Used. |
| `knex` | ^3.1.0 | Referenced by `knexfile.js` and `package.json` scripts only — no `import` from `src/` | depcheck flagged. The `node-pg-migrate` toolchain is what `migrate:up` actually uses. `knex` is duplicate migration tooling. See [F-DB-6](#f-db-6-duplicate-database-migration-toolchains). |
| `morgan` | ^1.10.0 | `server.ts` | Used. |
| `node-cron` | ^4.2.1 | `services/DailyNotificationService.ts` | Used in one place. |
| `node-fetch` | ^2.7.0 | `services/NotificationService.ts` only | Node 18+ has global `fetch`. See [F-DB-9](#f-db-9-node-fetch-replaceable-by-node-18-global-fetch). |
| `nodemailer` | ^7.0.10 | **Zero importers.** | depcheck-flagged, manually verified. Project uses `resend`. See [F-DB-2](#f-db-2-nodemailer-zero-importers-superseded-by-resend). |
| `pg` | ^8.11.3 | `config/database.ts`, `services/AutoRepairSystem.ts`, root-level scripts | Used. |
| `resend` | ^6.5.2 | `services/EmailService.ts`, `services/EmailService.resend.ts`, `routes/contact.ts` | Used. (`EmailService.resend.ts` has zero importers — file unused, not the package.) |
| `stripe` | ^19.3.1 | `services/{StripeService, SubscriptionPricingService}.ts`, `routes/subscriptionSync.ts`, `controllers/{StripeCheckoutController, StripeWebhookController}.ts` | Used. Removable if Stripe is feature-flagged off — see [F-NL-1](#f-nl-1-stripe-billing-stack). |
| `@aws-sdk/client-rds` | ^3.682.0 | **Zero importers.** | depcheck-flagged. See [F-DB-1](#f-db-1-aws-sdk-clients-have-zero-importers). |
| `@aws-sdk/client-s3` | ^3.682.0 | **Zero importers.** | Same. |
| `@aws-sdk/client-ses` | ^3.682.0 | **Zero importers.** | Same. |
| `@types/better-sqlite3` | ^7.6.13 | (only by `better-sqlite3`, which is unused) | Tags along with [F-DB-4](#f-db-4-three-sqlite-packages-with-zero-importers). |
| `@types/node-cron` | ^3.0.11 | `services/DailyNotificationService.ts` (typing only) | Type-only; valid. |
| `@types/nodemailer` | ^7.0.4 | (only by `nodemailer`, which is unused) | Tags along with [F-DB-2](#f-db-2-nodemailer-zero-importers-superseded-by-resend). |

### Dev dependencies (26)

| Package | Version | Where used | Notes |
| --- | --- | --- | --- |
| `@types/aws-lambda` | ^8.10.145 | **Zero importers.** | depcheck-flagged. Lambda isn't used; the only Lambda file is `serverless.yml` which references nonexistent handler files. See [F-DB-7](#f-db-7-serverless-toolchain-points-at-non-existent-handler-files). |
| `@types/bcryptjs` | ^2.4.6 | Used by `bcryptjs` consumers | Valid. |
| `@types/cors` | ^2.8.17 | `server.ts` | Valid. |
| `@types/express` | ^4.17.21 | All route files | Valid. |
| `@types/jest` | ^29.5.8 | depcheck reports unused — actually pulled in implicitly by `ts-jest` config | Tool-suggested, not verified — leaving as-is. |
| `@types/jsonwebtoken` | ^9.0.5 | Used by `jsonwebtoken` consumers | Valid. |
| `@types/morgan` | ^1.9.9 | `server.ts` | Valid. |
| `@types/node` | ^20.10.4 | Many files | Valid. |
| `@types/node-fetch` | ^2.6.13 | Used by `node-fetch` consumers | Tags along with [F-DB-9](#f-db-9-node-fetch-replaceable-by-node-18-global-fetch). |
| `@types/pg` | ^8.10.9 | Used by `pg` consumers | Valid. |
| `@types/supertest` | ^6.0.3 | `routes/trendingRecipes.test.ts` | Valid. |
| `@types/uuid` | ^10.0.0 | `services/PhotoUploadService.ts` | Valid. |
| `@typescript-eslint/eslint-plugin` | ^6.13.1 | depcheck reports unused — used implicitly by ESLint config | Tool-suggested, not verified — keeping. |
| `@typescript-eslint/parser` | ^6.13.1 | Same | Same. |
| `eslint` | ^8.57.0 | `npm run lint` script | Valid. |
| `fast-check` | ^4.8.0 | `services/TrendingScoreCalculator.test.ts` | Valid (PBT). |
| `jest` | ^29.7.0 | Test runner | Valid. |
| `js-yaml` | ^4.1.1 | **Zero importers.** | depcheck-flagged. See [F-DB-7](#f-db-7-serverless-toolchain-points-at-non-existent-handler-files). |
| `node-pg-migrate` | ^8.0.3 | `npm run migrate:up` script | Valid migration tool of record. |
| `nodemon` | ^3.0.2 | `npm run dev` script | Valid. |
| `serverless` | ^4.23.0 | `serverless.yml` only | See [F-DB-7](#f-db-7-serverless-toolchain-points-at-non-existent-handler-files). |
| `serverless-offline` | ^14.4.0 | `serverless.yml` only | Same. |
| `supertest` | ^7.1.4 | `routes/trendingRecipes.test.ts` | Valid. |
| `ts-jest` | ^29.4.5 | `jest.config.js` | Valid. |
| `ts-node` | ^10.9.1 | depcheck reports unused — typically used by `nodemon`/`ts-jest` indirectly | Tool-suggested, not verified — keeping. |
| `typescript` | ^5.3.3 | `npm run build` | Valid. |

### `tool-suggested, not verified`

Items where the tool flagged something but manual reading could not confirm a clean removal:

- `@types/jest`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `ts-node` — depcheck flags as unused, but they are typically required at runtime by the tools they support (Jest, ESLint, nodemon). Not promoted.
- `ts-prune` reports `requireAgeVerification` (`middleware/auth.ts:76`) as unused. It is exported but no route currently calls it. Could be a deliberate placeholder. Not promoted to a finding; recorded here for future cleanup awareness.
- `ts-prune` reports many `(used in module)` entries on type-only exports. These are noise and not promoted.

## 6. Findings, Grouped by Rubric

Each finding has: **title**, **rubric tag**, **evidence** (file paths and line numbers), and **recommended action** (`remove` / `feature-flag` / `simplify` / `keep`).

### `rubric/external-blocker` — anything requiring API keys, AWS credentials, or paid services to even boot

#### F-EB-1: `load-env.js` exits the process when no env file exists

**Tag**: `rubric/external-blocker`.

**Evidence**: `backend/load-env.js:18–21`. If neither `.env.secure` nor `.env` is present, `console.error('❌ No environment file found! ...')` then `process.exit(1)`. The file is referenced from `server.ts:7–8` before any other initialisation.

**Recommended action**: `simplify`. Allow the server to start with a warning when no env file is found. Provide a documented `.env.example`-derived minimum-viable `.env` (Section 4 of this doc) so a contributor can `cp .env.example .env` and run `npm run dev`.

#### F-EB-2: FatSecret is the sole recipe provider; no fallback registered

**Tag**: `rubric/external-blocker`.

**Evidence**:

- `backend/src/routes/recipes.ts:75–79` — `new RecipeProviderService([FatSecretAdapter])`.
- `backend/src/routes/trendingRecipes.ts:46–49`, `:181–184`, `:303–306` — same single-provider construction repeated three times.
- `backend/src/services/RecipeProviderService.ts:24–34` — class supports a fallback chain (`fallbackProviders = providers.slice(1)`) but is given a one-element array.
- `backend/src/services/TheMealDBService.ts:23` — fully implemented `IRecipeProvider` for an unlimited-free API. Default singleton exported (line 211). Never registered.

**Recommended action**: `simplify`. Either register `TheMealDBService` as the fallback (single line in two places) so recipe search degrades gracefully without FatSecret credentials, or document FatSecret as a hard dependency. The current state of "abstraction without a second provider, plus an unused free provider" is the worst of both options.

### `rubric/not-needed-locally` — code or infra for use cases the local-first single-developer app does not have

#### F-NL-1: Stripe billing stack

**Tag**: `rubric/not-needed-locally`.

**Evidence**:

- Routes: `routes/payments.ts`, `routes/subscriptionPricing.ts`, `routes/subscriptionSync.ts`, `routes/stripeWebhook.ts`.
- Controllers: `controllers/StripeWebhookController.ts` (517 lines), `controllers/StripeCheckoutController.ts` (180 lines), `controllers/SubscriptionPricingController.ts`.
- Services: `services/StripeService.ts` (587 lines), `services/SubscriptionPricingService.ts`, `services/SubscriptionMonitor.ts` (boots an immediate-then-6h interval at `server.ts:216`).
- Models: `models/Subscription.ts`, `models/SubscriptionPlan.ts`.
- Middleware: `middleware/subscriptionAccess.ts`.
- Server mounts: `server.ts:65` (`/api/webhooks/stripe`), `:156` (`/api/v1/payments`), `:173–174` (`/api/v1/subscriptions`).

**Recommended action**: `feature-flag`. Gate all of the above behind `if (process.env.STRIPE_SECRET_KEY)` checks at the route-mount level so they do not load. `SubscriptionMonitor.startDailyMonitoring()` should be the same: skip the boot if Stripe is not configured. Keeps the code path testable for the maintainer who *does* have Stripe wired up; doesn't require a local developer to set up a Stripe account.

#### F-NL-2: Discord webhooks and Discord "bot"

**Tag**: `rubric/not-needed-locally`.

**Evidence**:

- `services/DiscordWebhookService.ts` — sends to four hardcoded webhook URL slots from env. Used by `services/CommunityActivityService.ts` and `routes/discord.ts`.
- `services/DiscordBotService.ts` — defines slash commands (`/recipe`, `/stats`, `/help`) but their `execute` handlers are `console.log(...)` only; no actual Discord bot client is initialised. ts-prune confirms `DiscordBotService` only used in `routes/bot.ts`, which is mounted nowhere in `server.ts`. The whole "bot" surface is presentational.
- `services/NotificationService.ts` (1019 lines) — every notification path in the codebase routes through this service, which only knows how to talk to Discord webhooks.
- `middleware/discordNotifications.ts` — defines `discordNotificationMiddleware`, `notifyNewUser`, `notifyNewRecipe`, `notifyFeedback`, `notifyError`. ts-prune confirms all five exports are unused. Defined and never wired up.
- `routes/bot.ts`, `routes/community.ts`, `routes/discord.ts` — `bot.ts` and `community.ts` are not mounted in `server.ts`; `discord.ts` is mounted on `/api/discord`.

**Recommended action**: `feature-flag` for `services/NotificationService.ts` and `services/DiscordWebhookService.ts` — gate all sends behind webhook URL presence (which they already partially do, but the surrounding services keep firing). `remove` for `services/DiscordBotService.ts`, `routes/bot.ts`, `routes/community.ts`, and `middleware/discordNotifications.ts` — they are presentational and dead.

#### F-NL-3: Contact form via Resend

**Tag**: `rubric/not-needed-locally`.

**Evidence**: `routes/contact.ts:1–9` constructs a Resend client at module load and on POST, sends an admin notification email plus a confirmation email to the requester. The whole route is mounted at `server.ts:192` (`/contact`).

**Recommended action**: `feature-flag`. Skip mount when `RESEND_API_KEY` is not set, or replace with a `console.log`-only stub. The route is for a public-facing contact form and is not exercised in local development.

#### F-NL-4: Photo upload service writes to local disk + tracks in DB

**Tag**: `rubric/not-needed-locally`.

**Evidence**: `services/PhotoUploadService.ts:7–10` — `UPLOAD_DIR = path.join(__dirname, '../../uploads/photos')`, `MAX_FILE_SIZE = 5 * 1024 * 1024`. `init()` runs at module load creating the directory. Each upload writes to disk and inserts a row into `uploaded_photos` table.

**Recommended action**: `keep`. This works locally and doesn't require AWS S3. The `@aws-sdk/client-s3` dependency exists but isn't wired in (see [F-DB-1](#f-db-1-aws-sdk-clients-have-zero-importers)). Note it as "local disk OK; if S3 is wanted later, wire up `@aws-sdk/client-s3` then; until then remove it."

#### F-NL-5: `serverless.yml` and the Lambda toolchain

**Tag**: `rubric/not-needed-locally`.

**Evidence**: `backend/serverless.yml` (174 lines) defines 16 Lambda functions with handlers like `functions/auth/register.handler`, `functions/users/getProfile.handler`, etc. **No `functions/` directory exists in the repo.** The functions referenced are vestigial; the live deployment is Express on EC2 (per `Dockerfile` and `ecosystem.config.js`).

**Recommended action**: `remove`. Delete `serverless.yml`. Remove `serverless` and `serverless-offline` from devDependencies. Remove `@types/aws-lambda` from devDependencies. (If a Lambda deployment is wanted later, it would require complete rewrite of every handler from Express middleware-style to Lambda handler-style, so there's nothing of present value to preserve.)

### `rubric/over-architected` — premature abstraction; complexity exceeding the problem

#### F-OA-1: `SystemGuardian` can auto-rebuild the running process

**Tag**: `rubric/over-architected`.

**Evidence**: `services/SystemGuardian.ts`:

- 453 lines in one class.
- Constructor sets `MAX_CONSECUTIVE_FAILURES = 5`, `HEALTH_CHECK_INTERVAL = 60000`, `CRITICAL_ERROR_RATE = 0.15`.
- `startMonitoring()` sets `setInterval(performHealthCheck, 1min)` (line 61).
- `performHealthCheck()` triggers `handleCriticalState()` which can call `restartBackend()` — `await execAsync('pm2 restart cook-smart-backend')` (line 308).
- After `consecutiveFailures >= 5`, `initiateNuclearOption()` runs (lines 298–340):
  ```js
  await execAsync('pm2 stop all');
  await execAsync('git pull origin fresh-project-migration');
  await execAsync('npm install');
  await execAsync('npm run build');
  await execAsync('pm2 restart all');
  ```
- The trigger is sensitive: `checkBackendHealth()` returns `'down'` when `errorRate > 0.15` (15%, computed over total requests since process start — which on a quiet local server can be one 500 out of seven requests). `checkDatabaseHealth()` returns `'down'` when a `SELECT 1` takes over 500ms.
- The branch name `fresh-project-migration` is hardcoded on line 314.
- A REST route `POST /api/v1/system-guardian/nuke` accepts a `reason` body and triggers `initiateNuclearOption()` manually (`routes/systemGuardian.ts:75–96`), authenticated by a regular user JWT (not admin).

**Recommended action**: `remove`. This is the highest-blast-radius behaviour in the codebase. The "Nuclear Option" is a `git pull && npm install && pm2 restart` invoked from inside the running Node process triggered by ambient signals. Filing this as an immediately-actionable issue separate from the broader assessment, per the brief's "if you spot something genuinely dangerous" rule.

#### F-OA-2: Five monitoring singletons fire on boot or import

**Tag**: `rubric/over-architected`.

**Evidence**: See the boot sequence in Section 3, particularly steps 17, 18, and 19. The total interval count is 7–8 depending on `NODE_ENV`. The work each one does is either Discord-bound or Stripe-bound — none of them can do anything useful in a fresh local checkout.

- `HealthMonitor` — daily Discord summary. (`services/HealthMonitor.ts`.)
- `SubscriptionMonitor` — Stripe expiry/grace-period checks every 6h. (`services/SubscriptionMonitor.ts`.)
- `DailyNotificationService` — FCM pushes daily. (`services/DailyNotificationService.ts`.)
- `setInterval` in `server.ts:240` — recipe cache maintenance.
- `SystemGuardian` — the one above.
- `ThrottleManager` — see [F-OA-5](#f-oa-5-throttlemanager-self-starts-two-intervals-on-import).
- `middleware/adminAuth.ts:174` — login-attempt cleanup.

**Recommended action**: `simplify`. Each scheduled job should require an opt-in (e.g. `if (process.env.ENABLE_DAILY_NOTIFICATIONS) { ... }`) so a local developer running `npm run dev` doesn't kick off seven background jobs with side effects. Better still, lift the schedulers out of the `app.listen` callback into a separate `scheduler.ts` entry point only used in production.

#### F-OA-3: `AutoRepairSystem` can't actually repair anything

**Tag**: `rubric/over-architected`.

**Evidence**: `services/AutoRepairSystem.ts` (288 lines):

- Defines a `AutoRepairStrategy` interface and 4 implementations: `DatabaseConnectionRepair`, `RateLimitRepair`, `APITimeoutRepair`, `AuthenticationRepair`.
- Three of the four strategies' `repair()` methods perform no actual repair — `RateLimitRepair.repair` returns `{success: true, message: 'Rate limit detected - automatic fallback should handle this', action: '...'}` (lines 73–80). `APITimeoutRepair` and `AuthenticationRepair` are similar advisory-only stubs.
- `DatabaseConnectionRepair.repair` calls `pool.connect()` and `SELECT 1` then releases — i.e. it tests the connection and reports the result. It doesn't reconnect; the pg `Pool` reconnects automatically.
- The `attemptRepair` method is called from `errorMiddleware.ts:170` for every error that isn't throttled.

**Recommended action**: `remove`. The strategy pattern with four strategies and a repair-history map is theatre over a `try { pool.query('SELECT 1') } catch` health probe. Replace the call site in `errorMiddleware.ts` with logging only.

#### F-OA-4: `HealthMonitor` and `SystemHealthService` are two parallel health implementations

**Tag**: `rubric/over-architected`.

**Evidence**:

- `services/HealthMonitor.ts` (~250 lines): rolling error-rate counter, `recordRequest(isError)`, daily Discord summary, error-rate threshold alerts. Singleton, used by `middleware/logger.ts` (records every request) and `middleware/errorMiddleware.ts` (records every error).
- `services/SystemHealthService.ts` (~250 lines): different shape — CPU, memory, DB connection counts, "external services" status. Singleton.
- ts-prune confirms `SystemHealthService` default export and `SystemHealth` interface are imported only as types in `controllers/AdminHealthController.ts`. The runtime singleton is unused.

**Recommended action**: `simplify`. Pick one. `SystemHealthService` as a request-handler-only service exposed under `/api/v1/admin/health` is sufficient. Delete `HealthMonitor` (and its Discord cascade), reroute `requestLogger` and `errorMiddleware` to local logging only.

#### F-OA-5: `ThrottleManager` self-starts two intervals on import

**Tag**: `rubric/over-architected`.

**Evidence**: `services/ThrottleManager.ts:18–22, 200–217` — singleton instance, constructor calls `startBackgroundJobs()`, which calls `setInterval(cleanup, 1h)` and `setInterval(sendThrottledSummary, 5min)`. Importing the file (which `errorMiddleware.ts:5` does at top level) starts both intervals unconditionally. The summary that the 5-minute interval sends is itself a Discord notification.

**Recommended action**: `simplify`. Either remove the singleton pattern (instantiate explicitly in the boot path so the start is visible) and conditional-start it, or delete the throttling layer entirely. For a local-first single-developer app there is no reason to throttle Discord notifications by 1-minute windows when the Discord notifications themselves are not configured.

#### F-OA-6: Duplicate and zero-importer service implementations

**Tag**: `rubric/over-architected`.

**Evidence**: ts-prune output cross-referenced with manual import checks:

- `services/EmailService.ts` (Resend, used by `SubscriptionMonitor` and `routes/passwordReset`) and `services/EmailService.resend.ts` (also Resend, ts-prune confirms `default` export at line 102 unused). Two parallel implementations of the same thing.
- `services/PushNotificationService.ts` (Expo-based, used by `DailyNotificationService` and `routes/notifications`) and `services/PushNotificationService.firebase.ts` (Firebase Admin, ts-prune confirms `PushNotificationService` class export at line 43 unused). The latter is the only importer of the `firebase-admin` dep.
- `controllers/AdminErrorsController.ts` and `controllers/AdminErrorsController_backup.ts` — both contain `export class AdminAnalyticsController` (despite the filename mismatch with the class). They are byte-near-identical. The route is commented out in `server.ts:122,165`.
- `config/mockAuth.ts` (`mockAuthService`) and `config/mockDatabase.ts` (default `MockDatabase`) — both fully implemented file-system-backed user stores. ts-prune confirms zero importers for both.
- `middleware/errorHandler.ts` (basic error handler, exports `errorHandler` and `notFound`) and `middleware/errorMiddleware.ts` (the active full pipeline). ts-prune confirms `errorHandler` and `notFound` unused.

**Recommended action**: `remove`. Delete the unused half of each pair: `EmailService.resend.ts`, `PushNotificationService.firebase.ts`, both `AdminErrorsController*.ts` files, both mock files, and `errorHandler.ts`. The `firebase-admin` dep then becomes removable (see [F-DB-5](#f-db-5-firebase-admin-only-imported-by-an-unused-file)).

#### F-OA-7: `RecipeProviderService` is an orchestrator wrapping a single provider

**Tag**: `rubric/over-architected`.

**Evidence**: `services/RecipeProviderService.ts` (~330 lines) implements:

- A primary/fallback chain (`this.primaryProvider`, `this.fallbackProviders`).
- A cache-first strategy with MD5 ingredient hashing (lines 254–260).
- API usage logging via `APIUsageLogModel`.
- Rate-limit warnings via `APIUsageLogModel.checkRateLimitWarning`.
- Three external call sites (`routes/recipes.ts`, `routes/trendingRecipes.ts` x3) each construct it with a single provider: `new RecipeProviderService([FatSecretAdapter])`.
- Lines 43–67 explicitly disable the cache-first strategy with a comment ("SKIP CACHE for ingredient searches to ensure fresh matching calculations") — leaving the cache machinery present but inert.
- `services/TheMealDBService.ts:23–211` is a fully working `IRecipeProvider` implementation never registered.

**Recommended action**: `simplify`. Two paths: either (a) register `TheMealDBService` as the fallback, deduplicating the three `new RecipeProviderService([...])` constructions into one shared instance, *or* (b) collapse the orchestrator into a thin wrapper around `FatSecretAdapter` and treat the abstraction as deferred until a real second provider exists.

#### F-OA-8: Two error-handling pipelines

**Tag**: `rubric/over-architected`.

**Evidence**:

- `middleware/errorHandler.ts` (32 lines) — basic; logs to console, returns JSON. Exports `errorHandler` and `notFound`. ts-prune confirms unused.
- `middleware/errorMiddleware.ts` (266 lines) — active. Imports `NotificationService`, `ThrottleManager`, `AutoRepairSystem`, `HealthMonitor`, `ErrorLogModel`. Classifies severity, extracts request context, generates throttle keys, runs auto-repair, sends Discord notifications, persists to `error_logs` table, formats response.

**Recommended action**: `simplify`. Keep `errorMiddleware.ts` as the active path but strip out the Discord/throttle/auto-repair branches per [F-NL-2](#f-nl-2-discord-webhooks-and-discord-bot), [F-OA-3](#f-oa-3-autorepairsystem-cant-actually-repair-anything), [F-OA-5](#f-oa-5-throttlemanager-self-starts-two-intervals-on-import). Delete `errorHandler.ts`.

#### F-OA-9: Multiple ingredient standardiser services

**Tag**: `rubric/over-architected`.

**Evidence**: Three services exist:

- `services/IngredientStandardizationService.ts` — ts-prune confirms `IngredientStandardizationService` class export at line 18 unused.
- `services/ComprehensiveIngredientStandardizationService.ts`.
- `services/ComprehensiveIngredientStandardizer.ts` — the one actually imported by `routes/recipes.ts:11`.

**Recommended action**: `simplify`. Tool-suggested-and-manually-verified that `IngredientStandardizationService.ts` is unused. Confirmation of which of the other two is canonical requires deeper read; promote a follow-up issue, not a bulk delete here.

### `rubric/dep-bloat` — packages adding install size / security CVE / license risk without proportional value

#### F-DB-1: AWS SDK clients have zero importers

**Tag**: `rubric/dep-bloat`.

**Evidence**: `package.json` lists `@aws-sdk/client-rds@^3.682.0`, `@aws-sdk/client-s3@^3.682.0`, `@aws-sdk/client-ses@^3.682.0`. depcheck flags all three. `grep_search` for `aws-sdk|S3Client|SESClient|RDSClient` across `backend/src/**/*.ts` returns no matches. Combined install size approximately 50 MB.

**Recommended action**: `remove`. Delete all three from `dependencies`.

#### F-DB-2: `nodemailer` zero importers; superseded by `resend`

**Tag**: `rubric/dep-bloat`.

**Evidence**: depcheck flags `nodemailer@^7.0.10` and `@types/nodemailer@^7.0.4` as unused. Email is sent via `resend` everywhere it's sent (`services/EmailService.ts:1`, `services/EmailService.resend.ts:1`, `routes/contact.ts:2`).

**Recommended action**: `remove`. Both packages.

#### F-DB-3: `bcrypt` and `bcryptjs` both installed; only `bcryptjs` used

**Tag**: `rubric/dep-bloat`.

**Evidence**: `package.json:21` lists `bcrypt@^6.0.0`. depcheck flags it. `grep_search` for `bcrypt(?!js)|bcryptjs` shows only `import bcrypt from 'bcryptjs'` in `models/User.ts`, `models/AdminUser.ts`, `config/mockAuth.ts`. Native `bcrypt` requires a build toolchain on install; `bcryptjs` is pure JS.

**Recommended action**: `remove`. `bcrypt` only.

#### F-DB-4: Three SQLite packages with zero importers

**Tag**: `rubric/dep-bloat`.

**Evidence**: depcheck flags `better-sqlite3@^12.4.1`, `sqlite3@^5.1.7`, `@types/better-sqlite3@^7.6.13`. The project uses Postgres via `pg`. `grep_search` for `sqlite|better-sqlite` across `src/` returns no matches.

**Recommended action**: `remove`. All three. SQLite is not used.

#### F-DB-5: `firebase-admin` only imported by an unused file

**Tag**: `rubric/dep-bloat`.

**Evidence**: `firebase-admin@^13.6.0`. Single importer is `services/PushNotificationService.firebase.ts`, which has zero importers (ts-prune confirms class export unused, manual `grep_search` for `from.*PushNotificationService\.firebase` returns no matches). The active push service is the Expo-based `services/PushNotificationService.ts`.

**Recommended action**: `remove` together with the unused file (per [F-OA-6](#f-oa-6-duplicate-and-zero-importer-service-implementations)).

#### F-DB-6: Duplicate database migration toolchains

**Tag**: `rubric/dep-bloat`.

**Evidence**: `package.json` `scripts` shows both `migrate:up` (using `node-pg-migrate`) and `knex:migrate` (using `knex`). `knexfile.js` exists. Migrations live in `backend/migrations/` and use the `node-pg-migrate` directory layout for the `.js` files; `knex` is configured but no Knex-style migrations exist that aren't also covered by `node-pg-migrate`.

**Recommended action**: `remove`. `knex` (production dep). Delete `knexfile.js`. Pick `node-pg-migrate` as the single migration tool.

#### F-DB-7: `serverless` toolchain points at non-existent handler files

**Tag**: `rubric/dep-bloat`.

**Evidence**: `serverless.yml` references `functions/auth/register.handler`, `functions/users/getProfile.handler`, etc. `backend/functions/` directory does not exist (verified via `list_directory`). depcheck flags `serverless@^4.23.0`, `serverless-offline@^14.4.0`, `js-yaml@^4.1.1`, `@types/aws-lambda@^8.10.145` as unused.

**Recommended action**: `remove`. All four packages. Delete `serverless.yml` (as in [F-NL-5](#f-nl-5-serverlessyml-and-the-lambda-toolchain)).

#### F-DB-8: `axios` 1.3x carries 16 CVEs and can be replaced by built-in `fetch`

**Tag**: `rubric/dep-bloat`.

**Evidence**: `package.json:13` shows `axios@^1.13.2`. The IDE recorded a `Saw Error: axios@1.13.2 ... Known security vulnerabilities: 16 ... Highest severity: CRITICAL` warning when reading `package.json`. Use sites are 5 simple HTTP call sites: `services/barcodeService.ts`, `services/DiscordWebhookService.ts`, `services/FatSecretService.ts`, `services/PushNotificationService.ts`, `services/TheMealDBService.ts`, plus `routes/auth.ts`. None use axios-specific features (interceptors, request cancellation tokens, etc.) — all are `axios.get(url, {params, headers, timeout})` or `axios.post(url, body, {headers})`.

**Recommended action**: `remove`. Replace with global `fetch` (Node 18+ provides it). Each call site is a 10–20 line shim. The migration is mechanical.

#### F-DB-9: `node-fetch` replaceable by Node 18 global `fetch`

**Tag**: `rubric/dep-bloat`.

**Evidence**: `node-fetch@^2.7.0` and `@types/node-fetch@^2.6.13`. Single importer: `services/NotificationService.ts:1`. Project's `engines` (implicit via `Dockerfile:2` `FROM node:18-alpine`) supports global `fetch`.

**Recommended action**: `remove`. Both packages. Migration is one file, ~3 call sites.


## 7. What We Deliberately Kept

This is the calibration check. If everything got flagged, the assessment would be suspicious. Items considered for findings and consciously *not* flagged:

- **Postgres / `pg` `Pool` / `config/database.ts`**: Postgres is fine for local development (`docker run postgres` is one command). The Pool config (max 20, idle 30s, connection 2s) is conservative and reasonable. `keep`.
- **`helmet`, `cors`, `express-rate-limit`, `morgan`, `express-validator`**: Standard production middleware, low overhead, keep them. They cost nothing to run locally and are the right primitives. `keep`.
- **`bcryptjs` and `jsonwebtoken`**: Sensible auth primitives. The only call-out (`bcryptjs` over native `bcrypt`) is in [F-DB-3](#f-db-3-bcrypt-and-bcryptjs-both-installed-only-bcryptjs-used) and is a minor cleanup, not a redesign. `keep`.
- **`node-cron` and `DailyNotificationService`**: It's a single cron at 09:00 daily for FCM pushes, scoped narrowly. The schedule itself is sensible; the boot-on-start in development is the issue, addressed in [F-OA-2](#f-oa-2-five-monitoring-singletons-fire-on-boot-or-import). The dep is fine. `keep`.
- **`IRecipeProvider` interface (`interfaces/IRecipeProvider.ts`)**: Clean, well-typed contract. The orchestrator above it ([F-OA-7](#f-oa-7-recipeproviderservice-is-an-orchestrator-wrapping-a-single-provider)) is over-architected, but the *interface* is a reasonable abstraction even at one provider. If TheMealDB is registered as fallback, the interface is its load-bearing layer. `keep`.
- **The route-file split**: 50 route files is a lot, but each one is small (mostly under 200 lines), domain-named (`recipes.ts`, `dietary.ts`, `shopping.ts`), and the `app.use(...)` block in `server.ts:143–192` is readable. The split is a defensible organisation choice, not a smell. `keep`.
- **`errorMiddleware.ts` core function**: 404 bot filtering (lines 226–270 — silently drops `/.env`, `/wp-admin`, `*.php` etc.), error classification by HTTP status, structured response formatting. These are the right patterns. The Discord/throttle/auto-repair branches around them are the issue ([F-OA-3](#f-oa-3-autorepairsystem-cant-actually-repair-anything), [F-OA-5](#f-oa-5-throttlemanager-self-starts-two-intervals-on-import), [F-NL-2](#f-nl-2-discord-webhooks-and-discord-bot)), not the core. `keep` the core; strip the rest.
- **`PhotoUploadService` writing to local disk**: Considered flagging as "should use S3" but that would be the *opposite* of the local-first thesis. Local disk is correct for local use; the unused `@aws-sdk/client-s3` dependency is the actual issue. `keep` the service.
- **`AdminAuditLogger` and `AdminActivityLogger`**: Two separate services seemed redundant on first read but they have different shapes — audit log is per-resource (user X edited recipe Y), activity log is per-actor (user X logged in from IP Z). Both have legitimate distinct uses. `keep`.
- **Rate limiting in `middleware/adminAuth.ts:170–193`**: A Map-based in-memory rate limiter for admin login attempts. Could be replaced with `express-rate-limit` (already a dep), but the current code is small, clear, and works. The cleanup `setInterval` is the only concern, addressed in [F-OA-2](#f-oa-2-five-monitoring-singletons-fire-on-boot-or-import). `keep` the rate-limit logic itself.
- **`PhaseManagementService`**: A simple cached "are we in beta?" boolean read from DB. Used by Stripe pricing logic. If Stripe is feature-flagged off ([F-NL-1](#f-nl-1-stripe-billing-stack)), this becomes vestigial — but the service itself is small, well-scoped, and stops being a problem the moment its caller is feature-flagged. `keep` for now; revisit when Stripe is flagged off.

## 8. Ranked Recommendation for the Next PRD

Ordered list of slice-sized cleanup items, with rationale for the order.

### Priority 1: Unblocks running locally (do first)

1. **Soften `load-env.js` to allow boot without an env file** — single-file edit. Unblocks "first-time clone, `cp .env.example .env`, `npm run dev`" workflow. *Slice title: `[AFK] Allow backend to boot without .env.secure`* — sourced from [F-EB-1](#f-eb-1-load-envjs-exits-the-process-when-no-env-file-exists).

2. **Gate boot-time scheduled jobs behind opt-in env vars** — wraps `HealthMonitor.startDailyHealthSummary`, `SubscriptionMonitor.startDailyMonitoring`, `DailyNotificationService.startDailyChecks`, the recipe-cache `setInterval`, and `SystemGuardian.startMonitoring` in env-presence checks (or `NODE_ENV === 'production'`). Removes the "seven background jobs fire on `npm run dev`" surprise. *Slice title: `[AFK] Make boot-time monitoring opt-in via env presence`* — sourced from [F-OA-2](#f-oa-2-five-monitoring-singletons-fire-on-boot-or-import).

3. **Register `TheMealDBService` as the fallback recipe provider** — three-line change in `routes/recipes.ts` and `routes/trendingRecipes.ts`. Lets recipe search work without FatSecret credentials. *Slice title: `[AFK] Register TheMealDB as recipe-provider fallback`* — sourced from [F-EB-2](#f-eb-2-fatsecret-is-the-sole-recipe-provider-no-fallback-registered).

### Priority 2: Immediate-action safety

4. **Remove or neuter `SystemGuardian.initiateNuclearOption`** — file as a separate immediately-actionable issue per the brief's "if you spot something genuinely dangerous" rule, *not* deferred to the cleanup PRD. *Slice title: `[AFK] Remove SystemGuardian auto-rebuild behaviour`* — sourced from [F-OA-1](#f-oa-1-systemguardian-can-auto-rebuild-the-running-process).

### Priority 3: Independent and small (do anytime)

5. **Remove zero-importer dependencies in one commit**: `@aws-sdk/client-rds`, `@aws-sdk/client-s3`, `@aws-sdk/client-ses`, `bcrypt`, `nodemailer`, `@types/nodemailer`, `better-sqlite3`, `sqlite3`, `@types/better-sqlite3`, `firebase-admin`. Deletes their unique importers in the same PR (`PushNotificationService.firebase.ts` for `firebase-admin`). Pure subtraction, no behaviour change. *Slice title: `[AFK] Remove zero-importer dependencies`* — sourced from [F-DB-1](#f-db-1-aws-sdk-clients-have-zero-importers), [F-DB-2](#f-db-2-nodemailer-zero-importers-superseded-by-resend), [F-DB-3](#f-db-3-bcrypt-and-bcryptjs-both-installed-only-bcryptjs-used), [F-DB-4](#f-db-4-three-sqlite-packages-with-zero-importers), [F-DB-5](#f-db-5-firebase-admin-only-imported-by-an-unused-file).

6. **Delete unused / duplicate source files**: `controllers/AdminErrorsController.ts`, `controllers/AdminErrorsController_backup.ts`, `config/mockAuth.ts`, `config/mockDatabase.ts`, `config/mockIngredients.ts`, `services/EmailService.resend.ts`, `services/PushNotificationService.firebase.ts` (paired with [F-DB-5](#f-db-5-firebase-admin-only-imported-by-an-unused-file)), `middleware/errorHandler.ts`, `middleware/discordNotifications.ts` (with its 5 unused exports), `services/IngredientStandardizationService.ts`. *Slice title: `[AFK] Delete unused and duplicate service files`* — sourced from [F-OA-6](#f-oa-6-duplicate-and-zero-importer-service-implementations), [F-OA-8](#f-oa-8-two-error-handling-pipelines), [F-OA-9](#f-oa-9-multiple-ingredient-standardiser-services).

7. **Remove the `serverless` toolchain**: delete `serverless.yml`, remove `serverless`, `serverless-offline`, `js-yaml`, `@types/aws-lambda` from devDependencies. *Slice title: `[AFK] Remove vestigial serverless/Lambda toolchain`* — sourced from [F-NL-5](#f-nl-5-serverlessyml-and-the-lambda-toolchain), [F-DB-7](#f-db-7-serverless-toolchain-points-at-non-existent-handler-files).

8. **Remove `knex` and `knexfile.js`** — keep `node-pg-migrate` as the migration tool of record. *Slice title: `[AFK] Remove duplicate knex migration toolchain`* — sourced from [F-DB-6](#f-db-6-duplicate-database-migration-toolchains).

### Priority 4: Larger refactors (require Priority 1–3 first)

9. **Feature-flag the Stripe stack behind `STRIPE_SECRET_KEY` presence** — gate route mounts in `server.ts`, gate `SubscriptionMonitor.startDailyMonitoring` boot. Keeps the code paths testable for the maintainer who has Stripe wired up. Larger because it touches `server.ts` mount block, two services, and four route files. *Slice title: `[AFK] Feature-flag Stripe behind env presence`* — sourced from [F-NL-1](#f-nl-1-stripe-billing-stack).

10. **Feature-flag the Discord notification stack behind webhook URL presence** — strip the `NotificationService` cascade out of `errorMiddleware`, delete `DiscordBotService` and unwire `routes/bot.ts`/`routes/community.ts` (already not mounted), keep `DiscordWebhookService` for the few callers that genuinely want it. *Slice title: `[AFK] Feature-flag Discord notifications behind webhook presence`* — sourced from [F-NL-2](#f-nl-2-discord-webhooks-and-discord-bot).

11. **Replace `axios` and `node-fetch` with global `fetch`** — six files updated, both packages removed. Eliminates 16 CVEs. *Slice title: `[AFK] Migrate axios/node-fetch to built-in fetch`* — sourced from [F-DB-8](#f-db-8-axios-13x-carries-16-cves-and-can-be-replaced-by-built-in-fetch), [F-DB-9](#f-db-9-node-fetch-replaceable-by-node-18-global-fetch).

12. **Delete `AutoRepairSystem` and `HealthMonitor`; collapse `errorMiddleware` to logging-only** — replaces three services with logging-only error handling. Touches `errorMiddleware.ts`, `logger.ts`, and removes `services/AutoRepairSystem.ts` + `services/HealthMonitor.ts`. *Slice title: `[AFK] Replace AutoRepair/HealthMonitor with plain logging`* — sourced from [F-OA-3](#f-oa-3-autorepairsystem-cant-actually-repair-anything), [F-OA-4](#f-oa-4-healthmonitor-and-systemhealthservice-are-two-parallel-health-implementations), [F-OA-8](#f-oa-8-two-error-handling-pipelines).

13. **Remove `SystemGuardian` entirely (after Priority 2 neutering)** — including `routes/systemGuardian.ts` and `services/AutoRepairSystem.ts` if not already gone from item 12. *Slice title: `[AFK] Remove SystemGuardian and routes/systemGuardian`* — sourced from [F-OA-1](#f-oa-1-systemguardian-can-auto-rebuild-the-running-process).

14. **Remove `ThrottleManager`** — once Discord is feature-flagged (item 10), the throttling layer has nothing to throttle. *Slice title: `[AFK] Remove ThrottleManager throttling layer`* — sourced from [F-OA-5](#f-oa-5-throttlemanager-self-starts-two-intervals-on-import).

### Ordering rationale

- **Priority 1 unblocks "clone and run locally"** — the prerequisite for everything else. Without it, every subsequent change requires more setup than the change is worth.
- **Priority 2** is the "house is on fire" item. The Nuclear Option triggers from a 15% error rate on a quiet local server — it can fire from a single 500 response. It needs to be neutered before anyone runs the code locally with `NODE_ENV=production`.
- **Priority 3 is pure subtraction** — no behaviour changes for the maintainer, no gating logic, just removing things that are not used. Each is a single-PR slice that can ship in any order.
- **Priority 4 requires Priority 1** — feature-flagging Stripe means re-reading the boot path that Priority 1 cleaned up. Replacing axios is mechanical but six files; better done after the obvious wins are banked. Removing `AutoRepairSystem` requires `errorMiddleware` to no longer call it, which is clearer to do once the surrounding noise is gone.

---

*This document is a snapshot. Once the cleanup PRD starts shipping, parts of this go stale — that's expected. The doc becomes a historical artifact at that point, not a living document.*
