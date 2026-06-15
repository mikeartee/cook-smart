// Cook Smart Flutter mobile app entry point.
//
// Bootstrap sequence (Requirements 3.3, 16.1, 16.2, 16.3, 16.4, 16.5,
// 17.1) executed before the first screen renders:
//
//   1. `WidgetsFlutterBinding.ensureInitialized()` so platform plugin
//      channels are wired before the first async hop.
//   2. `Firebase.initializeApp()` to load the platform-specific
//      configuration and authorise the Firebase SDK against the
//      Crashlytics project dedicated to the Mobile_App
//      (Requirement 16.4). The Android configuration file
//      `mobile/android/app/google-services.json` is provisioned
//      separately by infrastructure and is excluded from version
//      control per Requirement 17.3 — `.gitignore` therefore covers
//      it and Task 1.4 enforces that exclusion.
//   3. Register `FlutterError.onError` so every uncaught Flutter
//      framework error is forwarded with stack trace and the fatal
//      flag set to Crashlytics within 1 second of capture
//      (Requirement 16.1). The forward target is the
//      `recordFlutterFatalError` method which already encodes both
//      the stack trace and the fatal flag, so a wrapping closure is
//      unnecessary.
//   4. Register `PlatformDispatcher.instance.onError` so every
//      uncaught asynchronous Dart error is forwarded with stack
//      trace and the fatal flag to Crashlytics within 1 second of
//      capture, and mark the error handled by returning `true`
//      (Requirement 16.2). Returning `true` prevents the platform
//      from terminating the isolate before Crashlytics finishes
//      shipping the report.
//   5. If any of steps 2–4 throws, abort startup before the first
//      screen renders (Requirement 16.3), make a best-effort attempt
//      to deliver the abort-time crash to Crashlytics
//      (Requirement 16.5), and mount a minimal failure screen that
//      explains crash reporting could not be initialised. The
//      failure screen intentionally does not depend on the
//      foundation (theme, router, providers) because the foundation
//      is exactly what just failed.
//   6. On success, `runApp` mounts `CookSmartApp` inside a single
//      top-level `ProviderScope` so every descendant widget can
//      resolve providers without additional scopes
//      (Requirements 3.3, 17.1).
//
// This file is one of only two Dart sources permitted directly under
// `lib/` (alongside `app.dart`) per Requirement 2.7.

import 'dart:ui';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart' show visibleForTesting;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:mobile/app.dart';
import 'package:mobile/features/auth/presentation/auth_overrides.dart';

/// Application entry point.
///
/// Returning a `Future<void>` rather than `void` is deliberate so that
/// `Firebase.initializeApp()` can be awaited before either Crashlytics
/// handler is registered. Registering handlers before Firebase is
/// initialised would forward errors to a SDK that has not yet been
/// authorised against the Crashlytics project, violating
/// Requirement 16.4.
Future<void> main() async {
  // Step 1: ensure platform plugin channels are available before any
  // async work that might depend on them.
  WidgetsFlutterBinding.ensureInitialized();

  try {
    // Step 2: initialise Firebase. With `google-services.json` present
    // on Android, no `options` argument is required — the SDK reads
    // platform-native configuration. Failure here (missing config,
    // network unavailable, plugin channel error) is caught by the
    // outer `try` and routes through the abort path below.
    await Firebase.initializeApp();

    // Step 3: route every uncaught Flutter framework error to
    // Crashlytics. `recordFlutterFatalError` already attaches the
    // stack trace from `FlutterErrorDetails` and marks the report
    // fatal, so the assignment is the entire registration.
    FlutterError.onError =
        FirebaseCrashlytics.instance.recordFlutterFatalError;

    // Step 4: route every uncaught asynchronous Dart error to
    // Crashlytics with the fatal flag set, and return `true` to mark
    // the error handled so the platform does not force-close the
    // isolate before Crashlytics ships the report.
    PlatformDispatcher.instance.onError = (Object error, StackTrace stack) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      return true;
    };
  } catch (error, stack) {
    // Step 5: abort startup. Any failure between Firebase init and
    // the second handler assignment lands here. We still try to
    // deliver the abort cause to Crashlytics (Requirement 16.5)
    // before mounting the static failure screen
    // (Requirement 16.3). The inner `try` is required because the
    // failing dependency may itself be Crashlytics — for example,
    // `Firebase.initializeApp()` returning before any plugin is
    // ready. In that case we silently fall through to the failure
    // screen rather than throwing on top of the original error.
    try {
      await FirebaseCrashlytics.instance.recordError(
        error,
        stack,
        fatal: true,
        reason: 'Bootstrap failure: crash reporting initialisation aborted',
      );
    } catch (_) {
      // Crashlytics itself is unavailable; nothing further to do.
    }

    runApp(const _BootstrapFailureApp());
    return;
  }

  // Step 6: mount the app under the single top-level `ProviderScope`,
  // applying the auth feature's foundation overrides
  // (Requirements 7.4, 7.6, 8.2). `buildAuthOverrides()` returns the
  // three entries described in Decision 3 of the flutter-port-auth
  // design — `authStateProvider`, `authRedirectCallbackProvider`, and
  // `dioProvider`. We splat the list into this single existing
  // `ProviderScope` rather than nesting a second scope so the
  // foundation's "exactly one root scope" invariant
  // (Requirement 17.1) is preserved. The scope can no longer be
  // `const` because `buildAuthOverrides()` is a runtime call, but the
  // child widget remains `const` so its subtree is still cached.
  runApp(
    ProviderScope(
      overrides: buildAuthOverrides(),
      child: const CookSmartApp(),
    ),
  );
}

/// Test-only seam that returns a fresh instance of the bootstrap failure
/// widget mounted by the abort path in [main].
///
/// `_BootstrapFailureApp` is intentionally private to this library so the
/// failure UI cannot be reached from production code outside the abort
/// branch. Unit and widget tests for Task 8.3 of the
/// flutter-migration-architecture spec need to pump the widget directly
/// to verify the on-screen copy required by Requirement 16.3, so this
/// `@visibleForTesting` factory exposes it without making the class
/// public. Lints flag any non-test consumer.
@visibleForTesting
Widget bootstrapFailureAppForTesting() => const _BootstrapFailureApp();

/// Static fallback widget mounted when the bootstrap sequence aborts.
///
/// Rendered in place of `CookSmartApp` when crash reporting cannot be
/// initialised (Requirement 16.3). This widget intentionally avoids
/// every foundation dependency — theme, router, Riverpod, even
/// `AppConfig` — because the abort path runs precisely because one of
/// those layers failed to come up. Re-entering the foundation here
/// would risk a second crash on top of the first.
///
/// The text deliberately does not surface the underlying error
/// message to the user; the operator-facing record is shipped to
/// Crashlytics in `main` via `recordError`. The user-facing copy
/// suggests the only two recovery paths the user can take without a
/// build environment: reinstall or contact support.
class _BootstrapFailureApp extends StatelessWidget {
  const _BootstrapFailureApp();

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'Cook Smart',
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  Icon(Icons.error_outline, size: 64),
                  SizedBox(height: 16),
                  Text(
                    'Cook Smart could not start',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  SizedBox(height: 12),
                  Text(
                    'Crash reporting failed to initialise. Please '
                    'reinstall the app or contact support.',
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
