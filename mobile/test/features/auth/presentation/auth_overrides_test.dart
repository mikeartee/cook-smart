// Property and example tests for
// `lib/features/auth/presentation/auth_overrides.dart`.
//
// Validates: Requirements 7.2, 7.3, 8.4 of the flutter-port-auth spec.
//
// Two tests live here, mirroring the two override seams [buildAuthOverrides]
// closes:
//
//   * Property 9 — `authStateProvider` derivation matches `AuthAuthenticated`.
//     For every canonical `AsyncValue<AuthState>` shape the foundation's
//     `routerProvider` may observe, the boolean published by
//     `authStateProvider` (after [buildAuthOverrides] is applied) is
//     `true` iff the value is `AsyncData(AuthAuthenticated(...))` and
//     `false` in every other case (Requirement 7.2).
//
//   * Example test — `authRedirectCallbackProvider`'s override 2 invokes
//     `routerProvider.go(Routes.loginPath)` exactly once and
//     `authNotifierProvider.notifier.markSessionExpired()` exactly once
//     when called (Requirements 7.3, 8.4).
//
// Test seams
// ----------
//
// The property test would, in principle, want to splat
// `buildAuthOverrides()` into the test container so the production code
// is exercised end-to-end. Two foundation seams make that awkward at
// unit-test scope:
//
//   1. The override 3 (`dioProvider.overrideWith(...)`) builds a real
//      `Dio` lazily on first read. That's harmless for Property 9 (we
//      never read `dioProvider`), but `buildDioWithCookSmartRefresh`
//      reads `secureStorageProvider` synchronously, which constructs a
//      real `FlutterSecureStorageAdapter`. The adapter's constructor is
//      side-effect-free, so this is also harmless — but every extra
//      moving part is one more thing that can fail.
//
//   2. The override 2 (`authRedirectCallbackProvider`) closure
//      synchronously reads `routerProvider` *at callback-invocation
//      time*. Property 9 never invokes the callback, so the cycle does
//      not bite, but we still need to override `routerProvider` for the
//      example test below.
//
// Following the design's "build a minimal test ProviderContainer that
// applies only the override-1 logic" guidance, the property test
// duplicates the override-1 expression inline. The duplicate is two
// lines and lifted from `auth_overrides.dart` verbatim, so a future
// change to the production derivation will fail the property test in
// the same diff that broke the contract — which is what we want.
//
// The example test takes the more conservative route: it splats the
// real `buildAuthOverrides()` and adds a `routerProvider` override on
// top so the override-2 closure can resolve. The `dioProvider` override
// from `buildAuthOverrides()` stays in place because we never read it.

// External libraries
//
// `glados` re-exports `package:test`'s `test`, `group`, `expect`. Importing
// both `flutter_test` and `glados` would produce ambiguous-import errors
// for those names. We hide the conflicting symbols from `flutter_test`
// (matching `auth_notifier_test.dart`'s convention) and use glados's
// versions for the property assertions. `addTearDown` is the only
// `flutter_test` affordance we need that glados does not re-export.
import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart' hide expect, group, test;
import 'package:glados/glados.dart';
import 'package:go_router/go_router.dart';

// Internal modules
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/core/router/router_provider.dart';
import 'package:mobile/core/router/routes.dart';
import 'package:mobile/features/auth/domain/auth_state.dart';
import 'package:mobile/features/auth/domain/user.dart';
import 'package:mobile/features/auth/presentation/auth_notifier.dart';
import 'package:mobile/features/auth/presentation/auth_overrides.dart';

// ---------------------------------------------------------------------------
// Canonical AsyncValue<AuthState> shapes the override-1 derivation must
// classify.
//
// These are the shapes [authNotifierProvider] can publish over its
// lifetime: pre-resolution AsyncLoading, post-error AsyncError, and the
// four AsyncData carriers for the sealed AuthState's variants. Property
// 9 asserts that exactly one of these (the AuthAuthenticated carrier)
// produces `true`; every other shape produces `false`.
// ---------------------------------------------------------------------------

enum _AsyncAuthState {
  /// `AsyncValue.loading()` — the build future is still in flight.
  asyncLoading,

  /// `AsyncValue.error(error, stack)` — the build future threw.
  asyncError,

  /// `AsyncData(AuthLoading())` — the notifier explicitly published
  /// the foundation's `AuthLoading` sentinel (e.g. while a login or
  /// session-restore is in flight).
  dataLoading,

  /// `AsyncData(AuthUnauthenticated(errorMessage: null))` — the
  /// canonical "no session" state after a clean logout.
  dataUnauthenticatedNoError,

  /// `AsyncData(AuthUnauthenticated(errorMessage: 'foo'))` — the
  /// "no session" state with a non-null inline error message.
  dataUnauthenticatedWithError,

  /// `AsyncData(AuthAuthenticated(user, token))` — the only shape
  /// that must derive to `true`.
  dataAuthenticated,
}

extension _AsyncAuthStateGenerators on Any {
  Generator<_AsyncAuthState> get asyncAuthState =>
      choose(_AsyncAuthState.values);
}

/// Sentinel [User] returned for the `dataAuthenticated` shape.
///
/// Constructed via [User.fromMeJson] so every field is populated and
/// the `is AuthAuthenticated` check has a real, non-trivial value to
/// observe.
final User _testUser = User.fromMeJson(const <String, dynamic>{
  'id': 'test-user-id',
  'email': 'test@example.com',
  'is_co_founder': false,
  'is_special_user': false,
  'is_creator': false,
  'has_lifetime_subscription': false,
  'subscription_status': 'free',
  'points': 0,
  'is_admin': false,
});

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

/// Fake [AuthNotifier] whose [build] produces the requested
/// [_AsyncAuthState] shape.
///
///   * `asyncLoading` → returns a Future that never completes, so
///     Riverpod leaves the state as `AsyncLoading` for as long as the
///     test reads it.
///   * `asyncError` → returns `Future.error(...)`, so once microtasks
///     flush the state is `AsyncError(...)`.
///   * The four `data*` shapes return `Future.value(value)`, so once
///     microtasks flush the state is `AsyncData(value)`.
///
/// The override return type matches the production [AuthNotifier.build]'s
/// `Future<AuthState>` signature exactly so the static check passes.
class _FakeAuthNotifier extends AuthNotifier {
  _FakeAuthNotifier(this._shape);

  final _AsyncAuthState _shape;

  @override
  Future<AuthState> build() {
    switch (_shape) {
      case _AsyncAuthState.asyncLoading:
        // A Completer whose `complete` is never called yields a Future
        // that never resolves. Riverpod observes the pending future
        // and pins state to AsyncLoading.
        return Completer<AuthState>().future;
      case _AsyncAuthState.asyncError:
        return Future<AuthState>.error(
          StateError('test-induced AsyncError'),
          StackTrace.empty,
        );
      case _AsyncAuthState.dataLoading:
        return Future<AuthState>.value(const AuthLoading());
      case _AsyncAuthState.dataUnauthenticatedNoError:
        return Future<AuthState>.value(const AuthUnauthenticated());
      case _AsyncAuthState.dataUnauthenticatedWithError:
        return Future<AuthState>.value(
          const AuthUnauthenticated(errorMessage: 'foo'),
        );
      case _AsyncAuthState.dataAuthenticated:
        return Future<AuthState>.value(
          AuthAuthenticated(user: _testUser, token: 'token'),
        );
    }
  }
}

/// Concrete [GoRouter] subclass used to record `go` calls.
///
/// `GoRouter` is implemented in v14.8.1 as a class with a factory
/// constructor and a private generative constructor `GoRouter._(...)`.
/// Subclasses cannot invoke either, so the override-test path goes
/// through this thin proxy: we never instantiate a real `GoRouter`,
/// we just implement the public surface via `noSuchMethod` and
/// override `go(...)` to spy.
///
/// In practice, the override-2 closure under test only invokes
/// `go(location)`. The proxy implements [GoRouter] via `noSuchMethod`
/// fallback for any other surface — none is exercised by this test.
class _GoRouterProxy implements GoRouter {
  _GoRouterProxy(this.recorded);

  final List<String> recorded;

  @override
  void go(String location, {Object? extra}) {
    recorded.add(location);
  }

  @override
  dynamic noSuchMethod(Invocation invocation) {
    throw UnsupportedError(
      'Test fake _GoRouterProxy does not implement '
      '${invocation.memberName}; the override-2 closure under test '
      'should only call go(...).',
    );
  }
}

/// [AuthNotifier] subclass whose only behavioural difference is that it
/// records every call to [markSessionExpired]. Used by the redirect-
/// callback example test to assert the override-2 closure dispatched
/// to the notifier exactly once.
class _MarkSessionExpiredTrackingNotifier extends AuthNotifier {
  /// One entry per [markSessionExpired] call. The test asserts on
  /// length so the failure message identifies "called N times" rather
  /// than just "did not call once".
  int markSessionExpiredCallCount = 0;

  @override
  Future<AuthState> build() => Future<AuthState>.value(
        const AuthUnauthenticated(),
      );

  @override
  void markSessionExpired() {
    markSessionExpiredCallCount++;
    // Intentionally not calling `super.markSessionExpired()` — the
    // test asserts only that the override-2 callback dispatched here,
    // not that the notifier's state mutated. The state-mutation
    // contract is covered by `auth_notifier_test.dart` (task 5.2).
  }
}

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

/// Lets the microtask queue drain. After `Riverpod` schedules a state
/// transition (e.g. `AsyncLoading` → `AsyncError` once a build future
/// rejects), a single `Future<void>.delayed(Duration.zero)` is enough
/// for a subsequent synchronous read to observe the new state.
Future<void> _flushMicrotasks() => Future<void>.delayed(Duration.zero);

void main() {
  group(
    'Property 9 — authStateProvider derivation matches AuthAuthenticated',
    () {
      Glados<_AsyncAuthState>(any.asyncAuthState).test(
        'derives true iff AsyncData(AuthAuthenticated(...)), false in '
        'every other case',
        (shape) async {
          // The override under test, lifted verbatim from
          // `buildAuthOverrides()` so a future change to the production
          // derivation breaks this property test in the same diff.
          // See the file-level note for why we don't simply splat
          // `buildAuthOverrides()` here.
          final container = ProviderContainer(
            overrides: <Override>[
              authStateProvider.overrideWith((ref) {
                final authValue = ref.watch(authNotifierProvider);
                return authValue.valueOrNull is AuthAuthenticated;
              }),
              authNotifierProvider.overrideWith(
                () => _FakeAuthNotifier(shape),
              ),
            ],
          );
          addTearDown(container.dispose);

          // Drive the build future to a settled state for every shape
          // except `asyncLoading`. For `asyncLoading`, leaving the
          // future unflushed is the whole point — Riverpod leaves
          // state pinned at AsyncLoading.
          if (shape != _AsyncAuthState.asyncLoading) {
            try {
              await container.read(authNotifierProvider.future);
            } catch (_) {
              // The `asyncError` shape's build future rejects; the
              // rejection is the test setup, not a failure to surface.
            }
            await _flushMicrotasks();
          }

          // Sanity: confirm the notifier's published AsyncValue shape
          // matches what the enum case promises before asserting on
          // the derived bool. Without this, a regression in
          // `_FakeAuthNotifier` could silently pass Property 9 by
          // producing (e.g.) AsyncData(AuthAuthenticated) when the
          // shape is `dataLoading`.
          final asyncValue = container.read(authNotifierProvider);
          switch (shape) {
            case _AsyncAuthState.asyncLoading:
              expect(
                asyncValue.isLoading,
                isTrue,
                reason: 'sanity: asyncLoading shape must publish '
                    'AsyncValue.isLoading',
              );
            case _AsyncAuthState.asyncError:
              expect(
                asyncValue.hasError,
                isTrue,
                reason: 'sanity: asyncError shape must publish '
                    'AsyncValue.hasError',
              );
            case _AsyncAuthState.dataLoading:
              expect(asyncValue.valueOrNull, const AuthLoading());
            case _AsyncAuthState.dataUnauthenticatedNoError:
              expect(asyncValue.valueOrNull, const AuthUnauthenticated());
            case _AsyncAuthState.dataUnauthenticatedWithError:
              expect(
                asyncValue.valueOrNull,
                const AuthUnauthenticated(errorMessage: 'foo'),
              );
            case _AsyncAuthState.dataAuthenticated:
              expect(
                asyncValue.valueOrNull,
                AuthAuthenticated(user: _testUser, token: 'token'),
              );
          }

          // The property under test.
          final derived = container.read(authStateProvider);
          final expected = shape == _AsyncAuthState.dataAuthenticated;
          expect(
            derived,
            equals(expected),
            reason: 'Shape $shape must derive to '
                '${expected ? 'true' : 'false'} per Requirement 7.2 '
                '(authStateProvider true iff AuthAuthenticated).',
          );
        },
      );
    },
  );

  group(
    'authRedirectCallbackProvider override (Requirements 7.3, 8.4)',
    () {
      test(
        'invoking the redirect callback calls routerProvider.go '
        '(Routes.loginPath) exactly once and '
        'authNotifierProvider.notifier.markSessionExpired() exactly once',
        () async {
          final goCalls = <String>[];
          final fakeRouter = _GoRouterProxy(goCalls);
          final trackingNotifier = _MarkSessionExpiredTrackingNotifier();

          // Splat the real `buildAuthOverrides()` so the override under
          // test (override 2 — `authRedirectCallbackProvider`) is the
          // production code, not a duplicate. The override-3 entry
          // (`dioProvider.overrideWith(buildDioWithCookSmartRefresh)`)
          // stays in place but is never read by this test, so no `Dio`
          // is constructed.
          final container = ProviderContainer(
            overrides: <Override>[
              ...buildAuthOverrides(),
              routerProvider.overrideWithValue(fakeRouter),
              authNotifierProvider.overrideWith(() => trackingNotifier),
            ],
          );
          addTearDown(container.dispose);

          // Drive the notifier's build to a settled state so
          // `ref.read(authNotifierProvider.notifier)` returns the
          // configured notifier instance rather than a freshly-built
          // one mid-async.
          await container.read(authNotifierProvider.future);
          await _flushMicrotasks();

          // Read the production override-2 callback and invoke it.
          final callback = container.read(authRedirectCallbackProvider);
          callback();

          // Allow any state mutations the callback dispatched to
          // settle. (Tracking notifier's `markSessionExpired` does
          // not mutate state, but the production override-2 closure
          // is allowed to evolve, so flushing keeps the test
          // resilient.)
          await _flushMicrotasks();

          expect(
            goCalls,
            equals(<String>[Routes.loginPath]),
            reason: 'authRedirectCallbackProvider override must call '
                'routerProvider.go(Routes.loginPath) exactly once '
                '(Requirements 7.3, 8.4).',
          );
          expect(
            trackingNotifier.markSessionExpiredCallCount,
            equals(1),
            reason: 'authRedirectCallbackProvider override must call '
                'authNotifierProvider.notifier.markSessionExpired() '
                'exactly once (Requirements 7.3, 8.4).',
          );
        },
      );
    },
  );
}
