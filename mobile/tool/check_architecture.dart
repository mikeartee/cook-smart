// Architectural enforcement for the Cook Smart Flutter mobile app.
//
// This is a standalone Dart program (no Flutter, no third-party packages) that
// scans every `.dart` source file under `mobile/lib/` and fails the build if
// any of the source-level architectural invariants from the
// `flutter-migration-architecture` spec is violated.
//
// Run from the `mobile/` directory:
//
//     dart run tool/check_architecture.dart
//
// Exits with status code 0 when every file passes every rule, and 1 as soon
// as a single violation is found in any file. Each violation is printed on
// its own line in the form
//
//     <relative_path>:<line>: <rule>: <message>
//
// so editors and CI log parsers can jump directly to the offending source.
//
// Validates: Properties 1, 2, 3, 4 and Requirements 2.5, 3.6, 4.8, 8.4, 11.3,
// 11.7 of the flutter-migration-architecture spec.
//
// Rules enforced (numbered to match the corresponding requirement):
//
//   R-2.5   Cross-feature imports: a file under `lib/features/<a>/` may not
//           import a file under `lib/features/<b>/` where `a != b`. Both
//           `package:mobile/features/<b>/...` and relative imports that
//           resolve into another feature folder are caught.
//   R-4.8   The `dio` package may only be imported from `lib/core/network/`.
//   R-11.3  The `flutter_secure_storage` package may only be imported from
//           `lib/core/storage/`.
//   R-11.7  No file under any feature `presentation/` folder, and no file
//           under `lib/shared/widgets/`, may construct a `Dio(` or
//           `GoRouter(` instance directly. Infrastructure singletons must be
//           consumed via Riverpod providers declared in the core layer.
//   R-3.6   No file under `lib/features/` may reference `FutureBuilder`.
//           Async UI must consume an `AsyncValue<T>`-based Riverpod provider.
//   R-8.4   No file outside `lib/core/theme/` may contain a raw `Color(`
//           literal. Colour tokens must be defined in `AppColours` so the
//           Theme_System stays the single source of truth.
//
// The script masks comments and string literals before applying token-level
// checks, so a `Color(` example inside a doc comment, or `'package:dio'` in a
// log message, will never trigger a false positive. Imports are detected on
// non-comment text only — the URI string itself is preserved for matching.

import 'dart:io';

/// Convenience record describing a single rule violation.
class _Violation {
  _Violation(this.relativePath, this.line, this.rule, this.message);

  final String relativePath;
  final int line;
  final String rule;
  final String message;

  @override
  String toString() => '$relativePath:$line: $rule: $message';
}

Future<void> main(List<String> args) async {
  final libDir = Directory('lib');
  if (!libDir.existsSync()) {
    stderr.writeln(
      'check_architecture: could not find a `lib/` directory in the current '
      'working directory. Run this script from `mobile/`, e.g. '
      '`dart run tool/check_architecture.dart`.',
    );
    exit(1);
  }

  final dartFiles = libDir
      .listSync(recursive: true, followLinks: false)
      .whereType<File>()
      .where((file) => file.path.endsWith('.dart'))
      .toList()
    ..sort((a, b) => a.path.compareTo(b.path));

  final violations = <_Violation>[];

  for (final file in dartFiles) {
    final relativePath = _toForwardSlashRelative(file.path);
    final source = file.readAsStringSync();
    final lines = source.split('\n');
    final maskedComments = _maskComments(source).split('\n');
    final maskedAll = _maskCommentsAndStrings(source).split('\n');

    violations
      ..addAll(_checkImports(relativePath, maskedComments))
      ..addAll(_checkConstructions(relativePath, maskedAll))
      ..addAll(_checkFutureBuilder(relativePath, maskedAll))
      ..addAll(_checkColorLiterals(relativePath, maskedAll));

    // Defensive: surface unreadable lines (extremely unlikely on Windows
    // CRLF-stripped files, but keeps the line counts sane).
    if (lines.length != maskedComments.length ||
        lines.length != maskedAll.length) {
      stderr.writeln(
        'check_architecture: internal error masking $relativePath '
        '(line counts diverged).',
      );
      exit(1);
    }
  }

  if (violations.isEmpty) {
    stdout.writeln(
      'check_architecture: OK (${dartFiles.length} file(s) scanned).',
    );
    exit(0);
  }

  for (final v in violations) {
    stdout.writeln(v.toString());
  }
  stdout.writeln(
    'check_architecture: FAIL — '
    '${violations.length} violation(s) across ${dartFiles.length} file(s).',
  );
  exit(1);
}

// ---------------------------------------------------------------------------
// Rule: cross-feature imports + package:dio + package:flutter_secure_storage.
// ---------------------------------------------------------------------------

/// Matches `import 'uri';` and `import "uri";` on a single masked line.
final RegExp _importRegExp = RegExp(
  r'''^\s*import\s+(['"])([^'"]+)\1''',
);

List<_Violation> _checkImports(
  String relativePath,
  List<String> maskedCommentLines,
) {
  final violations = <_Violation>[];
  final currentFeature = _featureOfPath(relativePath);

  for (var i = 0; i < maskedCommentLines.length; i++) {
    final line = maskedCommentLines[i];
    final match = _importRegExp.firstMatch(line);
    if (match == null) continue;
    final uri = match.group(2)!;
    final lineNo = i + 1;

    // Rule R-4.8: package:dio outside core/network/.
    if (uri == 'package:dio' || uri.startsWith('package:dio/')) {
      if (!_isUnder(relativePath, 'lib/core/network/')) {
        violations.add(_Violation(
          relativePath,
          lineNo,
          'dio_outside_network_layer',
          '`package:dio` may only be imported from `lib/core/network/` '
              '(Requirement 4.8, 11.7).',
        ));
      }
    }

    // Rule R-11.3: package:flutter_secure_storage outside core/storage/.
    if (uri == 'package:flutter_secure_storage' ||
        uri.startsWith('package:flutter_secure_storage/')) {
      if (!_isUnder(relativePath, 'lib/core/storage/')) {
        violations.add(_Violation(
          relativePath,
          lineNo,
          'secure_storage_outside_storage_layer',
          '`package:flutter_secure_storage` may only be imported from '
              '`lib/core/storage/` (Requirement 11.3).',
        ));
      }
    }

    // Rule R-2.5: cross-feature imports.
    if (currentFeature == null) continue;
    final targetFeature = _resolveImportFeature(uri, relativePath);
    if (targetFeature == null) continue;
    if (targetFeature != currentFeature) {
      violations.add(_Violation(
        relativePath,
        lineNo,
        'cross_feature_import',
        'feature `$currentFeature` may not import from feature '
            '`$targetFeature` (Requirement 2.5). Move shared code to '
            '`lib/shared/` or expose a contract via `lib/core/`.',
      ));
    }
  }

  return violations;
}

/// Returns the feature name (e.g. `auth`) for a file under
/// `lib/features/<feature>/...`, or `null` for any other location.
String? _featureOfPath(String relativePath) {
  const prefix = 'lib/features/';
  if (!relativePath.startsWith(prefix)) return null;
  final rest = relativePath.substring(prefix.length);
  final slash = rest.indexOf('/');
  if (slash <= 0) return null;
  return rest.substring(0, slash);
}

/// Resolves an import URI to a feature name when the import targets a file
/// under `lib/features/<feature>/...`. Returns `null` for `dart:` imports,
/// non-mobile package imports, and any path that does not land in a feature.
String? _resolveImportFeature(String uri, String currentRelativePath) {
  if (uri.startsWith('dart:')) return null;

  if (uri.startsWith('package:')) {
    const mobilePrefix = 'package:mobile/';
    if (!uri.startsWith(mobilePrefix)) return null;
    final libRelative = 'lib/${uri.substring(mobilePrefix.length)}';
    return _featureOfPath(libRelative);
  }

  // Relative import: resolve against the directory of the importing file.
  final lastSlash = currentRelativePath.lastIndexOf('/');
  if (lastSlash < 0) return null;
  final dir = currentRelativePath.substring(0, lastSlash);
  final resolved = _normalisePath('$dir/$uri');
  return _featureOfPath(resolved);
}

/// Collapses `.` and `..` segments in a forward-slash path. Empty segments
/// from leading slashes or doubled slashes are ignored.
String _normalisePath(String path) {
  final parts = path.split('/');
  final stack = <String>[];
  for (final part in parts) {
    if (part.isEmpty || part == '.') continue;
    if (part == '..') {
      if (stack.isNotEmpty) stack.removeLast();
      continue;
    }
    stack.add(part);
  }
  return stack.join('/');
}

// ---------------------------------------------------------------------------
// Rule: Dio(..) and GoRouter(..) construction outside the core layer.
// ---------------------------------------------------------------------------

final RegExp _dioConstructorRegExp = RegExp(r'(?<![A-Za-z0-9_])Dio\(');
final RegExp _goRouterConstructorRegExp =
    RegExp(r'(?<![A-Za-z0-9_])GoRouter\(');

List<_Violation> _checkConstructions(
  String relativePath,
  List<String> maskedAllLines,
) {
  final violations = <_Violation>[];
  final inFeaturePresentation = _isInFeaturePresentation(relativePath);
  final inSharedWidgets = _isUnder(relativePath, 'lib/shared/widgets/');
  if (!inFeaturePresentation && !inSharedWidgets) {
    return violations;
  }

  final location = inFeaturePresentation
      ? 'a feature `presentation/` folder'
      : '`lib/shared/widgets/`';

  for (var i = 0; i < maskedAllLines.length; i++) {
    final line = maskedAllLines[i];
    final lineNo = i + 1;
    if (_dioConstructorRegExp.hasMatch(line)) {
      violations.add(_Violation(
        relativePath,
        lineNo,
        'dio_construction_in_widget_tree',
        '`Dio(` must not be constructed in $location. Consume the singleton '
            'via `dioProvider` from the Network_Layer (Requirement 11.7).',
      ));
    }
    if (_goRouterConstructorRegExp.hasMatch(line)) {
      violations.add(_Violation(
        relativePath,
        lineNo,
        'go_router_construction_in_widget_tree',
        '`GoRouter(` must not be constructed in $location. Consume the '
            'singleton via `routerProvider` from the Router '
            '(Requirement 11.7).',
      ));
    }
  }

  return violations;
}

/// True for any file whose path is `lib/features/<feature>/presentation/...`.
bool _isInFeaturePresentation(String relativePath) {
  const prefix = 'lib/features/';
  if (!relativePath.startsWith(prefix)) return false;
  final rest = relativePath.substring(prefix.length);
  final firstSlash = rest.indexOf('/');
  if (firstSlash <= 0) return false;
  final afterFeature = rest.substring(firstSlash + 1);
  return afterFeature.startsWith('presentation/');
}

// ---------------------------------------------------------------------------
// Rule: FutureBuilder may not appear under lib/features/.
// ---------------------------------------------------------------------------

// Kept raw for visual consistency with the other identifier-boundary
// regexes in this file (Dio\(, Color\(, etc.) which must be raw to avoid
// double-escaping the backslash before the literal `(`.
final RegExp _futureBuilderRegExp = RegExp(
  // ignore: unnecessary_raw_strings
  r'(?<![A-Za-z0-9_])FutureBuilder(?![A-Za-z0-9_])',
);

List<_Violation> _checkFutureBuilder(
  String relativePath,
  List<String> maskedAllLines,
) {
  if (!_isUnder(relativePath, 'lib/features/')) return const [];

  final violations = <_Violation>[];
  for (var i = 0; i < maskedAllLines.length; i++) {
    final line = maskedAllLines[i];
    if (_futureBuilderRegExp.hasMatch(line)) {
      violations.add(_Violation(
        relativePath,
        i + 1,
        'future_builder_in_feature',
        '`FutureBuilder` is not permitted under `lib/features/`. Render async '
            'state via an `AsyncValue<T>`-based Riverpod provider '
            '(Requirement 3.6).',
      ));
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Rule: Color(...) literals only in lib/core/theme/.
// ---------------------------------------------------------------------------

final RegExp _colorLiteralRegExp = RegExp(r'(?<![A-Za-z0-9_])Color\(');

List<_Violation> _checkColorLiterals(
  String relativePath,
  List<String> maskedAllLines,
) {
  if (_isUnder(relativePath, 'lib/core/theme/')) return const [];

  final violations = <_Violation>[];
  for (var i = 0; i < maskedAllLines.length; i++) {
    final line = maskedAllLines[i];
    if (_colorLiteralRegExp.hasMatch(line)) {
      violations.add(_Violation(
        relativePath,
        i + 1,
        'color_literal_outside_theme',
        '`Color(` literals are only permitted in `lib/core/theme/`. Reference '
            'a token from `AppColours` instead (Requirement 8.4).',
      ));
    }
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Path utilities.
// ---------------------------------------------------------------------------

/// Converts a (possibly Windows-style) path emitted by `dart:io` into a
/// forward-slash path relative to the current working directory.
String _toForwardSlashRelative(String path) {
  final normalised = path.replaceAll(r'\', '/');
  // `Directory('lib').listSync` returns paths prefixed with `lib/`, but if the
  // caller ever invokes us from elsewhere, strip the leading `./` for clean
  // diagnostics.
  if (normalised.startsWith('./')) {
    return normalised.substring(2);
  }
  return normalised;
}

/// True when `relativePath` lives under `prefix`. `prefix` must use forward
/// slashes and end with a `/` so the check is folder-bounded (i.e.
/// `lib/core/themes/` is *not* matched by `lib/core/theme/`).
bool _isUnder(String relativePath, String prefix) {
  return relativePath.startsWith(prefix);
}

// ---------------------------------------------------------------------------
// Source masking.
//
// Both helpers preserve the exact line count and column count of the input
// (newlines are kept, every other character becomes a space) so that any
// regex match in the masked source maps directly onto a line number in the
// original file.
// ---------------------------------------------------------------------------

/// Replaces the contents of every `//...` and `/* ... */` comment with
/// spaces, keeping string literals intact so that import URIs remain visible.
String _maskComments(String source) {
  return _maskSource(source, maskStrings: false);
}

/// Replaces the contents of every comment AND every string literal with
/// spaces. Use this for token-level checks (`Dio(`, `Color(`, etc.) so that a
/// docstring or a log message containing the same text never triggers a
/// false positive.
String _maskCommentsAndStrings(String source) {
  return _maskSource(source, maskStrings: true);
}

String _maskSource(String source, {required bool maskStrings}) {
  final buf = StringBuffer();
  final n = source.length;
  var i = 0;

  while (i < n) {
    final c = source[i];
    final next = i + 1 < n ? source[i + 1] : '';

    // Line comment: `// ...` until end of line.
    if (c == '/' && next == '/') {
      while (i < n && source[i] != '\n') {
        buf.write(' ');
        i++;
      }
      continue;
    }

    // Block comment: `/* ... */`. Nests are not part of Dart, so a single
    // pass to the next `*/` is correct.
    if (c == '/' && next == '*') {
      buf
        ..write(' ')
        ..write(' ');
      i += 2;
      while (i < n) {
        if (source[i] == '*' && i + 1 < n && source[i + 1] == '/') {
          buf
            ..write(' ')
            ..write(' ');
          i += 2;
          break;
        }
        buf.write(source[i] == '\n' ? '\n' : ' ');
        i++;
      }
      continue;
    }

    // Raw string prefix `r'...'` or `r"..."`. Treat the same as a regular
    // string for masking — the content is still a literal we want to hide.
    if (c == 'r' &&
        (next == "'" || next == '"') &&
        (i == 0 || !_isIdentifierChar(source[i - 1]))) {
      buf.write(' '); // mask the leading `r`
      i++;
      i = _consumeString(source, i, buf, maskStrings: maskStrings);
      continue;
    }

    if (c == "'" || c == '"') {
      i = _consumeString(source, i, buf, maskStrings: maskStrings);
      continue;
    }

    buf.write(c);
    i++;
  }
  return buf.toString();
}

bool _isIdentifierChar(String ch) {
  if (ch.isEmpty) return false;
  final code = ch.codeUnitAt(0);
  // a-z
  if (code >= 0x61 && code <= 0x7A) return true;
  // A-Z
  if (code >= 0x41 && code <= 0x5A) return true;
  // 0-9
  if (code >= 0x30 && code <= 0x39) return true;
  // _ or $
  return ch == '_' || ch == r'$';
}

/// Consumes a string literal beginning at `start` (which must point at the
/// opening quote). When [maskStrings] is true, replaces the body with spaces;
/// when false, copies the body verbatim. Returns the index *after* the
/// closing quote (or end-of-source when the string is unterminated).
int _consumeString(
  String source,
  int start,
  StringBuffer buf, {
  required bool maskStrings,
}) {
  final n = source.length;
  final quote = source[start];
  final isTriple = start + 2 < n &&
      source[start + 1] == quote &&
      source[start + 2] == quote;

  // Always preserve the quotes themselves so an `import 'uri'` line keeps
  // its delimiters even when the body is masked.
  if (isTriple) {
    buf
      ..write(quote)
      ..write(quote)
      ..write(quote);
    var i = start + 3;
    while (i < n) {
      if (i + 2 < n &&
          source[i] == quote &&
          source[i + 1] == quote &&
          source[i + 2] == quote) {
        buf
          ..write(quote)
          ..write(quote)
          ..write(quote);
        return i + 3;
      }
      if (source[i] == '\n') {
        buf.write('\n');
      } else {
        buf.write(maskStrings ? ' ' : source[i]);
      }
      i++;
    }
    return n;
  }

  buf.write(quote);
  var i = start + 1;
  while (i < n) {
    final ch = source[i];
    if (ch == r'\' && i + 1 < n) {
      // Escape sequence — drop both characters from any token check, but
      // preserve the count when keeping string contents (e.g. for imports
      // there are never escapes that change the URI semantics we look at).
      if (maskStrings) {
        buf
          ..write(' ')
          ..write(' ');
      } else {
        buf
          ..write(ch)
          ..write(source[i + 1]);
      }
      i += 2;
      continue;
    }
    if (ch == quote) {
      buf.write(quote);
      return i + 1;
    }
    if (ch == '\n') {
      // Unterminated single-line string — bail out, but keep the newline
      // intact so subsequent line numbers stay aligned.
      buf.write('\n');
      return i + 1;
    }
    buf.write(maskStrings ? ' ' : ch);
    i++;
  }
  return n;
}
