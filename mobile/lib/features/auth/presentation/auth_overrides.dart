// Foundation overrides for the cook-smart auth feature.
//
// This file is the composition seam where the auth feature replaces the
// foundation's three default values that exist precisely to be replaced
// by an auth feature:
//
//   * `authStateProvider` — the foundation's `StateProvider<bool>` whose
//     value the router watches. The default is `false`. We override it
//     with a derived `Notifier<bool>` that emits `true` iff
//     [authNotifierProvider] currently holds an `AuthAuthenticated`
//     state, satisfying Requirement 7.2.
//
//   * `authRedirectCallbackProvider` — the foundation's no-op
//     `RedirectToLoginCallback` that `ErrorInterceptor` invokes after
//     it clears storage on a 401. We override it with a callback that
//     navigates the router to `Routes.loginPath` and tells
//     [authNotifierProvider]'s notifier to emit
//     `AuthUnauthenticated('Your session has expired.')` via
//     `markSessionExpired()`. Per Requirement 7.3 and Requirement 8.4.
//
//   * `dioProvider` — the foundation's `Dio` singleton constructed with
//     `_unimplementedRefreshCall` as its [RefreshTokenCall]. We
//     override it with a `Dio` whose [ErrorInterceptor] is wired with
//     [cookSmartRefreshNotSupported], the synchronous-throw stub from
//     `features/auth/data/refresh_token_stub.dart`, per Decision 2 of
//     the flutter-port-auth design and Requirement 8.2.
//
// `main.dart` consumes [buildAuthOverrides] and splats the result into
// the existing root `ProviderScope.overrides` list (Requirement 7.4 /
// 8.2 / Decision 3). No second `ProviderScope` is introduced.
//
// Architecture-lint compliance
// ----------------------------
//
// The architecture-enforcement script `tool/check_architecture.dart`
// forbids importing `package:dio` outside `lib/core/network/` (rule
// R-4.8) and forbids `Dio(` construction in any file under a feature's
// `presentation/` folder (rule R-11.7). Both checks apply to every line
// of the file regardless of context. The auth-port spec resolves the
// conflict by following the same shape as Decision 4 of the design:
// the actual `Dio` construction lives in the foundation's
// `lib/core/network/cook_smart_dio_factory.dart` as a top-level
// `buildDioWithCookSmartRefresh` helper, and this file simply imports
// the helper. The override-3 entry below references the helper by name
// and never imports `package:dio`.
//
// No `Color(` literal appears in this file (rule R-8.4); the file
// renders no UI.
//
// See `flutter-port-auth` Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6,
// 7.7, 8.2, 8.3, 8.4 and design Decisions 2, 3, 4.

// External libraries
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Internal modules
import 'package:mobile/core/network/cook_smart_dio_factory.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/core/router/router_provider.dart';
import 'package:mobile/core/router/routes.dart';
import 'package:mobile/features/auth/domain/auth_state.dart';
import 'package:mobile/features/auth/presentation/auth_notifier.dart';

/// Builds the list of [Override]s that the auth feature applies to the
/// foundation's root `ProviderScope`.
///
/// Ordering is documentary, not semantic: Riverpod resolves overrides by
/// provider identity, so any permutation of the three entries produces
/// the same provider graph. The order chosen here matches the design's
/// "three overrides per Decision 3" enumeration to make audit easier.
///
/// Splat the result into `ProviderScope.overrides` from `main.dart`:
///
/// ```dart
/// runApp(
///   ProviderScope(
///     overrides: buildAuthOverrides(),
///     child: const CookSmartApp(),
///   ),
/// );
/// ```
List<Override> buildAuthOverrides() {
  return <Override>[
    // Override 1 — authStateProvider derivation (Requirement 7.2).
    //
    // The foundation declares `authStateProvider` as a
    // `StateProvider<bool>` defaulting to `false`. We replace its
    // initial value with a derivation off [authNotifierProvider]: every
    // time the notifier's `AsyncValue<AuthState>` resolves, we emit
    // `true` iff the value is `AsyncData(AuthAuthenticated(...))`,
    // matching the rule
    //
    //     true  iff  ref.watch(authNotifierProvider).valueOrNull
    //                  is AuthAuthenticated
    //     false in every other case (loading, error, unauthenticated,
    //                                explicit AuthLoading)
    //
    // `routerProvider` listens to changes in `authStateProvider`'s
    // value and re-evaluates its redirect rules when the boolean
    // flips, satisfying Requirement 7.5 without the auth feature
    // touching `core/router/router_provider.dart`.
    authStateProvider.overrideWith((ref) {
      final authValue = ref.watch(authNotifierProvider);
      return authValue.valueOrNull is AuthAuthenticated;
    }),

    // Override 2 — authRedirectCallbackProvider (Requirements 7.3,
    // 8.4).
    //
    // `ErrorInterceptor` invokes this callback synchronously after it
    // has cleared `SecureStorage` on a 401 that survived the refresh
    // attempt (which, in the cook-smart context, always raises
    // immediately via [cookSmartRefreshNotSupported]). The callback
    // navigates the router to `/auth/login` and tells the auth
    // notifier to emit `AuthUnauthenticated('Your session has
    // expired.')` so the login screen renders the inline session-
    // expired message. Both reads are issued at callback-invocation
    // time, not at provider construction time, which is what resolves
    // the cycle warned about in `error_interceptor.dart`.
    authRedirectCallbackProvider.overrideWith(
      (ref) => () {
        ref.read(routerProvider).go(Routes.loginPath);
        ref.read(authNotifierProvider.notifier).markSessionExpired();
      },
    ),

    // Override 3 — dioProvider with cookSmartRefreshNotSupported
    // (Requirement 8.2 / Decision 2).
    //
    // Mirrors the foundation's `dioProvider` body (timeouts, base URL,
    // interceptor chain, disposal) but constructs `ErrorInterceptor`
    // with the synchronous-throw refresh stub instead of
    // `_unimplementedRefreshCall`. The actual `Dio` instantiation lives
    // in [buildDioWithCookSmartRefresh] under `lib/core/network/` per
    // architecture rules R-4.8 and R-11.7; this file does not import
    // `package:dio` and does not construct `Dio(` directly.
    //
    // `authApiClientProvider` reads `dioProvider`, so this single
    // override automatically rebuilds the auth API client against the
    // overridden `Dio` — no separate entry is required.
    dioProvider.overrideWith(buildDioWithCookSmartRefresh),
  ];
}
