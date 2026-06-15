// Unit tests for `lib/features/auth/data/auth_me_response.dart`.
//
// Verifies the parser for `GET /api/v1/auth/me` against the canonical
// [meFixture] derived from `backend/src/routes/auth.ts`. The `/me`
// endpoint is the only one that populates the four preference fields
// (`dietary_restrictions`, `allergies`, `show_nutrition`,
// `preferred_units`), so this test asserts all 15 User fields land
// correctly on the resolved [User].
//
// Then exercises the malformed-body shapes called out in
// Requirement 3.6 — missing user and non-object user — and asserts the
// raised [ServerException] names the offending endpoint
// (`GET /api/v1/auth/me`).
//
// These are example/unit tests, not property tests — `glados` is
// not imported here.
//
// Validates: Requirements 3.4, 3.6, 4.4.

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/features/auth/data/auth_me_response.dart';

import 'fixtures.dart';

void main() {
  group('AuthMeResponse.fromJson — happy path', () {
    test('populates all 15 User fields from the /me fixture', () {
      final response = AuthMeResponse.fromJson(meFixture);
      final fixtureUser = meFixture['user']! as Map<String, dynamic>;

      // Nine non-null fields (Requirement 4.1).
      expect(response.user.id, fixtureUser['id']);
      expect(response.user.email, fixtureUser['email']);
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
      expect(response.user.isAdmin, fixtureUser['is_admin']);

      // Optional name fields shared with /login and /register
      // (Requirement 4.2 first two entries).
      expect(response.user.firstName, fixtureUser['first_name']);
      expect(response.user.lastName, fixtureUser['last_name']);

      // The four /me-only nullable fields (Requirement 4.4).
      expect(
        response.user.dietaryRestrictions,
        equals(fixtureUser['dietary_restrictions']),
      );
      expect(response.user.allergies, equals(fixtureUser['allergies']));
      expect(response.user.showNutrition, fixtureUser['show_nutrition']);
      expect(response.user.preferredUnits, fixtureUser['preferred_units']);
    });
  });

  group('AuthMeResponse.fromJson — malformed bodies', () {
    test('missing user raises ServerException naming /me', () {
      final body = Map<String, dynamic>.from(meFixture)..remove('user');

      expect(
        () => AuthMeResponse.fromJson(body),
        throwsA(
          isA<ServerException>().having(
            (e) => e.message,
            'message',
            contains('GET /api/v1/auth/me'),
          ),
        ),
      );
    });

    test('non-object user (string) raises ServerException naming /me', () {
      final body = Map<String, dynamic>.from(meFixture)
        ..['user'] = 'not-an-object';

      expect(
        () => AuthMeResponse.fromJson(body),
        throwsA(
          isA<ServerException>().having(
            (e) => e.message,
            'message',
            contains('GET /api/v1/auth/me'),
          ),
        ),
      );
    });

    test('non-object user (null) raises ServerException naming /me', () {
      final body = Map<String, dynamic>.from(meFixture)..['user'] = null;

      expect(
        () => AuthMeResponse.fromJson(body),
        throwsA(
          isA<ServerException>().having(
            (e) => e.message,
            'message',
            contains('GET /api/v1/auth/me'),
          ),
        ),
      );
    });
  });
}
