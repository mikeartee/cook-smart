// Widget-level unit tests for `AppTheme` covering Requirements 8.1 and 8.5.
//
// These tests assert that both `AppTheme.light()` and `AppTheme.dark()` opt
// into Material 3, expose a non-null `ColorScheme` of the correct brightness
// with the brand-pinned slots wired through to `AppColours`, and that every
// documented Material 3 typography slot (display / headline / title / body /
// label, in large / medium / small) is populated with a non-null `TextStyle`.
//
// They run as plain Dart tests against the constructed `ThemeData` rather
// than pumping a widget tree, because the requirements are about the data
// returned from the factories, not about how it propagates through
// `MaterialApp`.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/core/theme/app_colours.dart';
import 'package:mobile/core/theme/app_theme.dart';

void main() {
  group('AppTheme.light()', () {
    final ThemeData theme = AppTheme.light();

    test('uses Material 3 with a non-null light colour scheme', () {
      expect(theme.useMaterial3, isTrue);
      expect(theme.colorScheme, isNotNull);
      expect(theme.colorScheme.brightness, Brightness.light);
    });

    test('pins brand colour slots to AppColours', () {
      expect(theme.colorScheme.primary, AppColours.primary);
      expect(theme.colorScheme.onPrimary, AppColours.onPrimary);
      expect(theme.colorScheme.secondary, AppColours.secondary);
      expect(theme.colorScheme.error, AppColours.error);
    });
  });

  group('AppTheme.dark()', () {
    final ThemeData theme = AppTheme.dark();

    test('uses Material 3 with a non-null dark colour scheme', () {
      expect(theme.useMaterial3, isTrue);
      expect(theme.colorScheme, isNotNull);
      expect(theme.colorScheme.brightness, Brightness.dark);
    });

    test('pins brand colour slots to AppColours', () {
      expect(theme.colorScheme.primary, AppColours.primary);
      expect(theme.colorScheme.onPrimary, AppColours.onPrimary);
      expect(theme.colorScheme.secondary, AppColours.secondary);
      expect(theme.colorScheme.error, AppColours.error);
    });
  });

  group('AppTheme typography hierarchy', () {
    // Each entry: (slot label, accessor returning the TextStyle from a
    // TextTheme). Covers every documented Material 3 scale per Requirement
    // 8.5: display, headline, title, body, label — large / medium / small.
    final List<({String name, TextStyle? Function(TextTheme t) get})> slots =
        <({String name, TextStyle? Function(TextTheme t) get})>[
      (name: 'displayLarge', get: (TextTheme t) => t.displayLarge),
      (name: 'displayMedium', get: (TextTheme t) => t.displayMedium),
      (name: 'displaySmall', get: (TextTheme t) => t.displaySmall),
      (name: 'headlineLarge', get: (TextTheme t) => t.headlineLarge),
      (name: 'headlineMedium', get: (TextTheme t) => t.headlineMedium),
      (name: 'headlineSmall', get: (TextTheme t) => t.headlineSmall),
      (name: 'titleLarge', get: (TextTheme t) => t.titleLarge),
      (name: 'titleMedium', get: (TextTheme t) => t.titleMedium),
      (name: 'titleSmall', get: (TextTheme t) => t.titleSmall),
      (name: 'bodyLarge', get: (TextTheme t) => t.bodyLarge),
      (name: 'bodyMedium', get: (TextTheme t) => t.bodyMedium),
      (name: 'bodySmall', get: (TextTheme t) => t.bodySmall),
      (name: 'labelLarge', get: (TextTheme t) => t.labelLarge),
      (name: 'labelMedium', get: (TextTheme t) => t.labelMedium),
      (name: 'labelSmall', get: (TextTheme t) => t.labelSmall),
    ];

    final Map<String, TextTheme> themes = <String, TextTheme>{
      'light': AppTheme.light().textTheme,
      'dark': AppTheme.dark().textTheme,
    };

    themes.forEach((String themeName, TextTheme textTheme) {
      for (final ({String name, TextStyle? Function(TextTheme t) get}) slot
          in slots) {
        test('$themeName textTheme.${slot.name} is non-null', () {
          expect(
            slot.get(textTheme),
            isNotNull,
            reason: '${slot.name} must be populated for the $themeName theme '
                '(Requirement 8.5)',
          );
        });
      }
    });
  });
}
