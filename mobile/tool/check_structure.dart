// Folder and naming invariant checker for the cook-smart Flutter app.
//
// Enforces the structural rules from the flutter-migration-architecture spec
// (Requirements 2.1, 2.4, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, and 3.10).
//
// Run from the `mobile/` directory:
//
//   dart run tool/check_structure.dart
//
// Exits 0 when no violations are reported, 1 when any violation is found.
//
// This is a standalone script — no package imports, no build_runner, no
// platform-specific dependencies. It walks `mobile/lib/` and `mobile/test/`
// using `dart:io` and reports every violation it finds in a single pass so
// the developer fixes them as a batch rather than one at a time.

import 'dart:io';

const String _libDirName = 'lib';
const String _testDirName = 'test';

// Only these files may live directly under `mobile/lib/` (Requirement 2.7).
const Set<String> _allowedTopLevelLibFiles = <String>{
  'main.dart',
  'app.dart',
};

// Only these subfolders may live directly under `mobile/lib/` (Requirement
// 2.7). Everything else either belongs in one of these or violates the rule.
const Set<String> _allowedTopLevelLibDirs = <String>{
  'core',
  'features',
  'shared',
};

// Forbidden top-level folder names that betray a layer-based structure
// (Requirement 2.6). These are reported with a more specific error than
// "unexpected top-level folder" so the violation is unambiguous.
const Set<String> _forbiddenTopLevelLibDirs = <String>{
  'data',
  'domain',
  'ui',
  'screens',
  'widgets',
  'models',
  'services',
};

// A feature folder must contain exactly these three subfolders, no more, no
// less (Requirement 2.4).
const Set<String> _requiredFeatureSubdirs = <String>{
  'data',
  'domain',
  'presentation',
};

// Generated Dart files that are not authored by hand. They are skipped from
// the file-name regex check, the provider-name check, and the test-mirror
// check because they are produced by code generators (build_runner,
// riverpod_generator, retrofit_generator, mocktail) and follow generator
// conventions that include extra dots in the file name.
final RegExp _generatedFileSuffix =
    RegExp(r'\.(g|freezed|gen|mocks|config|chopper|pb|pbenum|pbjson|pbserver)\.dart$');

// File-name regex from Requirement 2.8.
final RegExp _sourceFileNamePattern = RegExp(r'^[a-z][a-z0-9_]*\.dart$');

// Feature folder name regex from Requirement 2.1.
final RegExp _featureNamePattern = RegExp(r'^[a-z][a-z0-9_]{1,38}[a-z0-9]$');

// Riverpod provider variable name regex from Requirements 2.10 and 3.10.
final RegExp _providerVarPattern = RegExp(r'^[a-z][A-Za-z0-9]*Provider$');

// Riverpod provider declaration regex. Captures the variable name. The
// trailing `\b` requires a transition into a non-word character so that
// `FutureProvider` is matched but `FutureProviderRef` is not. A leading
// `\b` on `final` does the same on the front. Whitespace between tokens
// includes newlines, so a declaration whose right-hand side begins on the
// same line as `final <name> =` is matched even if the rest of the
// expression spans multiple lines.
final RegExp _providerDeclPattern = RegExp(
  r'\bfinal\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*'
  r'(?:Provider|FutureProvider|StreamProvider|StateProvider|'
  r'StateNotifierProvider|ChangeNotifierProvider|NotifierProvider|'
  r'AsyncNotifierProvider|StreamNotifierProvider)'
  r'\b',
  multiLine: true,
);

void main(List<String> args) {
  final mobileRoot = _resolveMobileRoot();
  final libDir = Directory(_join(mobileRoot.path, _libDirName));
  final testDir = Directory(_join(mobileRoot.path, _testDirName));

  if (!libDir.existsSync()) {
    stderr.writeln(
      'check_structure: lib/ not found at ${libDir.path}. '
      'Run this script from the mobile/ directory.',
    );
    exit(1);
  }

  final violations = <String>[];

  _checkTopLevelLib(libDir, violations);
  _checkFeatureFolders(libDir, violations);
  _checkSourceFileNames(libDir, mobileRoot, violations);
  _checkProviderNames(libDir, mobileRoot, violations);
  _checkMirroredTests(libDir, testDir, mobileRoot, violations);

  if (violations.isEmpty) {
    stdout.writeln('check_structure: OK (no violations)');
    exit(0);
  }

  stderr.writeln('check_structure: ${violations.length} violation(s) found:');
  for (final v in violations) {
    stderr.writeln('  - $v');
  }
  exit(1);
}

// Resolves the `mobile/` project root by walking up from the current working
// directory until a folder containing both `pubspec.yaml` and `lib/` is
// found. Capped at five levels so a misconfigured invocation fails fast.
Directory _resolveMobileRoot() {
  Directory current = Directory.current;
  for (int i = 0; i < 5; i++) {
    final hasPubspec = File(_join(current.path, 'pubspec.yaml')).existsSync();
    final hasLib = Directory(_join(current.path, _libDirName)).existsSync();
    if (hasPubspec && hasLib) {
      return current;
    }
    final parent = current.parent;
    if (parent.path == current.path) break;
    current = parent;
  }
  return Directory.current;
}

void _checkTopLevelLib(Directory libDir, List<String> violations) {
  for (final entity in libDir.listSync()) {
    final name = _baseName(entity.path);
    if (entity is File) {
      if (!_allowedTopLevelLibFiles.contains(name)) {
        violations.add(
          'lib/$name: only main.dart and app.dart are permitted directly '
          'under lib/ (Requirement 2.7).',
        );
        continue;
      }
      if (!_sourceFileNamePattern.hasMatch(name) || name.length > 64) {
        violations.add(
          'lib/$name: Dart source file name does not match '
          r'^[a-z][a-z0-9_]*\.dart$ within 1 to 64 characters '
          '(Requirement 2.8).',
        );
      }
    } else if (entity is Directory) {
      if (_forbiddenTopLevelLibDirs.contains(name)) {
        violations.add(
          'lib/$name/: forbidden top-level folder under lib/ '
          '(Requirement 2.6).',
        );
      } else if (!_allowedTopLevelLibDirs.contains(name)) {
        violations.add(
          'lib/$name/: unexpected top-level folder under lib/. '
          'Permitted: core/, features/, shared/ (Requirement 2.7).',
        );
      }
    }
  }
}

void _checkFeatureFolders(Directory libDir, List<String> violations) {
  final featuresDir = Directory(_join(libDir.path, 'features'));
  if (!featuresDir.existsSync()) {
    // No features yet is allowed during the foundation phase; per-feature
    // specs land features later. Nothing to check.
    return;
  }
  for (final entity in featuresDir.listSync()) {
    if (entity is! Directory) {
      violations.add(
        'lib/features/${_baseName(entity.path)}: only feature directories '
        'are permitted directly under lib/features/ (Requirement 2.1).',
      );
      continue;
    }
    final featureName = _baseName(entity.path);
    if (!_featureNamePattern.hasMatch(featureName)) {
      violations.add(
        'lib/features/$featureName/: feature folder name does not match '
        r'^[a-z][a-z0-9_]{1,38}[a-z0-9]$ (Requirement 2.1).',
      );
    }
    final children = entity
        .listSync()
        .map((e) => MapEntry<String, FileSystemEntity>(_baseName(e.path), e))
        .toList();

    final dirNames = children
        .where((e) => e.value is Directory)
        .map((e) => e.key)
        .toSet();

    final missing = _requiredFeatureSubdirs.difference(dirNames);
    final extra = dirNames.difference(_requiredFeatureSubdirs);
    if (missing.isNotEmpty) {
      violations.add(
        'lib/features/$featureName/: missing required subfolder(s): '
        "${missing.join(', ')} (Requirement 2.4).",
      );
    }
    if (extra.isNotEmpty) {
      violations.add(
        'lib/features/$featureName/: contains forbidden subfolder(s): '
        "${extra.join(', ')}. Only data/, domain/, presentation/ are "
        'permitted (Requirement 2.4).',
      );
    }
    for (final child in children) {
      if (child.value is File) {
        violations.add(
          'lib/features/$featureName/${child.key}: feature folder must not '
          'contain Dart source files outside data/, domain/, presentation/ '
          '(Requirement 2.4).',
        );
      }
    }
  }
}

void _checkSourceFileNames(
  Directory libDir,
  Directory mobileRoot,
  List<String> violations,
) {
  for (final file in _dartFilesUnder(libDir)) {
    final name = _baseName(file.path);
    if (_isGenerated(name)) continue;
    if (!_sourceFileNamePattern.hasMatch(name) || name.length > 64) {
      violations.add(
        '${_relativeTo(mobileRoot, file.path)}: Dart source file name does '
        r'not match ^[a-z][a-z0-9_]*\.dart$ within 1 to 64 characters '
        '(Requirement 2.8).',
      );
    }
  }
}

void _checkProviderNames(
  Directory libDir,
  Directory mobileRoot,
  List<String> violations,
) {
  for (final file in _dartFilesUnder(libDir)) {
    final name = _baseName(file.path);
    if (_isGenerated(name)) continue;
    final String contents;
    try {
      contents = file.readAsStringSync();
    } on FileSystemException {
      // Unreadable files are surfaced once and skipped rather than blocking
      // the rest of the run.
      violations.add(
        '${_relativeTo(mobileRoot, file.path)}: could not read file for '
        'provider-name check.',
      );
      continue;
    }
    for (final match in _providerDeclPattern.allMatches(contents)) {
      final variable = match.group(1)!;
      if (!_providerVarPattern.hasMatch(variable)) {
        violations.add(
          '${_relativeTo(mobileRoot, file.path)}: Riverpod provider '
          'variable "$variable" does not match '
          r'^[a-z][A-Za-z0-9]*Provider$ (Requirements 2.10, 3.10).',
        );
      }
    }
  }
}

void _checkMirroredTests(
  Directory libDir,
  Directory testDir,
  Directory mobileRoot,
  List<String> violations,
) {
  if (!testDir.existsSync()) {
    violations.add(
      'test/: missing test root directory. Every source file under lib/ '
      'requires a mirrored _test.dart under test/ (Requirements 2.11, 2.12).',
    );
    return;
  }
  for (final file in _dartFilesUnder(libDir)) {
    final name = _baseName(file.path);
    if (_isGenerated(name)) continue;
    // main.dart and app.dart sit at the lib/ root; their mirrored tests sit
    // at the test/ root.
    final relativeFromLib = _relativeTo(libDir, file.path);
    final basenameWithoutExt =
        name.substring(0, name.length - '.dart'.length);
    final mirroredDir = relativeFromLib.contains(_pathSep)
        ? relativeFromLib.substring(
            0, relativeFromLib.lastIndexOf(_pathSep))
        : '';
    final mirroredTestPath = mirroredDir.isEmpty
        ? _join(testDir.path, '${basenameWithoutExt}_test.dart')
        : _join(
            testDir.path,
            mirroredDir,
            '${basenameWithoutExt}_test.dart',
          );
    if (!File(mirroredTestPath).existsSync()) {
      violations.add(
        '${_relativeTo(mobileRoot, file.path)}: missing mirrored test at '
        '${_relativeTo(mobileRoot, mirroredTestPath)} '
        '(Requirements 2.11, 2.12).',
      );
    }
  }
}

// ---------------------------------------------------------------------------
// File system helpers
// ---------------------------------------------------------------------------

Iterable<File> _dartFilesUnder(Directory root) sync* {
  if (!root.existsSync()) return;
  for (final entity in root.listSync(recursive: true, followLinks: false)) {
    if (entity is File && entity.path.toLowerCase().endsWith('.dart')) {
      yield entity;
    }
  }
}

bool _isGenerated(String fileName) => _generatedFileSuffix.hasMatch(fileName);

String get _pathSep => Platform.pathSeparator;

String _baseName(String path) {
  final lastSep = path.lastIndexOf(RegExp(r'[\\/]'));
  return lastSep < 0 ? path : path.substring(lastSep + 1);
}

String _join(String a, [String? b, String? c]) {
  final parts = <String>[a, if (b != null) b, if (c != null) c];
  return parts.join(_pathSep);
}

String _relativeTo(Directory root, String path) {
  final normalisedRoot = root.path.endsWith(_pathSep)
      ? root.path.substring(0, root.path.length - 1)
      : root.path;
  if (path.startsWith(normalisedRoot + _pathSep)) {
    return path.substring(normalisedRoot.length + 1);
  }
  return path;
}
