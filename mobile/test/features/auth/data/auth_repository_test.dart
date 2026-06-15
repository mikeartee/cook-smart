// Property and example tests for `lib/features/auth/data/auth_repository.dart`.
//
// Validates the `AuthRepository` contract against the cook-smart auth seam
// described in `flutter-port-auth/design.md` Decision 4. The repository
// depends on two foundation seams and nothing else:
//
//   * [AuthApiClient] from `core/network/auth_api_client.dart` — wraps Dio
//     and bakes in the `requiresAuth` flag per endpoint. The repository
//     never imports `package:dio` and never sees `DioException`.
//   * [SecureStorage] from `core/storage/secure_storage.dart` — persists
//     the JWT under [AuthInterceptor.jwtTokenKey] (`'jwt'`) and the user
//     record under [AuthRepository.userRecordKey] (`'auth_user'`).
//
// These tests use hand-rolled fakes (`_FakeAuthApiClient` and
// `_InMemorySecureStorage`) per the design's "Mock surface" section. No
// `mocktail` is used; the fakes record their inputs so each property can
// assert the observable surface directly.
//
// The properties tested here come from the design's twelve correctness
// properties:
//
//   * Property 4 — Storage write surface is exactly two keys.
//   * Property 10 — Signup request includes optional names iff trimmed
//     non-empty.
//
// Plus example tests for:
//
//   * Requirement 2.7 — repository accepts 200–299 as success and 201 as
//     register success.
//   * Requirement 12.6 — `NetworkException` from `/me` does NOT call
//     `clearAll` and keeps the JWT persisted.
//
// Validates: Requirements 5.6, 8.7, 2.2, 10.1, 2.7, 12.5, 12.6.

// External libraries
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
// `package:glados/glados.dart` re-exports the entire `package:test` API,
// which collides with `flutter_test`'s own `test`, `group`, `expect`, etc.
// Hiding the colliding identifiers from the glados import (rather than
// `show`-ing only specific glados symbols) keeps the `AnyUtils.choose`
// extension method in scope while letting `flutter_test`'s versions of
// the test-runner identifiers stay unambiguous.
import 'package:glados/glados.dart'
    hide
        addTearDown,
        expect,
        expectLater,
        fail,
        group,
        setUp,
        setUpAll,
        tearDown,
        tearDownAll,
        test;

// Internal modules
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/network/auth_api_client.dart';
import 'package:mobile/core/network/auth_interceptor.dart';
import 'package:mobile/core/storage/secure_storage.dart';
import 'package:mobile/features/auth/data/auth_repository.dart';

// ---------------------------------------------------------------------------
// Hand-rolled fakes per design "Mock surface" section.
// ---------------------------------------------------------------------------

/// Programmable [AuthApiClient] used by the repository under test.
///
/// Each method records the request body / arguments it received in the
/// `recorded*` lists, then returns whatever response the test programmed
/// via the matching `*Response` field. Throwing a programmed exception is
/// supported via the `*Exception` fields, which take precedence over
/// `*Response`. This mirrors the `ErrorInterceptor`-already-translated
/// failure surface the real adapter exposes.
class _FakeAuthApiClient implements AuthApiClient {
  /// Records of every request the fake observed. One entry is appended on
  /// every method call, regardless of whether the call resolves with a
  /// response or throws.
  final List<_RecordedCall> recordedCalls = <_RecordedCall>[];

  // Programmable responses per endpoint. When the matching exception field
  // is non-null it is thrown instead of returning the response. The
  // `Exception?` typing satisfies `only_throw_errors` without per-call
  // ignores; every failure surface the repository observes is an
  // `ApiException` (which extends `Exception`).
  AuthApiResponse? loginResponse;
  AuthApiResponse? registerResponse;
  AuthApiResponse? meResponse;
  AuthApiResponse? logoutResponse;

  Exception? loginException;
  Exception? registerException;
  Exception? meException;
  Exception? logoutException;

  @override
  Future<AuthApiResponse> login({
    required String email,
    required String password,
  }) async {
    recordedCalls.add(
      _RecordedCall(
        path: '/api/v1/auth/login',
        body: <String, dynamic>{'email': email, 'password': password},
      ),
    );
    if (loginException != null) {
      throw loginException!;
    }
    return loginResponse!;
  }

  @override
  Future<AuthApiResponse> register(Map<String, dynamic> body) async {
    recordedCalls.add(
      _RecordedCall(
        path: '/api/v1/auth/register',
        body: Map<String, dynamic>.from(body),
      ),
    );
    if (registerException != null) {
      throw registerException!;
    }
    return registerResponse!;
  }

  @override
  Future<AuthApiResponse> me() async {
    recordedCalls.add(
      const _RecordedCall(
        path: '/api/v1/auth/me',
        body: <String, dynamic>{},
      ),
    );
    if (meException != null) {
      throw meException!;
    }
    return meResponse!;
  }

  @override
  Future<AuthApiResponse> logout() async {
    recordedCalls.add(
      const _RecordedCall(
        path: '/api/v1/auth/logout',
        body: <String, dynamic>{},
      ),
    );
    if (logoutException != null) {
      throw logoutException!;
    }
    return logoutResponse ??
        const AuthApiResponse(statusCode: 200, body: <String, dynamic>{});
  }
}

/// One observed call against [_FakeAuthApiClient].
class _RecordedCall {
  const _RecordedCall({required this.path, required this.body});

  final String path;
  final Map<String, dynamic> body;
}

/// In-memory [SecureStorage] used by the repository under test.
///
/// Backed by a [Map] so tests can read the post-call storage state directly
/// via [contents]. `clearAllInvocationCount` records how many times
/// `clearAll` was awaited so the logout-idempotence and `/me`-failure
/// expectations can assert it ran the expected number of times.
class _InMemorySecureStorage implements SecureStorage {
  final Map<String, String> contents = <String, String>{};
  int clearAllInvocationCount = 0;

  /// Set of keys this storage has ever observed a `writeToken` against,
  /// even if a later `clearAll` removed the value. Property 4 asserts on
  /// this set rather than [contents] so a write followed by a clear in a
  /// single operation still surfaces the write.
  final Set<String> writtenKeys = <String>{};

  @override
  Future<void> writeToken(String key, String value) async {
    writtenKeys.add(key);
    contents[key] = value;
  }

  @override
  Future<String?> readToken(String key) async => contents[key];

  @override
  Future<void> deleteToken(String key) async {
    contents.remove(key);
  }

  @override
  Future<void> clearAll() async {
    clearAllInvocationCount++;
    contents.clear();
  }
}

// ---------------------------------------------------------------------------
// Test fixtures.
//
// Endpoint shapes follow `backend/src/routes/auth.ts` literally per the
// design's "Fixtures" section. Tests mutate copies of these maps to flex
// individual fields without leaking state between cases.
// ---------------------------------------------------------------------------

Map<String, dynamic> _loginUserBody() => <String, dynamic>{
      'id': 'user-123',
      'email': 'user@example.com',
      'is_co_founder': false,
      'is_special_user': false,
      'is_creator': false,
      'has_lifetime_subscription': false,
      'subscription_status': 'free',
      'points': 0,
      'is_admin': false,
      'first_name': 'Alice',
      'last_name': 'Smith',
    };

Map<String, dynamic> _meUserBody() => <String, dynamic>{
      'id': 'user-123',
      'email': 'user@example.com',
      'is_co_founder': false,
      'is_special_user': false,
      'is_creator': false,
      'has_lifetime_subscription': false,
      'subscription_status': 'free',
      'points': 0,
      'is_admin': false,
      'first_name': 'Alice',
      'last_name': 'Smith',
      'dietary_restrictions': <String>['vegetarian'],
      'allergies': <String>['peanut'],
      'show_nutrition': true,
      'preferred_units': 'metric',
    };

Map<String, dynamic> _loginBody({String token = 'JWT_LOGIN'}) =>
    <String, dynamic>{
      'success': true,
      'message': 'Logged in',
      'token': token,
      'user': _loginUserBody(),
    };

Map<String, dynamic> _registerBody({String token = 'JWT_REGISTER'}) =>
    <String, dynamic>{
      'message': 'Registered',
      'token': token,
      'user': _loginUserBody(),
    };

Map<String, dynamic> _meBody() => <String, dynamic>{
      'user': _meUserBody(),
    };

// ---------------------------------------------------------------------------
// Property 4 — Storage write surface is exactly two keys.
//
// For any successful login or register response, the set of SecureStorage
// keys written by the repository while resolving the call is exactly
// `{'jwt', 'auth_user'}` — never `'refreshToken'` and never any other
// field the response carries.
// ---------------------------------------------------------------------------

/// Discriminator for which auth operation Property 4 is exercising.
enum _AuthOperation { login, register }

extension _AuthOperationAny on Any {
  Generator<_AuthOperation> get authOperation => choose(<_AuthOperation>[
        _AuthOperation.login,
        _AuthOperation.register,
      ]);
}

void main() {
  group('AuthRepository — Property 4: storage write surface is exactly '
      "{'jwt', 'auth_user'}", () {
    Glados<_AuthOperation>(any.authOperation).test(
      'successful login or register writes exactly the JWT and user-record '
      "keys, never 'refreshToken'",
      (operation) async {
        final client = _FakeAuthApiClient()
          ..loginResponse = AuthApiResponse(
            statusCode: 200,
            body: _loginBody(token: 'JWT_FROM_LOGIN'),
          )
          ..registerResponse = AuthApiResponse(
            statusCode: 201,
            body: _registerBody(token: 'JWT_FROM_REGISTER'),
          );
        final storage = _InMemorySecureStorage();
        final repository = AuthRepository(client, storage);

        final String expectedToken;
        switch (operation) {
          case _AuthOperation.login:
            await repository.login('user@example.com', 'pw12345678');
            expectedToken = 'JWT_FROM_LOGIN';
          case _AuthOperation.register:
            await repository.register(
              email: 'user@example.com',
              password: 'pw12345678',
              ageVerified: true,
            );
            expectedToken = 'JWT_FROM_REGISTER';
        }

        // Storage now holds exactly {jwt, auth_user} — Property 4 / Req 5.6.
        expect(
          storage.writtenKeys,
          equals(<String>{
            AuthInterceptor.jwtTokenKey,
            AuthRepository.userRecordKey,
          }),
        );
        expect(
          storage.contents.keys.toSet(),
          equals(<String>{
            AuthInterceptor.jwtTokenKey,
            AuthRepository.userRecordKey,
          }),
        );

        // No write under refreshToken (Req 8.7) — the cook-smart backend
        // does not issue refresh tokens and the foundation's
        // `ErrorInterceptor.refreshTokenKey` literal `'refreshToken'`
        // is never persisted by this repository.
        expect(storage.writtenKeys.contains('refreshToken'), isFalse);
        expect(storage.contents.containsKey('refreshToken'), isFalse);

        // The JWT under `'jwt'` matches the response token verbatim — the
        // repository never rewrites or normalises it.
        expect(
          storage.contents[AuthInterceptor.jwtTokenKey],
          equals(expectedToken),
        );
      },
    );
  });

  // -------------------------------------------------------------------------
  // Property 10 — Signup request includes optional names iff trimmed
  // non-empty.
  //
  // For any (firstName, lastName) pair drawn from {null, '', '   ',
  // '  Alice  ', 'Alice'}, the body sent to /register contains 'first_name'
  // iff firstName.trim() is non-null and non-empty (and likewise for
  // 'last_name'). When present, the field's value equals the trimmed
  // string.
  // -------------------------------------------------------------------------

  group(
      'AuthRepository — Property 10: signup includes optional names iff '
      'trimmed non-empty', () {
    Glados2<String?, String?>(
      _optionalNameAny,
      _optionalNameAny,
    ).test(
      'register request body contains first_name / last_name iff the '
      'trimmed input is non-null and non-empty, with the trimmed value',
      (firstName, lastName) async {
        final client = _FakeAuthApiClient()
          ..registerResponse = AuthApiResponse(
            statusCode: 201,
            body: _registerBody(),
          );
        final storage = _InMemorySecureStorage();
        final repository = AuthRepository(client, storage);

        await repository.register(
          email: 'a@b.c',
          password: 'pw12345678',
          ageVerified: true,
          firstName: firstName,
          lastName: lastName,
        );

        // Exactly one register call observed.
        expect(client.recordedCalls.length, equals(1));
        final body = client.recordedCalls.single.body;

        // Mandatory fields always present.
        expect(body['email'], equals('a@b.c'));
        expect(body['password'], equals('pw12345678'));
        expect(body['age_verified'], isTrue);

        // first_name presence and value rule.
        final trimmedFirst = firstName?.trim();
        final firstShouldBePresent =
            trimmedFirst != null && trimmedFirst.isNotEmpty;
        expect(
          body.containsKey('first_name'),
          equals(firstShouldBePresent),
          reason:
              'first_name presence must equal "trimmed value is non-null '
              'and non-empty" for input ${jsonEncode(firstName)}',
        );
        if (firstShouldBePresent) {
          expect(body['first_name'], equals(trimmedFirst));
        }

        // last_name presence and value rule.
        final trimmedLast = lastName?.trim();
        final lastShouldBePresent =
            trimmedLast != null && trimmedLast.isNotEmpty;
        expect(
          body.containsKey('last_name'),
          equals(lastShouldBePresent),
          reason:
              'last_name presence must equal "trimmed value is non-null '
              'and non-empty" for input ${jsonEncode(lastName)}',
        );
        if (lastShouldBePresent) {
          expect(body['last_name'], equals(trimmedLast));
        }
      },
    );
  });

  // -------------------------------------------------------------------------
  // Requirement 2.7 — repository accepts 200–299 as success and 201 as
  // register success.
  //
  // The AuthApiClient adapter does not filter on statusCode itself — it
  // relies on `ErrorInterceptor` to throw on 4xx/5xx. So the repository's
  // accept-success behaviour is "any response that is not an exception".
  // These tests confirm that for boundary status codes.
  // -------------------------------------------------------------------------

  group('AuthRepository — Requirement 2.7: any 2xx is treated as success',
      () {
    test('login resolves successfully when /login responds with 200', () async {
      final client = _FakeAuthApiClient()
        ..loginResponse = AuthApiResponse(statusCode: 200, body: _loginBody());
      final storage = _InMemorySecureStorage();
      final repository = AuthRepository(client, storage);

      final result =
          await repository.login('user@example.com', 'pw12345678');

      expect(result.token, equals('JWT_LOGIN'));
      expect(result.user.id, equals('user-123'));
      expect(
        storage.contents[AuthInterceptor.jwtTokenKey],
        equals('JWT_LOGIN'),
      );
    });

    test(
      'register resolves successfully when /register responds with 201',
      () async {
        final client = _FakeAuthApiClient()
          ..registerResponse = AuthApiResponse(
            statusCode: 201,
            body: _registerBody(),
          );
        final storage = _InMemorySecureStorage();
        final repository = AuthRepository(client, storage);

        final result = await repository.register(
          email: 'user@example.com',
          password: 'pw12345678',
          ageVerified: true,
        );

        expect(result.token, equals('JWT_REGISTER'));
        expect(result.user.id, equals('user-123'));
        expect(
          storage.contents[AuthInterceptor.jwtTokenKey],
          equals('JWT_REGISTER'),
        );
      },
    );

    test(
      'restoreSession resolves successfully when /me responds with 299',
      () async {
        final client = _FakeAuthApiClient()
          ..meResponse = AuthApiResponse(statusCode: 299, body: _meBody());
        final storage = _InMemorySecureStorage()
          ..contents[AuthInterceptor.jwtTokenKey] = 'PERSISTED_JWT';
        final repository = AuthRepository(client, storage);

        final user = await repository.restoreSession();

        expect(user, isNotNull);
        expect(user!.id, equals('user-123'));
        // The /me-only fields hydrate.
        expect(user.dietaryRestrictions, equals(<String>['vegetarian']));
        expect(user.allergies, equals(<String>['peanut']));
        expect(user.showNutrition, isTrue);
        expect(user.preferredUnits, equals('metric'));
      },
    );
  });

  // -------------------------------------------------------------------------
  // Requirement 12.6 — NetworkException from /me does NOT call clearAll
  // and keeps the JWT persisted.
  //
  // A poor network on cold start must not silently log the user out.
  // -------------------------------------------------------------------------

  group(
      'AuthRepository — Requirement 12.6: NetworkException from /me leaves '
      'storage intact', () {
    test(
      'restoreSession rethrows NetworkException without calling clearAll '
      'and keeps both keys persisted with their original values',
      () async {
        const persistedUserJson =
            '{"id":"user-123","email":"user@example.com",'
            '"is_co_founder":false,"is_special_user":false,'
            '"is_creator":false,"has_lifetime_subscription":false,'
            '"subscription_status":"free","points":0,"is_admin":false,'
            '"first_name":"Alice","last_name":"Smith",'
            '"dietary_restrictions":null,"allergies":null,'
            '"show_nutrition":null,"preferred_units":null}';
        final client = _FakeAuthApiClient()
          ..meException = const NetworkException('Connection refused');
        final storage = _InMemorySecureStorage()
          ..contents[AuthInterceptor.jwtTokenKey] = 'PERSISTED_JWT'
          ..contents[AuthRepository.userRecordKey] = persistedUserJson;
        final repository = AuthRepository(client, storage);

        await expectLater(
          repository.restoreSession(),
          throwsA(isA<NetworkException>()),
        );

        // Storage untouched (Req 12.6).
        expect(
          storage.contents[AuthInterceptor.jwtTokenKey],
          equals('PERSISTED_JWT'),
        );
        expect(
          storage.contents[AuthRepository.userRecordKey],
          equals(persistedUserJson),
        );
        // clearAll was never invoked — Req 12.6 distinguishes
        // network/server failures from session-expired (Req 12.5).
        expect(storage.clearAllInvocationCount, equals(0));
      },
    );
  });
}

// ---------------------------------------------------------------------------
// Generator for Property 10's optional-name input space.
//
// Drawn from `{null, '', '   ', '  Alice  ', 'Alice'}` per the property's
// formal statement. Each value is an independent draw, so Glados2 covers
// the 5 × 5 = 25 (firstName, lastName) combinations across its 100 runs.
// ---------------------------------------------------------------------------

final Generator<String?> _optionalNameAny = any.choose<String?>(<String?>[
  null,
  '',
  '   ',
  '  Alice  ',
  'Alice',
]);
