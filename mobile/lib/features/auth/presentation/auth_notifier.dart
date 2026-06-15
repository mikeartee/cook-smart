// Cook-smart authentication state machine — the Riverpod notifier that
// owns the [AuthState] surfaced into the rest of the app.
//
// `AuthNotifier` is the single source of truth for the user's session
// from the UI's perspective. Every screen that needs to know "is the
// user signed in?" watches [authNotifierProvider]; every mutation that
// affects authentication (login, signup, logout, a 401-driven session
// expiry) goes through one of this notifier's methods.
//
// The notifier consumes the `AuthRepository` declared in
// `features/auth/data/auth_repository.dart` for every backend call and
// for every `SecureStorage` read or write — see the doc comment on
// [AuthRepository] for the contract. It also reads the persisted JWT
// directly from [secureStorageProvider] inside [build] for the
// session-restore early-exit shortcut described in the design's
// "Session restore at startup" cross-cutting flow.
//
// Failure surface — never rethrows
// --------------------------------
//
// None of [login], [signup], [logout], or [markSessionExpired] ever
// rethrow to the calling widget. Every failure category maps to an
// `AuthUnauthenticated(errorMessage: ...)` state with a category-
// specific message:
//
//   * `UnauthorisedException` on login or signup → maps to a literal
//     auth-failure message that the [LoginScreen] or [SignupScreen]
//     renders inline. The notifier never surfaces the backend's raw
//     401 body to the user (Requirement 9.5).
//   * `UnauthorisedException` during session restore → maps to a
//     session-expired description and triggers `clearAll` inside
//     [AuthRepository.restoreSession] (Requirement 12.5).
//   * `ValidationException` → the backend's validation message is
//     surfaced verbatim so the screen can render it inline.
//   * `NetworkException` → category-specific "could not reach server"
//     message that the screen can pair with a retry affordance
//     (Requirements 9.6, 10.9, 12.6).
//   * `ServerException` → category-specific "server is having
//     trouble" message that the screen can pair with a retry
//     affordance.
//   * `StorageException` → describes the keystore failure so the user
//     can take action (e.g. retry on a fresh app launch).
//
// The screens consume `AuthState`, not the notifier method's future
// result. They switch on the sealed [AuthState] exhaustively and
// render the appropriate inline error region.
//
// Logout idempotence
// ------------------
//
// [logout] always resolves to `AuthUnauthenticated(errorMessage:
// null)` in the normal path (Requirement 11.2). The repository's
// `logout` method already swallows every transport failure from
// `POST /api/v1/auth/logout` (Requirement 11.5), so the only error
// path that can reach the notifier is a [StorageException] from
// `clearAll` itself. In that edge case the notifier still emits
// `AuthUnauthenticated` — with a non-null `errorMessage` describing
// the storage failure — so the user is never stuck on a half-resolved
// logout. The next successful auth call (or a fresh app launch with
// a working keystore) will overwrite the stale persisted values.
//
// `markSessionExpired`
// --------------------
//
// The 401 clear-and-redirect path declared by the foundation's
// `ErrorInterceptor` invokes [authRedirectCallbackProvider], whose
// auth-feature override (delivered in task 6.1) needs a synchronous
// way to flip the auth state to "session expired" without owning a
// notifier reference. [markSessionExpired] is exactly that hook:
// callable from any provider, sets `state = AsyncData(
// AuthUnauthenticated('Your session has expired'))` synchronously,
// and never raises (Requirements 8.4, 11.4 of the design).
//
// See `flutter-port-auth` Requirements 1.4, 6.5, 6.6, 6.7, 6.8, 6.9,
// 6.10, 7.1, 9.1, 9.2, 9.3, 10.2, 10.3, 11.1, 11.2, 11.4, 12.1, 12.2,
// 12.3, 12.4, 12.5, 12.6, 12.7.

// External libraries
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Internal modules
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/network/auth_interceptor.dart';
import 'package:mobile/core/storage/secure_storage.dart';
import 'package:mobile/core/storage/secure_storage_provider.dart';
import 'package:mobile/features/auth/data/auth_repository.dart';
import 'package:mobile/features/auth/domain/auth_state.dart';

// ---------------------------------------------------------------------------
// User-facing message constants. Centralised here so the screens, the
// notifier's tests, and the design's correctness properties all reference
// the same literal strings. Changing copy is a one-line diff.
//
// These are exposed as public top-level `const` strings so the auth
// screens can distinguish failure categories at the presentation layer
// without re-deriving the strings (which would risk drift). For example,
// `SignupScreen` clears the password fields only on a [ValidationException]
// (Requirement 10.8) but preserves them on [NetworkException] and
// [ServerException] so the retry affordance from Requirement 10.9 can
// re-submit the form. The screen tells the categories apart by comparing
// `AuthUnauthenticated.errorMessage` against [kAuthNetworkFailureMessage]
// and [kAuthServerFailureMessage].
// ---------------------------------------------------------------------------

/// Inline error rendered by `LoginScreen` when the backend returns
/// `401` from `POST /api/v1/auth/login`. The notifier translates the
/// raw [UnauthorisedException] into this fixed string per Requirement
/// 9.5 so the backend's error body never reaches the user.
const String kAuthInvalidCredentialsMessage = 'Invalid email or password.';

/// Inline error rendered when session restore observes a `401` from
/// `GET /api/v1/auth/me`. Distinct from the login-time message
/// because the user has not just submitted credentials — the session
/// they had was simply no longer valid (Requirements 12.5, 8.4).
const String kAuthSessionExpiredMessage = 'Your session has expired.';

/// Inline error rendered when any auth operation fails with
/// [NetworkException]. The screens pair this message with a retry
/// affordance (Requirements 9.6, 10.9).
const String kAuthNetworkFailureMessage =
    'Could not reach the server. Check your connection and try again.';

/// Inline error rendered when any auth operation fails with
/// [ServerException]. The screens pair this message with a retry
/// affordance (Requirements 9.6, 10.9).
const String kAuthServerFailureMessage =
    'The server is having trouble. Please try again shortly.';

/// Application-wide [AuthNotifier] singleton.
///
/// Construction is `AuthNotifier.new` so Riverpod can recreate the
/// notifier when the provider is invalidated (for example in a widget
/// test that overrides [authRepositoryProvider] or
/// `secureStorageProvider`). The first listener triggers `build`,
/// which begins the session-restore flow.
final AsyncNotifierProvider<AuthNotifier, AuthState> authNotifierProvider =
    AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

/// Riverpod `AsyncNotifier` driving the cook-smart authentication
/// state machine.
///
/// Methods never throw to callers. Every failure category is mapped
/// to an `AuthUnauthenticated(errorMessage: ...)` state with a
/// user-facing message; the screens render inline errors based on
/// that state. See the file-level doc comment for the full mapping.
class AuthNotifier extends AsyncNotifier<AuthState> {
  /// Builds the initial [AuthState] by running the session-restore
  /// flow described in the flutter-port-auth design.
  ///
  /// Behaviour, in order:
  ///
  /// 1. Synchronously emits `AsyncData(AuthLoading())` so listeners
  ///    observe the explicit [AuthLoading] sentinel rather than
  ///    Riverpod's default `AsyncLoading` while the build future is
  ///    pending. The screens render their loading UI off the same
  ///    `AuthLoading` they observe during a login or signup, so the
  ///    UX is uniform across all in-flight auth states.
  /// 2. Reads the persisted JWT from [secureStorageProvider] under
  ///    [AuthInterceptor.jwtTokenKey] (Requirement 12.1).
  /// 3. If the JWT is null or empty, returns `AuthUnauthenticated(
  ///    errorMessage: null)` immediately — no `/me` request is
  ///    issued (Requirement 12.2).
  /// 4. Otherwise calls [AuthRepository.restoreSession] and
  ///    dispatches outcomes per Property 6 of the design:
  ///
  ///    * Success → `AuthAuthenticated(user, jwt)` with the JWT we
  ///      just read.
  ///    * `UnauthorisedException` → `AuthUnauthenticated(
  ///      'Your session has expired.')`. The repository has already
  ///      cleared storage (Requirement 12.5).
  ///    * `NetworkException` / `ServerException` →
  ///      `AuthUnauthenticated(<category-specific message>)`. The
  ///      repository leaves storage intact (Requirement 12.6) so a
  ///      retry on a better network can succeed.
  ///    * `ValidationException` → defensive-only: the `/me` endpoint
  ///      should never raise a 4xx other than 401, but if it does
  ///      we surface the backend message verbatim and keep storage
  ///      intact.
  ///    * `StorageException` → `AuthUnauthenticated(<storage failure
  ///      description>)` (Requirement 5.7).
  @override
  Future<AuthState> build() async {
    state = const AsyncData<AuthState>(AuthLoading());

    final storage = ref.read(secureStorageProvider);
    final repository = ref.read(authRepositoryProvider);

    final String? jwt;
    try {
      jwt = await storage.readToken(AuthInterceptor.jwtTokenKey);
    } on StorageException catch (error) {
      return AuthUnauthenticated(
        errorMessage: _storageFailureMessage(error),
      );
    }

    if (jwt == null || jwt.isEmpty) {
      return const AuthUnauthenticated();
    }

    try {
      final user = await repository.restoreSession();
      if (user == null) {
        // Defensive: restoreSession returns null only when the JWT
        // read inside the repository sees no token. We just observed
        // a non-empty JWT above, so this branch should be
        // unreachable in practice — if storage flips between the two
        // reads we still degrade gracefully to AuthUnauthenticated.
        return const AuthUnauthenticated();
      }
      return AuthAuthenticated(user: user, token: jwt);
    } on UnauthorisedException {
      return const AuthUnauthenticated(
        errorMessage: kAuthSessionExpiredMessage,
      );
    } on NetworkException {
      return const AuthUnauthenticated(
        errorMessage: kAuthNetworkFailureMessage,
      );
    } on ServerException {
      return const AuthUnauthenticated(
        errorMessage: kAuthServerFailureMessage,
      );
    } on ValidationException catch (error) {
      // /me is not contractually expected to return a 4xx other than
      // 401; if it ever does, surface the backend's message verbatim
      // and keep storage intact (Requirement 12.6 carry-over).
      return AuthUnauthenticated(errorMessage: error.message);
    } on StorageException catch (error) {
      return AuthUnauthenticated(
        errorMessage: _storageFailureMessage(error),
      );
    }
  }

  /// Issues a login request through [AuthRepository.login] and emits
  /// the resulting [AuthState].
  ///
  /// Always emits `AsyncData(AuthLoading())` on entry so the
  /// `LoginScreen` can render its loading indicator and disable the
  /// submit button (Requirement 9.2). On success emits
  /// `AsyncData(AuthAuthenticated(user, token))` (Requirement 9.3
  /// and 6.8). On any failure emits `AsyncData(AuthUnauthenticated(
  /// errorMessage: ...))` with a user-facing message; never rethrows
  /// (Requirement 6.9).
  ///
  /// The user-facing message for [UnauthorisedException] is the
  /// literal `'Invalid email or password.'` per Requirement 9.5 —
  /// the backend's raw 401 body is never surfaced to the user.
  Future<void> login(String email, String password) async {
    state = const AsyncData<AuthState>(AuthLoading());
    try {
      final result = await ref.read(authRepositoryProvider).login(
            email,
            password,
          );
      state = AsyncData<AuthState>(
        AuthAuthenticated(user: result.user, token: result.token),
      );
    } on UnauthorisedException {
      state = const AsyncData<AuthState>(
        AuthUnauthenticated(errorMessage: kAuthInvalidCredentialsMessage),
      );
    } on ValidationException catch (error) {
      state = AsyncData<AuthState>(
        AuthUnauthenticated(errorMessage: error.message),
      );
    } on NetworkException {
      state = const AsyncData<AuthState>(
        AuthUnauthenticated(errorMessage: kAuthNetworkFailureMessage),
      );
    } on ServerException {
      state = const AsyncData<AuthState>(
        AuthUnauthenticated(errorMessage: kAuthServerFailureMessage),
      );
    } on StorageException catch (error) {
      state = AsyncData<AuthState>(
        AuthUnauthenticated(
          errorMessage:
              'Signed in successfully, but your session could not be '
              'saved. ${_storageFailureMessage(error)}',
        ),
      );
    }
  }

  /// Issues a signup request through [AuthRepository.register] and
  /// emits the resulting [AuthState].
  ///
  /// Mirrors [login]'s loading-then-resolve cadence (Requirement
  /// 10.2). On success emits `AsyncData(AuthAuthenticated(user,
  /// token))` (Requirement 10.3). On any failure emits
  /// `AsyncData(AuthUnauthenticated(errorMessage: ...))` with a
  /// user-facing message; never rethrows.
  ///
  /// `special_message` (Requirement 10.10)
  /// -------------------------------------
  ///
  /// `POST /api/v1/auth/register` may return an optional
  /// `special_message` field — used by the backend to deliver a
  /// co-founder / creator / lifetime-access welcome blurb that the
  /// `SignupScreen` renders in a non-blocking banner immediately
  /// before navigation to `/`. [AuthState] does not carry this
  /// message because the welcome banner is a one-shot UX surface,
  /// not a piece of authentication state — once the banner has been
  /// shown, the message is gone for the lifetime of this notifier.
  ///
  /// Instead the notifier captures the value into [_lastSpecialMessage]
  /// inside the success branch *before* transitioning to
  /// `AuthAuthenticated`, so the screen reads it via
  /// [lastSpecialMessage] in the same `ref.listen` callback that
  /// observes the success transition. The screen calls
  /// [consumeLastSpecialMessage] after rendering to clear the value,
  /// so a subsequent successful signup without a `special_message`
  /// does not re-render a stale banner.
  Future<void> signup({
    required String email,
    required String password,
    required bool ageVerified,
    String? firstName,
    String? lastName,
  }) async {
    state = const AsyncData<AuthState>(AuthLoading());
    try {
      final result = await ref.read(authRepositoryProvider).register(
            email: email,
            password: password,
            ageVerified: ageVerified,
            firstName: firstName,
            lastName: lastName,
          );
      _lastSpecialMessage = result.specialMessage;
      state = AsyncData<AuthState>(
        AuthAuthenticated(user: result.user, token: result.token),
      );
    } on UnauthorisedException catch (error) {
      // /register is not contractually expected to 401, but if it
      // does we surface the backend message rather than the
      // login-only "Invalid email or password." literal — the user
      // did not just submit credentials against a known account.
      state = AsyncData<AuthState>(
        AuthUnauthenticated(errorMessage: error.message),
      );
    } on ValidationException catch (error) {
      state = AsyncData<AuthState>(
        AuthUnauthenticated(errorMessage: error.message),
      );
    } on NetworkException {
      state = const AsyncData<AuthState>(
        AuthUnauthenticated(errorMessage: kAuthNetworkFailureMessage),
      );
    } on ServerException {
      state = const AsyncData<AuthState>(
        AuthUnauthenticated(errorMessage: kAuthServerFailureMessage),
      );
    } on StorageException catch (error) {
      state = AsyncData<AuthState>(
        AuthUnauthenticated(
          errorMessage:
              'Account created, but your session could not be saved. '
              '${_storageFailureMessage(error)}',
        ),
      );
    }
  }

  /// Performs a best-effort logout through [AuthRepository.logout]
  /// and unconditionally resolves to `AuthUnauthenticated(
  /// errorMessage: null)` (Requirement 11.2).
  ///
  /// The repository already swallows transport failures from
  /// `POST /api/v1/auth/logout` (Requirement 11.5), so the only
  /// error this method can observe is a [StorageException] from
  /// `clearAll` itself. In that edge case the notifier still emits
  /// `AuthUnauthenticated` — with a non-null `errorMessage`
  /// describing the storage failure — so the user is never stuck on
  /// a half-resolved logout. Calling [logout] from any starting
  /// state (`AuthLoading`, `AuthUnauthenticated`,
  /// `AuthAuthenticated`) clears the session idempotently
  /// (Requirement 11.4).
  Future<void> logout() async {
    state = const AsyncData<AuthState>(AuthLoading());
    try {
      await ref.read(authRepositoryProvider).logout();
      state = const AsyncData<AuthState>(AuthUnauthenticated());
    } on StorageException catch (error) {
      state = AsyncData<AuthState>(
        AuthUnauthenticated(
          errorMessage:
              'Logged out locally, but secure storage could not be '
              'cleared. ${_storageFailureMessage(error)}',
        ),
      );
    } catch (_) {
      // Defensive: the repository's contract says only
      // StorageException can escape, but if any other error type
      // ever leaks through we still resolve to AuthUnauthenticated
      // so the user is never stuck on a logout.
      state = const AsyncData<AuthState>(AuthUnauthenticated());
    }
  }

  /// Synchronously transitions the notifier to
  /// `AuthUnauthenticated('Your session has expired.')`.
  ///
  /// Called by `authRedirectCallbackProvider`'s auth-feature
  /// override (delivered in task 6.1) on a 401-driven clear-and-
  /// redirect (Requirement 8.4). The override needs a non-`async`
  /// hook because `authRedirectCallbackProvider`'s
  /// `RedirectToLoginCallback` typedef returns `void`, not
  /// `Future<void>`. Setting `state` to an `AsyncData` value is
  /// itself synchronous — Riverpod schedules listener notifications
  /// on the microtask queue but the state assignment is observable
  /// to a subsequent synchronous read inside the same callback.
  ///
  /// The repository has already cleared `SecureStorage` by the time
  /// this runs (the `ErrorInterceptor` clears storage before
  /// invoking the redirect callback), so this method does no
  /// storage I/O of its own.
  void markSessionExpired() {
    state = const AsyncData<AuthState>(
      AuthUnauthenticated(errorMessage: kAuthSessionExpiredMessage),
    );
  }

  // -- Welcome-banner one-shot --------------------------------------------

  /// Captures the optional `special_message` blurb returned by
  /// `POST /api/v1/auth/register` for the most recent successful
  /// signup. `null` after construction, after a failed signup, after
  /// a successful signup whose response did not include a
  /// `special_message`, and after [consumeLastSpecialMessage] has
  /// been called.
  ///
  /// Captured in [signup]'s success branch *before* the
  /// `AuthAuthenticated` transition is published so the
  /// `SignupScreen`'s `ref.listen` callback can synchronously read
  /// the value when it observes the transition.
  String? _lastSpecialMessage;

  /// One-shot accessor for the optional `special_message` returned by
  /// the most recent successful signup (Requirement 10.10).
  ///
  /// `SignupScreen` reads this immediately after observing the
  /// `AuthLoading` → `AuthAuthenticated` transition in its
  /// `ref.listen` callback, then calls [consumeLastSpecialMessage] to
  /// clear the value. The pair of getter + consumer is deliberately
  /// not folded into a single "take" method because consumption is a
  /// presentation-layer concern that needs to happen *after* the
  /// banner is mounted, not synchronously with the read.
  String? get lastSpecialMessage => _lastSpecialMessage;

  /// Clears the captured `special_message` so the welcome banner is
  /// rendered exactly once per successful signup. Safe to call when
  /// no message is pending.
  void consumeLastSpecialMessage() {
    _lastSpecialMessage = null;
  }

  // -- Private helpers -----------------------------------------------------

  /// Builds the user-facing description for a [StorageException].
  ///
  /// Centralised so the build-, login-, signup-, and logout-paths
  /// emit the same wording for the same underlying failure
  /// category. Callers prepend a context-specific lead-in (for
  /// example, "Signed in successfully, but your session could not
  /// be saved.") when they want to clarify what state the app is
  /// in.
  String _storageFailureMessage(StorageException error) {
    return 'Secure storage is unavailable: ${error.message}';
  }
}
