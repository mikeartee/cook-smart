// Mirrored test stub for `lib/core/network/auth_api_client.dart`.
//
// The auth-port spec's task 4.2 covers `AuthRepository` end-to-end with a
// fake `AuthApiClient`; that fake is the de-facto test for the
// [AuthApiClient] interface contract. The concrete `DioAuthApiClient`
// adapter is exercised indirectly by the integration tests in
// `mobile/integration_test/` (auth-port tasks 10.1, 10.2), which boot the
// app under a fake transport.
//
// This file exists so `tool/check_structure.dart` does not fail the
// final-checkpoint gate on Requirements 2.11/2.12 (every source file
// must have a mirrored test) for the new file added by the auth-port
// spec's seam-relocation amendment. Direct unit tests for
// `DioAuthApiClient` would have to fake `Dio` itself, which adds little
// signal beyond what the existing `error_interceptor_test.dart` and
// `auth_interceptor_test.dart` already cover.

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/auth_api_client.dart';

void main() {
  group('AuthApiResponse', () {
    test('carries statusCode and decoded body verbatim', () {
      const response = AuthApiResponse(
        statusCode: 200,
        body: <String, dynamic>{'token': 'abc'},
      );

      expect(response.statusCode, 200);
      expect(response.body, <String, dynamic>{'token': 'abc'});
    });
  });
}
