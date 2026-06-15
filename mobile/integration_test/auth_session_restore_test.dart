// Integration tests for the cook-smart auth feature's session-restore flow.
//
// These tests boot the real `CookSmartApp` widget under a hand-rolled
// `ProviderContainer` whose overrides swap the foundation's two transport
// seams for in-memory fakes:
//
//   * `secureStorageProvider` → `_InMemorySecureStorage`, a `Map`-backed
//     [SecureStorage] that records when `clearAll` is invoked so the test
//     can assert the 401 clear-and-redirect path actually wiped storage.
//   * `authApiClientProvider` → `_FakeAuthApiClient`, an [AuthApiClient]
//     whose four endpoint methods are programmable per-test (return a
//     body, throw an [ApiException]) and that records every call so the
//     test can assert that no `/me` request was issued when there is no
//     persisted JWT.
//
// We also re-apply two of the three overrides that
// `features/auth/presentation/auth_overrides.dart` would normally splice
// into the root `ProviderScope`:
//
//   * `authStateProvider` derivation from `authNotifierProvider` (so the
//     router's `refreshListenable` reacts to auth-state changes).
//   * `authRedirectCallbackProvider` → routes a 401 clear-and-redirect to
//     `Routes.loginPath` and tells [AuthNotifier] to mark the session
//     expired.
//
// We deliberately omit the third override (`dioProvider` →
// `buildDioWithCookSmartRefresh`) because we are intercepting one level
// higher at `authApiClientProvider`. With the API client faked, no
// auth-feature code path reaches `Dio` at all, so its construction is
// never observed and overriding it would only add untested wiring to the
// container.
//
// We also do not boot the app via `main.dart`. `main.dart` initialises
// `Firebase` and registers Crashlytics handlers, which require platform
// channels we deliberately are not exercising here. Mounting
// [CookSmartApp] directly under our own `UncontrolledProviderScope` keeps
// the integration scope tight to the auth feature.
//
// Validates: Requirements 7.5, 8.3, 8.4, 12.4, 12.5, 12.7 of the
// flutter-port-auth spec.

// External libraries
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

// Internal modules
import 'package:mobile/app.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/network/auth_api_client.dart';
import 'package:mobile/core/network/auth_interceptor.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/core/router/router_provider.dart';
import 'package:mobile/core/router/routes.dart';
import 'package:mobile/core/storage/secure_storage.dart';
import 'package:mobile/core/storage/secure_storage_provider.dart';
import 'package:mobile/features/auth/domain/auth_state.dart';
import 'package:mobile/features/auth/presentation/auth_notifier.dart';

// ---------------------------------------------------------------------------
// Backend fixtures.
//
// Shaped to match the cook-smart `/api/v1/auth/*` handlers verbatim. The
// `/login` body is the top-level `{ token, user }` envelope (Decision 1
// of the design); the `/me` body is the top-level `{ user }` envelope.
// Field values are deterministic so two test runs produce identical
// `User` instances when round-tripped through `User.fromMeJson` /
// `toJson`.
// ---------------------------------------------------------------------------

const Map<String, dynamic> _meSuccessBody = <String, dynamic>{
  'user': <String, dynamic>{
    'id': 'user-1',
    'email': 'returning@example.com',
    'is_co_founder': false,
    'is_special_user': false,
    'is_creator': false,
    'has_lifetime_subscription': false,
    'subscription_status': 'free',
    'points': 0,
    'is_admin': false,
    'first_name': 'Ada',
    'last_name': 'Lovelace',
    'dietary_restrictions': <String>[],
    'allergies': <String>[],
    'show_nutrition': true,
    'preferred_units': 'metric',
  },
};

const Map<String, dynamic> _loginSuccessBody = <String, dynamic>{
  'success': true,
  'message': 'Logged in',
  'token': 'fresh-jwt-from-login',
  'user': <String, dynamic>{
    'id': 'user-2',
    'email': 'fresh@example.com',
    'is_co_founder': false,
    'is_special_user': false,
    'is_creator': false,
    'has_lifetime_subscription': false,
    'subscription_status': 'free',
    'points': 0,
    'is_admin': false,
  },
};

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('auth session restore — integration', () {
    testWidgets(
      '1. pre-loaded JWT + /me 200 → app lands on /',
      (WidgetTester tester) async {
        final storage = _InMemorySecureStorage();
        await storage.writeToken(AuthInterceptor.jwtTokenKey, 'valid-jwt');

        final fakeClient = _FakeAuthApiClient()
          ..onMe = () async => const AuthApiResponse(
                statusCode: 200,
                body: _meSuccessBody,
              );

        final container = _buildContainer(storage: storage, client: fakeClient);
        addTearDown(container.dispose);

        await _pumpApp(tester, container);

        expect(_currentLocation(container), Routes.homePath);
        expect(fakeClient.recordedCalls, contains(_AuthEndpoint.me));
        expect(storage.clearAllInvoked, isFalse);
      },
    );

    testWidgets(
      '2. pre-loaded JWT + /me 401 → app lands on /auth/login, clearAll invoked',
      (WidgetTester tester) async {
        final storage = _InMemorySecureStorage();
        await storage.writeToken(AuthInterceptor.jwtTokenKey, 'expired-jwt');

        final fakeClient = _FakeAuthApiClient()
          ..onMe = () async => throw const UnauthorisedException(
                'JWT expired (test).',
              );

        final container = _buildContainer(storage: storage, client: fakeClient);
        addTearDown(container.dispose);

        await _pumpApp(tester, container);

        expect(_currentLocation(container), Routes.loginPath);
        expect(fakeClient.recordedCalls, contains(_AuthEndpoint.me));
        expect(
          storage.clearAllInvoked,
          isTrue,
          reason: 'restoreSession must clearAll on UnauthorisedException '
              '(Requirement 12.5).',
        );
        expect(
          await storage.readToken(AuthInterceptor.jwtTokenKey),
          isNull,
          reason: 'JWT must not survive the 401 clear path.',
        );
      },
    );

    testWidgets(
      '3. no persisted JWT → app lands on /auth/login without /me request',
      (WidgetTester tester) async {
        final storage = _InMemorySecureStorage();
        // Storage starts empty — no writeToken call.

        final fakeClient = _FakeAuthApiClient();
        // No handlers registered. If /me is somehow called, the fake's
        // default behaviour throws a StateError, which would surface as a
        // test failure rather than a silent pass.

        final container = _buildContainer(storage: storage, client: fakeClient);
        addTearDown(container.dispose);

        await _pumpApp(tester, container);

        expect(_currentLocation(container), Routes.loginPath);
        expect(
          fakeClient.recordedCalls,
          isNot(contains(_AuthEndpoint.me)),
          reason: 'No /me request must be issued when no JWT is persisted '
              '(Requirement 12.2).',
        );
        expect(
          fakeClient.recordedCalls,
          isEmpty,
          reason: 'No auth endpoint should be hit during a cold boot with '
              'empty storage.',
        );
      },
    );

    testWidgets(
      '4. auth-state flip re-evaluates router redirects without modifying '
      'routerProvider (Requirement 7.5)',
      (WidgetTester tester) async {
        final storage = _InMemorySecureStorage();
        // Empty storage → boot to /auth/login.

        final fakeClient = _FakeAuthApiClient()
          ..onLogin = () async => const AuthApiResponse(
                statusCode: 200,
                body: _loginSuccessBody,
              );

        final container = _buildContainer(storage: storage, client: fakeClient);
        addTearDown(container.dispose);

        await _pumpApp(tester, container);
        expect(
          _currentLocation(container),
          Routes.loginPath,
          reason: 'unauthenticated boot must land on /auth/login',
        );

        // Programmatically transition to authenticated. The notifier's
        // login() resolves to AuthAuthenticated, which causes the
        // overridden authStateProvider to flip to true. The router's
        // existing refreshListenable observes the change and re-runs the
        // redirect rules against the current /auth/login location,
        // sending the user to /. None of this is wired by mutating
        // routerProvider — the same routerProvider instance is reused.
        await container
            .read(authNotifierProvider.notifier)
            .login('fresh@example.com', 'correct horse battery staple');
        await tester.pumpAndSettle();

        expect(
          _currentLocation(container),
          Routes.homePath,
          reason: 'authenticated user on /auth/login must be redirected '
              'to / by the existing routerProvider (Requirement 7.5).',
        );
        expect(fakeClient.recordedCalls, contains(_AuthEndpoint.login));
      },
    );
  });
}

// ---------------------------------------------------------------------------
// Test harness helpers.
// ---------------------------------------------------------------------------

/// Builds a [ProviderContainer] with the auth feature's transport seams
/// swapped for in-memory fakes.
///
/// Mirrors two of the three entries in
/// `features/auth/presentation/auth_overrides.dart` (the
/// `authStateProvider` derivation and the `authRedirectCallbackProvider`
/// hook) and adds two test-only overrides for the foundation seams that
/// the auth feature consumes (the `secureStorageProvider` and the
/// `authApiClientProvider`). The `dioProvider` override is intentionally
/// omitted — see the file-level docstring for the rationale.
ProviderContainer _buildContainer({
  required SecureStorage storage,
  required AuthApiClient client,
}) {
  return ProviderContainer(
    overrides: <Override>[
      // Replicates override 1 from buildAuthOverrides: derive the
      // boolean the router watches from the AsyncValue of the auth
      // notifier.
      authStateProvider.overrideWith((ref) {
        final authValue = ref.watch(authNotifierProvider);
        return authValue.valueOrNull is AuthAuthenticated;
      }),
      // Replicates override 2 from buildAuthOverrides: the 401-driven
      // clear-and-redirect target.
      authRedirectCallbackProvider.overrideWith(
        (ref) => () {
          ref.read(routerProvider).go(Routes.loginPath);
          ref.read(authNotifierProvider.notifier).markSessionExpired();
        },
      ),
      // Test seams.
      secureStorageProvider.overrideWithValue(storage),
      authApiClientProvider.overrideWithValue(client),
    ],
  );
}

/// Mounts [CookSmartApp] under [container] and waits for the auth
/// notifier and router redirects to settle.
Future<void> _pumpApp(
  WidgetTester tester,
  ProviderContainer container,
) async {
  await tester.pumpWidget(
    UncontrolledProviderScope(
      container: container,
      child: const CookSmartApp(),
    ),
  );
  await tester.pumpAndSettle();
}

/// Reads the router's current location string (e.g. `'/auth/login'`).
String _currentLocation(ProviderContainer container) {
  final router = container.read(routerProvider);
  return router.routerDelegate.currentConfiguration.uri.toString();
}

// ---------------------------------------------------------------------------
// _InMemorySecureStorage — Map-backed [SecureStorage] used as the
// `secureStorageProvider` override.
// ---------------------------------------------------------------------------

/// Minimal in-memory [SecureStorage] for integration tests.
///
/// Records whether `clearAll` was invoked so tests can assert the
/// 401 clear-and-redirect path actually wiped storage.
class _InMemorySecureStorage implements SecureStorage {
  _InMemorySecureStorage();

  final Map<String, String> _values = <String, String>{};

  /// True after any call to [clearAll], including no-op clears against
  /// already-empty storage.
  bool clearAllInvoked = false;

  @override
  Future<void> writeToken(String key, String value) async {
    _values[key] = value;
  }

  @override
  Future<String?> readToken(String key) async => _values[key];

  @override
  Future<void> deleteToken(String key) async {
    _values.remove(key);
  }

  @override
  Future<void> clearAll() async {
    clearAllInvoked = true;
    _values.clear();
  }
}

// ---------------------------------------------------------------------------
// _FakeAuthApiClient — programmable [AuthApiClient] used as the
// `authApiClientProvider` override.
// ---------------------------------------------------------------------------

/// Identifies which auth endpoint a fake invocation targets. Recorded
/// in [_FakeAuthApiClient.recordedCalls] so tests can assert on the
/// presence (or absence) of a call without parsing strings.
enum _AuthEndpoint { login, register, me, logout }

/// Programmable [AuthApiClient] for integration tests.
///
/// Each endpoint method delegates to an optional async closure
/// ([onLogin], [onRegister], [onMe], [onLogout]). When a closure is
/// `null`, the method throws a [StateError] so an unexpected call
/// surfaces as a test failure rather than silently returning a default
/// response.
class _FakeAuthApiClient implements AuthApiClient {
  _FakeAuthApiClient();

  final List<_AuthEndpoint> recordedCalls = <_AuthEndpoint>[];

  Future<AuthApiResponse> Function()? onLogin;
  Future<AuthApiResponse> Function(Map<String, dynamic> body)? onRegister;
  Future<AuthApiResponse> Function()? onMe;
  Future<AuthApiResponse> Function()? onLogout;

  @override
  Future<AuthApiResponse> login({
    required String email,
    required String password,
  }) {
    recordedCalls.add(_AuthEndpoint.login);
    final handler = onLogin;
    if (handler == null) {
      throw StateError(
        '_FakeAuthApiClient.login was called but onLogin is unset.',
      );
    }
    return handler();
  }

  @override
  Future<AuthApiResponse> register(Map<String, dynamic> body) {
    recordedCalls.add(_AuthEndpoint.register);
    final handler = onRegister;
    if (handler == null) {
      throw StateError(
        '_FakeAuthApiClient.register was called but onRegister is unset.',
      );
    }
    return handler(body);
  }

  @override
  Future<AuthApiResponse> me() {
    recordedCalls.add(_AuthEndpoint.me);
    final handler = onMe;
    if (handler == null) {
      throw StateError(
        '_FakeAuthApiClient.me was called but onMe is unset.',
      );
    }
    return handler();
  }

  @override
  Future<AuthApiResponse> logout() {
    recordedCalls.add(_AuthEndpoint.logout);
    final handler = onLogout;
    if (handler == null) {
      throw StateError(
        '_FakeAuthApiClient.logout was called but onLogout is unset.',
      );
    }
    return handler();
  }
}
