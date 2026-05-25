# Requirements Document

## Introduction

This spec defines the requirements for the architectural foundation of porting the cook-smart mobile app from React Native to Flutter. The framework choice is settled in `docs/mobile-framework-evaluation.md` and is not in scope here. What is in scope: where the Flutter code lives, how it is structured, which libraries are committed for state, networking, routing, and native features, how the migration is sequenced against the still-shipping React Native app, and how iOS is parked without precluding it.

These requirements are derived from the approved design document and formalize the architectural commitments every later per-feature Flutter migration spec inherits. They are scoped to a single developer on Windows with verified Flutter 3.44.0 / Dart 3.9.2 toolchain, no live Mac access, no live users, and a backend (Node/Express on AWS EC2 + RDS PostgreSQL) that does not change.

Per-feature ports (auth, barcode, recipe matching, etc.) are explicitly out of scope and are tracked in their own specs that follow the order defined in this document.

## Glossary

- **Migration_Project**: The overall effort to port cook-smart from React Native to Flutter.
- **Cook_Smart_Repo**: The cook-smart monorepo at the root of the workspace.
- **Mobile_App**: The Flutter mobile app under the `mobile/` folder.
- **Legacy_RN_App**: The existing React Native mobile app under `src/` and root-level `android/`.
- **CI_Pipeline**: The GitHub Actions workflows under `.github/workflows/`.
- **Cutover_Gate**: The binary pass/fail check that decides whether the next Play Store release is the Flutter `Mobile_App`.
- **Parallel_Build_Phase**: The window between the foundation landing and the `Cutover_Gate` passing, during which both the `Mobile_App` and the `Legacy_RN_App` build cleanly.
- **Network_Layer**: The code under `mobile/lib/core/network/` that owns the HTTP client and exception hierarchy.
- **Storage_Layer**: The code under `mobile/lib/core/storage/` that owns secure persistent storage.
- **Router**: The code under `mobile/lib/core/router/` that owns navigation configuration.
- **Theme_System**: The code under `mobile/lib/core/theme/` that owns Material 3 theming and brand tokens.
- **Feature_Folder**: A subfolder of `mobile/lib/features/` that contains a single logical feature (auth, recipes, barcode, etc.).
- **Backend_API**: The existing cook-smart REST API hosted at `https://api.cooksmartapp.com`.
- **Legacy_Archive**: The `legacy-rn/` folder created from `Legacy_RN_App` source after a successful cutover, kept for one release cycle as a rollback safety net.
- **Per_Feature_Spec**: Any one of the sequenced specs that follow this one to port an individual feature.
- **Foundation_Phase**: The work covered by this spec — scaffold plus `core/` plus `shared/` plus first round of providers — before any feature is ported.

## Requirements

### Requirement 1: Code Location at `mobile/`

**User Story:** As the solo developer, I want the Flutter code to live in a new `mobile/` folder at the repo root, so that the React Native app can keep shipping APKs in parallel with the port and the Flutter port stays reversible until cutover.

#### Acceptance Criteria

1. THE Migration_Project SHALL create a `mobile/` directory at the root of the Cook_Smart_Repo to hold the Flutter project.
2. THE Migration_Project SHALL NOT modify the contents of `src/`, the root-level `android/` directory, `backend/`, `website/`, or `docs/` during the Foundation_Phase.
3. THE Migration_Project SHALL NOT use the folder name `flutter/` for the Flutter project root.
4. THE Migration_Project SHALL NOT create a separate sibling repository for the Flutter project.
5. WHILE the Parallel_Build_Phase is in effect, THE Cook_Smart_Repo SHALL contain the `mobile/` directory, and the absence of `src/` or the root-level `android/` directory SHALL NOT block entry into or continuation of the Parallel_Build_Phase.

### Requirement 2: Feature-Based Project Structure

**User Story:** As the solo developer, I want each logical feature to live in its own delete-able folder with internal data, domain, and presentation layers, so that features can be ported one at a time and related code stays colocated.

#### Acceptance Criteria

1. THE Mobile_App SHALL organize feature code such that every feature-specific Dart source file resides under `mobile/lib/features/<feature_name>/`, where `<feature_name>` is a `snake_case` identifier between 2 and 40 characters and uniquely identifies one logical feature.
2. THE Mobile_App SHALL place cross-cutting infrastructure code (networking, persistence, configuration, logging, error handling) under `mobile/lib/core/` and SHALL NOT place any feature-specific code under `mobile/lib/core/`.
3. THE Mobile_App SHALL place widgets, types, and utilities used by two or more features under `mobile/lib/shared/` and SHALL NOT place code used by only one feature under `mobile/lib/shared/`.
4. THE Mobile_App SHALL subdivide each Feature_Folder into exactly three subfolders named `data/`, `domain/`, and `presentation/`, and SHALL place every Dart source file inside the Feature_Folder within one of these three subfolders.
5. IF a Dart source file under `mobile/lib/features/<feature_name>/` imports a Dart source file from a different feature folder under `mobile/lib/features/`, THEN THE Mobile_App SHALL fail the static analysis step with an error indicating a cross-feature import violation.
6. THE Mobile_App SHALL NOT contain any of the directories `mobile/lib/data/`, `mobile/lib/domain/`, `mobile/lib/ui/`, `mobile/lib/screens/`, `mobile/lib/widgets/`, `mobile/lib/models/`, or `mobile/lib/services/` at the top level of `mobile/lib/`.
7. THE Mobile_App SHALL place the application entry point at `mobile/lib/main.dart` and the root widget at `mobile/lib/app.dart`, and SHALL NOT place any other Dart source files directly in `mobile/lib/` outside the `core/`, `features/`, and `shared/` subfolders.
8. THE Mobile_App SHALL name every Dart source file using `snake_case.dart`, where the file name matches the regular expression `^[a-z][a-z0-9_]*\.dart$` and is between 1 and 64 characters including the `.dart` extension.
9. THE Mobile_App SHALL name every Dart class, enum, mixin, extension, and typedef using `PascalCase` matching the regular expression `^[A-Z][A-Za-z0-9]*$`.
10. THE Mobile_App SHALL name every Riverpod provider variable using `camelCase` ending in the literal suffix `Provider`, matching the regular expression `^[a-z][A-Za-z0-9]*Provider$`.
11. THE Mobile_App SHALL place each test file at the path `mobile/test/<mirrored_path>/<source_basename>_test.dart`, where `<mirrored_path>` exactly mirrors the source file's path under `mobile/lib/` and `<source_basename>` is the source file name without the `.dart` extension.
12. IF a Dart source file under `mobile/lib/` does not have a corresponding test file at the mirrored path under `mobile/test/`, THEN THE Mobile_App SHALL report the missing test file during the test verification step as a structural violation.

### Requirement 3: State Management with Riverpod

**User Story:** As the solo developer, I want a single committed state-management library across every feature, so that providers, async state, and tests follow one mental model.

#### Acceptance Criteria

1. THE Mobile_App SHALL use Riverpod 2.x as the sole state-management library for all application, feature, and UI state.
2. THE Mobile_App SHALL declare exactly the following dependencies in `pubspec.yaml`: `flutter_riverpod` at version `^2.5.1` and `riverpod_annotation` at version `^2.3.5`. The `riverpod_generator ^2.4.0` package was removed by the `flutter-port-auth` spec — see Requirement 10.10 for the rationale and conditions under which it may be re-introduced.
3. THE Mobile_App SHALL wrap the root widget tree in a single top-level `ProviderScope` such that every descendant widget can resolve providers without additional scopes in feature code.
4. WHEN a provider exposes asynchronous data loaded from a repository, network, or other async source, THE Mobile_App SHALL represent that data using `AsyncValue<T>`.
5. WHEN a widget renders state sourced from an asynchronous provider, THE Mobile_App SHALL handle all three `AsyncValue<T>` states (loading, error, data) via `AsyncValue<T>.when` with a non-null callback for each state.
6. IF a feature widget attempts to consume asynchronous data using a raw `FutureBuilder`, THEN THE Mobile_App SHALL be considered non-compliant and the widget SHALL be refactored to use an `AsyncValue<T>`-based Riverpod provider before merge.
7. IF a pull request introduces a state-management library other than Riverpod (including but not limited to BLoC, Provider, GetX, MobX, or Redux) during the Foundation_Phase, THEN THE Mobile_App SHALL be considered non-compliant and the dependency SHALL be removed before merge.
8. WHERE a provider declaration is supported by `riverpod_generator` (including `Provider`, `FutureProvider`, `StreamProvider`, and `Notifier`/`AsyncNotifier` variants), THE Mobile_App SHALL declare that provider using the `@riverpod` annotation and generated code rather than hand-written provider constructors.
9. WHEN a provider raises an error that is surfaced through `AsyncValue<T>.error`, THE Mobile_App SHALL render an error UI within 100 milliseconds of the error state being emitted and SHALL preserve the previous successful data value so the user can retry without losing prior context.

### Requirement 4: Networking Layer

**User Story:** As the solo developer, I want a single configured HTTP client with auth header injection, error normalization, and a dev-vs-release base URL switch, so that every feature consumes the backend through one consistent surface.

#### Acceptance Criteria

1. THE Network_Layer SHALL provide a singleton Dio instance via a Riverpod provider.
2. WHEN a request is sent to an endpoint that requires authentication, THE Network_Layer SHALL attach the JWT retrieved from the Storage_Layer to the request's Authorization header via an auth interceptor.
3. WHEN a Dio error occurs during a request, THE Network_Layer SHALL translate the error into one of the following typed `ApiException` subtypes: `NetworkException` for connection or timeout failures, `UnauthorisedException` for authentication-rejection responses, `ValidationException` for client-side validation-rejection responses, and `ServerException` for server-side failure responses.
4. WHEN a successful HTTP response is received, THE Network_Layer SHALL parse the backend response envelope `{ success, message, data }` into a typed `ApiResponse<T>`.
5. THE Network_Layer SHALL apply a connect timeout of 10 seconds and a receive timeout of 15 seconds to every request.
6. THE Network_Layer SHALL select the base URL `http://192.168.12.196:3000` for debug builds and `https://api.cooksmartapp.com` for release builds.
7. THE Network_Layer SHALL use `dio` at version `^5.4.3`. The `retrofit` package at version `^4.1.0` was removed by the `flutter-port-auth` spec because its transitive `analyzer <7.0.0` constraint cannot co-exist with `glados`'s `package:test`-promoted requirement of `analyzer >= 8.0.0` under Flutter SDK 3.44+. No source under `mobile/lib/` imported `retrofit` at the time of removal. The Network_Layer therefore uses hand-rolled `dio` calls (with feature-shaped seams under `lib/core/network/` per the `flutter-port-auth` design's Decision 4) until either (a) `retrofit_generator` ships a release that lifts the analyzer cap, or (b) a follow-up spec restructures the codegen toolchain. Per_Feature_Specs MUST NOT add `retrofit` back without amending this requirement.
8. THE Mobile_App SHALL NOT import the `dio` package outside the Network_Layer.
9. WHEN a 401 Unauthorised response is received for a request that was sent with a stored JWT and a refresh token is available in the Storage_Layer at the time of the call, THE Network_Layer SHALL attempt exactly one refresh-token call using the stored refresh token, and SHALL retry the original request once with the new JWT only when that refresh-token call succeeds.
10. IF the refresh-token call returns a non-success response, exceeds the receive timeout, or no refresh token is available in the Storage_Layer, THEN THE Network_Layer SHALL clear all stored auth tokens from the Storage_Layer and trigger redirection to the login route.
11. IF the connect timeout or receive timeout is exceeded for a request, THEN THE Network_Layer SHALL raise a `NetworkException` indicating a timeout to the caller.
12. IF a received response body cannot be parsed as the `{ success, message, data }` envelope, THEN THE Network_Layer SHALL raise a `ServerException` indicating an invalid response format.
13. IF a request requires authentication but no JWT is available in the Storage_Layer, THEN THE Network_Layer SHALL fail the request with an `UnauthorisedException` and SHALL NOT send the request to the Backend_API.

### Requirement 5: Routing with go_router

**User Story:** As the solo developer, I want one declarative router that handles auth-gated redirects and a bottom-tab shell, so that navigation maps cleanly from the existing React Navigation structure.

#### Acceptance Criteria

1. THE Router SHALL use `go_router` at version `^14.2.0` as declared in `mobile/pubspec.yaml`.
2. THE Router SHALL expose its configured `GoRouter` instance via a Riverpod provider so consumers obtain the router without constructing it directly.
3. THE Router SHALL declare the initial location as `/` and resolve it to the main shell's first tab when the user is authenticated.
4. THE Router SHALL define every route name and path as a `static const String` in `mobile/lib/core/router/routes.dart`, and route declarations SHALL reference these constants rather than string literals.
5. THE Router SHALL host all bottom-tabbed destinations inside a single `StatefulShellRoute.indexedStack` whose branches preserve independent navigation stacks across tab switches.
6. THE Router SHALL declare authentication routes (including `/auth/login`) as top-level routes outside the `StatefulShellRoute.indexedStack`, so authentication screens render without the bottom tab bar.
7. WHEN an unauthenticated user requests any route whose path does not start with `/auth`, THE Router SHALL redirect to `/auth/login` within 100 milliseconds of the navigation request and SHALL NOT render the requested destination.
8. WHEN an authenticated user requests any route whose path starts with `/auth`, THE Router SHALL redirect to `/` within 100 milliseconds of the navigation request and SHALL NOT render the requested authentication screen.
9. WHEN the authentication state changes, THE Router SHALL re-evaluate the current location against the redirect rules in criteria 7 and 8 and navigate accordingly without requiring a manual refresh.
10. WHEN the operating system delivers a deep link to the application, THE Router SHALL resolve the link's path against its configured routes and apply the redirect rules in criteria 7 and 8 before rendering, using only `go_router`'s built-in deep link handling with no additional plugin configuration.
11. IF a deep link or navigation request targets a path that matches no configured route, THEN THE Router SHALL display an error destination indicating the route was not found and SHALL preserve the previous navigation stack so the user can return to it.

### Requirement 6: Migration Strategy and Cutover Gate

**User Story:** As the solo developer, I want a parallel-build window followed by a binary cutover gate and a one-release-cycle rollback archive, so that I can ship hotfixes during the port and recover from a critical regression after cutover.

#### Acceptance Criteria

1. WHILE the Parallel_Build_Phase is in effect, THE Legacy_RN_App SHALL produce a successful release APK build on every commit to the main branch.
2. WHILE the Parallel_Build_Phase is in effect, THE Mobile_App SHALL be developed in `mobile/` without modifying `src/` or root-level `android/`.
3. THE Migration_Project SHALL define a parity checklist that lists every in-scope feature with a status of `pass`, `fail`, or `skip`.
4. THE Cutover_Gate SHALL evaluate to `cutover` only when every entry on the parity checklist has status `pass` or `skip`, the smoke test on a physical Android device passes, and a release APK signed with the production keystore is present.
5. IF any parity checklist entry has status `fail`, THEN THE Cutover_Gate SHALL evaluate to `block` and SHALL identify the failing entries.
6. IF the smoke test on a physical Android device fails, THEN THE Cutover_Gate SHALL evaluate to `block`.
7. IF a release APK signed with the production keystore is absent, THEN THE Cutover_Gate SHALL evaluate to `block`.
8. WHEN the Cutover_Gate evaluates to `cutover`, THE Migration_Project SHALL move `src/`, root-level `android/`, `App.tsx`, root `package.json`, root `babel.config.js`, and root `app.json` into a Legacy_Archive at `legacy-rn/` using `git mv`.
9. WHEN the Legacy_Archive is created, THE Migration_Project SHALL create a git tag named `rn-final-snapshot` pointing at the cutover commit and SHALL push the tag to the origin remote.
10. WHEN the Legacy_Archive is created, THE Migration_Project SHALL write a `legacy-rn/README.md` that documents how to revive the React Native app for rollback.
11. WHEN the Legacy_Archive is created, THE CI_Pipeline SHALL stop running React Native test and build jobs.
12. WHEN at least one stable release has shipped after cutover and at least 14 days have elapsed without a rollback, THE Migration_Project SHALL delete the Legacy_Archive folder.
13. THE `rn-final-snapshot` git tag SHALL persist after the Legacy_Archive is deleted.
14. THE Migration_Project SHALL NOT use Flutter add-to-app or hybrid composition to embed Flutter modules into the Legacy_RN_App.
15. THE Migration_Project SHALL NOT delete `src/` or root-level `android/` before the Cutover_Gate evaluates to `cutover`.

### Requirement 7: iOS Deferral with Placeholder Project

**User Story:** As the solo developer, I want the Flutter project scaffolded for both Android and iOS but with iOS not built in CI, so that the architecture stays iOS-compatible without paying for iOS work until Mac access is justified.

#### Acceptance Criteria

1. WHEN scaffolding the Mobile_App, THE Migration_Project SHALL run `flutter create` with the platforms argument set exactly to `android,ios` and SHALL fail the scaffolding step if the resulting `mobile/ios/` directory is not produced.
2. THE Cook_Smart_Repo SHALL commit the `mobile/ios/` directory produced by `flutter create`, including the `Runner.xcodeproj`, `Runner/Info.plist`, and `Podfile` files, and SHALL NOT add `mobile/ios/` to `.gitignore`.
3. THE CI_Pipeline SHALL NOT execute `flutter build ios`, `flutter build ipa`, `pod install`, `xcodebuild`, or any iOS code-signing step, and SHALL NOT require a macOS runner for any job that runs on every push or pull request.
4. WHEN evaluating any package for inclusion in `pubspec.yaml`, THE Mobile_App SHALL reject any package whose declared platform support is Android-only if a package providing equivalent functionality with both Android and iOS support exists on pub.dev.
5. THE Mobile_App SHALL NOT include any package in `pubspec.yaml` whose declared platform support is iOS-only.
6. IF a pull request adds or modifies `pubspec.yaml`, THEN THE CI_Pipeline SHALL fail the pull request when any added dependency declares support for only Android or only iOS.
7. THE Mobile_App `README.md` SHALL contain a section titled "iOS Status" stating that iOS is not built, not signed, and not shipped pending Mac access, and SHALL list the exact gating conditions (Mac access available and iOS work justified) required before iOS builds will be enabled.

### Requirement 8: Material 3 Theme System

**User Story:** As the solo developer, I want one Material 3 ThemeData with brand colour tokens defined in a central location, so that the Flutter port consolidates the visual style currently scattered across 40+ React Native screens.

#### Acceptance Criteria

1. THE Theme_System SHALL expose two `ThemeData` instances via the `AppTheme` class through static methods named exactly `light()` and `dark()`, each returning a non-null `ThemeData` configured with `useMaterial3: true`.
2. THE Theme_System SHALL define all brand colour tokens as `static const Color` constants in the `AppColours` class, including at minimum a primary brand colour, a secondary colour, a background colour, a surface colour, an error colour, and an on-primary text colour.
3. WHEN the Mobile_App initialises its root `MaterialApp`, THE Mobile_App SHALL assign `AppTheme.light()` to the `theme` property and `AppTheme.dark()` to the `darkTheme` property so that every screen inherits the same Material 3 token set.
4. IF any widget references a colour value not defined in `AppColours`, THEN THE Theme_System SHALL fail the project's static analysis step (e.g., a lint or analyzer rule) so that ad-hoc colours cannot be merged.
5. THE Mobile_App SHALL preserve the existing brand identity by reusing the same logo asset, the same primary brand colour value, and the same typography hierarchy (display, headline, title, body, label scales) as the Legacy_RN_App, without replicating Legacy_RN_App screen layouts pixel-for-pixel.
6. WHERE the iOS build flavour is enabled, THE Mobile_App SHALL substitute Cupertino equivalents for date pickers and action sheets while sourcing all colour and typography values from the same `AppTheme` instance used on Android.

### Requirement 9: Backend Contract Stability

**User Story:** As the solo developer, I want the Flutter port to consume the existing REST API without backend changes, so that the migration risk stays scoped to the mobile codebase.

#### Acceptance Criteria

1. WHILE building the Mobile_App in release configuration, THE Mobile_App SHALL issue all Backend_API requests to the base URL `https://api.cooksmartapp.com` and SHALL NOT issue requests to any other host.
2. IF a release build of the Mobile_App is configured with a Backend_API base URL other than `https://api.cooksmartapp.com`, THEN THE build process SHALL fail with an error indicating an invalid release API base URL and SHALL NOT produce a distributable artifact.
3. THE Migration_Project SHALL NOT introduce, remove, or rename any endpoint path or HTTP method on the Backend_API.
4. THE Migration_Project SHALL NOT modify the request schema (fields, types, required/optional status) or response schema of any existing Backend_API endpoint.
5. THE Migration_Project SHALL NOT modify the JWT-based authentication flow used by the Backend_API, including token issuance, token format, token lifetime, refresh behavior, and the header used to transmit the token.
6. THE Migration_Project SHALL NOT modify the response envelope `{ success, message, data }` returned by the Backend_API, including field names, field types, and presence rules.
7. WHEN a Per_Feature_Spec identifies a Backend_API endpoint that is required by the Flutter port but does not exist in the current Backend_API, THE Per_Feature_Spec SHALL file a separate backend issue capturing the required endpoint, request schema, and response schema, and SHALL mark the dependent mobile feature as blocked until that backend issue is resolved outside the Migration_Project scope.
8. IF a Per_Feature_Spec proposes a change to an existing Backend_API endpoint, authentication flow, or response envelope, THEN THE Migration_Project SHALL reject the proposal with a rationale referencing this requirement and SHALL NOT implement the change within the Migration_Project.

### Requirement 10: Committed Package List

**User Story:** As the solo developer, I want the foundational Flutter package set committed in this spec, so that per-feature specs do not relitigate library choices and the dependency surface stays stable.

#### Acceptance Criteria

1. THE Mobile_App SHALL declare `flutter_secure_storage` at version `^9.2.2` for sensitive value storage in the `dependencies` section of `mobile/pubspec.yaml`.
2. THE Mobile_App SHALL declare `shared_preferences` at version `^2.2.3` for non-sensitive preference storage in the `dependencies` section of `mobile/pubspec.yaml`.
3. THE Mobile_App SHALL declare `mobile_scanner` at version `^5.1.1` for camera and barcode scanning in the `dependencies` section of `mobile/pubspec.yaml`.
4. THE Mobile_App SHALL declare `firebase_core` at version `^3.1.0` and `firebase_messaging` at version `^15.0.0` for push notifications in the `dependencies` section of `mobile/pubspec.yaml`.
5. THE Mobile_App SHALL declare `just_audio` at version `^0.9.38` and `audio_service` at version `^0.18.13` for audio playback in the `dependencies` section of `mobile/pubspec.yaml`.
6. THE Mobile_App SHALL declare `flutter_native_splash` at version `^2.4.0`, `package_info_plus` at version `^8.0.0`, and `url_launcher` at version `^6.3.0` in the `dependencies` section of `mobile/pubspec.yaml`.
7. THE Mobile_App SHALL declare `cached_network_image` at version `^3.3.1` and `shimmer` at version `^3.0.0` in the `dependencies` section of `mobile/pubspec.yaml`.
8. THE Mobile_App SHALL declare `very_good_analysis` at version `^6.0.0` as the lint ruleset in the `dev_dependencies` section of `mobile/pubspec.yaml`.
9. THE Mobile_App SHALL declare `mocktail` at version `^1.0.4` as the test mocking library in the `dev_dependencies` section of `mobile/pubspec.yaml`.
10. THE Mobile_App SHALL declare `build_runner` at version `^2.4.11` as code generation tooling in the `dev_dependencies` section of `mobile/pubspec.yaml`. The `riverpod_generator ^2.4.0` and `retrofit_generator ^8.1.0` packages were removed by the `flutter-port-auth` spec for the analyzer-version conflict described in Requirement 4.7; both were unused at the time of removal (no `@riverpod` annotations and no `.g.dart` part files anywhere under `mobile/lib/`). Provider declarations under the Foundation_Phase therefore use the hand-written `Provider`, `Notifier`, and `AsyncNotifier` constructors permitted by Requirement 3.8's "generated code adds no value" carve-out. A follow-up spec MAY re-introduce either codegen package once an analyzer-compatible release ships and at least one consumer in `mobile/lib/` actually requires it.
11. THE Mobile_App SHALL constrain the Dart SDK to `>=3.9.0 <4.0.0` and the Flutter SDK to `>=3.44.0` in the `environment` section of `mobile/pubspec.yaml`.
12. IF a Per_Feature_Spec proposes changing any package version pinned by criteria 1 through 11 without amending this requirement, THEN THE Migration_Project SHALL reject the change and SHALL retain the version specified in this requirement.
13. WHEN `flutter pub get` is run against `mobile/pubspec.yaml`, THE Mobile_App SHALL resolve all pinned versions without conflict and SHALL produce a `mobile/pubspec.lock` file.

### Requirement 11: Encapsulation of Core Infrastructure

**User Story:** As the solo developer, I want infrastructure libraries hidden behind thin wrappers, so that swapping a backend (storage, HTTP, router) is a one-file change rather than a sweep across every feature.

#### Acceptance Criteria

1. THE Mobile_App SHALL define an abstract `SecureStorage` class in `mobile/lib/core/storage/secure_storage.dart` exposing `writeToken(key, value)`, `readToken(key)`, `deleteToken(key)`, and `clearAll()` methods, where `key` is a non-empty string of 1 to 128 characters and `value` is a string of 0 to 4096 characters.
2. WHEN any operation defined on `SecureStorage` fails due to an unavailable or denied platform keystore, THE Mobile_App SHALL surface a typed storage error identifying the failed operation and preserve any previously stored values unchanged.
3. THE Mobile_App SHALL NOT import the `flutter_secure_storage` package in any file outside the Storage_Layer, and a static check SHALL fail the build when such an import is detected.
4. THE Mobile_App SHALL define an abstract `ApiClient` interface in the Network_Layer exposing `get(path)`, `post(path, body)`, `put(path, body)`, and `delete(path)` methods that return a typed response containing status, headers, and decoded body.
5. IF a method on the `ApiClient` interface is invoked and the underlying transport returns a non-success status or fails to complete, THEN THE Mobile_App SHALL return a typed network error identifying the HTTP method, request path, and failure category without exposing transport-library types to callers.
6. THE Mobile_App SHALL access the configured Dio instance, the GoRouter instance, and every infrastructure singleton exclusively through Riverpod providers declared in the Core_Layer.
7. THE Mobile_App SHALL NOT instantiate a Dio instance, a GoRouter instance, or any infrastructure singleton inside a widget, and a static check SHALL fail the build when such instantiation is detected in files under the widget tree.

### Requirement 12: Release Build Base URL

**User Story:** As the solo developer, I want release builds to always target the production backend, so that shipped APKs cannot accidentally point at a developer machine.

#### Acceptance Criteria

1. THE Mobile_App SHALL determine the API base URL at compile time using `bool.fromEnvironment('dart.vm.product')`, with no runtime override mechanism that could change the selected URL after build.
2. WHEN a build is compiled in release mode (`dart.vm.product == true`), THE Mobile_App SHALL set the API base URL to exactly `https://api.cooksmartapp.com` (HTTPS scheme, no trailing slash, no path suffix).
3. WHEN a build is compiled in non-release mode (`dart.vm.product == false`), THE Mobile_App SHALL set the API base URL to exactly `http://192.168.12.196:3000`.
4. IF a release build is configured with any API base URL other than `https://api.cooksmartapp.com`, THEN THE Mobile_App SHALL fail the build at compile time with an error indicating the release base URL is invalid.
5. WHEN the Mobile_App initializes in release mode, THE Mobile_App SHALL emit no network request whose host matches a private IPv4 range (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16) or `localhost`.

### Requirement 13: Cross-Platform Package Constraint

**User Story:** As the solo developer, I want every committed plugin to support both Android and iOS, so that enabling iOS later requires no plugin replacement work.

#### Acceptance Criteria

1. THE Mobile_App SHALL only include packages in `pubspec.yaml` whose published platform support declares both Android and iOS as supported platforms.
2. WHEN a Per_Feature_Spec proposes adding a new package to `pubspec.yaml`, THE Per_Feature_Spec SHALL record, before the package is committed, the package name, package version, and a verification note citing the package's declared Android and iOS platform support.
3. IF a proposed package does not declare support for both Android and iOS, THEN THE Per_Feature_Spec SHALL reject the package and SHALL document at least one alternative cross-platform package that was evaluated.
4. IF an Android-only package is selected as the only viable option for a Per_Feature_Spec, THEN THE Per_Feature_Spec SHALL document an iOS replacement plan containing the candidate iOS-compatible replacement package, the trigger condition for replacement, and the owner responsible, and SHALL amend this requirement to list the package as an approved exception before the package is committed.

### Requirement 14: Testing Foundation

**User Story:** As the solo developer, I want unit, widget, and integration test harnesses set up in the Foundation_Phase, so that per-feature specs can write tests without standing up infrastructure.

#### Acceptance Criteria

1. THE Mobile_App SHALL declare `flutter_test` and `integration_test` as dev dependencies in `pubspec.yaml` with versions pinned to the Flutter SDK version specified in the Foundation_Phase.
2. THE Mobile_App SHALL include a `test/` directory whose subdirectory structure mirrors every subdirectory present under `lib/` at the end of the Foundation_Phase, with each `test/` subdirectory containing at minimum a placeholder Dart file.
3. THE Mobile_App SHALL include an `integration_test/` directory at the project root containing a driver entry point file that initializes the `integration_test` package binding.
4. WHEN a pull request modifies one or more files under `mobile/`, THE CI_Pipeline SHALL execute the unit and widget test suites and SHALL block merge if any test fails or if the suite does not complete within 15 minutes.
5. WHILE the Parallel_Build_Phase is in effect, WHEN a pull request is opened or updated, THE CI_Pipeline SHALL execute the React Native test suite under `__tests__/` and SHALL block merge if any test fails or if the suite does not complete within 15 minutes.
6. IF a Foundation_Phase deliverable contains an integration test body, a golden test body, or a property-based test body, THEN THE CI_Pipeline SHALL reject the pull request with an error indicating that such test bodies are deferred to per-feature specs.
7. IF a required test harness file (`pubspec.yaml` dev dependency entry, `test/` directory, or `integration_test/` driver entry point) is missing or unreadable, THEN THE CI_Pipeline SHALL fail the build with an error indicating which harness component is missing.

### Requirement 15: Per-Feature Spec Sequencing

**User Story:** As the solo developer, I want the order of per-feature migration specs committed up front, so that foundation, authentication, and high-risk features land before dependent work.

#### Acceptance Criteria

1. THE Migration_Project SHALL produce per-feature migration specs in the order published in the design document, beginning with `flutter-port-auth` and ending with `flutter-ios-enablement`.
2. THE Migration_Project SHALL complete the `flutter-port-auth` spec before any spec that depends on authenticated features.
3. THE Migration_Project SHALL schedule the `flutter-port-barcode-scanner` spec early in the sequence to surface camera and ML Kit risk while the migration window has time to react.
4. THE Migration_Project SHALL complete the `flutter-port-home-shell` spec before specs that depend on the bottom-tab navigation shell.
5. WHERE a per-feature spec has no dependency on another in-progress per-feature spec, THE Migration_Project MAY parallelize the work across specs that are independent of each other.

### Requirement 16: Crash Reporting in Foundation_Phase

**User Story:** As the solo developer, I want crashes captured from the moment the Mobile_App runs, so that issues during the Parallel_Build_Phase are visible without affecting Legacy_RN_App users.

#### Acceptance Criteria

1. WHEN the Mobile_App executes its bootstrap sequence before rendering the first screen, THE Mobile_App SHALL register a `FlutterError.onError` handler that forwards every captured Flutter framework error, including its stack trace and a fatal flag, to Firebase Crashlytics within 1 second of capture.
2. WHEN the Mobile_App executes its bootstrap sequence before rendering the first screen, THE Mobile_App SHALL register a `PlatformDispatcher.instance.onError` handler that forwards every captured uncaught asynchronous Dart error, including its stack trace and a fatal flag, to Firebase Crashlytics within 1 second of capture and returns `true` to mark the error as handled.
3. IF registration of either the `FlutterError.onError` handler or the `PlatformDispatcher.instance.onError` handler fails during bootstrap, THEN THE Mobile_App SHALL abort startup before rendering the first screen and surface an error indicating that crash reporting could not be initialized.
4. WHILE the Mobile_App is running in the Foundation_Phase or Parallel_Build_Phase, THE Mobile_App SHALL route 100% of crashes captured by either handler to the Firebase Crashlytics project dedicated to the Mobile_App and SHALL NOT emit crash reports to any Firebase Crashlytics project used by the Legacy_RN_App.
5. IF startup is aborted due to handler registration failure per criterion 3, THEN THE Mobile_App SHALL still route any crashes captured during the abort sequence to the Firebase Crashlytics project dedicated to the Mobile_App.

### Requirement 17: Secrets and Build Configuration

**User Story:** As the solo developer, I want secrets to come from configuration files rather than source code, so that credentials are not committed to the repository.

#### Acceptance Criteria

1. WHEN the Mobile_App is built for Android, THE Mobile_App SHALL load Firebase Android configuration from the file `mobile/android/app/google-services.json` and SHALL fail the build with an error indicating the missing configuration if the file is absent.
2. THE Mobile_App SHALL load all API keys, signing passwords, and other secrets at runtime or build time from environment variables or untracked configuration files (such as `.env` files or `mobile/android/keystore.properties`) rather than from source files under `mobile/lib/`.
3. THE Cook_Smart_Repo SHALL list `mobile/android/app/google-services.json`, keystore files (`*.jks`, `*.keystore`), `keystore.properties`, and `.env` files in `.gitignore` so that these files are excluded from version control.
4. IF any source file under `mobile/lib/` contains a hardcoded API key, signing password, or other secret literal, THEN THE Migration_Project SHALL fail its pre-commit or CI verification step with an error identifying the offending file and secret type.
5. WHEN the Migration_Project produces a release APK, THE Migration_Project SHALL sign the APK using a production keystore referenced from an untracked configuration file, and the keystore file itself SHALL NOT be committed to the Cook_Smart_Repo.
6. IF the production keystore file or its credentials are unavailable at release build time, THEN THE Migration_Project SHALL abort the release build with an error indicating which keystore artifact is missing and SHALL NOT produce an unsigned or debug-signed release APK.
7. IF the secret-verification step fails for reasons other than detection of a secret literal in a source file under `mobile/lib/` (such as a tool error, transient I/O failure, or false positive that is not an actual secret), THEN THE Migration_Project SHALL allow the build to proceed and SHALL log the verification-tool failure with the offending pattern, the file scanned, and a timestamp for follow-up.
8. WHEN the secret-verification step completes without detecting a secret literal but a known false-negative pattern category is suspected, THE Migration_Project SHALL require either an additional manual review by the developer or a stricter verification pass to complete successfully before producing a release artifact.

