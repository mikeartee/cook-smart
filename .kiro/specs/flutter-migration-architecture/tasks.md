# Implementation Plan: Flutter Migration Architecture

## Overview

This plan lands the Foundation_Phase only: scaffold `mobile/`, configure dependencies, build out `core/` (config, storage, network, theme, router) and `shared/`, wire `app.dart` and `main.dart` with Crashlytics, set up architectural enforcement and the test harness, and update CI without touching `src/`, root-level `android/`, `backend/`, or `website/`. Per-feature ports are out of scope and will land as separate specs in the order published in the design document.

The implementation language is Dart/Flutter (Flutter 3.44.0 / Dart 3.9.2, verified). All test bodies are unit and widget tests only — integration test bodies, golden test bodies, and property-based test bodies are deferred to per-feature specs per Requirement 14.6.

## Tasks

- [x] 1. Scaffold the Flutter project and configure dependencies
  - [x] 1.1 Run `flutter create` at the repo root with platforms `android,ios`
    - Create `mobile/` via `flutter create --platforms=android,ios mobile`
    - Verify `mobile/ios/` is produced and committed (do not add to `.gitignore`)
    - Confirm `src/`, root-level `android/`, `backend/`, `website/`, `docs/` remain untouched
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2_

  - [x] 1.2 Configure `mobile/pubspec.yaml` with the committed package list
    - Set `environment.sdk` to `>=3.9.0 <4.0.0` and `environment.flutter` to `>=3.44.0`
    - Declare every dependency at the exact pinned version listed in Requirement 10
    - Run `flutter pub get` and verify `mobile/pubspec.lock` is generated
    - _Requirements: 3.2, 4.7, 5.1, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11, 10.12, 10.13_

  - [x] 1.3 Configure `mobile/analysis_options.yaml` with `very_good_analysis`
    - Include `package:very_good_analysis/analysis_options.yaml`
    - Disable only rules that conflict with project conventions, with a comment per disable
    - _Requirements: 10.8_

  - [x] 1.4 Update `.gitignore` to exclude secrets and untracked configuration
    - Add `mobile/android/app/google-services.json`, `*.jks`, `*.keystore`, `keystore.properties`, `.env`
    - Confirm `mobile/ios/` is NOT excluded
    - _Requirements: 7.2, 17.3_

- [x] 2. Implement the core configuration layer
  - [x] 2.1 Implement `mobile/lib/core/config/api_config.dart` with the compile-time URL switch
    - Use `bool.fromEnvironment('dart.vm.product')` only — no runtime override hook
    - Hard-code `_prodBaseUrl = 'https://api.cooksmartapp.com'` and `_devBaseUrl = 'http://192.168.12.196:3000'`
    - Add a `const` assertion that fails compilation if the release URL is altered to anything other than the production literal
    - _Requirements: 4.6, 9.1, 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x]* 2.2 Write unit tests for `ApiConfig`
    - Verify dev mode returns `http://192.168.12.196:3000` exactly
    - Verify release mode returns `https://api.cooksmartapp.com` exactly with no trailing slash and no path suffix
    - _Requirements: 12.2, 12.3_

  - [x] 2.3 Implement `mobile/lib/core/config/app_config.dart`
    - Declare build-time constants used by `app.dart` and `main.dart` (environment label, app name source, package info source)
    - _Requirements: 2.7_

- [x] 3. Implement the core storage layer
  - [x] 3.1 Define the `SecureStorage` abstract interface in `mobile/lib/core/storage/secure_storage.dart`
    - Declare `writeToken`, `readToken`, `deleteToken`, `clearAll` with the exact signatures from Requirement 11.1
    - Define a typed `StorageException` carrying the failed operation
    - _Requirements: 11.1, 11.2_

  - [x] 3.2 Implement `FlutterSecureStorageAdapter` in `mobile/lib/core/storage/flutter_secure_storage_adapter.dart`
    - Wrap `package:flutter_secure_storage` so it is the single import site
    - Translate platform-keystore failures to `StorageException` and preserve previously stored values on failure
    - _Requirements: 10.1, 11.1, 11.2, 11.3_

  - [x] 3.3 Implement `secureStorageProvider` in `mobile/lib/core/storage/secure_storage_provider.dart`
    - Expose `Provider<SecureStorage>` returning the adapter
    - _Requirements: 3.1, 3.2, 3.8, 11.6_

  - [x]* 3.4 Write unit tests for `FlutterSecureStorageAdapter`
    - Cover read, write, delete, clearAll happy paths
    - Cover platform-keystore-unavailable failure mapping and value preservation
    - _Requirements: 11.1, 11.2_

- [x] 4. Implement the core network layer
  - [x] 4.1 Define the `ApiException` hierarchy in `mobile/lib/core/network/api_exception.dart`
    - Sealed `ApiException` with `NetworkException`, `UnauthorisedException`, `ValidationException`, `ServerException` subtypes
    - Carry status code on `ServerException` and field errors on `ValidationException`
    - _Requirements: 4.3, 11.5_

  - [x] 4.2 Implement `ApiResponse<DataType>` in `mobile/lib/core/network/api_response.dart`
    - Parse the `{ success, message, data }` envelope
    - Raise `ServerException` indicating an invalid response format if the envelope cannot be parsed
    - _Requirements: 4.4, 4.12, 9.6_

  - [x] 4.3 Define the `ApiClient` abstract interface in `mobile/lib/core/network/api_client.dart`
    - Declare `get`, `post`, `put`, `delete` returning a typed response with status, headers, and decoded body
    - Do not expose `dio` types in the interface
    - _Requirements: 11.4, 11.5_

  - [x] 4.4 Implement `AuthInterceptor` in `mobile/lib/core/network/auth_interceptor.dart`
    - Inject the JWT from `SecureStorage` on requests that require auth
    - When auth is required and no JWT is available, fail the request with `UnauthorisedException` without sending it
    - _Requirements: 4.2, 4.13_

  - [x] 4.5 Implement `ErrorInterceptor` in `mobile/lib/core/network/error_interceptor.dart`
    - On 401 with a refresh token present, attempt exactly one refresh-token call and retry the original request once on success
    - On refresh failure, refresh timeout, or missing refresh token, clear all stored auth tokens and trigger redirection to `/auth/login`
    - Translate connect/receive timeout to `NetworkException`; translate non-success responses to the matching `ApiException` subtype
    - _Requirements: 4.3, 4.9, 4.10, 4.11_

  - [x] 4.6 Implement `DioClient` and `dioProvider` in `mobile/lib/core/network/dio_client.dart`
    - Configure `connectTimeout: 10s`, `receiveTimeout: 15s`, base URL from `ApiConfig`
    - Wire `AuthInterceptor` and `ErrorInterceptor`
    - Expose the singleton via `Provider<Dio>` only — no widget-level construction
    - _Requirements: 4.1, 4.5, 4.6, 4.7, 11.6, 11.7_

  - [x]* 4.7 Write unit tests for `ApiResponse` envelope parsing
    - Cover success envelope, error envelope, missing optional `data`, and malformed JSON paths
    - _Requirements: 4.4, 4.12_

  - [x]* 4.8 Write unit tests for `AuthInterceptor` and `ErrorInterceptor`
    - Cover auth header injection, missing-JWT failure path, 401 single-shot refresh, refresh failure clear-and-redirect, timeout-to-`NetworkException` translation
    - _Requirements: 4.2, 4.9, 4.10, 4.11, 4.13_

- [x] 5. Implement the core theme layer
  - [x] 5.1 Define `AppColours` in `mobile/lib/core/theme/app_colours.dart`
    - Declare `static const Color` for primary, secondary, background, surface, error, and onPrimary
    - Reuse the legacy primary brand colour value
    - _Requirements: 8.2, 8.5_

  - [x] 5.2 Implement `AppTheme` in `mobile/lib/core/theme/app_theme.dart`
    - Provide static `light()` and `dark()` returning `ThemeData` with `useMaterial3: true`
    - Populate the typography hierarchy (display, headline, title, body, label) matching the legacy brand
    - _Requirements: 8.1, 8.3, 8.5_

  - [x]* 5.3 Write widget tests for `AppTheme`
    - Verify both `light()` and `dark()` set `useMaterial3: true` and a non-null colour scheme
    - Verify the typography hierarchy is populated with non-null styles for every documented scale
    - _Requirements: 8.1, 8.5_

- [x] 6. Implement the core router layer
  - [x] 6.1 Define route constants in `mobile/lib/core/router/routes.dart`
    - Declare `static const String` for every route name and path used by the foundation, including `/`, `/auth/login`, `/auth/signup`, and tab destinations
    - _Requirements: 5.4_

  - [x] 6.2 Implement the GoRouter configuration in `mobile/lib/core/router/app_router.dart`
    - `initialLocation: '/'` resolving to the first tab when authenticated
    - `StatefulShellRoute.indexedStack` hosting bottom-tab destinations with independent stacks
    - Top-level `/auth/*` routes outside the shell
    - `redirect` enforcing auth-gated rules: unauthenticated to `/auth/login`, authenticated away from `/auth/*`, both within 100 ms
    - `errorBuilder` for unmatched routes that preserves the previous navigation stack
    - Use `go_router`'s built-in deep-link handling without additional plugins
    - _Requirements: 5.1, 5.3, 5.5, 5.6, 5.7, 5.8, 5.10, 5.11_

  - [x] 6.3 Implement `routerProvider` in `mobile/lib/core/router/router_provider.dart`
    - Expose the `GoRouter` instance through a Riverpod provider
    - Watch the auth-state stream stub so redirects re-evaluate on auth changes without manual refresh
    - _Requirements: 5.2, 5.9, 11.6_

  - [x]* 6.4 Write unit tests for router redirect logic
    - Unauthenticated request to a non-`/auth` path redirects to `/auth/login` and does not render the destination
    - Authenticated request to `/auth/login` redirects to `/` and does not render the auth screen
    - Auth-state change re-evaluates redirect rules without manual refresh
    - Unknown path renders the error destination and preserves the previous navigation stack
    - _Requirements: 5.7, 5.8, 5.9, 5.11_

- [x] 7. Implement the shared layer
  - [x] 7.1 Create `PrimaryButton`, `ErrorView`, and `LoadingSkeleton` under `mobile/lib/shared/widgets/`
    - Each in its own file using `snake_case.dart` naming
    - `ErrorView` accepts a retry callback and a message; `LoadingSkeleton` uses `shimmer`
    - All colours sourced from `AppColours`
    - _Requirements: 2.3, 3.9, 8.2, 8.5_

  - [x] 7.2 Implement `AsyncValue` extensions in `mobile/lib/shared/extensions/async_value_x.dart`
    - Helper that renders loading, error, and data via non-null callbacks for each state
    - On error, preserve the previous successful data so consumers can retry without losing prior context
    - _Requirements: 3.4, 3.5, 3.9_

  - [x]* 7.3 Write widget tests for `ErrorView` and `LoadingSkeleton`
    - Verify retry callback fires on tap
    - Verify shimmer renders within `LoadingSkeleton`
    - _Requirements: 3.9_

- [x] 8. Implement application bootstrap and Crashlytics
  - [x] 8.1 Implement `CookSmartApp` root widget in `mobile/lib/app.dart`
    - `MaterialApp.router` with `routerConfig` from `routerProvider`, `theme: AppTheme.light()`, `darkTheme: AppTheme.dark()`
    - No other Dart source files placed directly under `mobile/lib/` outside `core/`, `features/`, `shared/`
    - _Requirements: 2.7, 8.3_

  - [x] 8.2 Implement bootstrap in `mobile/lib/main.dart`
    - `WidgetsFlutterBinding.ensureInitialized` then `Firebase.initializeApp`
    - Register `FlutterError.onError` forwarding to Crashlytics with stack trace and fatal flag within 1 second
    - Register `PlatformDispatcher.instance.onError` forwarding to Crashlytics with stack trace and fatal flag within 1 second, returning `true`
    - Abort startup before rendering the first screen if either handler registration fails, while still routing the abort-time crash to Crashlytics
    - Wrap `runApp` in a single top-level `ProviderScope`
    - _Requirements: 3.3, 16.1, 16.2, 16.3, 16.4, 16.5, 17.1_

  - [x]* 8.3 Write unit tests for bootstrap error handler registration
    - Verify both handlers forward errors carrying stack trace and fatal flag
    - Verify the abort path on registration failure surfaces the initialisation error
    - _Requirements: 16.1, 16.2, 16.3, 16.5_

- [x] 9. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement architectural enforcement scripts
  - [x] 10.1 Implement `mobile/tool/check_architecture.dart` (source-level invariants)
    - Fail if any file under `lib/features/<a>/` imports any file under `lib/features/<b>/` where `a != b`
    - Fail if `package:dio` is imported outside `lib/core/network/`
    - Fail if `package:flutter_secure_storage` is imported outside `lib/core/storage/`
    - Fail if `Dio(` or `GoRouter(` is constructed in any file under a feature `presentation/` folder or `lib/shared/widgets/`
    - Fail if `FutureBuilder` is referenced in any file under `lib/features/`
    - Fail if a `Color(` literal appears in any file outside `lib/core/theme/`
    - **Validates: Properties 1, 2, 3, 4 and Requirements 2.5, 3.6, 4.8, 8.4, 11.3, 11.7**
    - _Requirements: 2.5, 3.6, 4.8, 8.4, 11.3, 11.7_

  - [x] 10.2 Implement `mobile/tool/check_structure.dart` (folder and naming invariants)
    - Verify each `lib/features/<feature_name>/` matches `^[a-z][a-z0-9_]{1,38}[a-z0-9]$` and contains exactly `data/`, `domain/`, `presentation/`
    - Verify no top-level forbidden folders (`lib/data/`, `lib/domain/`, `lib/ui/`, `lib/screens/`, `lib/widgets/`, `lib/models/`, `lib/services/`)
    - Verify only `main.dart` and `app.dart` live directly under `lib/`
    - Verify every Dart source file matches `^[a-z][a-z0-9_]*\.dart$` (1–64 chars)
    - Verify every Riverpod provider variable matches `^[a-z][A-Za-z0-9]*Provider$`
    - Verify every source file under `lib/` has a mirrored `_test.dart` under `test/`; report missing files as structural violations
    - _Requirements: 2.1, 2.4, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 3.10_

  - [x] 10.3 Implement `mobile/tool/check_packages.dart` (cross-platform package guard)
    - Read `pubspec.yaml` dependencies and dev_dependencies
    - For each, verify declared platform support on pub.dev includes both Android and iOS
    - Fail if any package is iOS-only or is Android-only when a cross-platform alternative exists
    - _Requirements: 7.4, 7.5, 7.6, 13.1, 13.2, 13.3_

  - [x] 10.4 Implement `mobile/tool/check_secrets.dart` (secret-literal scan)
    - Scan files under `lib/` for hardcoded API keys and signing passwords
    - Distinguish detection failures (Requirement 17.4) from tooling errors / transient failures (Requirement 17.7)
    - Log tool-failure mode with offending pattern, file scanned, and timestamp; allow build to proceed in that mode
    - Require additional verification for known false-negative pattern categories before producing a release artifact
    - _Requirements: 17.4, 17.7, 17.8_

  - [x]* 10.5 Write unit tests for verification scripts
    - For each script: a clean fixture passes, a violation fixture fails with a specific error pointing at the offending file
    - _Requirements: 2.5, 2.6, 2.8, 3.6, 4.8, 7.4, 8.4, 11.3, 11.7, 13.1, 17.4_

- [x] 11. Set up the testing harness
  - [x] 11.1 Create the `mobile/test/` directory mirroring `mobile/lib/` subfolders
    - One placeholder Dart file per subfolder so the structure compiles
    - Do not add integration test bodies, golden test bodies, or property-based test bodies
    - _Requirements: 2.11, 2.12, 14.1, 14.2, 14.6_

  - [x] 11.2 Create `mobile/integration_test/` with a driver entry point
    - Initialize `IntegrationTestWidgetsFlutterBinding` in a single driver file
    - Do not add integration test bodies
    - _Requirements: 14.1, 14.3, 14.6_

- [x] 12. Configure the CI pipeline
  - [x] 12.1 Update `.github/workflows/ci.yml` to add the Flutter job and preserve the React Native job
    - Trigger the Flutter job on PRs touching `mobile/`
    - Steps: `flutter pub get`, `flutter analyze`, `flutter test`, `dart run tool/check_architecture.dart`, `dart run tool/check_structure.dart`, `dart run tool/check_packages.dart`, `dart run tool/check_secrets.dart`
    - Set the suite timeout to 15 minutes
    - Confirm the existing `__tests__/` React Native job still runs on every PR with a 15-minute timeout
    - Do not run `flutter build ios`, `flutter build ipa`, `pod install`, `xcodebuild`, or any iOS code-signing step on every push or pull request
    - _Requirements: 6.1, 7.3, 7.6, 14.4, 14.5, 14.7_

  - [x] 12.2 Add a release-build base URL guard
    - In `mobile/android/app/build.gradle` (or a Gradle task it triggers), abort the release build with an explicit error if the resolved API base URL is anything other than `https://api.cooksmartapp.com`
    - Reference the keystore from `mobile/android/keystore.properties`; abort with an explicit error if the keystore file or credentials are missing
    - _Requirements: 9.2, 12.4, 17.5, 17.6_

- [x] 13. Write documentation
  - [x] 13.1 Write `mobile/README.md`
    - Run, build, and test commands for the Flutter project
    - Section titled "iOS Status" stating iOS is not built, not signed, and not shipped, and listing the gating conditions (Mac access available and iOS work justified) before iOS builds will be enabled
    - _Requirements: 7.7_

  - [x] 13.2 Update root `README.md` to reference the Flutter `mobile/` project
    - Add a "Mobile App (Flutter)" section noting the Parallel_Build_Phase
    - Do not modify any section that touches `src/`, `backend/`, `website/`, or `docs/`
    - _Requirements: 1.2_

  - [x] 13.3 Write the rollback runbook template at `docs/legacy-rn-rollback.md`
    - Template-only document explaining how to revive the React Native app from `legacy-rn/` if a post-cutover regression ships
    - The `legacy-rn/` folder itself is created by a later cutover spec (out of scope here)
    - _Requirements: 6.10_

- [x] 14. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery; core architecture tasks are never marked optional.
- Each task references specific requirements clauses for traceability rather than user-story numbers.
- Property-based test bodies, integration test bodies, and golden test bodies are intentionally absent from this Foundation_Phase plan per Requirement 14.6 — they are deferred to per-feature specs.
- The architectural invariants in the design document's Correctness Properties section are enforced by the static-analysis scripts in section 10 rather than randomized property tests.
- Per-feature ports (auth, barcode, recipe matching, etc.) are tracked in their own specs in the order published in the design document, beginning with `flutter-port-auth` and ending with `flutter-ios-enablement`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["2.1", "2.3", "3.1", "4.1", "5.1", "6.1", "7.2", "10.1", "10.2", "10.3", "10.4", "11.1", "11.2", "13.1", "13.2", "13.3"] },
    { "id": 3, "tasks": ["2.2", "3.2", "4.2", "4.3", "5.2", "10.5", "12.2"] },
    { "id": 4, "tasks": ["3.3", "3.4", "4.7", "5.3", "7.1"] },
    { "id": 5, "tasks": ["4.4", "4.5", "6.2"] },
    { "id": 6, "tasks": ["4.6", "4.8", "6.3"] },
    { "id": 7, "tasks": ["6.4", "8.1"] },
    { "id": 8, "tasks": ["8.2"] },
    { "id": 9, "tasks": ["8.3", "12.1"] }
  ]
}
```

