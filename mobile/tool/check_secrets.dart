// ignore_for_file: avoid_print
//
// check_secrets.dart
//
// Standalone secret-literal scanner for the Flutter Mobile_App.
//
// Scans every Dart source file under `mobile/lib/` for patterns that look
// like hardcoded API keys, signing passwords, or other credential literals.
//
// ---------------------------------------------------------------------------
// Two failure modes — kept distinct on purpose
// ---------------------------------------------------------------------------
//
// DETECTION_FAILURE  (Requirement 17.4)
//   A pattern matched real-looking secret material in a source file.
//   The build MUST stop. Exit code 1. Reported to stdout/stderr with the
//   offending file, line number, pattern label, and a redacted preview.
//
// TOOL_FAILURE       (Requirement 17.7)
//   The scanner itself could not complete a check — e.g. a file was
//   unreadable, a regex blew up on a particular input, an I/O error was
//   transient. The build MUST be allowed to proceed (exit 0 in non-strict
//   mode), and a structured log line is emitted to stderr containing the
//   offending pattern label, the file that was being scanned, and an
//   ISO-8601 timestamp so the failure can be triaged later.
//
// The two modes are deliberately not collapsed: a tooling glitch must never
// be misreported as "the codebase is clean" *and* must never block a build
// that is otherwise green. Use `--strict` only when intentionally tightening
// CI to catch tool-level regressions.
//
// ---------------------------------------------------------------------------
// Known false-negative pattern categories (Requirement 17.8)
// ---------------------------------------------------------------------------
//
// These are categories where this scanner is known NOT to catch the secret.
// A release build must add an additional verification pass (a stricter
// scanner, or a documented manual review) covering them before producing a
// distributable artifact. The scanner enforces this by requiring a
// `--reviewed-by=<reviewer>` argument when run with `--release`.
//
//   1. Custom-format vendor keys whose prefix is not in our pattern table
//      (e.g. `cs_live_...`, `pk_live_...`, `sk_test_...`, `xoxb-...`).
//   2. Secrets split across string concatenation or interpolation
//      (`'AKIA' + suffix`, `'AKIA${tail}...'`).
//   3. Secrets stored encoded — base64-of-base64, hex-encoded, ROT-N, etc.
//   4. Secrets assembled at runtime from individual character codes or list
//      literals.
//   5. Secrets embedded in raw multi-line string literals (`r'''...'''`)
//      where line-by-line scanning may not match across line breaks.
//   6. Tokens shorter than the minimum length thresholds used here, which
//      this scanner deliberately ignores to suppress noise from short
//      identifiers and placeholders.
//
// ---------------------------------------------------------------------------
// Usage
// ---------------------------------------------------------------------------
//
//   dart run tool/check_secrets.dart
//   dart run tool/check_secrets.dart --release --reviewed-by=alice
//   dart run tool/check_secrets.dart --strict
//
// Exit codes:
//   0  scanner completed and either (a) found nothing or (b) only encountered
//      tool failures in non-strict mode
//   1  at least one detection failure, or release mode without --reviewed-by,
//      or a tool failure while running in --strict mode
//
// The script intentionally uses only `dart:io` — no third-party packages —
// so it can run before `flutter pub get` if required.

import 'dart:io';

const String _scriptName = 'check_secrets.dart';

/// Patterns that match well-formed secret literals.
///
/// Each entry has a stable label, a compiled regex, and a short rationale
/// shown in the failure report. Keep this list narrow: the scanner is the
/// first line of defence, not the last.
const List<_SecretPattern> _patterns = <_SecretPattern>[
  _SecretPattern(
    label: 'aws-access-key-id',
    description: 'AWS access key ID (AKIA + 16 uppercase alphanumerics)',
    pattern: r'\bAKIA[0-9A-Z]{16}\b',
  ),
  _SecretPattern(
    label: 'google-api-key',
    description: 'Google API key (AIza + 35 url-safe characters)',
    pattern: r'\bAIza[0-9A-Za-z_\-]{35}\b',
  ),
  _SecretPattern(
    label: 'jwt-literal',
    description: 'JSON Web Token literal (three base64url segments)',
    pattern:
        r'\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b',
  ),
  _SecretPattern(
    label: 'private-key-block',
    description: 'PEM-encoded private key block',
    pattern: '-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----',
  ),
  _SecretPattern(
    label: 'suspicious-assignment',
    description:
        'Assignment to api_key / password / secret / token with a long literal',
    // Matches things like:   apiKey = 'abcdef0123456789abcdef'
    //                        password: "supersecretvalue123"
    // Length floor of 16 keeps short identifiers and placeholder strings out.
    pattern:
        // ignore: unnecessary_raw_strings
        r'''(?:api[_\-]?key|password|secret|auth[_\-]?token|access[_\-]?token|client[_\-]?secret)\s*[:=]\s*(?:r)?['"]([A-Za-z0-9_./+\-=]{16,})['"]''',
    caseSensitive: false,
  ),
];

/// Substrings that, when present in a `suspicious-assignment` match, mark it
/// as a placeholder rather than a real secret. Keep this list short and
/// obvious — anything fancier belongs in a stricter, follow-up scanner.
const List<String> _placeholderHints = <String>[
  'YOUR_',
  'your-',
  'your_',
  '<your',
  'PLACEHOLDER',
  'placeholder',
  'EXAMPLE',
  'example',
  'CHANGEME',
  'change_me',
  'change-me',
  'TODO',
  'todo',
  'FIXME',
  'fixme',
  'XXXXXXXX',
  'xxxxxxxx',
];

class _SecretPattern {
  const _SecretPattern({
    required this.label,
    required this.description,
    required this.pattern,
    this.caseSensitive = true,
  });

  final String label;
  final String description;
  final String pattern;
  final bool caseSensitive;
}

class _Detection {
  _Detection({
    required this.file,
    required this.line,
    required this.label,
    required this.preview,
  });

  final String file;
  final int line;
  final String label;
  final String preview;
}

class _ToolFailure {
  _ToolFailure({
    required this.file,
    required this.label,
    required this.timestamp,
    required this.reason,
  });

  final String file;
  final String label;
  final String timestamp;
  final String reason;
}

Future<void> main(List<String> args) async {
  exitCode = await _run(args);
}

Future<int> _run(List<String> args) async {
  final releaseMode = args.contains('--release');
  final strictMode = args.contains('--strict');
  final reviewer = _argValue(args, '--reviewed-by');

  final libDir = _resolveLibDirectory();
  if (!libDir.existsSync()) {
    stderr.writeln(
      '[$_scriptName] lib directory not found at ${libDir.path}. '
      'Run from the mobile/ project root or its tool/ subfolder.',
    );
    // Treat a missing lib directory as a tool failure: nothing to scan,
    // do not block the build, but make the situation visible.
    _logToolFailure(
      _ToolFailure(
        file: libDir.path,
        label: 'scanner-bootstrap',
        timestamp: _nowIso(),
        reason: 'lib directory does not exist',
      ),
    );
    return strictMode ? 1 : 0;
  }

  final detections = <_Detection>[];
  final toolFailures = <_ToolFailure>[];
  final targets = _collectDartFiles(libDir, toolFailures);
  final compiled = <RegExp>[];
  for (final p in _patterns) {
    try {
      compiled.add(
        RegExp(p.pattern, multiLine: true, caseSensitive: p.caseSensitive),
      );
    } on FormatException catch (e) {
      // A malformed pattern is a tool-side bug, not a code-side detection.
      toolFailures.add(
        _ToolFailure(
          file: '<pattern table>',
          label: p.label,
          timestamp: _nowIso(),
          reason: 'pattern failed to compile: ${e.message}',
        ),
      );
      compiled.add(RegExp('(?!x)x')); // never-match placeholder
    }
  }

  for (final file in targets) {
    String contents;
    try {
      contents = await file.readAsString();
    } on FileSystemException catch (e) {
      toolFailures.add(
        _ToolFailure(
          file: file.path,
          label: 'file-read',
          timestamp: _nowIso(),
          reason: 'could not read file: ${e.message}',
        ),
      );
      continue;
    } on FormatException catch (e) {
      toolFailures.add(
        _ToolFailure(
          file: file.path,
          label: 'file-decode',
          timestamp: _nowIso(),
          reason: 'could not decode file as UTF-8: ${e.message}',
        ),
      );
      continue;
    }

    final lines = contents.split('\n');

    for (var i = 0; i < _patterns.length; i++) {
      final p = _patterns[i];
      final re = compiled[i];

      Iterable<RegExpMatch> matches;
      try {
        matches = re.allMatches(contents);
      } on Object catch (e) {
        // Any runtime regex failure on a particular input is a tool failure
        // for that (file, pattern) pair — not a detection.
        toolFailures.add(
          _ToolFailure(
            file: file.path,
            label: p.label,
            timestamp: _nowIso(),
            reason: 'regex evaluation threw: $e',
          ),
        );
        continue;
      }

      for (final match in matches) {
        final hit = match.group(0) ?? '';
        if (_looksLikePlaceholder(hit)) {
          continue;
        }

        final lineNumber = _lineNumberOfOffset(contents, match.start);
        final rawLine =
            (lineNumber - 1) < lines.length ? lines[lineNumber - 1] : '';
        detections.add(
          _Detection(
            file: file.path,
            line: lineNumber,
            label: p.label,
            preview: _redact(rawLine.trim()),
          ),
        );
      }
    }
  }

  // ---- Reporting ---------------------------------------------------------

  for (final tf in toolFailures) {
    _logToolFailure(tf);
  }

  if (detections.isNotEmpty) {
    stderr.writeln(
      '[$_scriptName] DETECTION_FAILURE: '
      '${detections.length} secret-like literal(s) found under lib/.',
    );
    for (final d in detections) {
      stderr.writeln(
        '  ${d.file}:${d.line}  [${d.label}]  ${d.preview}',
      );
    }
    stderr.writeln(
      '[$_scriptName] Move the value to mobile/android/keystore.properties, '
      'an untracked .env file, or a runtime-loaded configuration source. '
      'See Requirements 17.2 and 17.4.',
    );
    return 1;
  }

  if (releaseMode) {
    if (reviewer == null || reviewer.isEmpty) {
      stderr
        ..writeln(
          '[$_scriptName] RELEASE_VERIFICATION_REQUIRED: '
          'no detection failures recorded, but release builds must add an '
          'additional verification pass covering the documented '
          'false-negative pattern categories (see header of $_scriptName).',
        )
        ..writeln(
          '[$_scriptName] Re-run with --reviewed-by=<name> after performing '
          'the additional review or a stricter verification pass. '
          'See Requirement 17.8.',
        );
      return 1;
    }
    stdout.writeln(
      '[$_scriptName] release verification acknowledged by: $reviewer',
    );
  }

  if (strictMode && toolFailures.isNotEmpty) {
    stderr.writeln(
      '[$_scriptName] strict mode: ${toolFailures.length} tool failure(s) '
      'present, exiting non-zero.',
    );
    return 1;
  }

  stdout.writeln(
    '[$_scriptName] OK — scanned ${targets.length} file(s) under lib/. '
    'detections=0 toolFailures=${toolFailures.length}',
  );
  return 0;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

Directory _resolveLibDirectory() {
  // Allow running from either `mobile/` or `mobile/tool/`.
  final cwd = Directory.current;
  final directLib = Directory('${cwd.path}${Platform.pathSeparator}lib');
  if (directLib.existsSync()) {
    return directLib;
  }
  final parentLib =
      Directory('${cwd.parent.path}${Platform.pathSeparator}lib');
  return parentLib;
}

List<File> _collectDartFiles(
  Directory root,
  List<_ToolFailure> toolFailures,
) {
  final out = <File>[];
  try {
    for (final entity in root.listSync(recursive: true, followLinks: false)) {
      if (entity is File && entity.path.endsWith('.dart')) {
        out.add(entity);
      }
    }
  } on FileSystemException catch (e) {
    toolFailures.add(
      _ToolFailure(
        file: root.path,
        label: 'directory-walk',
        timestamp: _nowIso(),
        reason: 'directory enumeration failed: ${e.message}',
      ),
    );
  }
  out.sort((a, b) => a.path.compareTo(b.path));
  return out;
}

int _lineNumberOfOffset(String contents, int offset) {
  if (offset <= 0) {
    return 1;
  }
  final upperBound = offset > contents.length ? contents.length : offset;
  var line = 1;
  for (var i = 0; i < upperBound; i++) {
    if (contents.codeUnitAt(i) == 0x0A) {
      line++;
    }
  }
  return line;
}

bool _looksLikePlaceholder(String hit) {
  for (final hint in _placeholderHints) {
    if (hit.contains(hint)) {
      return true;
    }
  }
  return false;
}

String _redact(String line) {
  // Keep enough context to locate the line, but never echo the full match.
  if (line.length <= 80) {
    return line.replaceAllMapped(
      RegExp(r'''(['"])([^'"\n]{8,})(['"])'''),
      (m) => '${m.group(1)}${'*' * 8}${m.group(3)}',
    );
  }
  return '${line.substring(0, 80).trim()}...';
}

String? _argValue(List<String> args, String name) {
  for (final arg in args) {
    if (arg.startsWith('$name=')) {
      return arg.substring(name.length + 1);
    }
  }
  final idx = args.indexOf(name);
  if (idx >= 0 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  return null;
}

String _nowIso() => DateTime.now().toUtc().toIso8601String();

void _logToolFailure(_ToolFailure tf) {
  // Structured single-line log so CI can grep for it later.
  stderr.writeln(
    '[$_scriptName] TOOL_FAILURE '
    'timestamp=${tf.timestamp} '
    'pattern=${tf.label} '
    'file=${tf.file} '
    'reason="${tf.reason}"',
  );
}
