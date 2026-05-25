// Unit tests for `lib/features/auth/data/auth_logout_response.dart`.
//
// The logout parser intentionally ignores the response body — the
// existence of a 2xx response is itself the success signal
// (Requirement 3.5). These tests verify that contract by feeding the
// parser three shapes and asserting it returns successfully each
// time:
//
//   1. The canonical [logoutFixture] (`{ success: true, message: ... }`)
//   2. An empty `Map<String, dynamic>{}` — the body is ignored
//   3. A map without the optional `success` field — the field is
//      optional
//
// These are example/unit tests, not property tests — `glados` is
// not imported here.
//
// Validates: Requirement 3.5.

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/auth/data/auth_logout_response.dart';

import 'fixtures.dart';

void main() {
  group('AuthLogoutResponse.fromJson', () {
    test('parses the canonical logoutFixture body successfully', () {
      final response = AuthLogoutResponse.fromJson(logoutFixture);

      expect(response, isA<AuthLogoutResponse>());
    });

    test('parses an empty body successfully (body is ignored)', () {
      final response = AuthLogoutResponse.fromJson(const <String, dynamic>{});

      expect(response, isA<AuthLogoutResponse>());
    });

    test('parses a body without the optional success field successfully', () {
      const body = <String, dynamic>{
        'message': 'Logged out successfully',
      };

      final response = AuthLogoutResponse.fromJson(body);

      expect(response, isA<AuthLogoutResponse>());
    });

    test('all parsed responses compare equal (no payload to diverge)', () {
      final fromFixture = AuthLogoutResponse.fromJson(logoutFixture);
      final fromEmpty = AuthLogoutResponse.fromJson(const <String, dynamic>{});
      final fromMessageOnly =
          AuthLogoutResponse.fromJson(const <String, dynamic>{
        'message': 'See you next time',
      });

      expect(fromFixture, equals(fromEmpty));
      expect(fromEmpty, equals(fromMessageOnly));
    });
  });
}
