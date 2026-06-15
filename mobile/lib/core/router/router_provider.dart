// Riverpod wiring for the application's [GoRouter] singleton.
//
// This file is the *only* place in the app that constructs a [GoRouter]
// instance, satisfying Requirement 11.6 (every infrastructure singleton is
// reached through a Riverpod provider declared in the core layer) and
// keeping Requirement 11.7 (no `GoRouter(` construction in the widget tree)
// trivially enforceable by `tool/check_architecture.dart`.
//
// The router is built once per `ProviderScope`. The route table, redirect
// rules and error fallback live in `app_router.dart`; this file's only job
// is wiring the auth integration so changes to authentication state
// re-evaluate the redirect callback without a manual refresh
// (Requirement 5.9).
//
// Reference: Requirements 5.2, 5.9 and 11.6 of the
// flutter-migration-architecture spec.

import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:mobile/core/router/app_router.dart';

/// Foundation-phase stub for the application's authentication state.
///
/// During the foundation phase the auth feature has not yet been ported, so
/// this provider holds a single boolean: `true` when the user is signed in,
/// `false` otherwise. The default value `false` boots the app to
/// `/auth/login`, matching the safer default of "not authenticated until
/// proven otherwise" and exercising the redirect rule from Requirement 5.7
/// out of the box.
///
/// The forthcoming auth feature spec replaces this stub in one of two
/// supported ways without breaking any consumer:
///
/// * Override the provider in the application `ProviderScope` with a
///   `Notifier<bool>` (or `AsyncNotifier<bool>`) whose state is driven by
///   the real `AuthRepository`. This is the preferred path.
/// * Replace the declaration entirely with a `@riverpod`-annotated provider
///   of the same name and `bool` value type. Because every consumer reads
///   the value through Riverpod (never by reference), the swap is a single-
///   file change.
///
/// Tests drive the redirect logic by overriding this provider with
/// `overrideWith` on a hand-rolled `ProviderScope`, which is why a
/// `StateProvider<bool>` is the chosen stub shape: it offers the simplest
/// override surface while staying compatible with both replacement paths
/// above.
///
/// Reference: Requirements 3.1, 3.7, 5.7 and 5.8 of the
/// flutter-migration-architecture spec.
final StateProvider<bool> authStateProvider = StateProvider<bool>(
  (ref) => false,
);

/// Application-wide [GoRouter] singleton.
///
/// Construction delegates to [buildAppRouter] so the route table stays
/// defined in `app_router.dart`. This provider is responsible only for the
/// auth integration:
///
/// * `isAuthenticated` is a callback that reads the *current* value of
///   [authStateProvider] each time go_router invokes the redirect
///   callback. Reading via `ref.read` (rather than `ref.watch`) is
///   deliberate: watching would cause the entire [GoRouter] to be rebuilt
///   on every auth-state change, dropping the in-memory navigation stack.
///   Re-evaluation of the redirect rules is driven instead by the
///   auth-state stream below, which preserves navigation state across
///   transitions.
///
/// * `authStateChanges` is a broadcast [Stream] of `void` events, one per
///   change to [authStateProvider]. go_router's `refreshListenable`
///   subscribes to this stream once and re-runs the redirect callback
///   against the current location whenever an event arrives. Together
///   with the synchronous redirect callback, this satisfies
///   Requirement 5.9 (auth-state changes re-evaluate redirect rules
///   without requiring a manual refresh).
///
/// The bridging [StreamController] is closed in `ref.onDispose`, which in
/// turn cancels the underlying `ref.listen` subscription. This guarantees
/// the controller cannot outlive the `ProviderScope` and prevents leaks in
/// tests that build and tear down the provider repeatedly.
///
/// Reference: Requirements 5.2, 5.9 and 11.6 of the
/// flutter-migration-architecture spec.
final Provider<GoRouter> routerProvider = Provider<GoRouter>((ref) {
  // Broadcast so go_router can attach the listener it needs without
  // worrying about single-subscription semantics, and so tests can attach
  // their own listener alongside the router for assertion purposes.
  final authChangesController = StreamController<void>.broadcast();

  // Wire the auth-state bridge. `ref..listen..onDispose` is expressed as a
  // cascade because both calls share the same receiver and run during
  // provider construction:
  //
  //   * `listen` forwards every authStateProvider change as a `void` event.
  //     `ref.listen` does not fire for the initial value, which is correct:
  //     go_router runs its redirect callback once on first navigation
  //     regardless, so an initial event would be redundant.
  //
  //   * `onDispose` closes the controller when the ProviderScope tears
  //     down. Closing also cancels the upstream `ref.listen` subscription,
  //     so there is nothing else to clean up here.
  ref
    ..listen<bool>(
      authStateProvider,
      (bool? previous, bool next) {
        if (!authChangesController.isClosed) {
          authChangesController.add(null);
        }
      },
    )
    ..onDispose(authChangesController.close);

  return buildAppRouter(
    isAuthenticated: () => ref.read(authStateProvider),
    authStateChanges: authChangesController.stream,
  );
});
