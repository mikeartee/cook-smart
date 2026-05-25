// Release-build base URL guard.
//
// Reads `lib/core/config/api_config.dart` and verifies that the production
// base URL literal is exactly `https://api.cooksmartapp.com`. Run from a
// Gradle task that is wired as a dependency of `assembleRelease` and
// `bundleRelease`, so a release build cannot be produced with a tampered
// production URL.
//
// Validates: Requirements 9.2, 12.4.

import 'dart:io';

const String _expectedReleaseUrl = 'https://api.cooksmartapp.com';
const String _apiConfigPath = 'lib/core/config/api_config.dart';

/// Regex that matches the `_prodBaseUrl` constant declaration in
/// `api_config.dart`. The match group captures the URL literal between the
/// surrounding single quotes.
final RegExp _prodBaseUrlPattern = RegExp(
  r"static\s+const\s+String\s+_prodBaseUrl\s*=\s*'([^']*)'\s*;",
);

void main(List<String> arguments) {
  final File apiConfigFile = File(_apiConfigPath);
  if (!apiConfigFile.existsSync()) {
    stderr.writeln(
      '[check_release_url] FAIL: $_apiConfigPath not found. The release '
      'base URL guard cannot run without it.',
    );
    exit(1);
  }

  final String contents = apiConfigFile.readAsStringSync();
  final RegExpMatch? match = _prodBaseUrlPattern.firstMatch(contents);
  if (match == null) {
    stderr.writeln(
      '[check_release_url] FAIL: could not locate _prodBaseUrl declaration '
      'in $_apiConfigPath. Restore the original literal before building '
      'a release artifact.',
    );
    exit(1);
  }

  final String prodBaseUrl = match.group(1) ?? '';
  if (prodBaseUrl != _expectedReleaseUrl) {
    stderr.writeln(
      '[check_release_url] FAIL: release base URL mismatch.\n'
      '  expected: $_expectedReleaseUrl\n'
      '  found:    $prodBaseUrl\n'
      'Release builds must target the production backend exactly '
      '(Requirements 9.2, 12.4). Revert the change or amend the spec '
      'before building.',
    );
    exit(1);
  }

  stdout.writeln(
    '[check_release_url] OK: _prodBaseUrl == $_expectedReleaseUrl',
  );
}
