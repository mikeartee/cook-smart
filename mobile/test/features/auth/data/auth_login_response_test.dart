// Unit tests for `lib/features/auth/data/auth_login_response.dart`.
//
// Verifies the parser for `POST /api/v1/auth/login` against the
// canonical [loginFixture] derived from `backend/src/routes/auth.ts`,
// then exercises every malformed-body shape called out in
// Requirement 3.6 — missing token, empty token, non-string token,
// missing user, and non-object user. Each malformed-body case
// asserts the raised [ServerException] names the offending endpoint
// (`POST /api/v1/auth/login`) so backend regressions surface with
// diagnostic context.
//
// These are example/unit tests, not property tests — `glados` is
// not imported here.
//
// Validates: Requirements 3.2, 3.6.

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/features/auth/data/auth_login_response.dart';

import 'fixtures.dart';

void main() {
  group('AuthLoginResponse.fromJson — happy path', () {
    test('captures the top-level token verbatim', () {
      final response = AuthLoginResponse.fromJson(loginFixture);

      expect(response.token, loginFixture['token']);
    });

    test('builds a User whose fields match the fixture user object', () {
      final response = AuthLoginResponse.fromJson(loginFixture);
      final fixtureUser = loginFixture['user']! as Map<String, dynamic>;

      expect(response.user.id, fixtureUser['id']);
      expect(response.user.email, fixtureUser['email']);
      expect(response.user.firstName, fixtureUser['first_name']);
      expect(response.user.lastName, fixtureUser['last_name']);
      expect(response.user.isAdmin, fixtureUser['is_admin']);
      expect(response.user.isCoFounder, fixtureUser['is_co_founder']);
      expect(response.user.isSpecialUser, fixtureUser['is_special_user']);
      expect(response.user.isCreator, fixtureUser['is_creator']);
      expect(
        response.user.hasLifetimeSubscription,
        fixtureUser['has_lifetime_subscription'],
      );
      expect(
        response.user.subscriptionStatus,
        fixtureUser['subscription_status'],
      );
      expect(response.user.points, fixtureUser['points']);
    });

    test('leaves /me-only fields null on the resolved User', () {
      final response = AuthLoginResponse.fromJson(loginFixture);

      expect(response.user.dietaryRestrictions, isNull);
      expect(response.user.allergies, isNull);
      expect(response.user.showNutrition, isNull);
      expect(response.user.preferredUnits, isNull);
    });
  });

  group('AuthLoginResponse.fromJson — malformed bodies', () {
    test('missing token raises ServerException naming /login', () {
      final body = Map<String, dynamic>.from(loginFixture)..remove('token');

      expect(
        () => AuthLoginResponse.fromJson(body),
        throwsA(
          isA<ServerException>().having(
            (e) => e.message,
            'message',
            contains('POST /api/v1/auth/login'),
          ),
        ),
      );
    });

    test('empty token raises ServerException naming /login', () {
      final body = Map<String, dynamic>.from(loginFixture)
        ..['token'] = '';

      expect(
        () => AuthLoginResponse.fromJson(body),
        throwsA(
          isA<ServerException>().having(
            (e) => e.message,
            'message',
            contains('POST /api/v1/auth/login'),
          ),
        ),
      );
    });

    test('non-string token raises ServerException naming /login', () {
      final body = Map<String, dynamic>.from(loginFixture)
        ..['token'] = 42;

      expect(
        () => AuthLoginResponse.fromJson(body),
        throwsA(
          isA<ServerException>().having(
            (e) => e.message,
            'message',
            contains('POST /api/v1/auth/login'),
          ),
        ),
      );
    });

    test('missing user raises ServerException naming /login', () {
      final body = Map<String, dynamic>.from(loginFixture)..remove('user');

      expect(
        () => AuthLoginResponse.fromJson(body),
        throwsA(
          isA<ServerException>().having(
            (e) => e.message,
            'message',
            contains('POST /api/v1/auth/login'),
          ),
        ),
      );
    });

    test('non-object user (string) raises ServerException naming /login', () {
      final body = Map<String, dynamic>.from(loginFixture)
        ..['user'] = 'not-an-object';

      expect(
        () => AuthLoginResponse.fromJson(body),
        throwsA(
          isA<ServerException>().having(
            (e) => e.message,
            'message',
            contains('POST /api/v1/auth/login'),
          ),
        ),
      );
    });

    test('non-object user (null) raises ServerException naming /login', () {
      final body = Map<String, dynamic>.from(loginFixture)
        ..['user'] = null;

      expect(
        () => AuthLoginResponse.fromJson(body),
        throwsA(
          isA<ServerException>().having(
            (e) => e.message,
            'message',
            contains('POST /api/v1/auth/login'),
          ),
        ),
      );
    });
  });
}
