// Property tests for `lib/features/auth/presentation/auth_notifier.dart`.
//
// Validates: Requirements 5.4, 5.5, 6.6, 6.7, 6.8, 6.9, 11.2, 11.4, 11.5,
// 12.4, 12.5, 12.6 of the flutter-port-auth spec.
//
// The notifier consumes two seams: `authRepositoryProvider` (the
// transport-agnostic auth repository) and `secureStorageProvider`
// (the persisted-JWT keystore). Both are overridden here with hand-
// rolled fakes so the tests run on the Dart VM without platform
// channels and without `Dio`.
//
// `_FakeAuthRepository` extends the real [AuthRepository] so it is
// assignable to `Provider<AuthRepository>` returned by
// [authRepositoryProvider]. Its parent constructor takes an
// [AuthApiClient] and a [SecureStorage]; we pass a [_DummyAuthApiClient]
// that throws on every call (the fake's overrides never delegate to the
// parent, so the dummy is unreachable in practice) and the in-memory
// [_InMemorySecureStorage] used elsewhere in the test so the storage
// surface stays consistent if a future test reaches the real method
// bodies.
//
// Property summary
// ----------------
//
//   Property 5 — Logout is idempotent across all relevant starting
//                states. For every starting state the notifier can
//                observe, calling [AuthNotifier.logout] resolves to
//                `AuthUnauthenticated(errorMessage: null)` and never
//                throws. (Adjusted variant of the design's Property 5
//                per the task description: HTTP-outcome variations are
//                covered by `auth_repository_test.dart` task 4.2 — the
//                notifier observes only that logout resolves.)
//
//   Property 6 — Session_Restore dispatches every (persisted JWT,
//                `/me` outcome) pair to the documented [AuthState].
//                The dispatch table from the design holds for:
//                  null JWT, empty JWT, valid JWT
//                  ×
//                  success, UnauthorisedException, NetworkException,
//                  ServerException, ValidationException,
//                  StorageException
//
//   Property 7 — Successful login or signup transitions to
//                `AuthAuthenticated(user, token)` by value equality.
//                Tested for both [AuthNotifier.login] and
//                [AuthNotifier.signup].
//
//   Property 8 — Failed login or signup transitions to
//                `AuthUnauthenticated(errorMessage: <non-null>)`
//                without rethrow, and never writes to storage. Tested
//                for every [ApiException] variant for both login and
//                signup.

// ignore_for_file: avoid_redundant_argument_values

// External libraries
//
// `glados` re-exports `test`, `expect`, and `group` from
// `package:test_core` and `package:matcher`. Importing both
// `flutter_test` and `glados` produces ambiguous-import errors for
// those names, so we hide the conflicting symbols from the
// `flutter_test` import. `addTearDown` is the only `flutter_test`
// affordance we need that is not re-exported by glados.
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart' hide expect, group, test;
import 'package:glados/glados.dart';

// Internal modules
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/network/auth_api_client.dart';
import 'package:mobile/core/network/auth_interceptor.dart';
import 'package:mobile/core/storage/secure_storage.dart';
import 'package:mobile/core/storage/secure_storage_provider.dart';
import 'package:mobile/features/auth/data/auth_repository.dart';
import 'package:mobile/features/auth/domain/auth_state.dart';
import 'package:mobile/features/auth/domain/user.dart';
import 'package:mobile/features/auth/presentation/auth_notifier.dart';

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

/// In-memory [SecureStorage] used by every test case. Records `clearAll`
/// invocations and `writeToken` calls so Property 8's "no storage write
/// on failure" assertion has a counter to consult.
class _InMemorySecureStorage implements SecureStorage {
  final Map<String, String> _store = <String, String>{};
  int clearAllCount = 0;
  int writeTokenCount = 0;

  /// When set, [readToken] throws this exception instead of consulting
  /// the in-memory map. Used by Property 6's StorageException variant
  /// to simulate a keystore failure during the initial JWT read in
  /// [AuthNotifier.build].
  StorageException? readTokenError;

  void seed(String key, String value) {
    _store[key] = value;
  }

  @override
  Future<void> writeToken(String key, String value) async {
    writeTokenCount++;
    _store[key] = value;
  }

  @override
  Future<String?> readToken(String key) async {
    final error = readTokenError;
    if (error != null) {
      throw error;
    }
    return _store[key];
  }

  @override
  Future<void> deleteToken(String key) async {
    _store.remove(key);
  }

  @override
  Future<void> clearAll() async {
    clearAllCount++;
    _store.clear();
  }
}

/// Throwing stand-in for [AuthApiClient]. The fake repository overrides
/// every method that the notifier exercises, so this dummy is never
/// reached in practice — but the parent [AuthRepository] constructor
/// requires a non-null client.
class _DummyAuthApiClient implements AuthApiClient {
  @override
  Future<AuthApiResponse> login({
    required String email,
    required String password,
  }) {
    throw StateError('_DummyAuthApiClient.login should never be called');
  }

  @override
  Future<AuthApiResponse> register(Map<String, dynamic> body) {
    throw StateError('_DummyAuthApiClient.register should never be called');
  }

  @override
  Future<AuthApiResponse> me() {
    throw StateError('_DummyAuthApiClient.me should never be called');
  }

  @override
  Future<AuthApiResponse> logout() {
    throw StateError('_DummyAuthApiClient.logout should never be called');
  }
}

/// Programmable fake [AuthRepository]. Each method is configured by
/// assigning a handler closure on the instance; if a handler is null
/// the method throws a [StateError] so an unconfigured call is a
/// loud test failure rather than a silent default.
class _FakeAuthRepository extends AuthRepository {
  _FakeAuthRepository(SecureStorage storage)
      : super(_DummyAuthApiClient(), storage);

  Future<({User user, String token})> Function(
    String email,
    String password,
  )? loginHandler;

  Future<({User user, String token, String? specialMessage})> Function({
    required String email,
    required String password,
    required bool ageVerified,
    String? firstName,
    String? lastName,
  })? registerHandler;

  Future<User?> Function()? restoreSessionHandler;

  Future<void> Function()? logoutHandler;

  int loginCallCount = 0;
  int registerCallCount = 0;
  int restoreSessionCallCount = 0;
  int logoutCallCount = 0;

  @override
  Future<({User user, String token})> login(String email, String password) {
    loginCallCount++;
    final handler = loginHandler;
    if (handler == null) {
      throw StateError('_FakeAuthRepository.login was not configured');
    }
    return handler(email, password);
  }

  @override
  Future<({User user, String token, String? specialMessage})> register({
    required String email,
    required String password,
    required bool ageVerified,
    String? firstName,
    String? lastName,
  }) {
    registerCallCount++;
    final handler = registerHandler;
    if (handler == null) {
      throw StateError('_FakeAuthRepository.register was not configured');
    }
    return handler(
      email: email,
      password: password,
      ageVerified: ageVerified,
      firstName: firstName,
      lastName: lastName,
    );
  }

  @override
  Future<User?> restoreSession() {
    restoreSessionCallCount++;
    final handler = restoreSessionHandler;
    if (handler == null) {
      throw StateError(
        '_FakeAuthRepository.restoreSession was not configured',
      );
    }
    return handler();
  }

  @override
  Future<void> logout() {
    logoutCallCount++;
    final handler = logoutHandler;
    if (handler == null) {
      // Default: best-effort logout (mirrors real repo's swallow-all).
      // Storage clear lives on the repository in production, so the
      // fake mirrors that here so Property 5 can verify the storage
      // was cleared by observing `clearAll` on the in-memory storage.
      // Not reachable in the parameterised Property 5 tests because
      // they install an explicit handler.
      return Future<void>.value();
    }
    return handler();
  }
}

// ---------------------------------------------------------------------------
// Test-only fixtures and generators
// ---------------------------------------------------------------------------

/// Builds a fully populated [User] for assertion comparisons.
///
/// The notifier and the repository care only about value equality, not
/// about which factory produced the user, so the [User.fromMeJson]
/// factory is the most expressive choice here (it covers every field).
User _userFromSeed({
  required String id,
  required String email,
  bool isCoFounder = false,
  bool isSpecialUser = false,
  bool isCreator = false,
  bool hasLifetimeSubscription = false,
  String subscriptionStatus = 'free',
  int points = 0,
  bool isAdmin = false,
}) {
  return User.fromMeJson(<String, dynamic>{
    'id': id,
    'email': email,
    'is_co_founder': isCoFounder,
    'is_special_user': isSpecialUser,
    'is_creator': isCreator,
    'has_lifetime_subscription': hasLifetimeSubscription,
    'subscription_status': subscriptionStatus,
    'points': points,
    'is_admin': isAdmin,
  });
}

/// Property 5 — starting state for the logout idempotence tests.
enum _StartingState {
  unauthenticatedNoError,
  unauthenticatedWithError,
  authenticated,
}

/// Property 6 — persisted JWT shape.
enum _PersistedJwt { absent, empty, present }

/// Property 6 — `/me` outcome dispatched by the notifier's session-
/// restore branch.
enum _MeOutcome {
  success,
  unauthorised,
  network,
  server,
  validation,
  storage,
}

/// Property 8 — categorical [ApiException] variant. Each value maps to
/// a typed exception the notifier must translate into an
/// `AuthUnauthenticated(errorMessage: <non-null>)`.
enum _ApiExceptionVariant {
  unauthorised,
  validation,
  network,
  server,
  storage,
}

extension _AuthGenerators on Any {
  /// Property 7 generator. Produces [User]s with non-empty letter ids
  /// and a synthetic email — sufficient variety for value-equality
  /// transitions; field-level coverage of [User] lives in `user_test.dart`.
  Generator<User> get authUser => combine2(
        any.nonEmptyLetters,
        any.nonEmptyLetters,
        (String id, String localPart) => _userFromSeed(
          id: id,
          email: '$localPart@example.com',
        ),
      );

  /// Non-empty token strings. Glados's stock `nonEmptyLetters` is
  /// sufficient for value-equality testing of the token round-trip.
  Generator<String> get authToken => any.nonEmptyLetters;

  Generator<_StartingState> get startingState =>
      choose(_StartingState.values);

  Generator<_PersistedJwt> get persistedJwt => choose(_PersistedJwt.values);

  Generator<_MeOutcome> get meOutcome => choose(_MeOutcome.values);

  Generator<_ApiExceptionVariant> get apiExceptionVariant =>
      choose(_ApiExceptionVariant.values);
}

// ---------------------------------------------------------------------------
// Test harness helpers
// ---------------------------------------------------------------------------

/// Bundle of test doubles wired into a [ProviderContainer]. Every
/// property test creates one of these and registers
/// `addTearDown(container.dispose)` so providers do not leak.
class _Harness {
  _Harness._(this.container, this.fakeRepo, this.fakeStorage);

  final ProviderContainer container;
  final _FakeAuthRepository fakeRepo;
  final _InMemorySecureStorage fakeStorage;

  /// Disposes the container. Idempotent.
  void dispose() => container.dispose();
}

/// Builds a fresh test harness. The fakes are configured by mutating
/// [_Harness.fakeRepo] and [_Harness.fakeStorage] *before* the first
/// read of [authNotifierProvider] so the eager `build()` sees the
/// intended setup.
_Harness _buildHarness() {
  final fakeStorage = _InMemorySecureStorage();
  final fakeRepo = _FakeAuthRepository(fakeStorage);
  final container = ProviderContainer(
    overrides: <Override>[
      secureStorageProvider.overrideWithValue(fakeStorage),
      authRepositoryProvider.overrideWith((ref) => fakeRepo),
    ],
  );
  return _Harness._(container, fakeRepo, fakeStorage);
}

/// Returns the resolved [AuthState] from an `AsyncData(AuthState)`
/// wrapper. Fails the test if the async value is not in data form.
AuthState _readState(ProviderContainer container) {
  final asyncValue = container.read(authNotifierProvider);
  expect(
    asyncValue,
    isA<AsyncData<AuthState>>(),
    reason: 'Expected AsyncData(AuthState); got $asyncValue',
  );
  return asyncValue.value!;
}

/// Waits for the [authNotifierProvider]'s `build` to complete *and* for
/// the microtask queue to drain so the post-build `state =` assignment
/// inside Riverpod's machinery is observable to a synchronous read.
///
/// `AuthNotifier.build` synchronously sets `state = AsyncData(
/// AuthLoading())` before its first `await`. Riverpod then overwrites
/// `state` with `AsyncData(returnedValue)` only after the build future
/// resolves and a microtask flushes — so a single
/// `await container.read(authNotifierProvider.future)` is not enough on
/// its own to observe the post-build state. A trailing
/// `await Future<void>.delayed(Duration.zero)` (or, equivalently, an
/// extra microtask hop) lets the queued state assignment land. This
/// mirrors the cadence the task description calls out:
///
/// > After mutations, listen with `container.listen(...)` or use
/// > `await Future<void>.delayed(Duration.zero)` to let microtasks flush.
Future<void> _awaitNotifierBuild(ProviderContainer container) async {
  await container.read(authNotifierProvider.future);
  await Future<void>.delayed(Duration.zero);
}

/// Lets the microtask queue drain after a notifier mutation
/// (`login`, `signup`, `logout`) so subsequent synchronous reads of
/// the provider observe the published state. Same rationale as
/// [_awaitNotifierBuild].
Future<void> _flushMicrotasks() => Future<void>.delayed(Duration.zero);

/// Drives [AuthNotifier.build] for Property 5 by configuring the fakes
/// to produce the requested starting state, then awaiting the initial
/// build future.
Future<void> _seedStartingState(
  _Harness harness,
  _StartingState startingState,
) async {
  switch (startingState) {
    case _StartingState.unauthenticatedNoError:
      // No JWT → build returns AuthUnauthenticated(errorMessage: null).
      // restoreSession is never invoked because the JWT short-circuits
      // it (Requirement 12.2).
      break;
    case _StartingState.unauthenticatedWithError:
      // Valid JWT + ServerException from /me → build returns
      // AuthUnauthenticated(errorMessage: kAuthServerFailureMessage).
      // The notifier preserves storage on this branch (Requirement
      // 12.6), so the JWT remains in place when logout runs.
      harness.fakeStorage.seed(AuthInterceptor.jwtTokenKey, 'starting-jwt');
      harness.fakeRepo.restoreSessionHandler = () async {
        throw const ServerException('upstream is sad', 500);
      };
    case _StartingState.authenticated:
      // Valid JWT + successful /me → build returns AuthAuthenticated.
      harness.fakeStorage.seed(AuthInterceptor.jwtTokenKey, 'starting-jwt');
      harness.fakeRepo.restoreSessionHandler = () async => _userFromSeed(
            id: 'starting-id',
            email: 'starting@example.com',
          );
  }
  await _awaitNotifierBuild(harness.container);
}

/// Seeds the in-memory storage according to [_PersistedJwt] used in
/// Property 6.
void _seedPersistedJwt(_Harness harness, _PersistedJwt jwt) {
  switch (jwt) {
    case _PersistedJwt.absent:
      // No write — storage returns null.
      break;
    case _PersistedJwt.empty:
      harness.fakeStorage.seed(AuthInterceptor.jwtTokenKey, '');
    case _PersistedJwt.present:
      harness.fakeStorage.seed(AuthInterceptor.jwtTokenKey, 'valid-jwt');
  }
}

/// Configures `restoreSessionHandler` to produce the given outcome.
/// Used by Property 6.
void _configureMeOutcome(
  _FakeAuthRepository fakeRepo,
  _MeOutcome outcome, {
  required User userOnSuccess,
  required String validationMessage,
}) {
  switch (outcome) {
    case _MeOutcome.success:
      fakeRepo.restoreSessionHandler = () async => userOnSuccess;
    case _MeOutcome.unauthorised:
      fakeRepo.restoreSessionHandler = () async {
        throw const UnauthorisedException('jwt expired');
      };
    case _MeOutcome.network:
      fakeRepo.restoreSessionHandler = () async {
        throw const NetworkException('offline');
      };
    case _MeOutcome.server:
      fakeRepo.restoreSessionHandler = () async {
        throw const ServerException('upstream', 502);
      };
    case _MeOutcome.validation:
      fakeRepo.restoreSessionHandler = () async {
        throw ValidationException(validationMessage, const <String, String>{});
      };
    case _MeOutcome.storage:
      fakeRepo.restoreSessionHandler = () async {
        throw const StorageException(
          SecureStorageOperation.read,
          'keystore unavailable',
        );
      };
  }
}

/// Returns the typed [Exception] for an [_ApiExceptionVariant], used
/// by Property 8 to drive failed login and signup paths. Both
/// [ApiException] and [StorageException] implement [Exception], so a
/// concrete return type works for every variant.
Exception _exceptionFor(_ApiExceptionVariant variant) {
  switch (variant) {
    case _ApiExceptionVariant.unauthorised:
      return const UnauthorisedException('bad credentials');
    case _ApiExceptionVariant.validation:
      return const ValidationException(
        'email already taken',
        <String, String>{'email': 'taken'},
      );
    case _ApiExceptionVariant.network:
      return const NetworkException('offline');
    case _ApiExceptionVariant.server:
      return const ServerException('upstream', 502);
    case _ApiExceptionVariant.storage:
      return const StorageException(
        SecureStorageOperation.write,
        'keystore unavailable',
      );
  }
}

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

void main() {
  group('Property 5 — logout is idempotent across all starting states', () {
    Glados<_StartingState>(any.startingState).test(
      'after notifier.logout() the state is AuthUnauthenticated(null) '
      'and clearAll is invoked exactly once on storage',
      (startingState) async {
        final harness = _buildHarness();
        addTearDown(harness.dispose);

        // The fake repo's logout mirrors the real repository's
        // try-then-clear shape: best-effort backend call (here a no-op
        // success) then unconditional storage clear. The notifier
        // observes only that logout() resolves; the swallow-all
        // semantics live in `auth_repository_test.dart` (task 4.2).
        harness.fakeRepo.logoutHandler = () async {
          await harness.fakeStorage.clearAll();
        };

        await _seedStartingState(harness, startingState);

        // Sanity: after seeding, the notifier is in the expected
        // starting state. The starting-state assertion guards against
        // a future regression in [_seedStartingState].
        switch (startingState) {
          case _StartingState.unauthenticatedNoError:
            expect(
              _readState(harness.container),
              const AuthUnauthenticated(),
            );
          case _StartingState.unauthenticatedWithError:
            expect(
              _readState(harness.container),
              const AuthUnauthenticated(
                errorMessage: kAuthServerFailureMessage,
              ),
            );
          case _StartingState.authenticated:
            expect(
              _readState(harness.container),
              isA<AuthAuthenticated>(),
            );
        }

        Object? thrown;
        try {
          await harness.container
              .read(authNotifierProvider.notifier)
              .logout();
        } catch (error) {
          thrown = error;
        }
        await _flushMicrotasks();

        expect(
          thrown,
          isNull,
          reason:
              'AuthNotifier.logout must never rethrow regardless of the '
              'starting state (Requirements 6.9, 11.2).',
        );
        expect(
          _readState(harness.container),
          const AuthUnauthenticated(),
          reason:
              'After logout the state must be '
              'AuthUnauthenticated(errorMessage: null) for any starting '
              'state (Requirements 11.2, 11.4).',
        );
        expect(
          harness.fakeStorage.clearAllCount,
          1,
          reason:
              'clearAll must be invoked exactly once on storage during '
              'logout (Requirement 5.4).',
        );
        expect(
          harness.fakeRepo.logoutCallCount,
          1,
          reason: 'AuthRepository.logout must be invoked exactly once.',
        );
      },
    );
  });

  group(
    'Property 6 — Session_Restore dispatches every (jwt, /me outcome) '
    'pair to the documented AuthState',
    () {
      const validationMessage = 'me said no';
      final userOnSuccess = _userFromSeed(
        id: 'me-id',
        email: 'me@example.com',
      );

      Glados2<_PersistedJwt, _MeOutcome>(
        any.persistedJwt,
        any.meOutcome,
      ).test(
        'state matches the dispatch table for every input pair',
        (jwt, outcome) async {
          final harness = _buildHarness();
          addTearDown(harness.dispose);

          _seedPersistedJwt(harness, jwt);
          _configureMeOutcome(
            harness.fakeRepo,
            outcome,
            userOnSuccess: userOnSuccess,
            validationMessage: validationMessage,
          );

          await _awaitNotifierBuild(harness.container);
          final state = _readState(harness.container);

          if (jwt == _PersistedJwt.absent || jwt == _PersistedJwt.empty) {
            // Requirement 12.2 — a missing or empty JWT short-circuits
            // session restore: no /me call is issued and the state is
            // AuthUnauthenticated(errorMessage: null).
            expect(state, const AuthUnauthenticated());
            expect(
              harness.fakeRepo.restoreSessionCallCount,
              0,
              reason:
                  'restoreSession must NOT be called when no JWT is '
                  'persisted (Requirement 12.2).',
            );
            return;
          }

          // From here on, the JWT is non-empty. Each /me outcome maps
          // deterministically to an AuthState per the dispatch table
          // documented on AuthNotifier.build.
          expect(
            harness.fakeRepo.restoreSessionCallCount,
            1,
            reason:
                'restoreSession must be invoked exactly once when a '
                'non-empty JWT is persisted.',
          );

          switch (outcome) {
            case _MeOutcome.success:
              expect(
                state,
                AuthAuthenticated(user: userOnSuccess, token: 'valid-jwt'),
                reason:
                    'Successful /me must transition to '
                    'AuthAuthenticated(user, jwt) (Requirement 12.4).',
              );
            case _MeOutcome.unauthorised:
              expect(
                state,
                const AuthUnauthenticated(
                  errorMessage: kAuthSessionExpiredMessage,
                ),
                reason:
                    '401 from /me must transition to '
                    'AuthUnauthenticated(session expired) '
                    '(Requirement 12.5).',
              );
            case _MeOutcome.network:
              expect(
                state,
                const AuthUnauthenticated(
                  errorMessage: kAuthNetworkFailureMessage,
                ),
                reason:
                    'NetworkException from /me must transition to '
                    'AuthUnauthenticated(network failure) '
                    '(Requirement 12.6).',
              );
            case _MeOutcome.server:
              expect(
                state,
                const AuthUnauthenticated(
                  errorMessage: kAuthServerFailureMessage,
                ),
                reason:
                    'ServerException from /me must transition to '
                    'AuthUnauthenticated(server failure) '
                    '(Requirement 12.6).',
              );
            case _MeOutcome.validation:
              expect(
                state,
                const AuthUnauthenticated(errorMessage: validationMessage),
                reason:
                    'ValidationException from /me must surface the '
                    'backend message verbatim.',
              );
            case _MeOutcome.storage:
              expect(state, isA<AuthUnauthenticated>());
              final unauth = state as AuthUnauthenticated;
              expect(
                unauth.errorMessage,
                contains('keystore unavailable'),
                reason:
                    'StorageException from /me must surface the storage '
                    'failure message (Requirement 5.7).',
              );
          }
        },
      );
    },
  );

  group(
    'Property 7 — successful login or signup transitions to '
    'AuthAuthenticated by value equality',
    () {
      Glados2<User, String>(any.authUser, any.authToken).test(
        'login(email, password) transitions to '
        'AuthAuthenticated(user, token)',
        (user, token) async {
          final harness = _buildHarness();
          addTearDown(harness.dispose);

          // Seed build() to a deterministic AuthUnauthenticated start
          // (no JWT) so the property is observed against the post-
          // login state, not the in-flight build future.
          await _awaitNotifierBuild(harness.container);

          harness.fakeRepo.loginHandler = (_, __) async => (
                user: user,
                token: token,
              );

          await harness.container
              .read(authNotifierProvider.notifier)
              .login('user@example.com', 'password');
          await _flushMicrotasks();

          final state = _readState(harness.container);
          expect(
            state,
            AuthAuthenticated(user: user, token: token),
            reason:
                'Successful login must publish '
                'AuthAuthenticated(user, token) by value equality '
                '(Requirements 6.8, 9.3).',
          );
          expect(harness.fakeRepo.loginCallCount, 1);
        },
      );

      Glados2<User, String>(any.authUser, any.authToken).test(
        'signup(...) transitions to AuthAuthenticated(user, token)',
        (user, token) async {
          final harness = _buildHarness();
          addTearDown(harness.dispose);

          await _awaitNotifierBuild(harness.container);

          harness.fakeRepo.registerHandler = ({
            required String email,
            required String password,
            required bool ageVerified,
            String? firstName,
            String? lastName,
          }) async =>
              (user: user, token: token, specialMessage: null);

          await harness.container
              .read(authNotifierProvider.notifier)
              .signup(
                email: 'user@example.com',
                password: 'password123',
                ageVerified: true,
              );
          await _flushMicrotasks();

          final state = _readState(harness.container);
          expect(
            state,
            AuthAuthenticated(user: user, token: token),
            reason:
                'Successful signup must publish '
                'AuthAuthenticated(user, token) by value equality '
                '(Requirement 10.3).',
          );
          expect(harness.fakeRepo.registerCallCount, 1);
        },
      );
    },
  );

  group(
    'Property 8 — failed login or signup transitions to '
    'AuthUnauthenticated without rethrow',
    () {
      Glados<_ApiExceptionVariant>(any.apiExceptionVariant).test(
        'login() never rethrows, surfaces a non-null errorMessage, '
        'and never writes to storage',
        (variant) async {
          final harness = _buildHarness();
          addTearDown(harness.dispose);

          await _awaitNotifierBuild(harness.container);
          // Reset the writeToken counter — build() may have written
          // nothing on a no-JWT seed, but starting from zero makes the
          // assertion below unambiguous.
          harness.fakeStorage.writeTokenCount = 0;

          final exception = _exceptionFor(variant);
          harness.fakeRepo.loginHandler = (_, __) async {
            throw exception;
          };

          Object? thrown;
          try {
            await harness.container
                .read(authNotifierProvider.notifier)
                .login('user@example.com', 'password');
          } catch (error) {
            thrown = error;
          }
          await _flushMicrotasks();

          expect(
            thrown,
            isNull,
            reason:
                'login() must never rethrow on any ApiException variant '
                '(Requirements 6.9, 9.4).',
          );

          final state = _readState(harness.container);
          expect(state, isA<AuthUnauthenticated>());
          final unauth = state as AuthUnauthenticated;
          expect(
            unauth.errorMessage,
            isNotNull,
            reason:
                'A failed login must surface a non-null errorMessage '
                'so the LoginScreen can render it inline.',
          );

          // Match the user-facing copy per the notifier's dispatch.
          switch (variant) {
            case _ApiExceptionVariant.unauthorised:
              expect(unauth.errorMessage, kAuthInvalidCredentialsMessage,
                  reason:
                      'A 401 on login must surface the literal '
                      '"Invalid email or password." rather than the '
                      'backend body (Requirement 9.5).');
            case _ApiExceptionVariant.validation:
              expect(unauth.errorMessage, 'email already taken');
            case _ApiExceptionVariant.network:
              expect(unauth.errorMessage, kAuthNetworkFailureMessage);
            case _ApiExceptionVariant.server:
              expect(unauth.errorMessage, kAuthServerFailureMessage);
            case _ApiExceptionVariant.storage:
              // The storage-failure branch on login attaches a
              // context-specific lead-in ("Signed in successfully, but
              // your session could not be saved.") because the auth
              // call itself succeeded and only persistence failed.
              expect(
                unauth.errorMessage,
                contains('keystore unavailable'),
              );
          }

          expect(
            harness.fakeStorage.writeTokenCount,
            0,
            reason:
                'A failed login must not write any value to storage '
                '(Requirement 12.5).',
          );
        },
      );

      Glados<_ApiExceptionVariant>(any.apiExceptionVariant).test(
        'signup() never rethrows, surfaces a non-null errorMessage, '
        'and never writes to storage',
        (variant) async {
          final harness = _buildHarness();
          addTearDown(harness.dispose);

          await _awaitNotifierBuild(harness.container);
          harness.fakeStorage.writeTokenCount = 0;

          final exception = _exceptionFor(variant);
          harness.fakeRepo.registerHandler = ({
            required String email,
            required String password,
            required bool ageVerified,
            String? firstName,
            String? lastName,
          }) async {
            throw exception;
          };

          Object? thrown;
          try {
            await harness.container
                .read(authNotifierProvider.notifier)
                .signup(
                  email: 'user@example.com',
                  password: 'password123',
                  ageVerified: true,
                );
          } catch (error) {
            thrown = error;
          }
          await _flushMicrotasks();

          expect(
            thrown,
            isNull,
            reason:
                'signup() must never rethrow on any ApiException variant '
                '(Requirement 6.9).',
          );

          final state = _readState(harness.container);
          expect(state, isA<AuthUnauthenticated>());
          final unauth = state as AuthUnauthenticated;
          expect(
            unauth.errorMessage,
            isNotNull,
            reason:
                'A failed signup must surface a non-null errorMessage '
                'so the SignupScreen can render it inline.',
          );

          // /register's 401 path is not contractually expected, but the
          // notifier surfaces the backend message verbatim for it
          // rather than the login-only "Invalid email or password."
          // literal — the user did not just submit credentials against
          // a known account.
          switch (variant) {
            case _ApiExceptionVariant.unauthorised:
              expect(unauth.errorMessage, 'bad credentials');
            case _ApiExceptionVariant.validation:
              expect(unauth.errorMessage, 'email already taken');
            case _ApiExceptionVariant.network:
              expect(unauth.errorMessage, kAuthNetworkFailureMessage);
            case _ApiExceptionVariant.server:
              expect(unauth.errorMessage, kAuthServerFailureMessage);
            case _ApiExceptionVariant.storage:
              expect(
                unauth.errorMessage,
                contains('keystore unavailable'),
              );
          }

          expect(
            harness.fakeStorage.writeTokenCount,
            0,
            reason: 'A failed signup must not write any value to storage.',
          );
        },
      );
    },
  );
}
