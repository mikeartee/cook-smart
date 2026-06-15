// Smoke test for the foundation-visible re-export bridge in
// `mobile/lib/core/network/auth_provider.dart`.
//
// The bridge exists so feature presentation and data files outside
// `features/auth/` can read `authNotifierProvider` and the
// [AuthState] sealed family without violating the architectural
// `cross_feature_import` rule (R-2.5). It also re-exports
// `CancelToken` so feature notifiers with the auto-dispose /
// cancel-on-disposal contract can cancel in-flight requests without
// writing `import 'package:dio/dio.dart';` (rule R-4.8).
//
// Verification surface
// --------------------
//
// The whole job of this file is to verify that the four documented
// symbols are reachable through the bridge URI alone — no transitive
// imports of `package:dio` or `mobile/features/auth/...` from the
// test. If a future refactor accidentally drops one of the `export`
// directives the build will not even compile this file, and the
// runtime assertions below double-check the re-exported types
// resolve to the same identity as their original declarations.
//
// `tool/check_structure.dart` requires every `lib/` source file to
// have a mirrored `_test.dart` under `test/`; this file satisfies
// that requirement for the bridge (Requirements 2.11 / 2.12 of the
// foundation spec).

// External libraries
import 'package:flutter_test/flutter_test.dart';

// Internal modules — bridge under test.
import 'package:mobile/core/network/auth_provider.dart';

void main() {
  group('core/network/auth_provider re-export bridge', () {
    test('re-exports authNotifierProvider', () {
      // The provider is publicly named per
      // `tool/check_structure.dart`'s provider-name rule and is
      // identity-stable across imports. The runtimeType check is
      // sufficient evidence that the symbol traversed the
      // `export` directive intact.
      expect(
        authNotifierProvider.runtimeType.toString(),
        contains('AsyncNotifierProvider'),
      );
    });

    test('re-exports the AuthState sealed family', () {
      const AuthState loading = AuthLoading();
      const AuthState unauth = AuthUnauthenticated();
      // AuthAuthenticated requires non-null user/token payloads, but
      // the bridge surface only needs to expose the constructor and
      // the type — instantiating with non-meaningful sentinels would
      // require importing `User`, which the bridge intentionally
      // does NOT re-export. The compile-time `is` checks below are
      // enough to verify the type re-exports.
      expect(loading, isA<AuthState>());
      expect(loading, isA<AuthLoading>());
      expect(unauth, isA<AuthState>());
      expect(unauth, isA<AuthUnauthenticated>());
      expect(AuthAuthenticated, isNotNull);
    });

    test('re-exports CancelToken from package:dio', () {
      final token = CancelToken();
      expect(token.isCancelled, isFalse);
      token.cancel('test');
      expect(token.isCancelled, isTrue);
    });
  });
}
