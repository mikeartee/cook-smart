// Unit tests for `lib/features/auth/domain/auth_state.dart`.
//
// Five concerns are exercised:
//
//   1. Compile-time exhaustiveness — a `switch` expression over the
//      sealed parent must compile while listing all three variants.
//      Because [AuthState] is sealed and every variant is `final`,
//      missing a variant is a compile-time error, so the *existence*
//      of this test file is itself the assertion. The runtime checks
//      below merely confirm the dispatch is wired up.
//   2. Equality and hashCode for [AuthLoading].
//   3. Equality and hashCode for [AuthUnauthenticated], including the
//      `errorMessage: null` vs `errorMessage: 'foo'` distinction.
//   4. Equality and hashCode for [AuthAuthenticated], including the
//      "different user" and "different token" axes.
//   5. `toString` smoke checks — each variant's string form names the
//      variant and surfaces its key fields.
//
// The [AuthAuthenticated] cases construct a [User] via
// [User.fromMeJson] with a minimal valid `/me` JSON object so the
// test file does not depend on the (private) [User] constructor.
//
// Validates: Requirements 6.1, 6.2, 6.3, 6.4.

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/auth/domain/auth_state.dart';
import 'package:mobile/features/auth/domain/user.dart';

/// Minimal valid `/me` payload — only the nine non-null fields
/// declared by Requirement 4.1.
Map<String, dynamic> _meJson({
  String id = 'user-1',
  String email = 'a@b.co',
}) {
  return <String, dynamic>{
    'id': id,
    'email': email,
    'is_co_founder': false,
    'is_special_user': false,
    'is_creator': false,
    'has_lifetime_subscription': false,
    'subscription_status': 'none',
    'points': 0,
    'is_admin': false,
  };
}

/// Exhaustive switch over [AuthState]. The compiler refuses to
/// compile this function if any [AuthState] variant is missing.
String _describe(AuthState state) => switch (state) {
      AuthLoading() => 'loading',
      AuthUnauthenticated() => 'unauthenticated',
      AuthAuthenticated() => 'authenticated',
    };

void main() {
  group('AuthState exhaustiveness', () {
    test('switch on AuthState is exhaustive at compile time', () {
      final user = User.fromMeJson(_meJson());

      expect(_describe(const AuthLoading()), 'loading');
      expect(_describe(const AuthUnauthenticated()), 'unauthenticated');
      expect(
        _describe(AuthAuthenticated(user: user, token: 't')),
        'authenticated',
      );
    });
  });

  group('AuthLoading', () {
    test('two instances are equal and share a hashCode', () {
      const AuthState a = AuthLoading();
      const AuthState b = AuthLoading();

      expect(a, equals(b));
      expect(a.hashCode, equals(b.hashCode));
    });

    test('is not equal to an AuthUnauthenticated instance', () {
      const AuthState loading = AuthLoading();
      const AuthState unauth = AuthUnauthenticated();

      expect(loading, isNot(equals(unauth)));
    });

    test('toString names the variant', () {
      expect(const AuthLoading().toString(), contains('AuthLoading'));
    });
  });

  group('AuthUnauthenticated', () {
    test('two instances with equal errorMessage are equal', () {
      const AuthState a = AuthUnauthenticated(errorMessage: 'boom');
      const AuthState b = AuthUnauthenticated(errorMessage: 'boom');

      expect(a, equals(b));
      expect(a.hashCode, equals(b.hashCode));
    });

    test('two instances with different errorMessage are not equal', () {
      const AuthState a = AuthUnauthenticated(errorMessage: 'boom');
      const AuthState b = AuthUnauthenticated(errorMessage: 'kaboom');

      expect(a, isNot(equals(b)));
    });

    test('null errorMessage is distinguishable from a non-null one', () {
      const AuthState withNull = AuthUnauthenticated();
      const AuthState withMessage = AuthUnauthenticated(errorMessage: 'foo');

      expect(withNull, isNot(equals(withMessage)));
    });

    test('two default instances are equal', () {
      const AuthState a = AuthUnauthenticated();
      const AuthState b = AuthUnauthenticated();

      expect(a, equals(b));
      expect(a.hashCode, equals(b.hashCode));
    });

    test('toString names the variant and surfaces errorMessage', () {
      const AuthState state = AuthUnauthenticated(errorMessage: 'boom');

      expect(state.toString(), contains('AuthUnauthenticated'));
      expect(state.toString(), contains('boom'));
    });
  });

  group('AuthAuthenticated', () {
    final userA = User.fromMeJson(_meJson(id: 'user-A'));
    final userB = User.fromMeJson(_meJson(id: 'user-B', email: 'b@b.co'));

    test('two instances with equal user and token are equal', () {
      final AuthState a = AuthAuthenticated(user: userA, token: 't');
      final AuthState b = AuthAuthenticated(user: userA, token: 't');

      expect(a, equals(b));
      expect(a.hashCode, equals(b.hashCode));
    });

    test('different user with same token is not equal', () {
      final AuthState a = AuthAuthenticated(user: userA, token: 't');
      final AuthState b = AuthAuthenticated(user: userB, token: 't');

      expect(a, isNot(equals(b)));
    });

    test('same user with different token is not equal', () {
      final AuthState a = AuthAuthenticated(user: userA, token: 't1');
      final AuthState b = AuthAuthenticated(user: userA, token: 't2');

      expect(a, isNot(equals(b)));
    });

    test('toString names the variant and surfaces user and token', () {
      final AuthState state = AuthAuthenticated(user: userA, token: 'jwt-xyz');

      expect(state.toString(), contains('AuthAuthenticated'));
      expect(state.toString(), contains('jwt-xyz'));
      expect(state.toString(), contains('user-A'));
    });
  });
}
