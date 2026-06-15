# Implementation Plan: Flutter Port — Authentication

## Overview

This plan ports the cook-smart authentication feature into the Flutter `mobile/` project per the design's `data/domain/presentation` split. Every task touches exactly one file (or one source file's mirrored test) so independent tasks can run in parallel inside a wave. The implementation language is Dart/Flutter, inherited from the foundation; no new packages are added apart from `glados`, which the design specifies for property tests but is not actually present in the foundation `pubspec.yaml` and so must be added here.

The eight waves below let an orchestrator dispatch ~28 leaf tasks across the spec with the same parallelism the foundation proved out. Wave 0 lands the dev-dependency change so `glados`-backed property tests can compile in later waves; waves 1–6 build the source layers bottom-up (domain → data → presentation → main wiring); wave 7 lays the integration tests on top; and the final checkpoint runs the same gate the foundation used (`flutter test`, `flutter analyze`, all four `tool/check_*.dart` scripts).

## Tasks

- [x] 1. Add property-test dev dependency
  - [x] 1.1 Add `glados` to `mobile/pubspec.yaml` `dev_dependencies`
    - Touch only `mobile/pubspec.yaml`
    - Add `glados: ^1.1.6` under `dev_dependencies` (the design references `glados` as the property-test runner; it is not present in the foundation pubspec, so add it once here so later waves can compile)
    - Run `flutter pub get` from `mobile/` and confirm `pubspec.lock` updates
    - Verify `dart run tool/check_packages.dart` still passes (glados is pure Dart and supports both Android and iOS)
    - _Requirements: 13.1, 13.2_

- [x] 2. Implement the domain layer
  - [x] 2.1 Implement `User` in `mobile/lib/features/auth/domain/user.dart`
    - Touch only `mobile/lib/features/auth/domain/user.dart`
    - `final class User` with private `const` constructor, value equality across all 15 fields, and `copyWith` covering every field
    - Three named factories: `User.fromLoginJson`, `User.fromRegisterJson` (defaulting `is_admin` to `false` when absent), `User.fromMeJson`
    - `toJson()` emits all 15 fields so a User round-trips through `SecureStorage`
    - Missing non-null fields raise `ServerException` identifying the offending endpoint and field
    - _Requirements: 1.2, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x]* 2.2 Write property tests for `User` in `mobile/test/features/auth/domain/user_test.dart`
    - Touch only `mobile/test/features/auth/domain/user_test.dart`
    - **Property 1: User round-trip across all four endpoint shapes** — `Glados2<User, _ResponseShape>().test(...)` over login/register/me/persistence shapes
    - **Property 2: Missing required field surfaces as ServerException** — drop one required field at a time and assert `ServerException` with the offending endpoint and field name
    - **Property 3: copyWith preserves all non-overridden fields** — `Glados2<User, _FieldName>` over every field
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.6, 4.3, 4.4, 4.5, 4.6, 4.7**

  - [x] 2.3 Implement `AuthState` in `mobile/lib/features/auth/domain/auth_state.dart`
    - Touch only `mobile/lib/features/auth/domain/auth_state.dart`
    - `sealed class AuthState` with three `final class` variants: `AuthLoading` (no payload), `AuthUnauthenticated({String? errorMessage})`, `AuthAuthenticated({required User user, required String token})`
    - All three with `const` constructors and value equality across all fields
    - _Requirements: 1.2, 6.1, 6.2, 6.3, 6.4_

  - [x]* 2.4 Write unit tests for `AuthState` in `mobile/test/features/auth/domain/auth_state_test.dart`
    - Touch only `mobile/test/features/auth/domain/auth_state_test.dart`
    - Verify the three variants are exhaustively switchable (compile-time exhaustiveness check via `final class`)
    - Verify equality and `hashCode` for each variant
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 3. Implement the data layer: response classes, fixtures, and the refresh stub
  - [x] 3.1 Implement `AuthLoginResponse` in `mobile/lib/features/auth/data/auth_login_response.dart`
    - Touch only `mobile/lib/features/auth/data/auth_login_response.dart`
    - `final class` with `fromJson` reading top-level `token` (non-empty `String`) and `user` (`Map<String, dynamic>`); ignore `success` and `message`
    - Build `User` via `User.fromLoginJson`; raise `ServerException` for malformed bodies identifying `POST /api/v1/auth/login`
    - _Requirements: 3.1, 3.2, 3.6_

  - [x] 3.2 Implement `AuthRegisterResponse` in `mobile/lib/features/auth/data/auth_register_response.dart`
    - Touch only `mobile/lib/features/auth/data/auth_register_response.dart`
    - `final class` with `fromJson` reading top-level `token` (non-empty `String`), `user` (`Map<String, dynamic>`), optional `special_message` (`String?`); ignore `message` and `lifetime_access`
    - Build `User` via `User.fromRegisterJson`; raise `ServerException` for malformed bodies identifying `POST /api/v1/auth/register`
    - _Requirements: 3.1, 3.3, 3.6_

  - [x] 3.3 Implement `AuthMeResponse` in `mobile/lib/features/auth/data/auth_me_response.dart`
    - Touch only `mobile/lib/features/auth/data/auth_me_response.dart`
    - `final class` with `fromJson` reading top-level `user` (`Map<String, dynamic>`)
    - Build `User` via `User.fromMeJson`; raise `ServerException` for malformed bodies identifying `GET /api/v1/auth/me`
    - _Requirements: 3.1, 3.4, 3.6_

  - [x] 3.4 Implement `AuthLogoutResponse` in `mobile/lib/features/auth/data/auth_logout_response.dart`
    - Touch only `mobile/lib/features/auth/data/auth_logout_response.dart`
    - `final class` whose `fromJson` ignores the body entirely (existence == success)
    - _Requirements: 3.1, 3.5_

  - [x] 3.5 Implement `cookSmartRefreshNotSupported` in `mobile/lib/features/auth/data/refresh_token_stub.dart`
    - Touch only `mobile/lib/features/auth/data/refresh_token_stub.dart`
    - Top-level `Future<String> cookSmartRefreshNotSupported(String _)` that synchronously throws `const UnauthorisedException('Refresh tokens are not supported by the cook-smart backend; the user must re-authenticate.')`
    - Doc comment documents the function as the dead-code refresh seam for the cook-smart backend per Decision 2
    - Does not import `package:dio` (architecture lint); imports `UnauthorisedException` from `core/network/api_exception.dart` only
    - _Requirements: 8.1, 8.2, 8.5, 8.6_

  - [x]* 3.6 Add backend response fixtures in `mobile/test/features/auth/data/fixtures.dart`
    - Touch only `mobile/test/features/auth/data/fixtures.dart`
    - Export `Map<String, dynamic>` constants `loginFixture`, `registerFixture`, `meFixture`, `logoutFixture` derived literally from `backend/src/routes/auth.ts` handler shapes
    - These fixtures are the single source of truth for "what the wire actually looks like" so a backend change shows up as one fixture diff
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [x]* 3.7 Write unit tests for `AuthLoginResponse` in `mobile/test/features/auth/data/auth_login_response_test.dart`
    - Touch only `mobile/test/features/auth/data/auth_login_response_test.dart`
    - Parse `loginFixture` and assert top-level `token` and the resulting `User` match expected values
    - Verify malformed bodies (missing `token`, non-object `user`) raise `ServerException` naming `/login`
    - _Requirements: 3.2, 3.6_

  - [x]* 3.8 Write unit tests for `AuthRegisterResponse` in `mobile/test/features/auth/data/auth_register_response_test.dart`
    - Touch only `mobile/test/features/auth/data/auth_register_response_test.dart`
    - Parse `registerFixture` and assert `token`, `user`, and optional `special_message` capture
    - Verify malformed bodies raise `ServerException` naming `/register`
    - _Requirements: 3.3, 3.6_

  - [x]* 3.9 Write unit tests for `AuthMeResponse` in `mobile/test/features/auth/data/auth_me_response_test.dart`
    - Touch only `mobile/test/features/auth/data/auth_me_response_test.dart`
    - Parse `meFixture` and assert all 15 User fields populate, including the four `/me`-only nullable fields
    - Verify malformed bodies raise `ServerException` naming `/me`
    - _Requirements: 3.4, 3.6, 4.4_

  - [x]* 3.10 Write unit tests for `AuthLogoutResponse` in `mobile/test/features/auth/data/auth_logout_response_test.dart`
    - Touch only `mobile/test/features/auth/data/auth_logout_response_test.dart`
    - Verify `fromJson` returns successfully whether or not the response body contains the optional `success` and `message` fields
    - _Requirements: 3.5_

  - [x]* 3.11 Write unit tests for `cookSmartRefreshNotSupported` in `mobile/test/features/auth/data/refresh_token_stub_test.dart`
    - Touch only `mobile/test/features/auth/data/refresh_token_stub_test.dart`
    - Verify the function throws `UnauthorisedException` synchronously (before any `await`) and never contacts the network
    - _Requirements: 8.1_

- [x] 4. Implement the AuthRepository
  - [x] 4.1 Implement `AuthRepository` and `authRepositoryProvider` in `mobile/lib/features/auth/data/auth_repository.dart`
    - Touch only `mobile/lib/features/auth/data/auth_repository.dart` (the auth-feature transport seam at `mobile/lib/core/network/auth_api_client.dart` was landed in a prior amendment per Decision 4)
    - Constructor takes `AuthApiClient` (from `authApiClientProvider`) and `SecureStorage` (from `secureStorageProvider`); declare `static const String userRecordKey = 'auth_user'`
    - Methods: `login`, `register`, `restoreSession`, `logout` matching the design's signatures
    - The `requiresAuth` per-endpoint contract lives inside `AuthApiClient` — `login` and `register` opt out of JWT injection at the seam; `me` and `logout` use the default. The repository never sets `Options(extra: ...)` directly.
    - Does NOT import `package:dio` (architecture lint). The repository imports `AuthApiClient` and `AuthApiResponse` from `core/network/auth_api_client.dart` only.
    - On successful login or register, write JWT under `AuthInterceptor.jwtTokenKey` and `jsonEncode(user.toJson())` under `userRecordKey` before resolving
    - On `restoreSession`, refresh the persisted user record after a successful `/me`; on `UnauthorisedException` invoke `clearAll`; on `NetworkException`/`ServerException` keep storage intact
    - On `logout`, best-effort `_client.logout()` wrapped in a swallow-all `try/catch`, then `SecureStorage.clearAll()` outside the catch so it always runs
    - Class-level doc comment documents the foundation's `RefreshTokenCall` typedef and refresh-and-retry block as dead code in the cook-smart context per Requirement 8.6
    - Expose `final Provider<AuthRepository> authRepositoryProvider`
    - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 8.6, 11.1, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [x]* 4.2 Write property tests for `AuthRepository` in `mobile/test/features/auth/data/auth_repository_test.dart`
    - Touch only `mobile/test/features/auth/data/auth_repository_test.dart`
    - Use a hand-rolled `_FakeAuthApiClient` and `_InMemorySecureStorage` per the design's "Mock surface" section (the seam is `AuthApiClient`, not `Dio` — see Decision 4)
    - **Property 4: Storage write surface is exactly two keys** — assert successful login/register write exactly `{'jwt', 'auth_user'}` and never `'refreshToken'`
    - **Property 10: Signup request includes optional names iff trimmed non-empty** — `Glados2<String?, String?>` over `(firstName, lastName)` and assert request body field presence/absence rule
    - Example test for Requirement 2.7 — repository accepts 200–299 as success and 201 as register success
    - Example test for Requirement 12.6 — `NetworkException` from `/me` does NOT call `clearAll` and keeps the JWT persisted
    - **Validates: Requirements 5.6, 8.7, 2.2, 10.1, 2.7, 12.5, 12.6**

- [x] 5. Implement the AuthNotifier
  - [x] 5.1 Implement `AuthNotifier` and `authNotifierProvider` in `mobile/lib/features/auth/presentation/auth_notifier.dart`
    - Touch only `mobile/lib/features/auth/presentation/auth_notifier.dart`
    - `class AuthNotifier extends AsyncNotifier<AuthState>` with `build()` running Session_Restore (read JWT, conditionally call `restoreSession`, dispatch outcomes per Property 6)
    - Methods: `login`, `signup`, `logout`, `markSessionExpired`
    - Never rethrow — failures map to `AuthUnauthenticated(errorMessage: ...)`; success maps to `AuthAuthenticated(user, token)`; `logout` always resolves to `AuthUnauthenticated(errorMessage: null)`
    - `markSessionExpired` transitions to `AuthUnauthenticated('Your session has expired')` so the redirect callback can call it without owning a notifier reference
    - Expose `final AsyncNotifierProvider<AuthNotifier, AuthState> authNotifierProvider`
    - _Requirements: 1.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 7.1, 9.1, 9.2, 9.3, 10.2, 10.3, 11.1, 11.2, 11.4, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [x]* 5.2 Write property tests for `AuthNotifier` in `mobile/test/features/auth/presentation/auth_notifier_test.dart`
    - Touch only `mobile/test/features/auth/presentation/auth_notifier_test.dart`
    - **Property 5: Logout is idempotent across all HTTP outcomes** — `Glados2<AuthState, _LogoutOutcome>` over `(starting state, /logout HTTP outcome ∈ {2xx, NetworkException, ServerException, UnauthorisedException, ValidationException})`; assert final state is `AuthUnauthenticated(errorMessage: null)`, `clearAll` called exactly once, no exception thrown
    - **Property 6: Session_Restore dispatches every outcome correctly** — `Glados2<_PersistedJwt, _MeOutcome>`; assert the dispatch table from the design holds for every (JWT presence, /me outcome) pair
    - **Property 7: Successful login or signup transitions to AuthAuthenticated** — `Glados2<User, String>` over `(user, token)` returned by mocked repo; assert `AuthAuthenticated(user, token)` by value equality
    - **Property 8: Failed login or signup transitions to AuthUnauthenticated without rethrow** — `Glados<_ApiExceptionVariant>`; assert no rethrow, `errorMessage` non-null, zero `writeToken` calls
    - **Validates: Requirements 5.4, 5.5, 6.6, 6.7, 6.8, 6.9, 11.2, 11.4, 11.5, 12.4, 12.5, 12.6**

- [x] 6. Implement the foundation overrides
  - [x] 6.1 Implement `buildAuthOverrides` in `mobile/lib/features/auth/presentation/auth_overrides.dart`
    - Touch only `mobile/lib/features/auth/presentation/auth_overrides.dart`
    - Top-level `List<Override> buildAuthOverrides()` returning three overrides per Decision 3
    - Override 1: `authStateProvider.overrideWith` with a tiny `Notifier<bool>` that watches `authNotifierProvider` and emits `next.valueOrNull is AuthAuthenticated` per Requirement 7.2
    - Override 2: `authRedirectCallbackProvider.overrideWith((ref) => () { ref.read(routerProvider).go(Routes.loginPath); ref.read(authNotifierProvider.notifier).markSessionExpired(); })`
    - Override 3: `dioProvider.overrideWith` mirroring the foundation's body but constructing `ErrorInterceptor` with `refreshCall: cookSmartRefreshNotSupported` per Decision 2
    - Architecture lint compliant: no `Color(` literals, no `Dio(` construction (the override 3 helper lives outside `presentation/` lint scope only if the helper is a top-level function — keep `_buildDioWithCookSmartRefresh` constructed via the existing `dioProvider` indirection without instantiating `Dio(` directly inside any presentation widget)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.2, 8.3, 8.4_

  - [x]* 6.2 Write property test for `buildAuthOverrides` in `mobile/test/features/auth/presentation/auth_overrides_test.dart`
    - Touch only `mobile/test/features/auth/presentation/auth_overrides_test.dart`
    - **Property 9: authStateProvider derivation matches AuthAuthenticated** — `Glados<_AsyncAuthState>` over `{AsyncValue.loading, AsyncValue.error, AsyncData(AuthLoading), AsyncData(AuthUnauthenticated(...)), AsyncData(AuthAuthenticated(...))}`; assert the derived `authStateProvider` resolves to `true` iff the value is `AsyncData(AuthAuthenticated(...))`
    - Example test: invoking the overridden `authRedirectCallbackProvider` calls `routerProvider.go(Routes.loginPath)` and `markSessionExpired` exactly once
    - **Validates: Requirements 7.2, 7.3, 8.4**

- [x] 7. Implement the auth screens
  - [x] 7.1 Implement `LoginScreen` in `mobile/lib/features/auth/presentation/login_screen.dart`
    - Touch only `mobile/lib/features/auth/presentation/login_screen.dart`
    - `ConsumerWidget` watching `authNotifierProvider` to drive loading and inline error states
    - Owns `TextEditingController`s and a `GlobalKey<FormState>` for client-side validation: email regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` after trim, password non-empty after trim
    - `obscureText: true` on the password field
    - Calls `ref.read(authNotifierProvider.notifier).login(...)`; never throws to the user
    - Inline error region renders `'Invalid email or password.'` for `UnauthorisedException`, the backend message for `ValidationException`, a category-specific message + retry affordance for `NetworkException`/`ServerException`
    - All colours sourced from `Theme.of(context)` — no `Color(` literals in this file (architecture lint)
    - _Requirements: 1.4, 1.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

  - [x]* 7.2 Write widget tests for `LoginScreen` in `mobile/test/features/auth/presentation/login_screen_test.dart`
    - Touch only `mobile/test/features/auth/presentation/login_screen_test.dart`
    - **Property 11: Email validator rejects every invalid shape** — `Glados<String>` over `{empty, whitespace-only, no @, @ only, leading whitespace, trailing whitespace, embedded whitespace, no . after @, multi-@}`; assert validator returns non-null and `login` is not invoked
    - **Property 12 (login portion): Password length** — `Glados<String>` for strings shorter than 1 char after trim; assert validator rejects and `login` is not invoked
    - Example test for Requirement 9.5 — `UnauthorisedException` renders the literal `'Invalid email or password.'` and never the backend's raw 401 message
    - Example test for Requirement 9.9 — password field is `obscureText: true`
    - **Validates: Requirements 9.5, 9.7, 9.8, 9.9**

  - [x] 7.3 Implement `SignupScreen` in `mobile/lib/features/auth/presentation/signup_screen.dart`
    - Touch only `mobile/lib/features/auth/presentation/signup_screen.dart`
    - `ConsumerWidget` watching `authNotifierProvider`
    - Owns first/last/email/password/confirm/age-verify form fields with validators: email regex, password ≥ 8 chars, password match, age-verification checkbox required
    - Calls `ref.read(authNotifierProvider.notifier).signup(...)` with trimmed email and trimmed first/last names (or `null` when empty after trim)
    - On success with non-null `special_message`, surface a non-blocking welcome banner before navigating to `/`
    - On `ValidationException`, preserve every field except the password fields, which are cleared
    - All colours sourced from `Theme.of(context)` — no `Color(` literals (architecture lint)
    - _Requirements: 1.4, 1.7, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10_

  - [x]* 7.4 Write widget tests for `SignupScreen` in `mobile/test/features/auth/presentation/signup_screen_test.dart`
    - Touch only `mobile/test/features/auth/presentation/signup_screen_test.dart`
    - **Property 10: Signup request includes optional names iff trimmed non-empty** — `Glados2<String?, String?>` over `(firstName, lastName)` ∈ `{null, '', '   ', '  Alice  ', 'Alice'}`; assert the call to the notifier passes the trimmed value or `null`
    - **Property 11: Email validator rejects every invalid shape** (signup variant)
    - **Property 12: Password validators reject short and mismatched inputs** — `Glados<String>` for length < 8 and `Glados2<String, String>` for mismatched pairs; assert `signup` is not invoked
    - Example test for Requirement 10.7 — unchecked age-verification prevents submission
    - Example test for Requirement 10.10 — `special_message` renders in a banner before navigation
    - **Validates: Requirements 2.2, 10.1, 10.4, 10.5, 10.6, 10.7, 10.10**

- [x] 8. Wire the overrides into application bootstrap
  - [x] 8.1 Apply `buildAuthOverrides()` in `mobile/lib/main.dart`
    - Touch only `mobile/lib/main.dart`
    - Import `package:mobile/features/auth/presentation/auth_overrides.dart`
    - Replace the existing `const ProviderScope(child: CookSmartApp())` with `ProviderScope(overrides: buildAuthOverrides(), child: const CookSmartApp())`
    - Do not introduce a second `ProviderScope`; do not modify any file under `mobile/lib/core/`
    - _Requirements: 7.4, 7.6, 8.2_

- [x] 9. Mid-build checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Integration tests
  - [x]* 10.1 Write `mobile/integration_test/auth_session_restore_test.dart`
    - Touch only `mobile/integration_test/auth_session_restore_test.dart`
    - Boot the app under a `ProviderScope.overrides` swapping `dioProvider` for a fake transport and `secureStorageProvider` for in-memory storage
    - Pre-load a JWT and assert the app lands on `/` after `/me` returns 200
    - Pre-load a JWT and assert the app lands on `/auth/login` after `/me` returns 401, with `SecureStorage.clearAll` having been invoked
    - With no persisted JWT, assert the app lands on `/auth/login` without issuing a `/me` request
    - Example test for Requirement 7.5 — auth-state flip re-evaluates router redirects without modifying `routerProvider`
    - **Validates: Requirements 7.5, 8.3, 8.4, 12.4, 12.5, 12.7**

  - [x]* 10.2 Write `mobile/integration_test/auth_logout_test.dart`
    - Touch only `mobile/integration_test/auth_logout_test.dart`
    - Boot the app authenticated, invoke logout, assert the app lands on `/auth/login` regardless of `/logout` HTTP outcome
    - Repeat with `/logout` returning 200, returning a `NetworkException`, and returning a `ServerException`; in every case assert the same final navigation target and that `SecureStorage` is cleared
    - **Validates: Requirements 11.2, 11.3, 11.5**

- [x] 11. Final checkpoint — full verification suite
  - From `mobile/`, run `flutter test`, `flutter analyze`, `dart run tool/check_architecture.dart`, `dart run tool/check_structure.dart`, `dart run tool/check_packages.dart`, `dart run tool/check_secrets.dart`
  - All six commands MUST report green; report the result and ask the user if any questions arise
  - This is the gate that "the spec is done" — the same gate the foundation_phase used
  - _Requirements: 13.1, 13.3, 13.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery; core implementation tasks (source files and `main.dart` wiring) are never marked optional
- Each task touches exactly one file so independent tasks within a wave can run in parallel under Run-All-Tasks without write conflicts
- Property tests reference the design document's twelve correctness properties; each property's test sub-task explicitly cites its property number and the requirements clauses it validates
- No file under `mobile/lib/core/` is modified by this spec — every foundation hook is consumed via the override seams already published (`authStateProvider`, `authRedirectCallbackProvider`, `dioProvider`)
- The architectural-enforcement scripts (`tool/check_*.dart`) and the `very_good_analysis` lint set stay unchanged; the final-checkpoint task is the gate that proves it

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.3", "3.5", "3.6"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "3.4", "2.2", "2.4", "3.11"] },
    { "id": 3, "tasks": ["4.1", "3.7", "3.8", "3.9", "3.10"] },
    { "id": 4, "tasks": ["5.1", "4.2"] },
    { "id": 5, "tasks": ["6.1", "7.1", "7.3", "5.2"] },
    { "id": 6, "tasks": ["8.1", "6.2", "7.2", "7.4"] },
    { "id": 7, "tasks": ["10.1", "10.2"] }
  ]
}
```

