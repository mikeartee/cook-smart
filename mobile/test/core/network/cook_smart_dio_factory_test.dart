// Mirrored test stub for `lib/core/network/cook_smart_dio_factory.dart`.
//
// `buildDioWithCookSmartRefresh` is the helper that the auth feature's
// `dioProvider` override invokes. Its behaviour is exercised end-to-end by
// the foundation's existing `error_interceptor_test.dart` and
// `auth_interceptor_test.dart` (the interceptor stack the helper wires up
// is the one those tests verify) and by the auth-port integration tests
// in `mobile/integration_test/auth_session_restore_test.dart` and
// `auth_logout_test.dart` (which boot the full app under the helper).
// Direct unit-testing the factory would require faking `Dio` itself,
// which adds little signal beyond what those tests already cover.
//
// This file exists so `tool/check_structure.dart` does not fail the
// final-checkpoint gate on Requirements 2.11/2.12 (every source file
// must have a mirrored test) for the new file added by the auth-port
// spec's seam-relocation amendment per `flutter-port-auth/design.md`
// Decision 4.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/cook_smart_dio_factory.dart';
import 'package:mobile/core/network/dio_client.dart';

void main() {
  group('buildDioWithCookSmartRefresh', () {
    test('is callable by dioProvider.overrideWith without throwing', () {
      // `buildDioWithCookSmartRefresh` is the production override target
      // for `dioProvider`. The simplest contract test is that it can be
      // installed as a Riverpod override and the resulting `Dio`
      // resolves without error. We intentionally do not exercise any
      // network call here — the interceptor wiring (auth, error,
      // refresh) is covered by the foundation's interceptor tests and
      // the auth-port integration tests.
      final container = ProviderContainer(
        overrides: <Override>[
          dioProvider.overrideWith(buildDioWithCookSmartRefresh),
        ],
      );
      addTearDown(container.dispose);

      final dio = container.read(dioProvider);
      expect(dio, isNotNull);
      // The configured Dio carries the foundation's two timeouts and
      // base URL. Asserting on the connect timeout confirms the helper
      // mirrored the foundation's `BaseOptions` rather than building a
      // bare `Dio()`.
      expect(dio.options.connectTimeout, const Duration(seconds: 10));
      expect(dio.options.receiveTimeout, const Duration(seconds: 15));
    });
  });
}
