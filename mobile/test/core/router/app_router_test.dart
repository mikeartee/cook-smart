// Unit tests for the redirect rules wired up by `buildAppRouter`.
//
// These tests drive the foundation router directly with:
//
//   * a mutable `bool` predicate exposed through a closure, so each test
//     can flip the authentication state synchronously, and
//   * a `StreamController<void>` standing in for the auth-state stream,
//     so each test can simulate auth-state changes by pushing events.
//
// The router is then mounted under `MaterialApp.router` so the placeholder
// screens declared in `app_router.dart` actually build, letting us assert
// against their text instead of inspecting private widget types.
//
// Validates: Requirements 5.7, 5.8, 5.9, 5.11 of the
// flutter-migration-architecture spec.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/router/app_router.dart';
import 'package:mobile/core/router/routes.dart';

void main() {
  group('buildAppRouter redirect logic', () {
    late StreamController<void> authStateController;
    late bool authenticated;

    setUp(() {
      authStateController = StreamController<void>.broadcast();
      authenticated = false;
    });

    tearDown(() async {
      await authStateController.close();
    });

    GoRouter createRouter() {
      return buildAppRouter(
        isAuthenticated: () => authenticated,
        authStateChanges: authStateController.stream,
      );
    }

    Future<GoRouter> pumpRouter(WidgetTester tester) async {
      final GoRouter router = createRouter();
      await tester.pumpWidget(
        MaterialApp.router(
          routerConfig: router,
        ),
      );
      await tester.pumpAndSettle();
      return router;
    }

    String currentLocation(GoRouter router) {
      return router.routerDelegate.currentConfiguration.uri.toString();
    }

    testWidgets(
      'unauthenticated request to /recipes redirects to /auth/login',
      (WidgetTester tester) async {
        authenticated = false;
        final GoRouter router = await pumpRouter(tester);

        router.go(Routes.recipesPath);
        await tester.pumpAndSettle();

        expect(find.text('Login placeholder'), findsOneWidget);
        expect(find.text('Recipes placeholder'), findsNothing);
        expect(currentLocation(router), Routes.loginPath);
      },
    );

    testWidgets(
      'unauthenticated boot at / redirects to /auth/login',
      (WidgetTester tester) async {
        authenticated = false;
        final GoRouter router = await pumpRouter(tester);

        expect(find.text('Login placeholder'), findsOneWidget);
        expect(find.text('Home placeholder'), findsNothing);
        expect(currentLocation(router), Routes.loginPath);
      },
    );

    testWidgets(
      'authenticated request to /auth/login redirects to /',
      (WidgetTester tester) async {
        authenticated = true;
        final GoRouter router = await pumpRouter(tester);

        router.go(Routes.loginPath);
        await tester.pumpAndSettle();

        expect(find.text('Home placeholder'), findsOneWidget);
        expect(find.text('Login placeholder'), findsNothing);
        expect(currentLocation(router), Routes.homePath);
      },
    );

    testWidgets(
      'authenticated request to /recipes renders the recipes destination',
      (WidgetTester tester) async {
        authenticated = true;
        final GoRouter router = await pumpRouter(tester);

        router.go(Routes.recipesPath);
        await tester.pumpAndSettle();

        expect(find.text('Recipes placeholder'), findsOneWidget);
        expect(find.text('Login placeholder'), findsNothing);
        expect(currentLocation(router), Routes.recipesPath);
      },
    );

    testWidgets(
      'auth-state change re-evaluates redirect rules without a manual refresh',
      (WidgetTester tester) async {
        // Boot unauthenticated — initial location `/` redirects to login.
        authenticated = false;
        final GoRouter router = await pumpRouter(tester);

        expect(find.text('Login placeholder'), findsOneWidget);
        expect(currentLocation(router), Routes.loginPath);

        // Flip the predicate and signal an auth-state change. The router's
        // `refreshListenable` should pick this up and re-run the redirect
        // rules against the current location, without any direct call from
        // the test.
        authenticated = true;
        authStateController.add(null);
        await tester.pumpAndSettle();

        expect(find.text('Login placeholder'), findsNothing);
        expect(find.text('Home placeholder'), findsOneWidget);
        expect(currentLocation(router), Routes.homePath);
      },
    );

    testWidgets(
      'unknown path renders the error destination and preserves the URL',
      (WidgetTester tester) async {
        // Authenticate so the redirect rules do not intercept the unknown
        // path before the matcher gets a chance to fail it.
        authenticated = true;
        final GoRouter router = await pumpRouter(tester);

        const String unknownPath = '/this/does/not/exist';
        router.go(unknownPath);
        await tester.pumpAndSettle();

        // The error screen renders and exposes the requested location.
        expect(find.text('Page not found'), findsOneWidget);
        expect(
          find.text('No route found for "$unknownPath".'),
          findsOneWidget,
        );

        // The router preserves the requested URL behind the error screen so
        // the user can pop back to where they came from.
        expect(currentLocation(router), unknownPath);
      },
    );
  });
}
