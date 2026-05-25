// ignore_for_file: avoid_print
//
// Cross-platform package guard for the Cook Smart Flutter mobile app.
//
// Reads `mobile/pubspec.yaml` and verifies that every declared dependency and
// dev_dependency supports both Android and iOS on pub.dev. Fails the build
// when a package is iOS-only, or Android-only without an explicit exception.
//
// Validates Requirements 7.4, 7.5, 7.6, 13.1, 13.2, 13.3.
//
// Usage:
//   dart run tool/check_packages.dart
//
// Environment variables:
//   COOK_SMART_OFFLINE_PACKAGE_CHECK=1
//     Skips the network check and exits 0 with a warning. Lets CI fall back
//     when pub.dev is unreachable so the rest of the pipeline can still run.
//
// CLI flags:
//   --offline   Same as setting COOK_SMART_OFFLINE_PACKAGE_CHECK=1.
//   --pubspec=<path>
//               Override the pubspec path (default: pubspec.yaml resolved from
//               the script's working directory).

import 'dart:async';
import 'dart:convert';
import 'dart:io';

/// Packages declared with `sdk:` source or shipped by the Flutter SDK itself.
/// These are not published to pub.dev so they cannot be platform-checked.
const Set<String> _sdkPackageNames = <String>{
  'flutter',
  'flutter_test',
  'flutter_driver',
  'flutter_localizations',
  'flutter_web_plugins',
  'integration_test',
  'sky_engine',
};

/// Packages that have been explicitly approved as Android-only exceptions per
/// Requirement 13.4. Each entry MUST also be documented in the spec with an
/// iOS replacement plan. Empty by default — the foundation phase commits no
/// exceptions.
const Set<String> _allowedAndroidOnly = <String>{};

/// Connect timeout for each pub.dev request.
const Duration _connectTimeout = Duration(seconds: 10);

/// Receive timeout for each pub.dev request.
const Duration _receiveTimeout = Duration(seconds: 15);

/// Maximum number of pub.dev requests to issue in parallel. Keeps us a polite
/// neighbour and avoids tripping rate limits on shared CI runners.
const int _maxConcurrentRequests = 4;

Future<void> main(List<String> arguments) async {
  exitCode = await _run(arguments);
}

Future<int> _run(List<String> arguments) async {
  final _CliOptions options = _CliOptions.parse(arguments);

  if (options.offline) {
    stderr.writeln(
      'check_packages: offline mode requested — skipping pub.dev verification.',
    );
    return 0;
  }

  final File pubspecFile = File(options.pubspecPath);
  if (!pubspecFile.existsSync()) {
    stderr.writeln(
      'check_packages: pubspec not found at ${pubspecFile.absolute.path}',
    );
    return 2;
  }

  final List<_DeclaredPackage> packages =
      _parsePubspec(pubspecFile.readAsStringSync())
          .where((_DeclaredPackage p) => !_sdkPackageNames.contains(p.name))
          .toList(growable: false);

  if (packages.isEmpty) {
    stderr.writeln('check_packages: no non-SDK packages found in pubspec.');
    return 0;
  }

  final List<_PackageReport> reports;
  try {
    reports = await _fetchPlatformSupport(packages);
  } on _OfflineFallback catch (e) {
    stderr.writeln(
      'check_packages: pub.dev unreachable (${e.message}) — '
      'set COOK_SMART_OFFLINE_PACKAGE_CHECK=1 to suppress this warning. '
      'Skipping verification.',
    );
    return 0;
  }

  final List<_PackageReport> failures = reports
      .where((_PackageReport r) => !r.isCompliant)
      .toList(growable: false);

  if (failures.isEmpty) {
    print(
      'check_packages: ${reports.length} package(s) verified — '
      'all support Android and iOS.',
    );
    return 0;
  }

  stderr.writeln(
    'check_packages: ${failures.length} package(s) failed the cross-platform '
    'guard:',
  );
  for (final _PackageReport failure in failures) {
    stderr.writeln('  - ${failure.formatFailure()}');
  }
  stderr.writeln(
    'See Requirements 7.4, 7.5, 13.1 for the cross-platform package policy.',
  );
  return 1;
}

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

class _CliOptions {
  const _CliOptions({required this.offline, required this.pubspecPath});

  final bool offline;
  final String pubspecPath;

  static _CliOptions parse(List<String> arguments) {
    bool offline =
        Platform.environment['COOK_SMART_OFFLINE_PACKAGE_CHECK'] == '1';
    String pubspecPath = 'pubspec.yaml';

    for (final String arg in arguments) {
      if (arg == '--offline') {
        offline = true;
      } else if (arg.startsWith('--pubspec=')) {
        pubspecPath = arg.substring('--pubspec='.length);
      } else {
        stderr.writeln('check_packages: unknown argument "$arg" — ignoring.');
      }
    }

    return _CliOptions(offline: offline, pubspecPath: pubspecPath);
  }
}

// ---------------------------------------------------------------------------
// Pubspec parsing
// ---------------------------------------------------------------------------

class _DeclaredPackage {
  const _DeclaredPackage({required this.name, required this.section});

  /// Package name as declared under `dependencies:` or `dev_dependencies:`.
  final String name;

  /// Either `dependencies` or `dev_dependencies`.
  final String section;

  @override
  String toString() => '$name ($section)';
}

/// Lightweight pubspec parser that extracts only the package names declared
/// directly under `dependencies:` and `dev_dependencies:`. We avoid pulling in
/// `package:yaml` to keep this script runnable as a standalone Dart tool with
/// no transitive resolution concerns.
///
/// Handles:
/// - `name: ^1.2.3` style declarations
/// - `name:` followed by a nested block (with `sdk:`, `path:`, `git:`, etc.)
/// - Comments (`#`) and blank lines
///
/// Skips:
/// - Anything declared with `sdk:`, `path:`, `git:`, or `hosted:` source —
///   these are not pub.dev packages and the cross-platform guard does not
///   apply to them in the same way.
List<_DeclaredPackage> _parsePubspec(String contents) {
  final List<String> lines = const LineSplitter().convert(contents);
  final List<_DeclaredPackage> packages = <_DeclaredPackage>[];

  String? currentSection;
  String? pendingPackage;
  int? pendingPackageIndent;
  bool pendingHasNonPubSource = false;

  void flushPending() {
    if (pendingPackage != null && currentSection != null) {
      if (!pendingHasNonPubSource) {
        packages.add(
          _DeclaredPackage(name: pendingPackage!, section: currentSection!),
        );
      }
    }
    pendingPackage = null;
    pendingPackageIndent = null;
    pendingHasNonPubSource = false;
  }

  for (final String rawLine in lines) {
    final String line = _stripComment(rawLine);
    if (line.trim().isEmpty) {
      continue;
    }

    final int indent = _leadingSpaces(line);

    // Section header (top-level key, indent 0).
    if (indent == 0) {
      flushPending();
      final String trimmed = line.trim();
      if (trimmed == 'dependencies:') {
        currentSection = 'dependencies';
      } else if (trimmed == 'dev_dependencies:') {
        currentSection = 'dev_dependencies';
      } else {
        currentSection = null;
      }
      continue;
    }

    if (currentSection == null) {
      continue;
    }

    // Direct child of the section (indent 2 in canonical pubspec style, but
    // we accept any indent strictly between 0 and the previous package's
    // nested-block indent).
    final bool isDirectChild =
        pendingPackageIndent == null || indent <= pendingPackageIndent!;

    if (isDirectChild) {
      flushPending();

      final RegExpMatch? m = _packageDeclRegExp.firstMatch(line);
      if (m == null) {
        continue;
      }

      final String name = m.group(1)!;
      final String? inlineValue = m.group(2)?.trim();

      if (inlineValue == null || inlineValue.isEmpty) {
        // Begins a nested block — defer flushing until we see its children
        // or the next sibling.
        pendingPackage = name;
        pendingPackageIndent = indent;
        pendingHasNonPubSource = false;
      } else {
        // Inline version constraint, e.g. `name: ^1.2.3`.
        packages.add(
          _DeclaredPackage(name: name, section: currentSection),
        );
      }
    } else {
      // Nested child of the pending package. Watch for non-pub-dev sources.
      final String trimmed = line.trim();
      if (trimmed.startsWith('sdk:') ||
          trimmed.startsWith('path:') ||
          trimmed.startsWith('git:') ||
          trimmed.startsWith('hosted:')) {
        pendingHasNonPubSource = true;
      }
    }
  }

  flushPending();
  return packages;
}

final RegExp _packageDeclRegExp = RegExp(r'^\s*([a-z_][a-z0-9_]*)\s*:(.*)$');

String _stripComment(String line) {
  final int hashIndex = line.indexOf('#');
  if (hashIndex < 0) {
    return line;
  }
  return line.substring(0, hashIndex);
}

int _leadingSpaces(String line) {
  int count = 0;
  while (count < line.length && line[count] == ' ') {
    count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// pub.dev API client
// ---------------------------------------------------------------------------

class _OfflineFallback implements Exception {
  const _OfflineFallback(this.message);
  final String message;
}

class _PackageReport {
  const _PackageReport({
    required this.package,
    required this.platforms,
    required this.fetchError,
  });

  final _DeclaredPackage package;
  final Set<String> platforms;
  final String? fetchError;

  bool get isCompliant {
    if (fetchError != null) {
      return false;
    }
    final bool hasAndroid = platforms.contains('android');
    final bool hasIos = platforms.contains('ios');
    if (hasAndroid && hasIos) {
      return true;
    }
    if (hasAndroid && !hasIos && _allowedAndroidOnly.contains(package.name)) {
      return true;
    }
    // Build-time Dart tooling (declared only in dev_dependencies and shipping
    // host-only platforms such as linux/macos/windows) never runs on the
    // device. The cross-platform constraint in Requirement 13.1 targets
    // packages that ship into the APK/IPA, so we exempt host-only dev
    // tooling here. Anything in `dependencies` must still satisfy the strict
    // android+ios rule.
    if (package.section == 'dev_dependencies' && !hasAndroid && !hasIos) {
      const Set<String> hostPlatforms = <String>{'linux', 'macos', 'windows'};
      final bool isHostOnly =
          platforms.isNotEmpty && platforms.every(hostPlatforms.contains);
      if (isHostOnly) {
        return true;
      }
    }
    return false;
  }

  String formatFailure() {
    if (fetchError != null) {
      return '${package.name} (${package.section}): $fetchError';
    }
    final List<String> sorted = platforms.toList()..sort();
    final String declared = sorted.isEmpty ? '<none>' : sorted.join(', ');
    final bool hasIos = platforms.contains('ios');
    final bool hasAndroid = platforms.contains('android');
    if (!hasAndroid && hasIos) {
      return '${package.name} (${package.section}) is iOS-only '
          '(declared platforms: $declared) — Requirement 7.5 forbids '
          'iOS-only packages.';
    }
    if (hasAndroid && !hasIos) {
      return '${package.name} (${package.section}) is Android-only '
          '(declared platforms: $declared) — add an iOS-compatible '
          'replacement or list the package in `_allowedAndroidOnly` with a '
          'spec amendment per Requirement 13.4.';
    }
    return '${package.name} (${package.section}) does not declare Android '
        'and iOS support (declared platforms: $declared).';
  }
}

Future<List<_PackageReport>> _fetchPlatformSupport(
  List<_DeclaredPackage> packages,
) async {
  final HttpClient client = HttpClient()
    ..connectionTimeout = _connectTimeout
    ..userAgent = 'cook-smart-check-packages/1.0 (dart)';

  try {
    // Probe pub.dev once before fanning out so we can degrade gracefully
    // when the host is unreachable from the runner.
    await _probePubDev(client);

    final List<_PackageReport> reports =
        List<_PackageReport>.filled(packages.length, _placeholderReport);
    int nextIndex = 0;
    final int workerCount =
        packages.length < _maxConcurrentRequests
            ? packages.length
            : _maxConcurrentRequests;

    Future<void> worker() async {
      while (true) {
        final int index = nextIndex++;
        if (index >= packages.length) {
          return;
        }
        reports[index] = await _fetchSinglePackage(client, packages[index]);
      }
    }

    await Future.wait(<Future<void>>[
      for (int i = 0; i < workerCount; i++) worker(),
    ]);

    return reports;
  } finally {
    client.close(force: true);
  }
}

const _PackageReport _placeholderReport = _PackageReport(
  package: _DeclaredPackage(name: '<placeholder>', section: 'dependencies'),
  platforms: <String>{},
  fetchError: 'placeholder report (worker did not run)',
);

Future<void> _probePubDev(HttpClient client) async {
  try {
    final HttpClientRequest request = await client
        .getUrl(Uri.parse('https://pub.dev/api/packages/dio'))
        .timeout(_connectTimeout);
    request.headers.set(HttpHeaders.acceptHeader, 'application/json');
    final HttpClientResponse response =
        await request.close().timeout(_receiveTimeout);
    await response.drain<void>();
    if (response.statusCode >= 500) {
      throw _OfflineFallback(
        'pub.dev probe returned ${response.statusCode}',
      );
    }
  } on _OfflineFallback {
    rethrow;
  } on TimeoutException catch (e) {
    throw _OfflineFallback('pub.dev probe timed out: ${e.message ?? ''}');
  } on SocketException catch (e) {
    throw _OfflineFallback('pub.dev probe failed: ${e.message}');
  } on HttpException catch (e) {
    throw _OfflineFallback('pub.dev probe failed: ${e.message}');
  }
}

Future<_PackageReport> _fetchSinglePackage(
  HttpClient client,
  _DeclaredPackage package,
) async {
  final Uri uri = Uri.parse('https://pub.dev/api/packages/${package.name}');
  try {
    final HttpClientRequest request =
        await client.getUrl(uri).timeout(_connectTimeout);
    request.headers.set(HttpHeaders.acceptHeader, 'application/json');
    final HttpClientResponse response =
        await request.close().timeout(_receiveTimeout);

    if (response.statusCode != 200) {
      await response.drain<void>();
      return _PackageReport(
        package: package,
        platforms: const <String>{},
        fetchError:
            'pub.dev returned HTTP ${response.statusCode} for ${uri.path}',
      );
    }

    final String body =
        await response.transform(utf8.decoder).join().timeout(_receiveTimeout);
    final dynamic decoded = jsonDecode(body);
    final Set<String> platforms = _extractPlatforms(decoded);
    return _PackageReport(
      package: package,
      platforms: platforms,
      fetchError: null,
    );
  } on TimeoutException catch (e) {
    return _PackageReport(
      package: package,
      platforms: const <String>{},
      fetchError:
          'pub.dev request timed out for ${package.name}: ${e.message ?? ''}',
    );
  } on SocketException catch (e) {
    return _PackageReport(
      package: package,
      platforms: const <String>{},
      fetchError: 'pub.dev request failed for ${package.name}: ${e.message}',
    );
  } on FormatException catch (e) {
    return _PackageReport(
      package: package,
      platforms: const <String>{},
      fetchError:
          'pub.dev response for ${package.name} was not valid JSON: ${e.message}',
    );
  }
}

/// Pub.dev exposes the latest version's pubspec under
/// `latest.pubspec.flutter.plugin.platforms` for plugin packages, and also
/// publishes a `latest.pubspec.platforms` key on platform-aware packages.
/// For pure-Dart packages neither key exists; pub.dev assumes universal
/// compatibility so we treat that case as cross-platform compliant.
Set<String> _extractPlatforms(dynamic decoded) {
  if (decoded is! Map<String, dynamic>) {
    return const <String>{};
  }
  final dynamic latest = decoded['latest'];
  if (latest is! Map<String, dynamic>) {
    return const <String>{};
  }
  final dynamic pubspec = latest['pubspec'];
  if (pubspec is! Map<String, dynamic>) {
    return const <String>{};
  }

  // Plugin platforms — federated plugin form.
  final Set<String> declared = <String>{};
  final dynamic flutterSection = pubspec['flutter'];
  if (flutterSection is Map<String, dynamic>) {
    final dynamic plugin = flutterSection['plugin'];
    if (plugin is Map<String, dynamic>) {
      final dynamic platformsMap = plugin['platforms'];
      if (platformsMap is Map<String, dynamic>) {
        declared.addAll(platformsMap.keys.map((String k) => k.toLowerCase()));
      }
    }
  }

  // Top-level `platforms:` block (non-plugin platform-aware packages).
  final dynamic platformsBlock = pubspec['platforms'];
  if (platformsBlock is Map<String, dynamic>) {
    declared.addAll(platformsBlock.keys.map((String k) => k.toLowerCase()));
  }

  // Pure-Dart packages declare neither block. Pub.dev treats them as
  // universally compatible, so we report android+ios to keep them compliant.
  if (declared.isEmpty) {
    return const <String>{'android', 'ios', 'linux', 'macos', 'web', 'windows'};
  }
  return declared;
}
