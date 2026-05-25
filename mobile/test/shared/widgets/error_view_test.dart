// Widget tests for `lib/shared/widgets/error_view.dart`.
//
// Covers Requirement 3.9 of the flutter-migration-architecture spec: an
// error UI is rendered when an async provider emits an error, and the user
// can retry from that surface. These tests assert that `ErrorView`:
//
//   - renders the supplied message,
//   - renders a `Retry` button (`PrimaryButton` with the `Retry` label),
//   - invokes the `onRetry` callback exactly once when the button is
//     tapped, and
//   - renders the canonical `Icons.error_outline` glyph.
//
// Each test pumps `ErrorView` inside a `MaterialApp` so the Material
// `Directionality`, theme, and font loader are wired up the same way they
// are at runtime.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile/shared/widgets/error_view.dart';
import 'package:mobile/shared/widgets/primary_button.dart';

void main() {
  group('ErrorView', () {
    Widget buildHarness({
      required String message,
      required VoidCallback onRetry,
    }) {
      return MaterialApp(
        home: Scaffold(
          body: ErrorView(
            message: message,
            onRetry: onRetry,
          ),
        ),
      );
    }

    testWidgets('renders the supplied message text', (
      WidgetTester tester,
    ) async {
      const String message = 'Something went wrong loading recipes.';

      await tester.pumpWidget(
        buildHarness(message: message, onRetry: () {}),
      );

      expect(find.text(message), findsOneWidget);
    });

    testWidgets('renders a Retry button', (WidgetTester tester) async {
      await tester.pumpWidget(
        buildHarness(message: 'oops', onRetry: () {}),
      );

      expect(find.byType(PrimaryButton), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
    });

    testWidgets('invokes onRetry exactly once when Retry is tapped', (
      WidgetTester tester,
    ) async {
      int retryCount = 0;

      await tester.pumpWidget(
        buildHarness(
          message: 'oops',
          onRetry: () => retryCount++,
        ),
      );

      await tester.tap(find.text('Retry'));
      await tester.pump();

      expect(retryCount, 1);
    });

    testWidgets('renders the Icons.error_outline glyph', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildHarness(message: 'oops', onRetry: () {}),
      );

      expect(
        find.byWidgetPredicate(
          (Widget widget) =>
              widget is Icon && widget.icon == Icons.error_outline,
        ),
        findsOneWidget,
      );
    });
  });
}
