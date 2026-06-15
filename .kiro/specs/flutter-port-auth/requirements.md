# Requirements Document

## Introduction

This spec ports the cook-smart authentication feature from the React Native app under `src/` to the Flutter app under `mobile/`. It is the second spec in the Flutter migration, immediately following `flutter-migration-architecture` (the Foundation_Phase, complete and shipped) whose committed decisions every requirement here inherits.

Scope is the MVP authentication surface that the existing user-facing backend at `https://api.cooksmartapp.com` actually exposes today. The shipping endpoints under `/api/v1/auth/*` are exactly four: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, and `POST /api/v1/auth/logout`. Anything that requires a backend route the public auth router does not expose (forgot-password, reset-password, refresh-token rotation, two-factor authentication) is explicitly out of scope and deferred to later specs gated on backend work, per Foundation Requirement 9 which forbids backend changes within the migration.

Two facts discovered during code review anchor this spec and are formalised below:

1. The Foundation_Phase's `ApiResponse<DataType>.fromJson` envelope parser (Foundation Requirements 4.4, 9.6) assumes every backend response is shaped `{ success, message, data }`. The auth endpoints disagree: register, login, and `/me` each return a different shape with the JWT and user payload at the top level. This spec resolves the deviation at the feature boundary by parsing the real shapes inside `lib/features/auth/data/` rather than amending the foundation envelope.
2. The Foundation_Phase's `ErrorInterceptor` was built around a single-shot 401-then-refresh-then-retry pattern (Foundation Requirements 4.9, 4.10), with `_unimplementedRefreshCall` and the `RefreshTokenCall` typedef intended to be replaced by this spec. The cook-smart backend does not expose a refresh endpoint on `/api/v1/auth/*`, so this spec replaces the stub with a refresh function that fails immediately, documents the typedef and refresh path as dead code in the cook-smart context, and leaves the foundation's existing clear-and-redirect behaviour as the active 401 path.

These requirements are derived from the user's MVP scope, the actual `backend/src/routes/auth.ts` contract, the existing RN auth implementation in `src/services/authService.ts` and `src/contexts/AuthContext.tsx`, and the Foundation_Phase's published architectural commitments.

## Glossary

- **Auth_Feature**: The Flutter authentication feature ported by this spec, residing under `mobile/lib/features/auth/`.
- **Foundation_Phase**: The work committed by `.kiro/specs/flutter-migration-architecture/`, including the `core/` infrastructure layer, providers, and architectural-enforcement scripts. Cited as "Foundation Requirement N.M" or "Foundation Decision N".
- **Mobile_App**: The Flutter mobile app under `mobile/`, as defined by the Foundation_Phase.
- **Backend_API**: The cook-smart REST API at `https://api.cooksmartapp.com`, unchanged by this spec.
- **Auth_Endpoints**: The four user-facing authentication routes mounted under `/api/v1/auth/*` by `backend/src/routes/auth.ts`: `POST /register`, `POST /login`, `GET /me`, `POST /logout`. No other endpoint is in scope.
- **Auth_Repository**: The data-layer repository at `mobile/lib/features/auth/data/auth_repository.dart` that owns every call to the Auth_Endpoints and persists the JWT and user record.
- **Auth_Notifier**: The Riverpod notifier at `mobile/lib/features/auth/presentation/auth_notifier.dart` that holds the application's authentication state and exposes `login`, `signup`, and `logout` mutations.
- **Auth_State**: A sealed Dart type defined under `mobile/lib/features/auth/domain/` with the variants `AuthLoading`, `AuthUnauthenticated`, and `AuthAuthenticated`. The third variant carries the resolved User value.
- **User**: The Flutter domain model defined under `mobile/lib/features/auth/domain/user.dart`, shaped as the union of every field any of the Auth_Endpoints returns. `/me`-only fields are nullable.
- **JWT**: The JSON Web Token issued by the Backend_API and persisted by the Auth_Repository under `SecureStorage` key `'jwt'`, matching the constant `AuthInterceptor.jwtTokenKey` declared by the Foundation_Phase.
- **Session_Restore**: The startup flow that reads any persisted JWT from `SecureStorage`, calls `GET /api/v1/auth/me` once to validate the token and hydrate the User, and resolves the Auth_State to `AuthAuthenticated` on success or `AuthUnauthenticated` on failure.
- **Auth_Login_Response**: The response shape returned by `POST /api/v1/auth/login`, namely `{ success: true, message, token, user }` with the JWT at the top level.
- **Auth_Register_Response**: The response shape returned by `POST /api/v1/auth/register`, namely `{ message, token, user, special_message?, lifetime_access? }` with the JWT at the top level and no `success` field.
- **Auth_Me_Response**: The response shape returned by `GET /api/v1/auth/me`, namely `{ user }` with no envelope.
- **Auth_Logout_Response**: The response shape returned by `POST /api/v1/auth/logout`, namely `{ success: true, message }` with no `data` payload.
- **Refresh_Dead_Code**: The Foundation_Phase's `RefreshTokenCall` typedef in `error_interceptor.dart`, the refresh-and-retry block within `ErrorInterceptor.onError`, and the `_unimplementedRefreshCall` stub in `dio_client.dart`. Collectively unused in the cook-smart context because the Backend_API exposes no refresh endpoint.
- **Cleared_Session**: The Auth_Repository state immediately after `SecureStorage.clearAll` has been awaited and the Auth_Notifier has emitted `AuthUnauthenticated`.

## Requirements

### Requirement 1: Feature Folder Layout

**User Story:** As the solo developer, I want every Auth_Feature source file to live under `mobile/lib/features/auth/` in the data/domain/presentation layout the Foundation_Phase committed, so that the auth code stays a deletable, move-able unit and the architectural-enforcement scripts pass without relaxation.

#### Acceptance Criteria

1. THE Auth_Feature SHALL place every Dart source file under `mobile/lib/features/auth/`, and SHALL place each file inside exactly one of the subfolders `data/`, `domain/`, or `presentation/`. EXCEPT THAT a single transport seam — `mobile/lib/core/network/auth_api_client.dart` — lives under `lib/core/network/` so the Foundation_Phase's `tool/check_architecture.dart` ban on `package:dio` outside `lib/core/network/` continues to hold. The seam exposes only the four Auth_Endpoints' surfaces; it is not a general-purpose API client. See Decision 4 of the design document.
2. THE Auth_Feature SHALL define the User domain model in `mobile/lib/features/auth/domain/user.dart` and the Auth_State sealed type in `mobile/lib/features/auth/domain/auth_state.dart`.
3. THE Auth_Feature SHALL define the Auth_Repository in `mobile/lib/features/auth/data/auth_repository.dart` and the typed auth response classes (Auth_Login_Response, Auth_Register_Response, Auth_Me_Response, Auth_Logout_Response) under `mobile/lib/features/auth/data/`.
4. THE Auth_Feature SHALL define the Auth_Notifier in `mobile/lib/features/auth/presentation/auth_notifier.dart`, the `LoginScreen` widget in `mobile/lib/features/auth/presentation/login_screen.dart`, and the `SignupScreen` widget in `mobile/lib/features/auth/presentation/signup_screen.dart`.
5. THE Auth_Feature SHALL NOT import any source file under `mobile/lib/features/<other_feature>/` and SHALL NOT be imported by any source file under `mobile/lib/features/<other_feature>/`.
6. THE Auth_Feature SHALL pass every invariant enforced by `mobile/tool/check_architecture.dart` without modification of that script, including but not limited to the bans on importing `package:dio` outside `lib/core/network/`, importing `package:flutter_secure_storage` outside `lib/core/storage/`, constructing `Dio(` or `GoRouter(` from a `presentation/` folder, and using `FutureBuilder` in any feature file.
7. THE Auth_Feature SHALL NOT contain any `Color(` literal in any file under `mobile/lib/features/auth/`, and any colour referenced by a presentation widget SHALL resolve to a constant defined in `lib/core/theme/app_colours.dart` per Foundation Requirement 8.4.
8. THE Auth_Feature SHALL provide a `_test.dart` file at the mirrored path under `mobile/test/features/auth/` for every Dart source file under `mobile/lib/features/auth/`, per Foundation Requirements 2.11 and 2.12.

### Requirement 2: Backend Endpoint Contract

**User Story:** As the solo developer, I want the Auth_Repository to call exactly the four auth endpoints the Backend_API exposes today, so that the migration ships against the real backend without proposing endpoint changes that Foundation Requirement 9 forbids.

#### Acceptance Criteria

1. WHEN the Auth_Notifier handles a login request, THE Auth_Repository SHALL issue a `POST` to the path `/api/v1/auth/login` with a JSON request body containing exactly the fields `email` (String) and `password` (String).
2. WHEN the Auth_Notifier handles a signup request, THE Auth_Repository SHALL issue a `POST` to the path `/api/v1/auth/register` with a JSON request body containing the fields `email` (String), `password` (String), and `age_verified` (boolean), and SHALL include the optional fields `first_name` (String) and `last_name` (String) only when the caller-provided values are non-null and non-empty after trimming.
3. WHEN the Auth_Notifier handles a Session_Restore request, THE Auth_Repository SHALL issue a `GET` to the path `/api/v1/auth/me` with no request body and with the request's `requiresAuth` flag set to `true` so the Foundation_Phase's `AuthInterceptor` attaches the persisted JWT.
4. WHEN the Auth_Notifier handles a logout request and a JWT is currently persisted, THE Auth_Repository SHALL issue a `POST` to the path `/api/v1/auth/logout` with no request body and with the request's `requiresAuth` flag set to `true`.
5. THE Auth_Repository SHALL NOT issue a request to any path other than `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/me`, or `/api/v1/auth/logout`.
6. THE Auth_Repository SHALL set the request's `requiresAuth` flag (via the Foundation_Phase's `AuthInterceptor.requiresAuthExtraKey`) to `false` for the login and register requests, and SHALL set the flag to `true` for the `/me` and logout requests.
7. THE Auth_Repository SHALL accept any HTTP success response in the range 200 through 299 inclusive as a successful response, and SHALL accept the 201 response from `POST /api/v1/auth/register` as a successful registration.

### Requirement 3: Response Envelope Strategy

**User Story:** As the solo developer, I want the Auth_Repository to parse the actual response shapes returned by the Backend_API rather than the canonical `{ success, message, data }` envelope, so that login, signup, and `/me` succeed against the real backend without amending the Foundation_Phase's `ApiResponse<DataType>` parser.

#### Acceptance Criteria

1. THE Auth_Repository SHALL NOT call `ApiResponse<DataType>.fromJson` for any response returned by the Auth_Endpoints, because the Auth_Endpoints do not return the canonical `{ success, message, data }` envelope.
2. WHEN a `200` response is received from `POST /api/v1/auth/login`, THE Auth_Repository SHALL parse the response body as Auth_Login_Response by reading the top-level fields `token` (non-empty String), `user` (non-null JSON object), and the optional fields `success` (boolean) and `message` (String).
3. WHEN a `201` response is received from `POST /api/v1/auth/register`, THE Auth_Repository SHALL parse the response body as Auth_Register_Response by reading the top-level fields `token` (non-empty String), `user` (non-null JSON object), and the optional fields `message` (String), `special_message` (String), and `lifetime_access` (boolean).
4. WHEN a `200` response is received from `GET /api/v1/auth/me`, THE Auth_Repository SHALL parse the response body as Auth_Me_Response by reading the top-level field `user` (non-null JSON object).
5. WHEN a `200` response is received from `POST /api/v1/auth/logout`, THE Auth_Repository SHALL treat the response as a successful logout regardless of whether the optional `success` (boolean) and `message` (String) fields are present in the body.
6. IF a successful HTTP response from any Auth_Endpoint is parsed and the parse fails because a required field is missing, mistyped, or otherwise malformed in the response body (for example because `token` is missing or `user` is not a JSON object on login or register), THEN THE Auth_Repository SHALL raise a `ServerException` with a message identifying the offending endpoint and SHALL NOT persist any value to `SecureStorage`. Transport-level failures (no response received, timeout, connection error) SHALL surface as the `ApiException` subtype already produced by the Foundation_Phase's `ErrorInterceptor` rather than as `ServerException` from this rule.
7. THE Auth_Feature SHALL NOT modify the Foundation_Phase's `ApiResponse<DataType>` class, the canonical envelope contract documented by Foundation Requirement 9.6, or the foundation's `tool/check_architecture.dart` invariants.

### Requirement 4: User Domain Model as Endpoint Union

**User Story:** As the solo developer, I want the Flutter User model to be the union of every field any Auth_Endpoint can return, so that login, register, and `/me` all decode into the same domain type and `/me`-only fields populate naturally on Session_Restore.

#### Acceptance Criteria

1. THE User domain model SHALL declare the following non-null fields: `id` (String), `email` (String), `is_co_founder` (bool), `is_special_user` (bool), `is_creator` (bool), `has_lifetime_subscription` (bool), `subscription_status` (String), `points` (int), `is_admin` (bool).
2. THE User domain model SHALL declare the following nullable fields: `first_name` (String?), `last_name` (String?), `dietary_restrictions` (List<String>?), `allergies` (List<String>?), `show_nutrition` (bool?), `preferred_units` (String?).
3. WHEN parsing a `user` JSON object from Auth_Login_Response or Auth_Register_Response, THE User domain model SHALL populate every non-null field declared in criterion 1 and SHALL leave the `dietary_restrictions`, `allergies`, `show_nutrition`, and `preferred_units` fields as `null` because those four fields are returned only by `GET /api/v1/auth/me`. This null-population rule is contextual to the parsing entry point used and does not constrain User instances constructed from `/me` responses, persisted records, or `copyWith`.
4. WHEN parsing a `user` JSON object from Auth_Me_Response, THE User domain model SHALL populate every non-null field declared in criterion 1 and SHALL populate every nullable field declared in criterion 2 from the corresponding JSON value, treating a JSON `null` or absent field as the Dart value `null`.
5. IF a `user` JSON object is missing any field declared as non-null in criterion 1, THEN THE User domain model SHALL raise a `ServerException` identifying the missing field and SHALL NOT construct a partial User instance.
6. THE User domain model SHALL provide a `toJson()` method that emits exactly the field names listed in criteria 1 and 2 with their JSON-equivalent values, so the model can be persisted to and re-read from `SecureStorage` without loss.
7. THE User domain model SHALL be implemented as a `final class` with `const` constructor, value-equality (`==` and `hashCode` by all fields), and `copyWith` covering every field declared in criteria 1 and 2.

### Requirement 5: Session Persistence in SecureStorage

**User Story:** As a returning user, I want my JWT and user record to persist across app restarts under the keys the Foundation_Phase reserves, so that I am restored to an authenticated session without re-entering credentials.

#### Acceptance Criteria

1. WHEN the Auth_Repository receives a successful Auth_Login_Response or Auth_Register_Response, THE Auth_Repository SHALL write the response's `token` value to `SecureStorage` under the key `AuthInterceptor.jwtTokenKey` (literal value `'jwt'`) before resolving the login or signup operation.
2. WHEN the Auth_Repository receives a successful Auth_Login_Response, Auth_Register_Response, or Auth_Me_Response, THE Auth_Repository SHALL write the JSON-encoded User record produced by `User.toJson()` to `SecureStorage` under the key `AuthRepository.userRecordKey` (literal value `'auth_user'`) before resolving the operation.
3. WHEN the Auth_Repository performs Session_Restore at startup, THE Auth_Repository SHALL first read the JWT from `SecureStorage` under the key `'jwt'`, and SHALL only issue the `GET /api/v1/auth/me` request when the JWT is non-null and non-empty.
4. WHEN the Auth_Repository performs logout, THE Auth_Repository SHALL invoke `SecureStorage.clearAll` to remove every persisted value, regardless of whether the `POST /api/v1/auth/logout` request to the Backend_API succeeds.
5. IF the `POST /api/v1/auth/logout` request fails with any error including network unavailability, server failure, or `UnauthorisedException`, THEN THE Auth_Repository SHALL still complete the local logout by invoking `SecureStorage.clearAll` and SHALL resolve the logout operation without re-raising the network error.
6. THE Auth_Repository SHALL NOT write the user's password, the response's `special_message`, the response's `lifetime_access`, or any other field outside the JWT and the User record to `SecureStorage`.
7. IF a `SecureStorage` write or read fails with a `StorageException`, THEN THE Auth_Repository SHALL surface the failure to the Auth_Notifier as a typed error, and the Auth_Notifier SHALL emit `AuthUnauthenticated` for any failure observed during Session_Restore.

### Requirement 6: Auth State Machine

**User Story:** As a developer integrating with auth, I want one sealed Auth_State that covers loading, unauthenticated, and authenticated states, so that every consumer handles the three cases exhaustively at compile time.

#### Acceptance Criteria

1. THE Auth_State sealed type SHALL declare exactly three variants named `AuthLoading`, `AuthUnauthenticated`, and `AuthAuthenticated`, each as a `final class` extending the sealed parent.
2. THE `AuthAuthenticated` variant SHALL carry a non-null `user` field of type User and a non-null `token` field of type String.
3. THE `AuthUnauthenticated` variant SHALL carry an optional `errorMessage` field of type String? that is non-null only when the previous transition was a failed login, signup, Session_Restore, or 401 clear-and-redirect.
4. THE `AuthLoading` variant SHALL carry no payload fields.
5. WHEN the Auth_Notifier is first constructed, THE Auth_Notifier SHALL emit `AuthLoading` and SHALL begin the Session_Restore flow.
6. WHEN Session_Restore completes successfully, THE Auth_Notifier SHALL emit `AuthAuthenticated` with the User returned by `GET /api/v1/auth/me` and the JWT read from `SecureStorage`.
7. WHEN Session_Restore completes with any failure including no persisted JWT, an `UnauthorisedException` from the Backend_API, any other `ApiException` subtype from `GET /api/v1/auth/me`, a `StorageException`, or a timeout, THE Auth_Notifier SHALL emit `AuthUnauthenticated` and SHALL set the `errorMessage` field to a description of the failure when the cause is anything other than "no persisted JWT", in which case `errorMessage` SHALL be `null`. IF a second Session_Restore failure is observed concurrently with a first one in flight, THEN THE Auth_Notifier SHALL retain the result of the first failure and SHALL NOT re-emit a second `AuthUnauthenticated` for the concurrent failure.
8. WHEN the Auth_Notifier handles a successful login or signup, THE Auth_Notifier SHALL emit `AuthAuthenticated` with the User and JWT returned by the Auth_Endpoint.
9. WHEN the Auth_Notifier handles a failed login or signup, THE Auth_Notifier SHALL emit `AuthUnauthenticated` with `errorMessage` set to the failure description, SHALL NOT raise the failure to the calling widget, and the Auth_Repository SHALL NOT have written any value to `SecureStorage`.
10. WHEN the Auth_Notifier handles a logout request, THE Auth_Notifier SHALL emit `AuthUnauthenticated` with `errorMessage` set to `null` after the Auth_Repository's logout operation resolves.

### Requirement 7: Riverpod Provider Graph and Foundation Wiring

**User Story:** As the solo developer, I want the Auth_Notifier to replace the Foundation_Phase's `authStateProvider` stub and to plug a real navigation callback into `authRedirectCallbackProvider`, so that the router and the network layer's clear-and-redirect path work against the real auth state with no further changes.

#### Acceptance Criteria

1. THE Auth_Feature SHALL declare an `authNotifierProvider` of type `AsyncNotifierProvider<AuthNotifier, AuthState>` in `mobile/lib/features/auth/presentation/auth_notifier.dart`, where `AuthState` is the sealed type defined in Requirement 6.
2. THE Auth_Feature SHALL provide an override of the Foundation_Phase's `authStateProvider` that derives a `bool` from `authNotifierProvider` according to the rule "true when the current `AsyncValue<AuthState>` resolves to `AuthAuthenticated`, false in every other case including `AuthLoading`, `AuthUnauthenticated`, `AsyncValue.loading`, and `AsyncValue.error`".
3. THE Auth_Feature SHALL provide an override of the Foundation_Phase's `authRedirectCallbackProvider` whose `RedirectToLoginCallback` invocation calls `GoRouter.go(Routes.loginPath)` on the router exposed by `routerProvider` and clears the persisted JWT and user record by invoking the Auth_Repository's logout flow.
4. THE Auth_Feature SHALL apply both overrides in `mobile/lib/main.dart` by adding them to the `overrides` list of the existing root `ProviderScope` and SHALL NOT introduce a second `ProviderScope`.
5. WHEN the override of `authStateProvider` resolves, THE Foundation_Phase's `routerProvider` SHALL re-evaluate its redirect rules without code change to `core/router/router_provider.dart`, satisfying Foundation Requirement 5.9.
6. THE Auth_Feature SHALL NOT modify the file `mobile/lib/core/router/router_provider.dart` or the file `mobile/lib/core/network/dio_client.dart` beyond the documented ProviderScope override pattern that those files already invite.
7. WHERE a widget under `mobile/lib/features/auth/presentation/` reads authentication state, THE widget SHALL read from `authNotifierProvider` and SHALL NOT read from the Foundation_Phase's `authStateProvider`, because the boolean stub exists for the router and the network layer rather than for feature-internal consumption.

### Requirement 8: Refresh Dead-Code Strategy

**User Story:** As the solo developer, I want the Foundation_Phase's refresh-token machinery wired with a function that fails immediately, so that the existing 401 clear-and-redirect path fires correctly without pretending the cook-smart backend supports a refresh endpoint it does not expose.

#### Acceptance Criteria

1. THE Auth_Feature SHALL provide a `RefreshTokenCall` named `cookSmartRefreshNotSupported` whose body raises `UnauthorisedException` synchronously with the message `'Refresh tokens are not supported by the cook-smart backend; the user must re-authenticate.'`, and SHALL NOT contact any Backend_API endpoint.
2. THE Auth_Feature SHALL replace the Foundation_Phase's `_unimplementedRefreshCall` by overriding `dioProvider` in the root `ProviderScope` with a Dio instance that constructs `ErrorInterceptor` using `cookSmartRefreshNotSupported` as the `refreshCall` parameter.
3. WHEN `ErrorInterceptor` observes a `401` response on any authenticated request, THE Auth_Feature's wiring SHALL ensure the resulting refresh attempt fails immediately with the `UnauthorisedException` from criterion 1, so the Foundation_Phase's existing clear-and-redirect path runs unchanged and `SecureStorage.clearAll` is invoked.
4. WHEN the clear-and-redirect path runs as a consequence of a 401, THE `authRedirectCallbackProvider` override from Requirement 7.3 SHALL navigate the router to `Routes.loginPath` and the Auth_Notifier SHALL emit `AuthUnauthenticated` with `errorMessage` set to a session-expired description.
5. THE Auth_Feature SHALL NOT modify the Foundation_Phase's `error_interceptor.dart` source file, because the file already documents the `RefreshTokenCall` injection point as the override seam.
6. THE Auth_Feature SHALL document, in the `mobile/lib/features/auth/data/auth_repository.dart` doc comment, that the `RefreshTokenCall` typedef and the refresh-and-retry block in `error_interceptor.dart` are dead code in the cook-smart context and that future refresh support requires a backend change outside the migration's scope.
7. THE Auth_Feature SHALL NOT persist a refresh token under the Foundation_Phase's `ErrorInterceptor.refreshTokenKey` (literal value `'refreshToken'`), because no Auth_Endpoint issues a refresh token.

### Requirement 9: Login Flow

**User Story:** As a returning user, I want to sign in with email and password, so that I can resume using the app without re-creating my account.

#### Acceptance Criteria

1. WHEN the user submits the LoginScreen with non-empty email and password values, THE Auth_Notifier SHALL invoke the Auth_Repository's login operation with the trimmed lower-cased email and the password as provided.
2. WHILE the Auth_Repository's login operation is in flight, THE LoginScreen SHALL display a loading indicator and SHALL disable the submit button.
3. WHEN the login operation succeeds, THE Auth_Notifier SHALL emit `AuthAuthenticated` and the Foundation_Phase's `routerProvider` SHALL redirect the user from `/auth/login` to `/` per Foundation Requirement 5.8.
4. WHEN the login operation fails with `ValidationException`, THE LoginScreen SHALL render the validation message returned by the Backend_API in an inline error region without dismissing the user's typed input.
5. WHEN the login operation fails with `UnauthorisedException`, THE LoginScreen SHALL render an inline error region with the literal message `'Invalid email or password.'` and SHALL NOT surface the Backend_API's raw 401 message.
6. WHEN the login operation fails with `NetworkException` or `ServerException`, THE LoginScreen SHALL render an inline error region with a description identifying the failure category and a retry affordance that re-submits the form on tap.
7. IF the email field is empty, contains only whitespace, or does not match the regular expression `^[^\s@]+@[^\s@]+\.[^\s@]+$` after trimming, THEN THE LoginScreen SHALL prevent submission, render an inline field-level error stating the email is invalid, and SHALL NOT invoke the Auth_Notifier.
8. IF the password field is empty after trimming, THEN THE LoginScreen SHALL prevent submission, render an inline field-level error stating the password is required, and SHALL NOT invoke the Auth_Notifier.
9. WHEN the LoginScreen renders the password field, THE LoginScreen SHALL configure the field with `obscureText: true` so the password is not visible by default.

### Requirement 10: Signup Flow

**User Story:** As a new user, I want to create an account with my email, password, and age verification, so that I can start using cook-smart.

#### Acceptance Criteria

1. WHEN the user submits the SignupScreen with valid inputs, THE Auth_Notifier SHALL invoke the Auth_Repository's signup operation with the trimmed lower-cased email, the password as provided, the trimmed `first_name` value (or `null` when empty after trimming), the trimmed `last_name` value (or `null` when empty after trimming), and the boolean `age_verified` value.
2. WHILE the Auth_Repository's signup operation is in flight, THE SignupScreen SHALL display a loading indicator and SHALL disable the submit button.
3. WHEN the signup operation succeeds, THE Auth_Notifier SHALL emit `AuthAuthenticated` with the User and JWT returned by `POST /api/v1/auth/register` and the Foundation_Phase's `routerProvider` SHALL redirect the user from `/auth/signup` to `/`.
4. IF the password field has fewer than 8 characters, THEN THE SignupScreen SHALL prevent submission, render an inline field-level error stating the password must be at least 8 characters, and SHALL NOT invoke the Auth_Notifier.
5. IF the confirm-password field does not match the password field exactly, THEN THE SignupScreen SHALL prevent submission, render an inline field-level error stating the passwords do not match, and SHALL NOT invoke the Auth_Notifier.
6. IF the email field is empty, contains only whitespace, or does not match the regular expression `^[^\s@]+@[^\s@]+\.[^\s@]+$` after trimming, THEN THE SignupScreen SHALL prevent submission, render an inline field-level error stating the email is invalid, and SHALL NOT invoke the Auth_Notifier.
7. IF the age-verification checkbox is not selected, THEN THE SignupScreen SHALL prevent submission, render an inline field-level error stating the user must verify they are at least 13 years old, and SHALL NOT invoke the Auth_Notifier.
8. WHEN the signup operation fails with `ValidationException`, THE SignupScreen SHALL render the validation message returned by the Backend_API in an inline error region and SHALL preserve every typed field except the password fields, which SHALL be cleared so the user re-enters them.
9. WHEN the signup operation fails with `NetworkException` or `ServerException`, THE SignupScreen SHALL render an inline error region with a description identifying the failure category and a retry affordance that re-submits the form on tap.
10. WHEN the signup operation succeeds and the response contains a non-null `special_message` field, THE SignupScreen SHALL display the `special_message` text in a non-blocking welcome banner before navigating to `/`, so the cook-smart "co-founder" / "creator" / "special user" greeting is preserved from the React Native experience.

### Requirement 11: Logout Flow

**User Story:** As an authenticated user, I want a logout action that clears my session locally even if the backend is unreachable, so that I can sign out at any time.

#### Acceptance Criteria

1. WHEN the user invokes the logout action exposed by the Auth_Notifier, THE Auth_Notifier SHALL request that the Auth_Repository perform the logout operation defined in Requirement 5.4.
2. WHEN the Auth_Repository's logout operation resolves, regardless of whether `POST /api/v1/auth/logout` succeeded against the Backend_API, THE Auth_Notifier SHALL emit `AuthUnauthenticated` with `errorMessage` set to `null`.
3. WHEN the Auth_Notifier emits `AuthUnauthenticated` after logout, THE Foundation_Phase's `routerProvider` SHALL redirect the user to `/auth/login` per Foundation Requirement 5.7.
4. WHEN the user invokes logout while the Auth_State is `AuthLoading` or `AuthUnauthenticated`, THE Auth_Notifier SHALL still invoke `SecureStorage.clearAll` and emit `AuthUnauthenticated` so a partially-loaded session is cleared idempotently.
5. THE Auth_Repository's logout operation SHALL NOT raise to the Auth_Notifier any error originating from the `POST /api/v1/auth/logout` request, including `NetworkException`, `ServerException`, and `UnauthorisedException`.

### Requirement 12: Session Restore on App Start

**User Story:** As a returning user, I want the app to validate my persisted JWT against `GET /api/v1/auth/me` at startup, so that I land on the home screen without re-entering credentials when my session is still valid.

#### Acceptance Criteria

1. WHEN the Auth_Notifier is first constructed by Riverpod, THE Auth_Notifier SHALL read the persisted JWT from `SecureStorage` under the key `'jwt'`.
2. IF no JWT is persisted under the key `'jwt'` or the persisted value is the empty string, THEN THE Auth_Notifier SHALL emit `AuthUnauthenticated` with `errorMessage` set to `null` and SHALL NOT issue a request to `GET /api/v1/auth/me`.
3. WHEN a non-empty JWT is persisted, THE Auth_Notifier SHALL invoke the Auth_Repository's `restoreSession` operation, which issues a single `GET /api/v1/auth/me` request and returns the resulting User on success.
4. WHEN `restoreSession` succeeds, THE Auth_Notifier SHALL emit `AuthAuthenticated` with the returned User and the persisted JWT, and the Auth_Repository SHALL update the persisted user record in `SecureStorage` with the User returned by `/me` so subsequent reads see the `/me`-only fields.
5. WHEN `restoreSession` fails with `UnauthorisedException`, THE Auth_Repository SHALL invoke `SecureStorage.clearAll` and the Auth_Notifier SHALL emit `AuthUnauthenticated` with `errorMessage` set to a session-expired description.
6. WHEN `restoreSession` fails with `NetworkException` or `ServerException`, THE Auth_Notifier SHALL emit `AuthUnauthenticated` with `errorMessage` set to a description that distinguishes the network or server failure from a session-expired failure, and the Auth_Repository SHALL NOT clear the persisted JWT or user record.
7. THE Session_Restore flow SHALL complete or fail within the receive timeout configured by Foundation Requirement 4.5 (15 seconds), after which the Auth_Notifier SHALL emit `AuthUnauthenticated` with `errorMessage` set to a timeout description.

### Requirement 13: Architectural Compliance

**User Story:** As the solo developer, I want the Auth_Feature to ship without relaxing or amending the Foundation_Phase's enforcement scripts, so that the migration's invariants stay machine-checked.

#### Acceptance Criteria

1. THE Auth_Feature SHALL pass `dart run tool/check_architecture.dart`, `dart run tool/check_structure.dart`, `dart run tool/check_packages.dart`, and `dart run tool/check_secrets.dart` without modification of any of those scripts.
2. THE Auth_Feature SHALL NOT add any new Dart package to `mobile/pubspec.yaml`, because the Foundation_Phase's committed package list (Foundation Requirement 10) already covers every dependency this spec needs. EXCEPT THAT `glados ^1.1.6` is added under `dev_dependencies` for property-based testing per Decision 5 of the design document. Adding `glados` proved incompatible with the Foundation_Phase's `retrofit ^4.1.0`, `retrofit_generator ^8.1.0`, and `riverpod_generator ^2.4.0` pins because their transitive `analyzer <7.0.0` constraint cannot co-exist with `glados`'s `package:test`-promoted requirement of `analyzer >= 8.0.0`. None of the three packages was imported by any source under `mobile/lib/`, `mobile/test/`, or `mobile/integration_test/` at the time the auth-port spec was being implemented, so this spec removes them from `pubspec.yaml` and documents the removal as a deviation owed to the Foundation_Phase. The Foundation_Phase's pubspec deviations (Foundation Requirements 4.7, 10.10, and Foundation Decision 4) MUST be amended in a follow-up spec to either drop the three removed packages permanently or pin them to versions compatible with `analyzer >= 8.0.0`.
3. THE Auth_Feature SHALL pass `flutter analyze` under the `very_good_analysis` ruleset committed by Foundation Requirement 10.8.
4. THE Auth_Feature SHALL pass `flutter test` for every `_test.dart` file required by Requirement 1.8.
5. IF a future requirement of this spec implies a backend change to the Auth_Endpoints, the response envelope, or the JWT-based authentication flow, THEN THE Auth_Feature SHALL reject the change per Foundation Requirement 9.8 and SHALL file a separate backend issue rather than absorb the change into the migration.

