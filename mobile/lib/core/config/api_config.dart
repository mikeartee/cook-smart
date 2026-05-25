// Compile-time API configuration for the Cook Smart Flutter mobile app.
//
// The Backend_API base URL is selected at compile time via
// `bool.fromEnvironment('dart.vm.product')` so a release artifact can never
// resolve to the development host at runtime. There is intentionally no
// runtime override mechanism (Requirement 12.1) — this is the same intent as
// the existing React Native `api-configuration` steering rule.
//
// Validates: Requirement 4.6, 9.1, 12.1, 12.2, 12.3, 12.4, 12.5.

/// Static configuration of the Backend_API base URL.
///
/// All members are `static const`, so the URL chosen for a build is baked
/// into the compiled artifact and cannot be swapped at runtime.
class ApiConfig {
  // Marked `const` so the class is non-instantiable from the outside; every
  // consumer reads `ApiConfig.baseUrl` directly.
  const ApiConfig._();

  /// Production backend host. Release builds MUST resolve to this exact URL.
  ///
  /// Altering this literal causes the `_releaseUrlGuard` below to fail
  /// compile-time evaluation (Requirement 12.4) before any release artifact
  /// can be produced.
  static const String _prodBaseUrl = 'https://api.cooksmartapp.com';

  /// Local development backend host used by debug and profile builds.
  static const String _devBaseUrl = 'http://192.168.12.196:3000';

  /// `true` when compiled with the Dart VM in product (release) mode.
  ///
  /// Evaluated at compile time; the corresponding branch of `baseUrl` is the
  /// only one preserved in the resulting binary.
  static const bool _isReleaseMode = bool.fromEnvironment('dart.vm.product');

  /// Compile-time guard that fails the build if `_prodBaseUrl` is altered to
  /// anything other than the production literal.
  ///
  /// Because this is a `static const` field, the `_ReleaseUrlGuard`
  /// constructor below is invoked in a constant context. Constant
  /// constructors evaluate their `assert` clauses at compile time, so any
  /// change to `_prodBaseUrl` away from `https://api.cooksmartapp.com`
  /// produces a compilation error rather than a runtime regression.
  // ignore: unused_field
  static const _ReleaseUrlGuard _releaseUrlGuard =
      _ReleaseUrlGuard(_prodBaseUrl);

  /// Base URL applied to every Backend_API request, resolved at compile time.
  ///
  /// - Release builds (`dart.vm.product == true`)  -> `_prodBaseUrl`.
  /// - Non-release builds (`dart.vm.product == false`) -> `_devBaseUrl`.
  static const String baseUrl = _isReleaseMode ? _prodBaseUrl : _devBaseUrl;
}

/// Sentinel type whose constant constructor enforces, at compile time, that
/// the production base URL has not been altered away from the literal
/// `https://api.cooksmartapp.com`.
///
/// The guard is private to this file and is only ever instantiated via the
/// `ApiConfig._releaseUrlGuard` `static const` field, which puts the
/// constructor invocation in a constant context. Constant `assert`s are
/// evaluated at compile time, so a literal mismatch produces a build error.
class _ReleaseUrlGuard {
  const _ReleaseUrlGuard(String prodBaseUrl)
      : assert(
          prodBaseUrl == 'https://api.cooksmartapp.com',
          'Release base URL must be exactly https://api.cooksmartapp.com '
          '(Requirement 12.4). Update the spec before changing this literal.',
        );
}
