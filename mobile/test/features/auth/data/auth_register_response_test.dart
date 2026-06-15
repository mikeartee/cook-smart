// Unit tests for `lib/features/auth/data/auth_register_response.dart`.
//
// Verifies the parser for `POST /api/v1/auth/register` against the
// canonical [registerFixture] derived from `backend/src/routes/auth.ts`,
// then exercises every malformed-body shape called out in
// Requirement 3.6 — missing token, empty token, missing user,
// non-object user, and a non-string `special_message`. Each
// malformed-body case asserts the raised [ServerException] names
// the offending endpoint (`POST /api/v1/auth/register`).
//
// Also covers the optional-`special_message` rule from Requirement 3.3:
// a successful body that omits `special_message` resolves to a
// response with `specialMessage == null`.
//
// These are example/unit tests, not property tests — `glados` is
// not imported here.
//
// Validates: Requirements 3.3, 3.6.

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/features/auth/data/auth_register_response.dart';

import 'fixtures.dart';

void main() {
  group('AuthRegisterResponse.fromJson — happy path', () {
    test('captures the top-level token verbatim', () {
      final response = AuthRegisterResponse.fromJson(registerFixture);

      expect(response.token, registerFixture['token']);
    });

    test('builds a User whose fields match the fixture user object', () {
      final response = AuthRegisterResponse.fromJson(registerFixture);
      final fixtureUser = registerFixture['user']! as Map<String, dynamic>;

      expect(response.user.id, fixtureUser['id']);
      expect(response.user.email, fixtureUser['email']);
      expect(response.user.firstName, fixtureUser['first_name']);
      expect(response.user.lastName, fixtureUser['last_name']);
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
      // The register handler omits `is_admin` for brand-new accounts;
      // `User.fromRegisterJson` defaults it to `false`.
      expect(response.user.isAdmin, isFalse);
    });

    test('captures special_message when present', () {
      final response = AuthRegisterResponse.fromJson(registerFixture);

      expect(response.specialMessage, registerFixture['special_message']);
    });

    test('resolves specialMessage to null when the field is absent', () {
      final body = Map<String, dynamic>.from(registerFixture)
        ..remove('special_message')
        ..remove('lifetime_access');

      final response = AuthRegisterResponse.fromJson(body);

      expect(response.specialMessage, isNull);
      expect(response.token, body['token']);
      expect(response.user.email, (body['user']! as Map)['email']);
    });
  });

  group('AuthRegisterResponse.fromJson — malformed bodies', () {
    test('missing token raises ServerException naming /register', () {
      final body = Map<String, dynamic>.from(registerFixture)
        ..remove('token');

      expect(
        () => AuthRegisterResponse.fromJson(body),
        throwsA(
          isA<ServerException>().having(
            (e) => e.message,
            'message',
            contains('POST /api/v1/auth/register'),
          ),
        ),
      );
    });

    test('empty token raises ServerException naming /register', () {
      final body = Map<String, dynamic>.from(registerFixture)
        ..['token'] = '';

      expect(
        () => AuthRegisterResponse.fromJson(body),
        throwsA(
          isA<ServerException>().having(
            (e) => e.message,
            'message',
            contains('POST /api/v1/auth/register'),
          ),
        ),
      );
    });

    test('missing user raises ServerException naming /register', () {
      final body = Map<String, dynamic>.from(registerFixture)..remove('user');

      expect(
        () => AuthRegisterResponse.fromJson(body),
        throwsA(
          isA<ServerException>().having(
            (e) => e.message,
            'message',
            contains('POST /api/v1/auth/register'),
          ),
        ),
      );
    });

    test('non-object user raises ServerException naming /register', () {
      final body = Map<String, dynamic>.from(registerFixture)
        ..['user'] = 'not-an-object';

      expect(
        () => AuthRegisterResponse.fromJson(body),
        throwsA(
          isA<ServerException>().having(
            (e) => e.message,
            'message',
            contains('POST /api/v1/auth/register'),
          ),
        ),
      );
    });

    test('non-string special_message raises ServerException naming /register',
        () {
      final body = Map<String, dynamic>.from(registerFixture)
        ..['special_message'] = 42;

      expect(
        () => AuthRegisterResponse.fromJson(body),
        throwsA(
          isA<ServerException>().having(
            (e) => e.message,
            'message',
            contains('POST /api/v1/auth/register'),
          ),
        ),
      );
    });
  });
}
