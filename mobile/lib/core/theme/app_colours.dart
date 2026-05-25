import 'package:flutter/material.dart';

/// Brand colour tokens for the Cook Smart Flutter app.
///
/// Every colour referenced anywhere in the app must be defined here so that
/// the `check_architecture.dart` lint can fail builds that introduce ad-hoc
/// `Color(...)` literals outside `lib/core/theme/`.
///
/// The primary brand colour is preserved from the Legacy_RN_App, which used
/// `#10B981` (Tailwind emerald-500) as the active tab tint, primary CTA
/// background, and accent icon colour across 40+ screens.
///
/// References:
/// - Requirement 8.2: brand colour tokens declared as `static const Color`
///   constants on `AppColours`.
/// - Requirement 8.5: primary brand colour value reused from Legacy_RN_App.
class AppColours {
  const AppColours._();

  /// Primary brand colour. Reused from the Legacy_RN_App
  /// (`#10B981`, Tailwind emerald-500) per Requirement 8.5.
  static const Color primary = Color(0xFF10B981);

  /// Secondary accent colour, paired with `primary` for badges and
  /// supporting calls-to-action (Tailwind amber-500).
  static const Color secondary = Color(0xFFF59E0B);

  /// Default scaffold/page background (Tailwind gray-50), matching the
  /// legacy `#F9FAFB` surface used across most RN screens.
  static const Color background = Color(0xFFF9FAFB);

  /// Card and elevated-surface background.
  static const Color surface = Color(0xFFFFFFFF);

  /// Error / destructive action colour (Tailwind red-500), matching the
  /// legacy `#EF4444` used for delete buttons and error states.
  static const Color error = Color(0xFFEF4444);

  /// Foreground colour for content rendered on top of `primary`,
  /// e.g. text on the primary CTA button.
  static const Color onPrimary = Color(0xFFFFFFFF);

  // ---------------------------------------------------------------------------
  // Barcode_Feature scanner tokens (flutter-port-barcode Requirement 1.7).
  //
  // These four named constants alias the existing palette so that every colour
  // referenced by the barcode-scanner presentation widgets (corner markers,
  // loading spinner, error banner, success banner) resolves to a token in this
  // file — keeping the `check_architecture.dart` ban on `Color(` literals under
  // `lib/features/barcode/` enforceable. Per Requirement 1.7 the existing
  // palette is reused where suitable; no new RGB values are introduced.
  // ---------------------------------------------------------------------------

  /// Corner marker colour drawn on the four corners of the camera viewfinder
  /// while `Scan_State` is `ScanCameraActive`. Reuses the brand emerald so the
  /// overlay reads as a Cook Smart surface and stays high-contrast against the
  /// darkened camera preview.
  static const Color scannerViewfinderCorner = primary;

  /// Tint of the centred loading spinner shown while `Scan_State` is
  /// `ScanLookingUp` (Open Food Facts request in flight) or `ScanAdding`
  /// (cook-smart `POST /api/v1/ingredients` in flight). Reuses the brand
  /// emerald.
  static const Color scannerLoadingIndicator = primary;

  /// Banner colour for inline error regions surfaced by the scanner and
  /// confirmation screens (`ScanFailed`, `ScanPermissionDenied`,
  /// `ScanProductNotFound`). Reuses the destructive `error` token.
  static const Color scannerErrorBanner = error;

  /// Banner colour for the post-add success affirmation rendered when
  /// `Scan_State` transitions to `ScanAdded`. Reuses the brand emerald.
  static const Color scannerSuccessBanner = primary;
}
