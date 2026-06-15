// Subprocess unit tests for `tool/check_secrets.dart`.
//
// Strategy
// --------
//
// `tool/check_secrets.dart` walks `lib/` from the current working
// directory and reports any literal that looks like a real credential.
// Each test in this file builds a synthetic `lib/` under
// `Directory.systemTemp`, invokes the script with that directory as the
// `workingDirectory`, and asserts on the exit code plus the script's
// diagnostic output.
//
// We pick the AWS access-key-ID pattern (`AKIA[0-9A-Z]{16}`) for the
// violation fixture because it is the most unambiguously secret-shaped
// pattern in the table — it has a fixed alphabet, a fixed length, a
// distinctive prefix, and is unlikely to overlap with placeholder hints.
//
// Validates: Requirement 17.4 (Task 10.5).

import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  final String scriptPath =
      File('tool/check_secrets.dart').absolute.path;

  late Directory fixtureRoot;

  setUp(() {
    fixtureRoot = Directory.systemTemp.createTempSync('check_secrets_');
  });

  tearDown(() {
    if (fixtureRoot.existsSync()) {
      fixtureRoot.deleteSync(recursive: true);
    }
  });

  void writeFixtureFile(String relativePath, String contents) {
    final String absolute = '${fixtureRoot.path}'
        '${Platform.pathSeparator}'
        '${relativePath.replaceAll('/', Platform.pathSeparator)}';
    final File file = File(absolute);
    file.parent.createSync(recursive: true);
    file.writeAsStringSync(contents);
  }

  ProcessResult runScript() {
    // `runInShell: true` is required so the Windows `dart.bat` shim on
    // PATH is found by `Process.runSync` — without it, the call resolves
    // through `CreateProcess` directly, which only matches `.exe`.
    return Process.runSync(
      'dart',
      <String>[scriptPath],
      workingDirectory: fixtureRoot.path,
      runInShell: true,
    );
  }

  group('clean fixture', () {
    test(
      'a lib/ tree with no secret-shaped literals passes (exit 0)',
      () {
        // A trivial Dart file with no credentials, no API keys, and no
        // assignments to `password = '...'`. Use a string short enough
        // (< 16 chars) that the suspicious-assignment pattern never
        // fires even on the variable name.
        writeFixtureFile(
          'lib/main.dart',
          'void main() {\n'
          "  const String greeting = 'hello';\n"
          '  print(greeting);\n'
          '}\n',
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
          contains('detections=0'),
          reason:
              'The OK summary line is the script\'s contract for "no '
              'secrets found"; rely on that substring rather than the '
              'full message.',
        );
      },
    );
  });

  group('violation fixtures', () {
    test(
      'an AWS access key ID literal fails and the report points at the '
      'offending file (Requirement 17.4)',
      () {
        // The AWS access-key-ID pattern requires `AKIA` followed by
        // exactly 16 uppercase alphanumerics. This literal is shaped
        // exactly like a real key (no placeholder hints, no embedded
        // `EXAMPLE`, no `<your...>` wrapper) so the scanner reports it
        // as a detection rather than skipping it.
        const String offendingPath = 'lib/secrets.dart';
        writeFixtureFile(
          offendingPath,
          "const String awsKey = 'AKIA1234567890ABCDEF';\n",
        );

        final ProcessResult result = runScript();

        expect(
          result.exitCode,
          1,
          reason: 'Detection failure must exit non-zero.\n'
              'stdout: ${result.stdout}\n'
              'stderr: ${result.stderr}',
        );
        final String stderr = result.stderr as String;
        // The script prints absolute paths on stderr; the relative
        // suffix (`secrets.dart`) is the stable, OS-independent piece
        // we can grep for.
        expect(
          stderr,
          contains('secrets.dart'),
          reason:
              'The violation report must point at the offending file '
              'so a developer can locate the leaked secret.',
        );
        expect(
          stderr,
          contains('aws-access-key-id'),
          reason:
              'The pattern label is part of the contract — it tells the '
              'developer which class of credential was matched.',
        );
        expect(
          stderr,
          contains('DETECTION_FAILURE'),
          reason:
              'The DETECTION_FAILURE marker distinguishes a real secret '
              'leak from a transient TOOL_FAILURE (Requirement 17.4 vs '
              '17.7) and must appear in the report.',
        );
      },
    );
  });
}
