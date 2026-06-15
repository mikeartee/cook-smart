// Subprocess unit tests for `tool/check_structure.dart`.
//
// Strategy
// --------
//
// `tool/check_structure.dart` walks `lib/` and `test/` from the current
// working directory and reports folder, naming, and mirrored-test
// violations. Each test in this file builds a synthetic project layout
// under `Directory.systemTemp`, invokes the script with that directory
// as `workingDirectory`, and asserts on the exit code plus the script's
// diagnostic output (which goes to stderr).
//
// The clean fixture must satisfy *every* invariant the script enforces —
// permitted top-level folders only, valid feature subfolders, valid file
// names, and a mirrored `_test.dart` for every `lib/*.dart` file — so
// that the test's positive assertion ("a clean fixture passes") is not
// quietly carrying an unrelated failure.
//
// Validates: Requirements 2.5, 2.6, 2.8 (Task 10.5).

import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  final String scriptPath =
      File('tool/check_structure.dart').absolute.path;

  late Directory fixtureRoot;

  setUp(() {
    fixtureRoot = Directory.systemTemp.createTempSync('check_struct_');
    // The script walks up to five parents looking for a folder containing
    // both `pubspec.yaml` and `lib/`. Drop a stub pubspec at the fixture
    // root so the resolver pins onto the fixture rather than the real
    // `mobile/` project the test happens to be running under.
    File('${fixtureRoot.path}${Platform.pathSeparator}pubspec.yaml')
        .writeAsStringSync('name: fixture\n');
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
      'minimal valid project layout passes (exit 0)',
      () {
        // Only `main.dart` and `app.dart` may live directly under `lib/`
        // (Requirement 2.7). Each gets a mirrored `_test.dart` under
        // `test/` (Requirements 2.11, 2.12) so the structural scan finds
        // nothing to complain about.
        writeFixtureFile('lib/main.dart', 'void main() {}\n');
        writeFixtureFile('lib/app.dart', 'class App {}\n');
        writeFixtureFile('test/main_test.dart', 'void main() {}\n');
        writeFixtureFile('test/app_test.dart', 'void main() {}\n');

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
          contains('check_structure: OK'),
          reason:
              'The script prints a single OK line on the success path so a '
              'CI log makes the result obvious.',
        );
      },
    );
  });

  group('violation fixtures', () {
    test(
      'a top-level lib/services/ folder fails and the report points at '
      'lib/services/ (Requirement 2.6)',
      () {
        // Requirement 2.6 forbids layer-based top-level folders under
        // `lib/`, including `services/`. The fixture is otherwise valid:
        // `main.dart` and `app.dart` are present with mirrored tests, so
        // the only reported violation is the forbidden folder.
        writeFixtureFile('lib/main.dart', 'void main() {}\n');
        writeFixtureFile('lib/app.dart', 'class App {}\n');
        writeFixtureFile(
          'lib/services/api_service.dart',
          'class ApiService {}\n',
        );
        writeFixtureFile('test/main_test.dart', 'void main() {}\n');
        writeFixtureFile('test/app_test.dart', 'void main() {}\n');
        writeFixtureFile(
          'test/services/api_service_test.dart',
          'void main() {}\n',
        );

        final ProcessResult result = runScript();

        expect(
          result.exitCode,
          1,
          reason: 'Violation fixture must exit non-zero.\n'
              'stdout: ${result.stdout}\n'
              'stderr: ${result.stderr}',
        );
        final String stderr = result.stderr as String;
        expect(
          stderr,
          contains('lib/services'),
          reason:
              'The violation report must point at the offending top-level '
              'folder so a developer can locate and remove it.',
        );
        expect(
          stderr,
          contains('forbidden top-level folder'),
          reason:
              'The diagnostic must explain *why* the folder is rejected '
              '(Requirement 2.6) rather than relying on path alone.',
        );
      },
    );
  });
}
