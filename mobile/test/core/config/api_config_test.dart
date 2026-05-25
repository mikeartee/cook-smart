// Mirrored unit tests for `lib/core/config/api_config.dart`.
//
// The base URL is selected at compile time via
// `bool.fromEnvironment('dart.vm.product')`, so a single test binary can only
// observe one branch of the switch. `flutter test` compiles in non-product
// mode, so `ApiConfig.baseUrl` is always evaluated against the dev branch
// here. The release branch is verified by reading the source file and
// asserting the literal value of `_prodBaseUrl` directly — this is sufficient
// because the source-level guard `_ReleaseUrlGuard` already fails compilation
// if the literal is altered, so a textual check fully covers Requirement 12.2.
//
// Validates: Requirements 12.2, 12.3.

import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/config/api_config.dart';

void main() {
  group('ApiConfig.baseUrl (Requirement 12.3 — non-release mode)', () {
    test('returns exactly http://192.168.12.196:3000 with no trailing slash',
        () {
      // `flutter test` runs with `dart.vm.product == false`, so `baseUrl`
      // must resolve to `_devBaseUrl` exactly as declared in the source.
      expect(ApiConfig.baseUrl, equals('http://192.168.12.196:3000'));
      expect(ApiConfig.baseUrl.endsWith('/'), isFalse);
    });
  });

  group('ApiConfig source literal (Requirement 12.2 — release mode)', () {
    test(
      'declares _prodBaseUrl as exactly https://api.cooksmartapp.com',
      () {
        // `flutter test` always compiles in non-product mode, so the release
        // branch of `baseUrl` is dead-stripped from the test binary. We
        // therefore verify the release URL by inspecting the source file
        // directly, which is the same literal the compile-time switch
        // selects when `dart.vm.product == true`.
        final File source = File('lib/core/config/api_config.dart');
        expect(
          source.existsSync(),
          isTrue,
          reason:
              'Expected api_config.dart to be readable from the package root '
              '(flutter test runs with cwd == mobile/).',
        );

        final String contents = source.readAsStringSync();

        // Match the exact assignment, anchored on the closing single quote
        // and semicolon. This proves the literal has no trailing slash and
        // no path suffix appended to `.com`.
        final RegExp prodAssignment = RegExp(
          r"_prodBaseUrl\s*=\s*'https://api\.cooksmartapp\.com';",
        );
        final Iterable<Match> matches = prodAssignment.allMatches(contents);

        expect(
          matches.length,
          equals(1),
          reason:
              'Exactly one assignment of _prodBaseUrl to '
              "'https://api.cooksmartapp.com' (no trailing slash, no path "
              'suffix) is required by Requirement 12.2.',
        );
      },
    );
  });
}
