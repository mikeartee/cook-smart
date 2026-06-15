// Root widget for the Cook Smart Flutter mobile app.
//
// `CookSmartApp` is the single `MaterialApp.router` mounted under the
// top-level `ProviderScope` created in `main.dart`. It is intentionally
// minimal: every load-bearing decision lives in a dedicated `core/`
// module and is reached through a Riverpod provider so that this widget
// stays a pure composition root.
//
// Wiring:
//
//   * `routerConfig` resolves to the `GoRouter` exposed by
//     `routerProvider` in `core/router/router_provider.dart`. Reading
//     through the provider (rather than constructing a `GoRouter` here)
//     keeps Requirement 11.7 trivially enforceable by
//     `tool/check_architecture.dart`, which fails the build if
//     `GoRouter(` is constructed anywhere in the widget tree.
//
//   * `theme` and `darkTheme` are sourced from `AppTheme.light()` and
//     `AppTheme.dark()` so every screen inherits the same Material 3
//     token set, satisfying Requirement 8.3.
//
//   * `title` reads `AppConfig.appName` so the user-facing product name
//     has a single source of truth across the codebase.
//
//   * `debugShowCheckedModeBanner` is disabled because the in-app
//     debug banner is redundant with the in-IDE build-mode indicator
//     and would clip onto screenshots and recordings.
//
// Per Requirement 2.7, this file is one of only two Dart sources
// permitted directly under `lib/` (alongside `main.dart`). All other
// sources must live under `core/`, `features/`, or `shared/`.
//
// Reference: Requirements 2.7 and 8.3 of the
// flutter-migration-architecture spec.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:mobile/core/config/app_config.dart';
import 'package:mobile/core/router/router_provider.dart';
import 'package:mobile/core/theme/app_theme.dart';

/// Root widget of the Cook Smart Flutter app.
///
/// Mounted by `main.dart` inside the application's single top-level
/// `ProviderScope`. The class is a [ConsumerWidget] rather than a plain
/// [StatelessWidget] because the [GoRouter] singleton is reached
/// through Riverpod; using a [ConsumerWidget] gives [build] direct
/// access to a [WidgetRef] without an extra `Consumer` wrapper.
///
/// This widget is deliberately the only application-level surface
/// between `runApp` and the router. Any concern that does not belong on
/// `MaterialApp` itself (theming, configuration, navigation) is
/// delegated to a `core/` module so that swapping a backend (theme
/// system, router, configuration source) is a one-file change.
class CookSmartApp extends ConsumerWidget {
  /// Creates the root widget of the Cook Smart application.
  const CookSmartApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch the router so the entire app reactively rebuilds if the
    // provider is ever overridden in tests or replaced wholesale by
    // the auth feature spec. In production the provider yields the
    // same `GoRouter` instance for the lifetime of the
    // `ProviderScope`, so this watch does not cause spurious rebuilds.
    final GoRouter router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      routerConfig: router,
    );
  }
}
