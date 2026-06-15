import 'package:flutter/material.dart';

import 'app_colours.dart';

/// Material 3 theme system for the Cook Smart Flutter app.
///
/// Exposes [light] and [dark] [ThemeData] instances built from a single
/// brand-seeded [ColorScheme] and a fully populated typography hierarchy.
///
/// References:
/// - Requirement 8.1: `AppTheme.light()` and `AppTheme.dark()` return non-null
///   [ThemeData] configured with `useMaterial3: true`.
/// - Requirement 8.3: `MaterialApp` uses `AppTheme.light()` for `theme` and
///   `AppTheme.dark()` for `darkTheme`, so every screen inherits the same
///   Material 3 token set.
/// - Requirement 8.5: the same primary brand colour as the Legacy_RN_App is
///   reused (via [AppColours.primary]) and a complete typography hierarchy
///   covering display, headline, title, body, and label scales is exposed.
class AppTheme {
  const AppTheme._();

  /// Light theme used by [MaterialApp.theme].
  static ThemeData light() {
    final ColorScheme colorScheme = ColorScheme.fromSeed(
      seedColor: AppColours.primary,
      brightness: Brightness.light,
      primary: AppColours.primary,
      onPrimary: AppColours.onPrimary,
      secondary: AppColours.secondary,
      error: AppColours.error,
      surface: AppColours.surface,
    );

    return _buildTheme(
      colorScheme: colorScheme,
      scaffoldBackground: AppColours.background,
    );
  }

  /// Dark theme used by [MaterialApp.darkTheme].
  ///
  /// The brand-relevant slots ([ColorScheme.primary], [ColorScheme.onPrimary],
  /// [ColorScheme.secondary], [ColorScheme.error]) are pinned to the same
  /// [AppColours] tokens used in light mode so the brand identity stays
  /// recognisable. Surface and background tones are left to the seeded
  /// generator, which derives appropriate dark-mode tones from
  /// [AppColours.primary].
  static ThemeData dark() {
    final ColorScheme colorScheme = ColorScheme.fromSeed(
      seedColor: AppColours.primary,
      brightness: Brightness.dark,
      primary: AppColours.primary,
      onPrimary: AppColours.onPrimary,
      secondary: AppColours.secondary,
      error: AppColours.error,
    );

    return _buildTheme(
      colorScheme: colorScheme,
      scaffoldBackground: colorScheme.surface,
    );
  }

  static ThemeData _buildTheme({
    required ColorScheme colorScheme,
    required Color scaffoldBackground,
  }) {
    final TextTheme textTheme = _buildTextTheme(colorScheme.onSurface);

    return ThemeData(
      useMaterial3: true,
      brightness: colorScheme.brightness,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: scaffoldBackground,
      textTheme: textTheme,
      primaryTextTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: colorScheme.surface,
        foregroundColor: colorScheme.onSurface,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: textTheme.titleLarge,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          textStyle: textTheme.labelLarge,
        ),
      ),
    );
  }

  /// Builds the Material 3 type scale.
  ///
  /// Sizes, line heights, weights, and letter spacing follow the Material 3
  /// reference type scale so every named slot in [TextTheme] is non-null,
  /// satisfying the typography hierarchy requirement (8.5) for display,
  /// headline, title, body, and label scales.
  static TextTheme _buildTextTheme(Color baseColor) {
    return TextTheme(
      displayLarge: TextStyle(
        fontSize: 57,
        height: 64 / 57,
        fontWeight: FontWeight.w400,
        letterSpacing: -0.25,
        color: baseColor,
      ),
      displayMedium: TextStyle(
        fontSize: 45,
        height: 52 / 45,
        fontWeight: FontWeight.w400,
        color: baseColor,
      ),
      displaySmall: TextStyle(
        fontSize: 36,
        height: 44 / 36,
        fontWeight: FontWeight.w400,
        color: baseColor,
      ),
      headlineLarge: TextStyle(
        fontSize: 32,
        height: 40 / 32,
        fontWeight: FontWeight.w400,
        color: baseColor,
      ),
      headlineMedium: TextStyle(
        fontSize: 28,
        height: 36 / 28,
        fontWeight: FontWeight.w400,
        color: baseColor,
      ),
      headlineSmall: TextStyle(
        fontSize: 24,
        height: 32 / 24,
        fontWeight: FontWeight.w400,
        color: baseColor,
      ),
      titleLarge: TextStyle(
        fontSize: 22,
        height: 28 / 22,
        fontWeight: FontWeight.w600,
        color: baseColor,
      ),
      titleMedium: TextStyle(
        fontSize: 16,
        height: 24 / 16,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.15,
        color: baseColor,
      ),
      titleSmall: TextStyle(
        fontSize: 14,
        height: 20 / 14,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.1,
        color: baseColor,
      ),
      bodyLarge: TextStyle(
        fontSize: 16,
        height: 24 / 16,
        fontWeight: FontWeight.w400,
        letterSpacing: 0.5,
        color: baseColor,
      ),
      bodyMedium: TextStyle(
        fontSize: 14,
        height: 20 / 14,
        fontWeight: FontWeight.w400,
        letterSpacing: 0.25,
        color: baseColor,
      ),
      bodySmall: TextStyle(
        fontSize: 12,
        height: 16 / 12,
        fontWeight: FontWeight.w400,
        letterSpacing: 0.4,
        color: baseColor,
      ),
      labelLarge: TextStyle(
        fontSize: 14,
        height: 20 / 14,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.1,
        color: baseColor,
      ),
      labelMedium: TextStyle(
        fontSize: 12,
        height: 16 / 12,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.5,
        color: baseColor,
      ),
      labelSmall: TextStyle(
        fontSize: 11,
        height: 16 / 11,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.5,
        color: baseColor,
      ),
    );
  }
}
