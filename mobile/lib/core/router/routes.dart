/// Route names and paths for the foundation router.
///
/// Every `GoRoute` declaration in the application router references one of
/// these constants rather than a string literal, per Requirement 5.4 of the
/// `flutter-migration-architecture` spec.
///
/// Conventions:
///
/// * Path constants are absolute, begin with `/`, and have no trailing slash.
/// * Name constants are `camelCase` identifiers suitable for
///   `GoRouter.goNamed` / `GoRouter.pushNamed` lookup.
/// * Auth-related routes are grouped under [authPathPrefix] so the router's
///   redirect rules can match the entire auth subtree with a single
///   `startsWith` check.
abstract final class Routes {
  Routes._();

  // ---------------------------------------------------------------------------
  // Bottom-tab shell destinations
  // ---------------------------------------------------------------------------

  /// Home tab path. Resolves to the first branch of the bottom-tab shell when
  /// the user is authenticated and is the router's `initialLocation`.
  static const String homePath = '/';

  /// Home tab name.
  static const String homeName = 'home';

  /// Recipes tab path.
  static const String recipesPath = '/recipes';

  /// Recipes tab name.
  static const String recipesName = 'recipes';

  /// Favourites tab path.
  static const String favouritesPath = '/favourites';

  /// Favourites tab name.
  static const String favouritesName = 'favourites';

  /// Profile tab path.
  static const String profilePath = '/profile';

  /// Profile tab name.
  static const String profileName = 'profile';

  // ---------------------------------------------------------------------------
  // Authentication routes (top-level, outside the tab shell)
  // ---------------------------------------------------------------------------

  /// Common prefix for every authentication route. The router's redirect rules
  /// treat any location starting with this prefix as an auth route.
  static const String authPathPrefix = '/auth';

  /// Login screen path.
  static const String loginPath = '/auth/login';

  /// Login screen name.
  static const String loginName = 'login';

  /// Sign-up screen path.
  static const String signupPath = '/auth/signup';

  /// Sign-up screen name.
  static const String signupName = 'signup';

  // ---------------------------------------------------------------------------
  // Barcode feature routes (mounted inside the authenticated tab shell)
  // ---------------------------------------------------------------------------

  /// Barcode scanner screen path. Hosts the camera preview and viewfinder.
  static const String barcodeScannerPath = '/barcode/scan';

  /// Barcode scanner screen name.
  static const String barcodeScannerName = 'barcodeScanner';

  /// Manual barcode entry screen path. Fallback when the camera is denied or
  /// unavailable, or when the user prefers keyboard entry.
  static const String barcodeManualEntryPath = '/barcode/manual';

  /// Manual barcode entry screen name.
  static const String barcodeManualEntryName = 'barcodeManualEntry';

  /// Scanned-product confirmation screen path. Reached after a successful
  /// Open Food Facts lookup; the user reviews and adds the product to their
  /// pantry from here.
  static const String barcodeConfirmPath = '/barcode/confirm';

  /// Scanned-product confirmation screen name.
  static const String barcodeConfirmName = 'barcodeConfirm';
}
