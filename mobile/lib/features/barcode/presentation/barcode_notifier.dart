// BarcodeNotifier — the Riverpod state machine that drives the
// barcode-scan-to-pantry flow.
//
// `BarcodeNotifier` is the single source of truth for the [ScanState]
// surfaced into the three barcode screens (`BarcodeScannerScreen`,
// `ManualBarcodeEntryScreen`, `ScannedProductConfirmationScreen`). Every
// transition the state machine makes — camera permission, OFF lookup,
// ingredient add, lifecycle response, retry counter book-keeping —
// happens here, and the screens consume the state via
// `ref.watch(barcodeNotifierProvider)`.
//
// Decision recap (flutter-port-barcode design)
// --------------------------------------------
//
// Decision 1 — the notifier holds a [CameraController] reference, never
// a `MobileScannerController` directly. The concrete adapter lives in
// `data/mobile_scanner_camera_controller.dart` and is the only file
// under `features/barcode/` that imports `package:mobile_scanner`. This
// notifier reads the controller via [cameraControllerProvider]
// (Requirement 2.12).
//
// Decision 2 — the provider is `AsyncNotifierProvider.autoDispose`, no
// `keepAlive`. The same notifier is shared across the three barcode
// screens for the duration of a Scan_Session; popping out of the
// scanner subtree triggers Riverpod auto-dispose, which in turn
// releases the camera and cancels any in-flight HTTP request via the
// `ref.onDispose` hook registered in [build] (Requirement 8.7).
//
// Decision 3 — barcode-detection callbacks are debounced **in the
// notifier**, not by stopping the camera. The notifier subscribes to
// `_camera.rawDetections` once in [build] and gates consumption on the
// `_consumingDetections` flag (true only while `state ==
// ScanCameraActive`). A 1000 ms `_lastLookupAt` rate limit applies on
// top so two valid detections in rapid succession resolve as
// most-recent-wins (Requirements 9.3, 12.5, 12.6).
//
// Decision 5 — the 3-attempt retry limit is owned here. The notifier
// keeps two private counters, [_lookupRetryCount] and [_addRetryCount],
// and exposes the corresponding `retriesRemainingForLookup` and
// `retriesRemainingForAdd` getters (each `max(0, 3 - count)`) for the
// modal "Retry" button gating (Requirements 11.4, 11.5, 11.8).
//
// Cross-feature isolation (Requirements 1.5, 6.4, 6.5)
// ----------------------------------------------------
//
// The notifier never imports any file under `mobile/lib/features/auth/`
// directly. The `authNotifierProvider`, the [AuthState] sealed family,
// and `package:dio`'s [CancelToken] are read through the foundation-
// visible re-export at `mobile/lib/core/network/auth_provider.dart`,
// which is the only sanctioned bridge for cross-feature auth-state
// consumption per the flutter-port-barcode spec.
//
// Failure mapping (design's "Notifier-level handling" table)
// ----------------------------------------------------------
//
// Every typed [ApiException] subtype maps to exactly one
// [ScanFailureReason]; the screens render a category-specific UI off
// the resulting `ScanFailed` variant:
//
//   * OFF lookup `NetworkException`   → `ScanFailed(network)`
//                                       (modal "Lookup Failed", Retry
//                                       gated on `retriesRemainingForLookup`)
//   * OFF lookup `ServerException`    → `ScanFailed(server)`
//                                       (modal "Lookup Failed", Retry)
//   * Ingredient `NetworkException`   → `ScanFailed(network)`
//                                       (modal "Add Failed", Retry
//                                       gated on `retriesRemainingForAdd`)
//   * Ingredient `ServerException`    → `ScanFailed(server)`
//                                       (modal "Add Failed", Retry)
//   * Ingredient `ValidationException`→ `ScanFailed(validation)`
//                                       (inline error, no retry counter
//                                        increment — fix the form, not
//                                        the network)
//   * Ingredient `UnauthorisedException` → `ScanFailed(sessionExpired)`
//                                       (router redirect runs in
//                                        parallel via Auth_Feature wiring)
//   * Camera controller hard failure  → `ScanFailed(cameraUnavailable)`
//   * Defence-in-depth auth failure   → `ScanFailed(notAuthenticated)`
//                                       (router redirect is the primary
//                                        gate; this state is observed
//                                        only in tests)
//
// In-flight `AuthUnauthenticated` emissions transition any in-flight
// state to `ScanFailed(sessionExpired)` and stop the camera; the
// router redirect, driven by the Auth_Feature's
// `authRedirectCallbackProvider` override, replaces the screen with
// `LoginScreen` before the user could see the failure UI.
//
// Reference: flutter-port-barcode Requirements 1.5, 2.3-2.10, 3.3-3.5,
// 6.3-6.5, 7.8, 8.3, 8.5, 8.6, 8.7, 8.10, 9.2, 9.3, 10.3, 10.5, 11.4,
// 11.5, 11.8, 12.2, 12.5, 12.6, 12.7.

// External libraries
import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Internal modules
import 'package:mobile/core/network/api_exception.dart';
// Foundation-visible bridge: re-exports `authNotifierProvider`, the
// [AuthState] sealed family, and `CancelToken`. The notifier MUST NOT
// import `mobile/lib/features/auth/...` directly per Requirement 1.5,
// and MUST NOT import `package:dio/...` per architecture lint R-4.8.
import 'package:mobile/core/network/auth_provider.dart';
import 'package:mobile/features/barcode/data/barcode_repository.dart';
import 'package:mobile/features/barcode/data/ingredient_add_response.dart';
import 'package:mobile/features/barcode/data/mobile_scanner_camera_controller.dart';
import 'package:mobile/features/barcode/data/off_lookup_response.dart';
import 'package:mobile/features/barcode/domain/camera_controller.dart';
import 'package:mobile/features/barcode/domain/camera_permission_state.dart';
import 'package:mobile/features/barcode/domain/ingredient_to_add.dart';
import 'package:mobile/features/barcode/domain/scan_state.dart';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/// Validation regex pinned by Requirement 3.1: 8–13 ASCII digits, no
/// whitespace, no leading or trailing characters.
final RegExp _kBarcodePattern = RegExp(r'^[0-9]{8,13}$');

/// Soft rate limit between successive `submitBarcode` attempts within
/// the same camera-on session (Requirement 12.6 / Decision 3). A
/// detection-driven submit that arrives inside this window from a
/// previous one is dropped; the most recent valid detection wins.
const Duration _kDetectionRateLimitWindow = Duration(milliseconds: 1000);

/// Maximum number of retry attempts the modal "Retry" button surfaces
/// before disabling itself per Requirements 11.4, 11.5, 11.8 / Decision
/// 5. A fresh entry path (`submitBarcode` for lookup, a new
/// `confirmAdd` ingredient for add) resets the corresponding counter.
const int _kMaxRetries = 3;

/// User-facing description threaded into [ScanFailed.description] for a
/// `notAuthenticated` defence-in-depth failure (Requirement 6.4). The
/// router redirect is the primary gate; this description is observed
/// only in tests because the redirect replaces the screen before the
/// failure UI renders.
const String _kNotAuthenticatedDescription =
    'You must be signed in to scan barcodes.';

/// User-facing description threaded into [ScanFailed.description] for a
/// `sessionExpired` failure — emitted on either an in-flight
/// `AuthUnauthenticated` emission (Requirement 6.5) or a 401 from the
/// Ingredient_Endpoint (Requirement 5.8). Mirrors the
/// `kAuthSessionExpiredMessage` literal owned by the auth feature so a
/// future deduplication can reach for it without a copy edit.
const String _kSessionExpiredDescription = 'Your session has expired.';

/// User-facing description threaded into [ScanFailed.description] for a
/// `cameraUnavailable` failure (Requirement 12.3). The user falls back
/// to manual entry; the inline error region surfaces this exact text.
const String _kCameraUnavailableDescription =
    'The camera is unavailable on this device.';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/// Application-wide [BarcodeNotifier] / [ScanState] provider.
///
/// Constructed via `AsyncNotifierProvider.autoDispose<BarcodeNotifier,
/// ScanState>(BarcodeNotifier.new)` per Decision 2. The provider is
/// auto-dispose with **no** `keepAlive` — the same notifier is shared
/// across the three barcode screens for one Scan_Session, and popping
/// out of the scanner subtree triggers Riverpod auto-dispose, which
/// releases the camera and cancels any in-flight request via the
/// `ref.onDispose` hook registered in [BarcodeNotifier.build]
/// (Requirement 8.7).
///
/// The variable's static type is the [AutoDisposeAsyncNotifierProvider]
/// typedef from `package:flutter_riverpod`. It is NOT
/// `AsyncNotifierProvider<BarcodeNotifier, ScanState>`, because
/// `AsyncNotifierProvider.autoDispose<...>` returns
/// `AutoDisposeAsyncNotifierProviderImpl<...>` (which the typedef
/// aliases) — that class does not extend `AsyncNotifierProvider`,
/// so the more specific type is the only assignable one. Consumers
/// who watch this provider via `ref.watch(barcodeNotifierProvider)`
/// get an `AsyncValue<ScanState>` regardless of the provider's
/// concrete type.
final AutoDisposeAsyncNotifierProvider<BarcodeNotifier, ScanState>
    barcodeNotifierProvider =
    AsyncNotifierProvider.autoDispose<BarcodeNotifier, ScanState>(
  BarcodeNotifier.new,
);

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

/// Riverpod `AutoDisposeAsyncNotifier` driving the barcode scan-to-
/// pantry state machine.
///
/// The build future resolves synchronously to `ScanIdle()`
/// (Requirement 8.6) so consumers observe `AsyncData(ScanIdle())`
/// immediately on first read. State transitions thereafter are
/// performed by the public methods documented below; every method is
/// safe to call before the build future resolves and after the
/// notifier has been disposed (post-dispose calls are no-ops per
/// Requirement 8.10).
///
/// Methods never rethrow to the calling widget. Every failure category
/// maps to a [ScanFailed] state with a category-specific
/// [ScanFailureReason]; the screens render inline errors, modal
/// alerts, or redirect-to-login banners based on that reason.
class BarcodeNotifier extends AutoDisposeAsyncNotifier<ScanState> {
  // -- Cached collaborators -----------------------------------------------

  /// Camera controller borrowed from [cameraControllerProvider] in
  /// [build]. Cached so [_handleDispose] can `stop()` synchronously
  /// without re-reading the provider after the notifier has begun
  /// tearing down.
  CameraController? _camera;

  /// Repository borrowed from [barcodeRepositoryProvider] in [build].
  /// Cached for the same reason as [_camera] and so the per-method
  /// call sites are not littered with `ref.read(...)`.
  BarcodeRepository? _repo;

  // -- Detection consumption ---------------------------------------------

  /// Long-lived subscription on `_camera.rawDetections`. The
  /// underlying stream is broadcast and outlives any single state
  /// transition, so subscribing once in [build] avoids the camera
  /// having to be restarted on a "Try Again" outcome (Decision 3).
  ///
  /// The stream remains subscribed even while the camera is stopped;
  /// no events arrive in that case, so the subscription has zero
  /// runtime cost.
  ///
  /// The lint cannot statically prove cancellation because the
  /// subscription is created in [build] and cancelled in
  /// [_handleDispose]; the notifier's lifecycle invariant (every
  /// `build` is paired with `_handleDispose` registered through
  /// `ref.onDispose`) makes the cleanup contract correct, so the
  /// warning is suppressed at the field declaration.
  // ignore: cancel_subscriptions
  StreamSubscription<String>? _detectionSubscription;

  /// Set to `true` only while `state == ScanCameraActive` (Decision
  /// 3). The detection-stream listener checks this flag first and
  /// returns early when `false`, so detections that arrive during
  /// `ScanLookingUp`, the confirmation modal, or any failure state
  /// are dropped silently rather than triggering another lookup.
  bool _consumingDetections = false;

  /// Wall-clock timestamp of the most recently-dispatched
  /// `submitBarcode` invocation. Used by the camera-detection path
  /// to enforce the soft 1000 ms rate limit per Requirement 12.6:
  /// detections that arrive within
  /// [_kDetectionRateLimitWindow] of the previous one are deferred
  /// (most-recent-wins).
  ///
  /// Manual-entry submissions bypass this gate — the user has
  /// explicitly tapped a button, so the rate limit's purpose
  /// (preventing camera misreads from generating bursts of HTTP
  /// requests) does not apply.
  DateTime? _lastLookupAt;

  // -- Retry counters (Decision 5 / Property 11) -------------------------

  /// Number of failed `submitBarcode` retries in the current Scan_
  /// Session. The user-facing `retriesRemainingForLookup` getter
  /// returns `max(0, _kMaxRetries - _lookupRetryCount)`, which is
  /// `_kMaxRetries` immediately after the first failure and drops
  /// monotonically as the user taps Retry. A fresh `submitBarcode`
  /// call (camera detection or manual entry) resets the counter to
  /// zero per Property 11.
  int _lookupRetryCount = 0;

  /// Number of failed `confirmAdd` retries against the same
  /// [_lastConfirmedIngredient]. Reset to zero whenever
  /// `confirmAdd` is invoked with a different ingredient
  /// (`!= _lastConfirmedIngredient`) per Decision 5.
  int _addRetryCount = 0;

  // -- Retry context -----------------------------------------------------

  /// The most-recently-validated barcode dispatched by
  /// `submitBarcode`. `retryLookup` re-uses this value rather than
  /// re-validating an empty input, so a user can tap "Retry" from
  /// the modal without typing the barcode a second time.
  String? _lastSubmittedBarcode;

  /// The most-recently-confirmed ingredient. `retryAdd` re-uses
  /// this value; `confirmAdd` invoked with a different ingredient
  /// resets the add retry counter to zero.
  IngredientToAdd? _lastConfirmedIngredient;

  // -- Cancellation and dispose guard ------------------------------------

  /// Single in-flight cancel token for either the OFF lookup or the
  /// ingredient add — never both at once, because the two flows are
  /// strictly sequential through the state machine. Cancelled by
  /// [_handleDispose] so an in-flight HTTP request resolves
  /// deterministically when the notifier is torn down
  /// (Requirement 8.10).
  CancelToken? _cancelToken;

  /// Set to `true` after [_handleDispose] runs. Subsequent state
  /// assignments in [_setState] become no-ops so any stream callback
  /// or in-flight future that resolves after disposal cannot mutate
  /// state (Requirement 8.10).
  bool _disposed = false;

  // -- Lifecycle book-keeping --------------------------------------------

  /// Set to `true` while the camera was active (`ScanCameraActive`
  /// or `ScanLookingUp`) at the moment a `paused`/`inactive`
  /// lifecycle event fired. On the matching `resumed` event the
  /// notifier re-queries permission and re-activates the camera
  /// per Requirements 2.9, 2.10. Cleared after the resumed handler
  /// runs.
  bool _resumeNeeded = false;

  // -- AsyncNotifier override --------------------------------------------

  @override
  FutureOr<ScanState> build() {
    _camera = ref.read(cameraControllerProvider);
    _repo = ref.read(barcodeRepositoryProvider);

    // Decision 3 — subscribe to camera detections once for the lifetime
    // of the notifier. Consumption is gated by `_consumingDetections`
    // so the camera can stay running through the confirmation modal
    // without triggering another lookup. The stream is broadcast and
    // outlives any single `start`/`stop` cycle on the controller.
    _detectionSubscription =
        _camera!.rawDetections.listen(_onCameraDetection);

    // Requirement 6.5 — observe Auth_Notifier transitions for the
    // mid-session `AuthUnauthenticated` case. `ref.listen` does not
    // fire for the initial value, which is correct: the defence-in-
    // depth check in `startSession` handles the entry-time read
    // separately.
    ref
      ..listen<AsyncValue<AuthState>>(
        authNotifierProvider,
        _onAuthStateChanged,
      )
      ..onDispose(_handleDispose);

    // Build resolves synchronously to ScanIdle. Returning a non-Future
    // value from a `FutureOr` build is the documented pattern for
    // notifiers whose initial state needs no async work.
    return const ScanIdle();
  }

  // -- Public surface ----------------------------------------------------

  /// Number of additional Retry attempts the lookup-failure modal
  /// will accept before disabling its Retry button (Property 11).
  ///
  /// Returns `_kMaxRetries` immediately after the first lookup
  /// failure and drops monotonically with each `retryLookup` that
  /// also fails. Reset to `_kMaxRetries` on every fresh
  /// `submitBarcode` invocation.
  int get retriesRemainingForLookup =>
      (_kMaxRetries - _lookupRetryCount).clamp(0, _kMaxRetries);

  /// Number of additional Retry attempts the add-failure modal will
  /// accept before disabling its Retry button (Property 11).
  ///
  /// Returns `_kMaxRetries` immediately after the first add failure
  /// and drops monotonically with each `retryAdd` that also fails.
  /// Reset to `_kMaxRetries` whenever `confirmAdd` is invoked with
  /// an ingredient that does not equal `_lastConfirmedIngredient`.
  int get retriesRemainingForAdd =>
      (_kMaxRetries - _addRetryCount).clamp(0, _kMaxRetries);

  /// Entry point for opening the scanner UI.
  ///
  /// Drives the permission cascade per Requirements 2.3, 2.4, 2.5,
  /// 2.6:
  ///
  /// 1. Defence-in-depth auth check (Requirement 6.4): read
  ///    [authNotifierProvider]; if not `AuthAuthenticated`,
  ///    transition to `ScanFailed(notAuthenticated)` and issue zero
  ///    camera calls. The router redirect is the primary gate, but
  ///    this guard catches anomalous deep-link paths and tests.
  /// 2. `_camera.queryPermission()`; on `granted`, start the camera
  ///    and transition to `ScanCameraActive`.
  /// 3. On `denied`, transition to `ScanRequestingPermission` and
  ///    call `_camera.requestPermission()`. If the request resolves
  ///    `granted`, start the camera and transition to
  ///    `ScanCameraActive`. Any other outcome resolves to
  ///    `ScanPermissionDenied` with the matching reason.
  /// 4. `permanentlyDenied` and `unavailable` skip the request step
  ///    (the OS dialogue would not surface) and resolve directly to
  ///    `ScanPermissionDenied(permanentlyDenied|unavailable)`. The
  ///    screen exposes "Open Settings" or "Use Manual Entry"
  ///    accordingly.
  Future<void> startSession() async {
    if (_disposed) return;

    // Defence-in-depth auth check (Requirement 6.4).
    final authValue = ref.read(authNotifierProvider).valueOrNull;
    if (authValue is! AuthAuthenticated) {
      _setState(
        const ScanFailed(
          reason: ScanFailureReason.notAuthenticated,
          description: _kNotAuthenticatedDescription,
        ),
      );
      return;
    }

    final camera = _camera;
    if (camera == null) {
      // Defensive: build always assigns _camera before any public
      // method can be invoked, but a future refactor that delays
      // build's side effects must surface a clean `cameraUnavailable`
      // rather than silently no-op.
      _setState(
        const ScanFailed(
          reason: ScanFailureReason.cameraUnavailable,
          description: _kCameraUnavailableDescription,
        ),
      );
      return;
    }

    final initial = await _safeQueryPermission(camera);
    if (_disposed) return;

    switch (initial) {
      case CameraPermissionState.granted:
        await _activateCameraAfterGrant(camera);
        return;

      case CameraPermissionState.denied:
        _setState(const ScanRequestingPermission());
        final granted = await _safeRequestPermission(camera);
        if (_disposed) return;
        switch (granted) {
          case CameraPermissionState.granted:
            await _activateCameraAfterGrant(camera);
            return;
          case CameraPermissionState.denied:
            _setState(
              const ScanPermissionDenied(
                reason: CameraPermissionDenialReason.denied,
              ),
            );
            return;
          case CameraPermissionState.permanentlyDenied:
            _setState(
              const ScanPermissionDenied(
                reason: CameraPermissionDenialReason.permanentlyDenied,
              ),
            );
            return;
          case CameraPermissionState.unavailable:
            _setState(
              const ScanPermissionDenied(
                reason: CameraPermissionDenialReason.unavailable,
              ),
            );
            return;
        }

      case CameraPermissionState.permanentlyDenied:
        _setState(
          const ScanPermissionDenied(
            reason: CameraPermissionDenialReason.permanentlyDenied,
          ),
        );
        return;

      case CameraPermissionState.unavailable:
        _setState(
          const ScanPermissionDenied(
            reason: CameraPermissionDenialReason.unavailable,
          ),
        );
        return;
    }
  }

  /// Validates and dispatches a barcode for OFF lookup.
  ///
  /// This is the single entry point shared between camera detection
  /// (called from [_onCameraDetection]) and manual entry (called
  /// from `ManualBarcodeEntryScreen`'s submit handler) per
  /// Requirement 10.5. The validator enforces `^[0-9]{8,13}$`; on
  /// failure the call is a no-op for the camera path (the bad
  /// detection is dropped silently per Requirement 3.3) and the
  /// manual-entry screen is responsible for surfacing the inline
  /// "Barcode must be 8 to 13 digits" message.
  ///
  /// On a fresh successful submission the lookup retry counter is
  /// reset to zero (Property 11). The notifier transitions to
  /// `ScanLookingUp(barcode)` and dispatches
  /// `BarcodeRepository.lookupOpenFoodFacts`. The result maps to
  /// `ScanProductFound`, `ScanProductNotFound`, or `ScanFailed`
  /// per the design's "Notifier-level handling" table.
  Future<void> submitBarcode(String barcode) async {
    if (_disposed) return;

    if (!_kBarcodePattern.hasMatch(barcode)) {
      // Manual-entry path: the screen renders the inline error from
      // its own controller state. Camera path: the bad detection is
      // dropped silently per Requirement 3.3 — no state mutation,
      // no retry counter increment.
      return;
    }

    // A fresh `submitBarcode` (as opposed to `retryLookup`) resets
    // the lookup retry counter to zero per Property 11.
    _lookupRetryCount = 0;
    _lastSubmittedBarcode = barcode;
    _lastLookupAt = DateTime.now();

    await _runLookup(barcode);
  }

  /// Persists [ingredient] to the user's pantry via
  /// `POST /api/v1/ingredients`.
  ///
  /// Transitions to `ScanAdding(ingredient)` and dispatches
  /// `BarcodeRepository.addIngredient`. The result maps per the
  /// "Notifier-level handling" table:
  ///
  ///   * success → `ScanAdded(addedIngredientName)` where the
  ///     ingredient name is read from the backend's `custom_name`
  ///     field via [IngredientAddResponse.addedIngredientName],
  ///     falling back to the ingredient's [IngredientToAdd.customName]
  ///     when the backend returned a malformed body
  ///     (Requirement 5.6 / 9.7).
  ///   * `ValidationException` → `ScanFailed(validation)` (no retry
  ///     counter increment — the user fixes the form, not the
  ///     network).
  ///   * `UnauthorisedException` → `ScanFailed(sessionExpired)` (the
  ///     auth feature's `authRedirectCallbackProvider` override is
  ///     already navigating away by the time this state is
  ///     observed).
  ///   * `NetworkException` / `ServerException` →
  ///     `ScanFailed(network|server)` with `_addRetryCount`
  ///     incremented.
  ///
  /// Calling `confirmAdd` with an ingredient that does not equal
  /// the previous [_lastConfirmedIngredient] resets the add retry
  /// counter to zero (Decision 5 / Property 11). Calling with the
  /// same ingredient (e.g. via [retryAdd]) preserves the counter so
  /// successive failures count correctly.
  Future<void> confirmAdd(IngredientToAdd ingredient) async {
    if (_disposed) return;

    if (_lastConfirmedIngredient != ingredient) {
      _addRetryCount = 0;
      _lastConfirmedIngredient = ingredient;
    }

    await _runAdd(ingredient);
  }

  /// Re-attempts the previous lookup (Requirement 11.4 / 11.5).
  ///
  /// Increments the lookup retry counter (capped at [_kMaxRetries])
  /// and re-runs `BarcodeRepository.lookupOpenFoodFacts` against
  /// [_lastSubmittedBarcode]. A no-op when no barcode has been
  /// submitted yet or when `retriesRemainingForLookup` is zero —
  /// the modal's Retry button is disabled in that case, so
  /// `retryLookup` should not be reachable.
  Future<void> retryLookup() async {
    if (_disposed) return;
    final barcode = _lastSubmittedBarcode;
    if (barcode == null) return;
    if (retriesRemainingForLookup <= 0) return;

    _lookupRetryCount += 1;
    _lastLookupAt = DateTime.now();
    await _runLookup(barcode);
  }

  /// Re-attempts the previous add (Requirement 11.8).
  ///
  /// Increments the add retry counter (capped at [_kMaxRetries])
  /// and re-runs `BarcodeRepository.addIngredient` against
  /// [_lastConfirmedIngredient]. A no-op when no ingredient has
  /// been confirmed yet or when `retriesRemainingForAdd` is zero.
  Future<void> retryAdd() async {
    if (_disposed) return;
    final ingredient = _lastConfirmedIngredient;
    if (ingredient == null) return;
    if (retriesRemainingForAdd <= 0) return;

    _addRetryCount += 1;
    await _runAdd(ingredient);
  }

  /// Returns the camera-active preview to the foreground without
  /// re-running the permission cascade (Requirement 9.5).
  ///
  /// Used by the "Try Again" button in the `ScanProductNotFound`
  /// modal: the camera was never stopped per Decision 3, so the
  /// preview can resume detections immediately. Also used by the
  /// confirmation screen's back gesture per the state diagram.
  void resetToCameraActive() {
    if (_disposed) return;
    _setState(const ScanCameraActive());
  }

  /// Returns the notifier to `ScanIdle` and releases the camera
  /// (Requirement 9.11 / Property 9).
  ///
  /// Called by `BarcodeScannerScreen`'s `PopScope`/`WillPopScope`
  /// hook on user-driven dismissal. The auto-dispose contract
  /// covers cleanup automatically when the entire scanner subtree
  /// is popped (Decision 2), but `reset` provides a deterministic
  /// "user backed out" entry that does not depend on which
  /// `Consumer` was the last to unmount.
  Future<void> reset() async {
    if (_disposed) return;
    await _stopCameraSafely();
    _consumingDetections = false;
    _setState(const ScanIdle());
  }

  /// Forwards a Flutter [AppLifecycleState] event to the notifier.
  ///
  /// The screen registers as a `WidgetsBindingObserver` and calls
  /// this method from `didChangeAppLifecycleState`. The notifier:
  ///
  ///   * On `paused`/`inactive`/`hidden` while the camera was
  ///     active (state in `{ScanCameraActive, ScanLookingUp}`):
  ///     `_camera.stop()` is invoked to release the camera within
  ///     500 ms (Requirements 2.7, 2.8) and `_resumeNeeded` is set
  ///     so the matching `resumed` event re-activates the preview.
  ///     If the state was `ScanCameraActive`, it transitions to
  ///     `ScanIdle` per the state diagram. `ScanLookingUp` is
  ///     preserved because the in-flight HTTP request continues
  ///     in the background.
  ///   * On `resumed` while `_resumeNeeded` is set: `startSession`
  ///     is invoked to re-query permission and re-activate the
  ///     camera per Requirements 2.9, 2.10. The flag is cleared
  ///     before the call so a synchronous failure does not loop.
  ///
  /// Other lifecycle states (e.g. `detached`) are passed through
  /// to `_camera.stop()` defensively.
  Future<void> notifyLifecycleEvent(AppLifecycleState event) async {
    if (_disposed) return;

    switch (event) {
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
      case AppLifecycleState.hidden:
      case AppLifecycleState.detached:
        final wasActive = state.valueOrNull is ScanCameraActive ||
            state.valueOrNull is ScanLookingUp;
        await _stopCameraSafely();
        _consumingDetections = false;
        if (wasActive) {
          _resumeNeeded = true;
          if (state.valueOrNull is ScanCameraActive) {
            _setState(const ScanIdle());
          }
        }
        return;

      case AppLifecycleState.resumed:
        if (_resumeNeeded) {
          _resumeNeeded = false;
          await startSession();
        }
        return;
    }
  }

  // -- Auth-state listener -----------------------------------------------

  /// Listener for [authNotifierProvider] transitions (Requirement
  /// 6.5).
  ///
  /// Fires on every change after the first observation. When the
  /// notifier observes anything other than `AuthAuthenticated`
  /// while a Scan_Session is in flight, it transitions to
  /// `ScanFailed(sessionExpired)` and stops the camera. The
  /// "in flight" window is every state except `ScanIdle` and
  /// `ScanFailed` itself — emitting an additional `sessionExpired`
  /// from a state that already represents a session-expired
  /// failure is a no-op.
  ///
  /// The router redirect, driven by the auth feature's
  /// `authRedirectCallbackProvider` override, runs in parallel and
  /// will replace the screen with `LoginScreen` before the user
  /// could see this state — so in production this transition is
  /// observed only by tests. The camera stop is the user-observable
  /// effect: the device's camera light goes out immediately on
  /// session expiry, even if the redirect is briefly delayed.
  void _onAuthStateChanged(
    AsyncValue<AuthState>? previous,
    AsyncValue<AuthState> next,
  ) {
    if (_disposed) return;
    final value = next.valueOrNull;
    if (value is AuthAuthenticated) return;

    final current = state.valueOrNull;
    // Only react during an in-flight Scan_Session. ScanIdle is the
    // pre-session resting state; a fresh ScanFailed from another
    // path already represents the failure.
    if (current is ScanIdle || current is ScanFailed) return;

    // Camera stop is best-effort and may be inflight; the await is
    // deliberately not held here because the listener returns
    // synchronously. The state assignment is observable to the
    // screens immediately; the camera releases in the next 500 ms
    // (Requirement 2.7).
    unawaited(_stopCameraSafely());
    _consumingDetections = false;

    _setState(
      const ScanFailed(
        reason: ScanFailureReason.sessionExpired,
        description: _kSessionExpiredDescription,
      ),
    );
  }

  // -- Camera detection --------------------------------------------------

  /// Listener attached to `_camera.rawDetections` in [build].
  ///
  /// Implements the consumption-flag gate (Decision 3) and the
  /// 1000 ms rate-limit gate (Requirement 12.6). An invalid digit
  /// string is dropped silently per Requirement 3.3 — even when
  /// the consumption flag is true, only valid 8–13 digit inputs
  /// reach `submitBarcode`.
  void _onCameraDetection(String raw) {
    if (_disposed) return;
    if (!_consumingDetections) return;

    final last = _lastLookupAt;
    if (last != null &&
        DateTime.now().difference(last) < _kDetectionRateLimitWindow) {
      // Most-recent-wins per Requirement 12.6: the previous lookup
      // is in flight or has just resolved; drop this detection
      // rather than queueing a second submit. The user's next
      // valid detection (whether after the window or the next
      // resolution) will fire normally.
      return;
    }

    if (!_kBarcodePattern.hasMatch(raw)) return;

    // Fire-and-forget — `submitBarcode` returns once the lookup
    // resolves, but `_onCameraDetection` is a stream listener that
    // must not await.
    unawaited(submitBarcode(raw));
  }

  // -- Internal helpers --------------------------------------------------

  /// Activates the camera after a `granted` permission outcome.
  ///
  /// Sets `state` to `ScanCameraActive`, raises the consumption
  /// flag, and starts the camera. The `_consumingDetections` flag
  /// is set BEFORE `start()` is awaited so a fast first detection
  /// from the package is not dropped.
  Future<void> _activateCameraAfterGrant(CameraController camera) async {
    _setState(const ScanCameraActive());
    _consumingDetections = true;
    try {
      await camera.start();
    } catch (_) {
      // Hard camera failure (Requirement 12.3). The camera adapter's
      // contract is to translate platform errors to a coherent
      // `unavailable` permission state, so a thrown exception here
      // signals an environment we cannot recover from automatically.
      _consumingDetections = false;
      _setState(
        const ScanFailed(
          reason: ScanFailureReason.cameraUnavailable,
          description: _kCameraUnavailableDescription,
        ),
      );
    }
  }

  /// Runs an OFF lookup against [barcode] and dispatches the
  /// outcome.
  ///
  /// Shared by `submitBarcode` (initial entry) and `retryLookup`
  /// (retry entry). The retry-counter book-keeping is the caller's
  /// responsibility; this helper only owns the state-machine
  /// transition and the exception mapping.
  Future<void> _runLookup(String barcode) async {
    final repo = _repo;
    if (repo == null) return;

    _consumingDetections = false;
    _setState(ScanLookingUp(barcode: barcode));

    final cancelToken = CancelToken();
    _cancelToken = cancelToken;

    try {
      final outcome = await repo.lookupOpenFoodFacts(
        barcode,
        cancelToken: cancelToken,
      );
      if (_disposed || _cancelToken != cancelToken) return;

      switch (outcome) {
        case OffLookupProduct(:final product):
          _setState(ScanProductFound(product: product));
        case OffLookupNotFound(:final barcode):
          _setState(ScanProductNotFound(barcode: barcode));
      }
    } on UnauthorisedException catch (error) {
      if (_disposed) return;
      // OFF lookups are unauthenticated (`requiresAuth=false`), so
      // a 401 from this path is a defensive surprise. Fall through
      // to the session-expired surface so the user is never stuck.
      _setState(
        ScanFailed(
          reason: ScanFailureReason.sessionExpired,
          description: error.message,
        ),
      );
    } on ValidationException catch (error) {
      if (_disposed) return;
      // OFF does not surface validation errors, so this is similarly
      // defensive — surface as a server failure.
      _setState(
        ScanFailed(
          reason: ScanFailureReason.server,
          description: error.message,
        ),
      );
    } on NetworkException catch (error) {
      if (_disposed) return;
      _setState(
        ScanFailed(
          reason: ScanFailureReason.network,
          description: error.message,
        ),
      );
    } on ServerException catch (error) {
      if (_disposed) return;
      _setState(
        ScanFailed(
          reason: ScanFailureReason.server,
          description: error.message,
        ),
      );
      // ignore: avoid_catching_errors
    } on ArgumentError catch (error) {
      // The repository's barcode validator raises `ArgumentError`
      // synchronously for invalid input per Requirement 13.6 (c).
      // `submitBarcode` already validates upstream, so this branch
      // is reached only when an upstream caller bypasses the
      // notifier's validator (defensive). Catching `Error` is
      // normally a lint smell, but here the repository's contract
      // documents `ArgumentError` as the expected failure mode and
      // the alternative — letting the error escape Riverpod's
      // notifier — would surface as an unhandled `AsyncError`
      // instead of the more specific `ScanFailed` the screens
      // already know how to render.
      if (_disposed) return;
      _setState(
        ScanFailed(
          reason: ScanFailureReason.server,
          description: error.message.toString(),
        ),
      );
    } finally {
      if (_cancelToken == cancelToken) {
        _cancelToken = null;
      }
    }
  }

  /// Runs an ingredient-add against [ingredient] and dispatches the
  /// outcome.
  ///
  /// Shared by `confirmAdd` (initial entry) and `retryAdd` (retry
  /// entry). The retry-counter book-keeping is the caller's
  /// responsibility.
  Future<void> _runAdd(IngredientToAdd ingredient) async {
    final repo = _repo;
    if (repo == null) return;

    _consumingDetections = false;
    _setState(ScanAdding(ingredient: ingredient));

    final cancelToken = CancelToken();
    _cancelToken = cancelToken;

    try {
      final response = await repo.addIngredient(
        ingredient,
        cancelToken: cancelToken,
      );
      if (_disposed || _cancelToken != cancelToken) return;

      // Per Requirement 9.7, the success banner uses the backend's
      // resolved `custom_name` when present, falling back to the
      // ingredient's user-confirmed `customName` when the body was
      // malformed (Requirement 5.6) or the field was absent.
      final addedName = response.addedIngredientName ?? ingredient.customName;
      _setState(ScanAdded(addedIngredientName: addedName));
    } on ValidationException catch (error) {
      if (_disposed) return;
      // Inline error per Requirement 11.6; the user fixes the form,
      // not the network, so the retry counter is intentionally NOT
      // incremented.
      _setState(
        ScanFailed(
          reason: ScanFailureReason.validation,
          description: error.message,
        ),
      );
    } on UnauthorisedException catch (error) {
      if (_disposed) return;
      // 401 from `POST /api/v1/ingredients` per Requirement 5.8.
      // The Auth_Feature's `authRedirectCallbackProvider` override
      // is already replacing the screen with `LoginScreen`, so this
      // state is observed only in tests in production. The retry
      // counter is intentionally NOT incremented — re-submitting
      // would just hit another 401.
      _setState(
        ScanFailed(
          reason: ScanFailureReason.sessionExpired,
          description: error.message,
        ),
      );
    } on NetworkException catch (error) {
      if (_disposed) return;
      _setState(
        ScanFailed(
          reason: ScanFailureReason.network,
          description: error.message,
        ),
      );
    } on ServerException catch (error) {
      if (_disposed) return;
      _setState(
        ScanFailed(
          reason: ScanFailureReason.server,
          description: error.message,
        ),
      );
      // ignore: avoid_catching_errors
    } on StateError catch (error) {
      // `IngredientToAdd.toBackendJson` raises `StateError` for
      // out-of-bounds fields per Requirement 7.6. Surface as a
      // validation failure so the form-level UI on the confirmation
      // screen renders the diagnostic verbatim. Catching `Error` is
      // normally a lint smell, but here the domain model's contract
      // documents `StateError` as the expected failure mode for
      // out-of-bounds confirmation-form input — letting the error
      // escape Riverpod would surface as an unhandled `AsyncError`
      // instead of the more specific `ScanFailed(validation)` the
      // screens already render.
      if (_disposed) return;
      _setState(
        ScanFailed(
          reason: ScanFailureReason.validation,
          description: error.message,
        ),
      );
    } finally {
      if (_cancelToken == cancelToken) {
        _cancelToken = null;
      }
    }
  }

  /// Reads the camera's current permission state, treating any
  /// thrown exception as `unavailable` per Requirement 12.3.
  ///
  /// `mobile_scanner` does not throw from its query helper in
  /// practice, but a future iOS adapter or a test fake might —
  /// catching here keeps the cascade robust against adapter bugs.
  Future<CameraPermissionState> _safeQueryPermission(
    CameraController camera,
  ) async {
    try {
      return await camera.queryPermission();
    } catch (_) {
      return CameraPermissionState.unavailable;
    }
  }

  /// Requests camera permission, treating any thrown exception as
  /// `unavailable`. See [_safeQueryPermission] for the rationale.
  Future<CameraPermissionState> _safeRequestPermission(
    CameraController camera,
  ) async {
    try {
      return await camera.requestPermission();
    } catch (_) {
      return CameraPermissionState.unavailable;
    }
  }

  /// Stops the camera if one is held, swallowing any thrown
  /// exception. Used by every cleanup path
  /// (`paused`/`inactive`/dispose/`reset`/auth-listener) so a
  /// camera that is already stopped or in an error state cannot
  /// crash the notifier mid-transition.
  Future<void> _stopCameraSafely() async {
    final camera = _camera;
    if (camera == null) return;
    try {
      await camera.stop();
    } catch (_) {
      // `stop` is documented as safe to call in any state. If the
      // adapter still throws, the most useful action is to drop the
      // failure on the floor — the alternative would be to surface
      // a `cameraUnavailable` here, but that would clobber whatever
      // failure state caused us to call `stop` in the first place.
    }
  }

  /// Disposal handler registered via `ref.onDispose` in [build].
  ///
  /// Cancels any in-flight `CancelToken`, stops the camera within
  /// the 500 ms budget (Requirement 2.7), cancels the long-lived
  /// detection subscription, and sets `_disposed` so any
  /// post-dispose `state =` assignment via [_setState] is a no-op
  /// (Requirement 8.10).
  ///
  /// The handler is synchronous because `ref.onDispose`'s callback
  /// shape is `void Function()`. The async work it triggers
  /// (`camera.stop()`, `subscription.cancel()`) is fired and
  /// allowed to complete in the background — the
  /// `Provider.autoDispose<CameraController>` binding from
  /// `data/mobile_scanner_camera_controller.dart` also tears the
  /// adapter down, so a stop that is briefly pending here will be
  /// completed by that side regardless.
  void _handleDispose() {
    _disposed = true;
    _consumingDetections = false;

    final cancelToken = _cancelToken;
    _cancelToken = null;
    if (cancelToken != null && !cancelToken.isCancelled) {
      cancelToken.cancel('BarcodeNotifier disposed');
    }

    final subscription = _detectionSubscription;
    _detectionSubscription = null;
    if (subscription != null) {
      unawaited(subscription.cancel());
    }

    unawaited(_stopCameraSafely());
  }

  /// Guarded `state` setter. Becomes a no-op after [_handleDispose]
  /// has run so callbacks that resolve after disposal cannot mutate
  /// state and trigger Riverpod's "modified after dispose" assertion
  /// (Requirement 8.10).
  void _setState(ScanState next) {
    if (_disposed) return;
    state = AsyncData<ScanState>(next);
    // Mirror `_consumingDetections` to the new state per Decision 3.
    // The flag is the source of truth for the rawDetections listener;
    // every transition that exits `ScanCameraActive` must drop the
    // flag, and every transition into `ScanCameraActive` must raise
    // it. Per-call sites already manage the flag explicitly for the
    // entry transitions (`startSession` raises it, `_runLookup` /
    // `_runAdd` / `_onAuthStateChanged` / `notifyLifecycleEvent` /
    // `reset` drop it); this is a defence-in-depth catch for any
    // future transition that forgets.
    if (next is! ScanCameraActive) {
      _consumingDetections = false;
    }
  }
}
