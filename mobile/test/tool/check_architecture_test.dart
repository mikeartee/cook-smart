// Subprocess unit tests for `tool/check_architecture.dart`.
//
// Strategy
// --------
//
// `tool/check_architecture.dart` is a standalone Dart program that walks
// `lib/` from the current working directory. Testing it means:
//
//   1. Spawning the script as a child process.
//   2. Pointing its working directory at a synthetic fixture under
//      `Directory.systemTemp` so the real `mobile/lib/` is never touched
//      by the test.
//   3. Asserting on (a) the exit code and (b) the script's diagnostic
//      output, including the offending file path so a developer reading a
//      CI failure can jump straight to the violating line.
//
// The script reports violations on stdout in the form
//
//     <relative_path>:<line>: <rule>: <message>
//
// followed by a summary line. We grep stdout for the offending file path
// AND the rule label (e.g. `dio_outside_network_layer`) so a future copy
// edit to the human-readable message does not silently break the test.
//
// Validates: Requirements 2.5, 3.6, 4.8, 8.4, 11.3, 11.7 (Task 10.5).

import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  // `flutter test` runs with `Directory.current == mobile/`, matching the
  // convention already used by `test/main_test.dart` and
  // `test/core/config/api_config_test.dart`. Resolve the script path once
  // up front so each test has a stable absolute path regardless of where
  // the temp fixture lives.
  final String scriptPath =
      File('tool/check_architecture.dart').absolute.path;

  late Directory fixtureRoot;

  setUp(() {
    fixtureRoot = Directory.systemTemp.createTempSync('check_arch_');
  });

  tearDown(() {
    if (fixtureRoot.existsSync()) {
      fixtureRoot.deleteSync(recursive: true);
    }
  });

  /// Writes [contents] to `<fixtureRoot>/<relativePath>`, creating any
  /// intermediate directories. `relativePath` uses forward slashes; this
  /// helper converts to the platform separator so the same fixture
  /// description compiles on Windows and POSIX.
  void writeFixtureFile(String relativePath, String contents) {
    final String absolute = '${fixtureRoot.path}'
        '${Platform.pathSeparator}'
        '${relativePath.replaceAll('/', Platform.pathSeparator)}';
    final File file = File(absolute);
    file.parent.createSync(recursive: true);
    file.writeAsStringSync(contents);
  }

  /// Runs `tool/check_architecture.dart` against [fixtureRoot] and returns
  /// the completed [ProcessResult].
  ///
  /// `runInShell: true` is required so the Windows `dart.bat` shim on PATH
  /// is found by `Process.runSync` — without it, the call resolves through
  /// `CreateProcess` directly, which only matches `.exe` and reports
  /// "system cannot find the file specified" on Windows hosts even when
  /// `dart` is present on PATH.
  ProcessResult runScript() {
    return Process.runSync(
      'dart',
      <String>[scriptPath],
      workingDirectory: fixtureRoot.path,
      runInShell: true,
    );
  }

  group('clean fixture', () {
    test(
      'a single dio import inside lib/core/network/ passes (exit 0)',
      () {
        // `package:dio` is permitted only under `lib/core/network/`
        // (Requirement 4.8). A file there with no other rule violations
        // is the simplest possible clean fixture.
        writeFixtureFile(
          'lib/core/network/dio_client.dart',
          "import 'package:dio/dio.dart';\n"
          '\n'
          'final dynamic placeholder = null;\n',
        );

        final ProcessResult result = runScript();

        expect(
          result.exitCode,
          0,
          reason: 'Clean fixture must pass.\n'
              'stdout: ${result.stdout}\n'
              'stderr: ${result.stderr}',
        );
        expect(
          result.stdout as String,
          contains('check_architecture: OK'),
          reason:
              'The script prints a single OK line on the success path so a '
              'CI log makes the result obvious.',
        );
      },
    );
  });

  group('violation fixtures', () {
    test(
      'dio import from lib/features/foo/presentation/ fails with '
      '`dio_outside_network_layer` and points at the offending file',
      () {
        // Requirement 4.8: `package:dio` may only be imported from
        // `lib/core/network/`. Importing it from a feature presentation
        // folder is the canonical violation.
        const String offendingPath =
            'lib/features/foo/presentation/screen.dart';
        writeFixtureFile(
          offendingPath,
          "import 'package:dio/dio.dart';\n"
          '\n'
          'final dynamic placeholder = null;\n',
        );

        final ProcessResult result = runScript();

        expect(
          result.exitCode,
          1,
          reason: 'Violation fixture must exit non-zero.\n'
              'stdout: ${result.stdout}\n'
              'stderr: ${result.stderr}',
        );
        final String stdout = result.stdout as String;
        expect(
          stdout,
          contains(offendingPath),
          reason:
              'The violation report must point at the offending file so a '
              'developer can jump to it from the CI log.',
        );
        expect(
          stdout,
          contains('dio_outside_network_layer'),
          reason:
              'The rule label is part of the contract — copy edits to the '
              'human message must not change it (Requirement 4.8).',
        );
        expect(
          stdout,
          contains('check_architecture: FAIL'),
          reason:
              'The summary line is how CI distinguishes a failed scan from '
              'an empty-stdout crash.',
        );
      },
    );
  });
}
