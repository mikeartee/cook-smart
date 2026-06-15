// Integration test for the cook-smart auth logout flow.
//
// Validates that calling [AuthNotifier.logout] from any logged-in state
// always lands the app on `/auth/login` and unconditionally clears
// `SecureStorage`, regardless of the outcome of the
// `POST /api/v1/auth/logout` round-trip:
//
//   * `/logout` returns 200 with an empty body — happy path.
//   * `/logout` raises [NetworkException] — offline / DNS / connection
//     refused. The repository must swallow the exception and still
//     clear storage so the user is locally logged out.
//   * `/logout` raises [ServerException] — backend 5xx. Same outcome.
//
// Mirrors the setup pattern of `auth_session_restore_test.dart` (task
// 10.1):
//
//   * `secureStorageProvider` is overridden with the in-memory adapter
//     defined below, seeded with a valid JWT and user record so the
//     app boots straight into [AuthAuthenticated] without hitting the
//     login screen.
//   * `authApiClientProvider` is overridden with a fake [AuthApiClient]
//     whose `me()` returns success on Session_Restore and whose
//     `logout()` is configured per scenario.
//   * The `authStateProvider` and `authRedirectCallbackProvider`
//     overrides from `auth_overrides.dart` are applied inline so the
//     router observes [authNotifierProvider]'s state changes and the
//     401 redirect callback is wired up. `dioProvider` is intentionally
//     not overridden — the fake [AuthApiClient] never calls into Dio
//     so the foundation default goes untouched.
//
// Validates: Requirements 11.2, 11.3, 11.5.

import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:mobile/app.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/network/auth_api_client.dart';
import 'package:mobile/core/network/auth_interceptor.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/core/router/router_provider.dart';
import 'package:mobile/core/router/routes.dart';
import 'package:mobile/core/storage/secure_storage.dart';
import 'package:mobile/core/storage/secure_storage_provider.dart';
import 'package:mobile/features/auth/data/auth_repository.dart';
import 'package:mobile/features/auth/domain/auth_state.dart';
import 'package:mobile/features/auth/presentation/auth_notifier.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('auth_logout_test', () {
    // Pre-seeded session values. The JWT is opaque to the in-memory
    // storage; the user record is the JSON shape `User.fromMeJson`
    // expects (every non-null field populated, every /me-only field
    // present and explicit-`null`).
    const testJwt = 'integration-test-jwt';
    const meUserJson = <String, dynamic>{
      'id': 'user-1',
      'email': 'alice@example.com',
      'is_co_founder': false,
      'is_special_user': false,
      'is_creator': false,
      'has_lifetime_subscription': false,
      'subscription_status': 'active',
      'points': 0,
      'is_admin': false,
      'first_name': 'Alice',
      'last_name': 'Example',
      'dietary_restrictions': null,
      'allergies': null,
      'show_nutrition': null,
      'preferred_units': null,
    };

    /// Boots `CookSmartApp` under a `ProviderContainer` whose overrides
    /// seed an authenticated session and configure the fake transport.
    ///
    /// Returns the container, the in-memory storage, and the fake
    /// client so each scenario can drive the notifier and assert
    /// against the resulting state.
    Future<({
      ProviderContainer container,
      _InMemorySecureStorage storage,
      _FakeAuthApiClient client,
    })> bootAuthenticatedApp(
      WidgetTester tester, {
      required AuthApiResponse? logoutResponse,
      required ApiException? logoutException,
    }) async {
      final storage = _InMemorySecureStorage(
        seed: <String, String>{
          AuthInterceptor.jwtTokenKey: testJwt,
          AuthRepository.userRecordKey: jsonEncode(meUserJson),
        },
      );

      final client = _FakeAuthApiClient()
        ..meResponse = const AuthApiResponse(
          statusCode: 200,
          body: <String, dynamic>{'user': meUserJson},
        )
        ..logoutResponse = logoutResponse
        ..logoutException = logoutException;

      final container = ProviderContainer(
        overrides: <Override>[
          // In-memory storage seeded with a valid session.
          secureStorageProvider.overrideWithValue(storage),
          // Fake AuthApiClient — Session_Restore succeeds via me(),
          // logout() behaves per scenario.
          authApiClientProvider.overrideWithValue(client),
          // authStateProvider derivation (mirrors auth_overrides.dart):
          // true iff the notifier currently holds AuthAuthenticated.
          authStateProvider.overrideWith((ref) {
            final value = ref.watch(authNotifierProvider);
            return value.valueOrNull is AuthAuthenticated;
          }),
          // 401 redirect callback (mirrors auth_overrides.dart). Not
          // exercised by these scenarios — logout never raises a 401
          // through ErrorInterceptor in this test — but applied for
          // parity with the production wiring.
          authRedirectCallbackProvider.overrideWith(
            (ref) => () {
              ref.read(routerProvider).go(Routes.loginPath);
              ref.read(authNotifierProvider.notifier).markSessionExpired();
            },
          ),
        ],
      );
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const CookSmartApp(),
        ),
      );
      await tester.pumpAndSettle();

      // Sanity: Session_Restore should resolve to AuthAuthenticated and
      // the router should land the user on the home tab. Without this
      // gate, a logout assertion that "lands on /auth/login" would
      // pass trivially if the boot itself never authenticated.
      expect(
        container.read(authNotifierProvider).valueOrNull,
        isA<AuthAuthenticated>(),
        reason: 'Session_Restore must succeed before logout is exercised.',
      );
      expect(
        _currentLocation(container),
        Routes.homePath,
        reason:
            'Authenticated boot must land on / before logout is invoked.',
      );

      return (container: container, storage: storage, client: client);
    }

    testWidgets(
      'logout with /logout returning 200 lands on /auth/login and '
      'clears storage',
      (tester) async {
        final boot = await bootAuthenticatedApp(
          tester,
          logoutResponse: const AuthApiResponse(
            statusCode: 200,
            body: <String, dynamic>{},
          ),
          logoutException: null,
        );

        await boot.container
            .read(authNotifierProvider.notifier)
            .logout();
        await tester.pumpAndSettle();

        expect(_currentLocation(boot.container), Routes.loginPath);
        expect(boot.storage.clearAllInvocationCount, 1);
        expect(
          boot.storage.containsKey(AuthInterceptor.jwtTokenKey),
          isFalse,
          reason: 'JWT must be wiped from secure storage on logout.',
        );
        expect(
          boot.storage.containsKey(AuthRepository.userRecordKey),
          isFalse,
          reason: 'User record must be wiped from secure storage on logout.',
        );
      },
    );

    testWidgets(
      'logout with /logout raising NetworkException still lands on '
      '/auth/login and clears storage',
      (tester) async {
        final boot = await bootAuthenticatedApp(
          tester,
          logoutResponse: null,
          logoutException: const NetworkException('offline'),
        );

        await boot.container
            .read(authNotifierProvider.notifier)
            .logout();
        await tester.pumpAndSettle();

        expect(_currentLocation(boot.container), Routes.loginPath);
        expect(boot.storage.clearAllInvocationCount, 1);
        expect(
          boot.storage.containsKey(AuthInterceptor.jwtTokenKey),
          isFalse,
        );
        expect(
          boot.storage.containsKey(AuthRepository.userRecordKey),
          isFalse,
        );
      },
    );

    testWidgets(
      'logout with /logout raising ServerException still lands on '
      '/auth/login and clears storage',
      (tester) async {
        final boot = await bootAuthenticatedApp(
          tester,
          logoutResponse: null,
          logoutException: const ServerException('upstream', 500),
        );

        await boot.container
            .read(authNotifierProvider.notifier)
            .logout();
        await tester.pumpAndSettle();

        expect(_currentLocation(boot.container), Routes.loginPath);
        expect(boot.storage.clearAllInvocationCount, 1);
        expect(
          boot.storage.containsKey(AuthInterceptor.jwtTokenKey),
          isFalse,
        );
        expect(
          boot.storage.containsKey(AuthRepository.userRecordKey),
          isFalse,
        );
      },
    );
  });
}

/// Reads the router's current location through `routerProvider`'s
/// `routeInformationProvider`. Matches the convention recommended by
/// the auth-port spec for integration tests.
String _currentLocation(ProviderContainer container) {
  return container
      .read(routerProvider)
      .routeInformationProvider
      .value
      .uri
      .toString();
}

/// In-memory [SecureStorage] used by the integration tests in this
/// file. Stores values in a plain `Map<String, String>`, tracks
/// `clearAll` invocations so scenarios can assert idempotence, and
/// supports key seeding via the constructor so a test can boot the
/// app with a pre-existing session.
///
/// Defined inline (rather than shared with task 10.1) per the spec's
/// "don't share state between integration tests — they should be
/// independent" guidance.
class _InMemorySecureStorage implements SecureStorage {
  _InMemorySecureStorage({Map<String, String>? seed})
      : _store = Map<String, String>.from(seed ?? const <String, String>{});

  final Map<String, String> _store;

  /// Number of times [clearAll] has been called. Asserted on by the
  /// scenarios below to verify the repository's contract that
  /// `SecureStorage.clearAll` runs exactly once per logout call,
  /// regardless of `/logout` HTTP outcome.
  int clearAllInvocationCount = 0;

  @override
  Future<void> writeToken(String key, String value) async {
    _store[key] = value;
  }

  @override
  Future<String?> readToken(String key) async => _store[key];

  @override
  Future<void> deleteToken(String key) async {
    _store.remove(key);
  }

  @override
  Future<void> clearAll() async {
    clearAllInvocationCount++;
    _store.clear();
  }

  /// Test-only helper used by the scenarios below to verify that the
  /// JWT and user record have been wiped after logout. Not part of
  /// the [SecureStorage] interface.
  bool containsKey(String key) => _store.containsKey(key);
}

/// Test fake for [AuthApiClient]. Each scenario configures
/// [logoutResponse] and [logoutException] to drive the three
/// branches under test:
///
///   * `logoutResponse` set, `logoutException` null — `/logout`
///     resolves with the configured success response.
///   * `logoutResponse` null, `logoutException` set — `/logout`
///     raises the configured [ApiException].
///
/// `me()` always succeeds with [meResponse] so Session_Restore
/// resolves to [AuthAuthenticated]. `login` and `register` are not
/// exercised here and intentionally throw to make a misuse
/// observable rather than silent.
class _FakeAuthApiClient implements AuthApiClient {
  AuthApiResponse? meResponse;
  AuthApiResponse? logoutResponse;
  ApiException? logoutException;

  @override
  Future<AuthApiResponse> me() async {
    final response = meResponse;
    if (response == null) {
      throw StateError('me() called without a configured meResponse.');
    }
    return response;
  }

  @override
  Future<AuthApiResponse> logout() async {
    final exception = logoutException;
    if (exception != null) {
      throw exception;
    }
    final response = logoutResponse;
    if (response == null) {
      throw StateError(
        'logout() called without a configured logoutResponse or '
        'logoutException.',
      );
    }
    return response;
  }

  @override
  Future<AuthApiResponse> login({
    required String email,
    required String password,
  }) async {
    throw UnimplementedError(
      'login is not exercised by auth_logout_test.dart',
    );
  }

  @override
  Future<AuthApiResponse> register(Map<String, dynamic> body) async {
    throw UnimplementedError(
      'register is not exercised by auth_logout_test.dart',
    );
  }
}
