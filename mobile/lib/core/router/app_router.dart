import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/features/barcode/presentation/barcode_scanner_screen.dart';
import 'package:mobile/features/barcode/presentation/manual_barcode_entry_screen.dart';
import 'package:mobile/features/barcode/presentation/scanned_product_confirmation_screen.dart';

import 'routes.dart';

/// Builds the [GoRouter] configuration for the Cook Smart Flutter app.
///
/// This function is the single source of truth for the foundation router's
/// shape: bottom-tabbed shell, top-level auth routes, redirect rules, and
/// error fallback. The actual `GoRouter` singleton exposed to the application
/// is constructed by `routerProvider` (task 6.3) which calls this function
/// once and feeds it the auth integration. Decoupling the construction from
/// any concrete auth notifier keeps the router testable in isolation and
/// lets the auth feature spec wire its real `Notifier` later without
/// touching this file.
///
/// Parameters:
///
/// * [isAuthenticated] is invoked synchronously on every navigation request
///   to decide whether the redirect rules should kick in. Reading is via a
///   function (rather than a captured boolean) so the latest value is always
///   observed at redirect time, even between auth-state change events.
/// * [authStateChanges] is a broadcastable stream that emits whenever the
///   authentication state transitions. Each emission triggers GoRouter's
///   `refreshListenable`, which in turn re-runs the router's `redirect`
///   callback against the current location, satisfying Requirement 5.9
///   (auth-state changes must re-evaluate redirect rules without a manual
///   refresh).
///
/// Behaviour summary:
///
/// * `initialLocation` is `/`, which resolves to the first branch of the
///   bottom-tabbed shell when the user is authenticated (Requirements 5.3,
///   5.5).
/// * `/auth/*` routes are declared at the top level, outside the
///   [StatefulShellRoute.indexedStack], so authentication screens render
///   without the bottom tab bar (Requirement 5.6).
/// * The redirect callback is synchronous, so it completes well within the
///   100 ms window required for unauthenticated→`/auth/login` and
///   authenticated→`/` transitions (Requirements 5.7, 5.8).
/// * The default deep-link handling provided by go_router is used as-is; no
///   additional plugins or platform configuration are introduced here
///   (Requirement 5.10).
/// * `errorBuilder` is supplied so unmatched routes render a recognisable
///   "page not found" destination. go_router's default behaviour keeps the
///   previous navigation stack intact behind the error page so the user can
///   pop back to it (Requirement 5.11).
GoRouter buildAppRouter({
  required bool Function() isAuthenticated,
  required Stream<void> authStateChanges,
}) {
  return GoRouter(
    initialLocation: Routes.homePath,
    refreshListenable: _GoRouterRefreshStream(authStateChanges),
    redirect: _redirect(isAuthenticated),
    errorBuilder: (BuildContext context, GoRouterState state) {
      return _RouteNotFoundScreen(requestedLocation: state.uri.toString());
    },
    routes: <RouteBase>[
      // -----------------------------------------------------------------
      // Auth routes — top-level, outside the StatefulShellRoute so that
      // authentication screens render without the bottom tab bar.
      // -----------------------------------------------------------------
      GoRoute(
        path: Routes.loginPath,
        name: Routes.loginName,
        builder: (BuildContext context, GoRouterState state) =>
            const _LoginPlaceholderScreen(),
      ),
      GoRoute(
        path: Routes.signupPath,
        name: Routes.signupName,
        builder: (BuildContext context, GoRouterState state) =>
            const _SignupPlaceholderScreen(),
      ),

      // -----------------------------------------------------------------
      // Bottom-tabbed shell. Each branch keeps an independent navigation
      // stack across tab switches (Requirement 5.5).
      // -----------------------------------------------------------------
      StatefulShellRoute.indexedStack(
        builder: (
          BuildContext context,
          GoRouterState state,
          StatefulNavigationShell navigationShell,
        ) {
          return _MainShell(navigationShell: navigationShell);
        },
        branches: <StatefulShellBranch>[
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: Routes.homePath,
                name: Routes.homeName,
                builder: (BuildContext context, GoRouterState state) =>
                    const _HomePlaceholderScreen(),
              ),
              // -----------------------------------------------------------
              // Barcode feature routes (flutter-port-barcode tasks 7.2 + 8).
              //
              // Mounted as siblings of the Home branch entry point so the
              // authenticated bottom-tab shell remains visible while the
              // user is scanning, entering a barcode manually, or
              // confirming a resolved product. The Foundation_Phase's
              // existing redirect rule (Requirement 5.7) plus the
              // Auth_Feature's `authStateProvider` override drive the
              // unauthenticated-user redirect for these paths per
              // Barcode Requirement 6.1 — no new redirect rule is added
              // here. Builders construct the real screen widgets from
              // `lib/features/barcode/presentation/`. The placeholders
              // that previously stood in here have been removed now that
              // tasks 6.1, 6.3, and 6.5 have landed.
              //
              // `ManualBarcodeEntryScreen.cameraUnavailable` is read off
              // `GoRouterState.extra` (a `Map<String, dynamic>` shaped
              // `{'cameraUnavailable': bool}`) so the
              // `BarcodeScannerScreen` can flag the informational note
              // when it pushes manual entry because of an unavailable
              // camera (Requirement 10.7); every other navigation path
              // omits the extra and the field defaults to `false`.
              // -----------------------------------------------------------
              GoRoute(
                path: Routes.barcodeScannerPath,
                name: Routes.barcodeScannerName,
                builder: (BuildContext context, GoRouterState state) =>
                    const BarcodeScannerScreen(),
              ),
              GoRoute(
                path: Routes.barcodeManualEntryPath,
                name: Routes.barcodeManualEntryName,
                builder: (BuildContext context, GoRouterState state) {
                  final extra = state.extra;
                  final cameraUnavailable = extra is Map<String, dynamic> &&
                      extra['cameraUnavailable'] == true;
                  return ManualBarcodeEntryScreen(
                    cameraUnavailable: cameraUnavailable,
                  );
                },
              ),
              GoRoute(
                path: Routes.barcodeConfirmPath,
                name: Routes.barcodeConfirmName,
                builder: (BuildContext context, GoRouterState state) =>
                    const ScannedProductConfirmationScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: Routes.recipesPath,
                name: Routes.recipesName,
                builder: (BuildContext context, GoRouterState state) =>
                    const _RecipesPlaceholderScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: Routes.favouritesPath,
                name: Routes.favouritesName,
                builder: (BuildContext context, GoRouterState state) =>
                    const _FavouritesPlaceholderScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: <RouteBase>[
              GoRoute(
                path: Routes.profilePath,
                name: Routes.profileName,
                builder: (BuildContext context, GoRouterState state) =>
                    const _ProfilePlaceholderScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}

/// Builds the synchronous redirect callback that enforces the auth-gated
/// routing rules from Requirements 5.7 and 5.8:
///
/// * An unauthenticated user navigating anywhere outside `/auth/*` is sent
///   to [Routes.loginPath] before the requested destination renders.
/// * An authenticated user navigating to any `/auth/*` route is sent to
///   [Routes.homePath] before the auth screen renders.
/// * Any other navigation request is allowed to proceed unmodified
///   (returning `null`).
GoRouterRedirect _redirect(bool Function() isAuthenticated) {
  return (BuildContext context, GoRouterState state) {
    final bool loggedIn = isAuthenticated();
    final bool goingToAuth =
        state.matchedLocation.startsWith(Routes.authPathPrefix);

    if (!loggedIn && !goingToAuth) {
      return Routes.loginPath;
    }
    if (loggedIn && goingToAuth) {
      return Routes.homePath;
    }
    return null;
  };
}

/// Adapts a [Stream] into a [Listenable] so it can be passed as the router's
/// `refreshListenable`.
///
/// The router subscribes once when constructed; every event on the stream
/// then triggers `notifyListeners()`, which causes the router to re-run its
/// redirect callback against the current location. This is the documented
/// go_router pattern for driving redirects from a stream-based auth source.
class _GoRouterRefreshStream extends ChangeNotifier {
  _GoRouterRefreshStream(Stream<void> stream) {
    _subscription = stream.asBroadcastStream().listen(
          (_) => notifyListeners(),
        );
  }

  late final StreamSubscription<void> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

// ---------------------------------------------------------------------------
// Placeholder screens.
//
// Per the task brief, this file deliberately ships minimal placeholders for
// every routed destination so the foundation router compiles and runs in
// isolation. Each placeholder is a private widget so it cannot be imported
// from anywhere else in the app — feature specs will replace them with real
// screens under `lib/features/<feature>/presentation/`.
//
// All visual styling is sourced from the active [ThemeData] (which is built
// from `AppColours` in `lib/core/theme/`). No `Color(...)` literal appears
// here, satisfying the architectural lint enforced by
// `tool/check_architecture.dart` (Requirement 8.4).
// ---------------------------------------------------------------------------

class _MainShell extends StatelessWidget {
  const _MainShell({required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (int index) => navigationShell.goBranch(
          index,
          // Tapping the already-active tab pops the branch back to its root,
          // which matches the React Navigation behaviour the legacy app uses.
          initialLocation: index == navigationShell.currentIndex,
        ),
        destinations: const <NavigationDestination>[
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.restaurant_menu_outlined),
            selectedIcon: Icon(Icons.restaurant_menu),
            label: 'Recipes',
          ),
          NavigationDestination(
            icon: Icon(Icons.favorite_outline),
            selectedIcon: Icon(Icons.favorite),
            label: 'Favourites',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class _PlaceholderScreen extends StatelessWidget {
  const _PlaceholderScreen({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    final TextTheme textTheme = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            '$title placeholder',
            style: textTheme.titleMedium,
          ),
        ),
      ),
    );
  }
}

class _HomePlaceholderScreen extends StatelessWidget {
  const _HomePlaceholderScreen();

  @override
  Widget build(BuildContext context) =>
      const _PlaceholderScreen(title: 'Home');
}

class _RecipesPlaceholderScreen extends StatelessWidget {
  const _RecipesPlaceholderScreen();

  @override
  Widget build(BuildContext context) =>
      const _PlaceholderScreen(title: 'Recipes');
}

class _FavouritesPlaceholderScreen extends StatelessWidget {
  const _FavouritesPlaceholderScreen();

  @override
  Widget build(BuildContext context) =>
      const _PlaceholderScreen(title: 'Favourites');
}

class _ProfilePlaceholderScreen extends StatelessWidget {
  const _ProfilePlaceholderScreen();

  @override
  Widget build(BuildContext context) =>
      const _PlaceholderScreen(title: 'Profile');
}

class _LoginPlaceholderScreen extends StatelessWidget {
  const _LoginPlaceholderScreen();

  @override
  Widget build(BuildContext context) =>
      const _PlaceholderScreen(title: 'Login');
}

class _SignupPlaceholderScreen extends StatelessWidget {
  const _SignupPlaceholderScreen();

  @override
  Widget build(BuildContext context) =>
      const _PlaceholderScreen(title: 'Sign up');
}

// ---------------------------------------------------------------------------
// Barcode feature placeholders removed (flutter-port-barcode task 8).
//
// The router now points the three barcode routes directly at the real
// screen widgets imported from `lib/features/barcode/presentation/`. The
// private placeholder widgets that lived here while screen tasks 6.1,
// 6.3, and 6.5 were in flight have been deleted; this comment is kept as
// a navigational marker for archaeology against the previous revision.
// ---------------------------------------------------------------------------

/// Destination shown when go_router cannot match the requested path against
/// any configured route, including unmatched deep links (Requirement 5.11).
///
/// The screen exposes the requested location for diagnosability and a
/// recovery action that returns the user to the home tab when the previous
/// stack cannot be popped (e.g. the app was launched cold via a malformed
/// deep link). When there *is* a previous stack, go_router preserves it
/// behind this page automatically, so popping with the system back button
/// returns the user to wherever they were.
class _RouteNotFoundScreen extends StatelessWidget {
  const _RouteNotFoundScreen({required this.requestedLocation});

  final String requestedLocation;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Page not found')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Icon(
                Icons.error_outline,
                size: 64,
                color: theme.colorScheme.error,
              ),
              const SizedBox(height: 16),
              Text(
                'No route found for "$requestedLocation".',
                style: theme.textTheme.titleMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () {
                  if (context.canPop()) {
                    context.pop();
                  } else {
                    context.go(Routes.homePath);
                  }
                },
                child: const Text('Go back'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
