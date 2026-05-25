// Widget tests for `lib/shared/widgets/loading_skeleton.dart`.
//
// Covers Requirement 3.9 of the flutter-migration-architecture spec: a
// loading UI is rendered when an async provider is in the loading state.
// These tests assert that `LoadingSkeleton`:
//
//   - builds a `Shimmer` widget within its subtree,
//   - constructs without errors when invoked with no arguments (defaults
//     wired via the const constructor), and
//   - honours the supplied `width`, `height`, and `borderRadius` params by
//     forwarding them to the underlying `Container`.
//
// Each test pumps the widget inside a `MaterialApp` so the Material
// `Directionality`, theme, and ticker provider needed by `Shimmer`'s
// animation are available.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shimmer/shimmer.dart';

import 'package:mobile/shared/widgets/loading_skeleton.dart';

void main() {
  group('LoadingSkeleton', () {
    Widget buildHarness(Widget child) {
      return MaterialApp(
        home: Scaffold(
          // Bound the skeleton's intrinsic-width default
          // (`double.infinity`) by giving it a finite parent.
          body: Center(child: child),
        ),
      );
    }

    testWidgets('builds a Shimmer widget within the tree', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildHarness(
          const SizedBox(width: 200, child: LoadingSkeleton()),
        ),
      );

      expect(find.byType(Shimmer), findsOneWidget);
    });

    testWidgets('default LoadingSkeleton (no params) builds without errors', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        buildHarness(
          const SizedBox(width: 200, child: LoadingSkeleton()),
        ),
      );

      expect(tester.takeException(), isNull);
      expect(find.byType(LoadingSkeleton), findsOneWidget);
    });

    testWidgets('honours custom width, height, and borderRadius params', (
      WidgetTester tester,
    ) async {
      const double expectedWidth = 100;
      const double expectedHeight = 20;
      const BorderRadius expectedRadius = BorderRadius.all(
        Radius.circular(4),
      );

      await tester.pumpWidget(
        buildHarness(
          const LoadingSkeleton(
            width: expectedWidth,
            height: expectedHeight,
            borderRadius: expectedRadius,
          ),
        ),
      );

      // The `Container` rendered inside the skeleton is the descendant of
      // `Shimmer.fromColors`. Locate it via that ancestry so we don't pick
      // up unrelated containers from the surrounding harness.
      final Finder containerFinder = find.descendant(
        of: find.byType(Shimmer),
        matching: find.byType(Container),
      );

      expect(containerFinder, findsOneWidget);

      final Container container = tester.widget<Container>(containerFinder);
      final BoxConstraints? constraints = container.constraints;
      expect(constraints, isNotNull);
      expect(constraints!.maxWidth, expectedWidth);
      expect(constraints.minWidth, expectedWidth);
      expect(constraints.maxHeight, expectedHeight);
      expect(constraints.minHeight, expectedHeight);

      final BoxDecoration decoration =
          container.decoration! as BoxDecoration;
      expect(decoration.borderRadius, expectedRadius);
    });
  });
}
