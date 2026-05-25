// Build-time configuration for the Cook Smart Flutter mobile app.
//
// `AppConfig` is a static-only namespace exposing compile-time constants
// consumed by `lib/main.dart` (Firebase initialisation, Crashlytics tagging,
// `runApp` setup) and `lib/app.dart` (the root `MaterialApp`). Values are
// evaluated at compile time using `bool.fromEnvironment('dart.vm.product')`,
// so they cannot be altered at runtime — this matches the intent of
// Requirement 12.1 for build-time-only configuration.
//
// Per Requirement 2.7, only `core/`, `features/`, and `shared/` may contain
// Dart source files under `lib/` outside `main.dart` and `app.dart`; this
// file therefore lives under `lib/core/config/`.
//
// Note: the API base URL is intentionally NOT exposed here. It lives in
// `lib/core/config/api_config.dart` so the network layer has a single
// owner for that decision.

/// Compile-time constants used by `app.dart` and `main.dart`.
///
/// Use [environmentLabel] for diagnostic surfaces (about screens, crash
/// report context), [appName] as the source of truth for the user-facing
/// product name in widgets that don't read the platform manifests directly,
/// and [packageName] as the reverse-DNS identifier that mirrors the Android
/// `applicationId` and the iOS `CFBundleIdentifier`.
class AppConfig {
  // Private constructor — `AppConfig` is a namespace, not an instance type.
  AppConfig._();

  /// `true` when the binary is compiled in release mode
  /// (`flutter build apk --release`), `false` otherwise.
  ///
  /// Resolved at compile time via `bool.fromEnvironment('dart.vm.product')`
  /// so that release builds cannot be downgraded to development behaviour
  /// by a runtime flag.
  static const bool isReleaseBuild = bool.fromEnvironment(
    'dart.vm.product',
  );

  /// Human-readable environment label.
  ///
  /// Release builds report `'production'`; all non-release builds (debug
  /// and profile) report `'development'`. Surfaces that need a finer-grained
  /// label (e.g., a `'staging'` value) must amend this constant rather than
  /// introducing a runtime override.
  static const String environmentLabel = isReleaseBuild
      ? 'production'
      : 'development';

  /// User-facing app name used by widgets that do not read the platform
  /// manifest values (for example, the `MaterialApp.title` property and
  /// dialog titles). Mirrors the marketing name "Cook Smart".
  static const String appName = 'Cook Smart';

  /// Reverse-DNS package identifier that mirrors the Android `applicationId`
  /// configured in `mobile/android/app/build.gradle` and the iOS
  /// `CFBundleIdentifier` configured in `mobile/ios/Runner/Info.plist`.
  ///
  /// Used by `main.dart` to tag crash reports and by diagnostic surfaces
  /// when the platform `package_info_plus` lookup is unavailable (for
  /// example, before `WidgetsFlutterBinding.ensureInitialized()` resolves).
  static const String packageName = 'com.cooksmartfresh';
}
