// BarcodeScannerScreen — the user-facing entry point for the
// barcode-scan-to-pantry flow.
//
// The screen is the visual surface for the [BarcodeNotifier] state machine.
// It owns no async state of its own: every UI decision branches off the
// current `Scan_State` watched from `barcodeNotifierProvider` via
// `AsyncValue<ScanState>.when` per Requirements 8.6 / 9.12, and every
// transition-driven side effect (haptic feedback, route push, modal
// open) is dispatched from a `ref.listen` callback registered in
// [build].
//
// The screen also forwards the application lifecycle (`paused`,
// `inactive`, `resumed`, `detached`, `hidden`) to the notifier per
// Requirements 2.7, 2.8, 2.9, 2.10, registering itself as a
// [WidgetsBindingObserver] in [initState] and unregistering in
// [dispose].
//
// Camera-preview wiring (Decision 1)
// ----------------------------------
//
// The notifier holds an abstract [CameraController] reference and the
// concrete `MobileScannerCameraController` adapter is the only file
// under `features/barcode/` that imports `package:mobile_scanner`.
// The screen renders the live preview by calling
// `controller.buildPreview()` on the same provider the notifier
// reads from — the abstract interface declares
// `Widget buildPreview()` so neither the screen nor the notifier
// needs to know the underlying widget type. The adapter handles its
// own rebuilds via an internal `ValueListenableBuilder`, so the
// screen can drop the result straight into its `Stack` without any
// listener plumbing of its own.
//
// Per-state branch table (design Section "BarcodeScannerScreen")
// --------------------------------------------------------------
//
//   * `ScanIdle`                     → tap-to-start CTA. The screen
//                                      also schedules
//                                      `notifier.startSession()` from
//                                      a post-frame callback after
//                                      the first build, so the user
//                                      rarely sees this in practice.
//   * `ScanRequestingPermission`    → centred spinner.
//   * `ScanPermissionDenied(denied)` → inline error region with the
//                                      "Grant Permission" button
//                                      (Requirement 11.1).
//   * `ScanPermissionDenied(permanentlyDenied)` → inline error with
//                                      the "Open Settings" button
//                                      (Requirement 11.2; opens
//                                      device settings via
//                                      `url_launcher ^6.3.0` per
//                                      Foundation Requirement 10.6).
//   * `ScanPermissionDenied(unavailable)` → inline error with the
//                                      "Use Manual Entry" button
//                                      (Requirement 11.3).
//   * `ScanCameraActive`            → live camera preview +
//                                      250-logical-pixel viewfinder
//                                      with four corner markers +
//                                      the literal "Point camera at
//                                      barcode" instruction
//                                      (Requirement 9.1).
//   * `ScanLookingUp(barcode)`      → preview + non-blocking
//                                      centred "Looking up product..."
//                                      loading card (Requirement
//                                      9.2). Also triggers the single
//                                      medium-intensity haptic
//                                      impulse on entry.
//   * `ScanProductFound(product)`   → preview retained underneath;
//                                      `ref.listen` pushes
//                                      `ScannedProductConfirmationScreen`
//                                      via `context.push`. The
//                                      confirmation screen renders
//                                      the product UI; this screen
//                                      stays mounted underneath so
//                                      navigating back lands on the
//                                      live preview.
//   * `ScanProductNotFound(barcode)` → modal alert with "Manual
//                                      Entry" / "Try Again" actions
//                                      (Requirement 9.4).
//   * `ScanAdding(ingredient)`      → preview retained; the user
//                                      observes the in-flight UI on
//                                      the confirmation screen, not
//                                      here. The "Cancel" / "Manual
//                                      Entry" controls disable per
//                                      Requirement 9.10.
//   * `ScanAdded(name)`             → `ref.listen` pops the scanner
//                                      so the user lands on the
//                                      previous tab with the
//                                      success banner the
//                                      confirmation screen rendered
//                                      (Requirement 9.9).
//   * `ScanFailed(network|server)`   → preview + "Lookup Failed"
//                                      modal with Retry / Manual
//                                      Entry buttons. Retry is
//                                      disabled when
//                                      `notifier.retriesRemainingForLookup
//                                      == 0` and a tooltip surfaces
//                                      the literal "Retry limit
//                                      reached. Try Manual Entry."
//                                      (Requirements 11.4, 11.5).
//   * `ScanFailed(cameraUnavailable)` → inline error region with a
//                                      "Use Manual Entry" affordance
//                                      (Requirement 12.3).
//   * `ScanFailed(validation|notAuthenticated|sessionExpired)` →
//                                      blank. Validation is rendered
//                                      on the confirmation screen;
//                                      the two auth-related reasons
//                                      coexist with the
//                                      router redirect to
//                                      `/auth/login` driven by the
//                                      Auth_Feature, which replaces
//                                      this screen before the state
//                                      is observable.
//
// Architecture lint compliance
// ----------------------------
//
//   * No `Color(` literal — every colour resolves to a token in
//     [AppColours] per Requirement 1.7.
//   * No `FutureBuilder` — every async branch reads `Scan_State`
//     through `AsyncValue.when` per Requirement 9.12.
//   * No `Dio(` or `GoRouter(` construction — navigation goes
//     through `context.push` / `context.go` / `Navigator.pop`.
//   * No direct import from `mobile/lib/features/auth/...`.
//
// See `flutter-port-barcode` Requirements 1.5, 1.7, 2.7, 2.8, 2.9,
// 2.10, 9.1, 9.2, 9.4, 9.10, 9.11, 9.12, 11.1, 11.2, 11.3, 11.4,
// 11.5, 12.3.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile/core/router/routes.dart';
import 'package:mobile/core/theme/app_colours.dart';
import 'package:mobile/features/barcode/data/mobile_scanner_camera_controller.dart';
import 'package:mobile/features/barcode/domain/scan_state.dart';
import 'package:mobile/features/barcode/presentation/barcode_notifier.dart';
import 'package:url_launcher/url_launcher.dart';

// ---------------------------------------------------------------------------
// User-facing string constants pinned by the spec.
//
// Each constant maps to a single user-visible literal. The strings live in
// this file rather than in a localisation bundle because Foundation Phase
// has not yet introduced an l10n infrastructure; when it does, every
// constant below moves to that surface in a single edit.
// ---------------------------------------------------------------------------

/// Instruction rendered below the viewfinder while the camera preview is
/// up (Requirement 9.1).
const String _kViewfinderInstructionLabel = 'Point camera at barcode';

/// Loading-card text rendered while `Scan_State == ScanLookingUp`
/// (Requirement 9.2).
const String _kLookingUpProductLabel = 'Looking up product...';

/// Title of the modal shown on `ScanProductNotFound` (Requirement 9.4).
const String _kProductNotFoundTitle = 'Product Not Found';

/// Body of the modal shown on `ScanProductNotFound` (Requirement 9.4).
const String _kProductNotFoundBody =
    'This product is not in our database. You can add it manually.';

/// Title of the modal shown on `ScanFailed(network|server)` from the
/// OFF lookup path (Requirements 11.4, 11.5).
const String _kLookupFailedTitle = 'Lookup Failed';

/// Tooltip surfaced on the disabled Retry button when
/// `notifier.retriesRemainingForLookup == 0` (Requirement 11.4).
const String _kLookupRetryLimitTooltip =
    'Retry limit reached. Try Manual Entry.';

/// Inline error region text for `ScanPermissionDenied(denied)`
/// (Requirement 11.1).
const String _kPermissionDeniedMessage =
    'Camera access is needed to scan barcodes.';

/// Inline error region text for `ScanPermissionDenied(permanentlyDenied)`
/// (Requirement 11.2).
const String _kPermissionPermanentlyDeniedMessage =
    'Camera access is blocked. Please enable it in Settings.';

/// Inline error region text for `ScanPermissionDenied(unavailable)`
/// (Requirement 11.3) and `ScanFailed(cameraUnavailable)`
/// (Requirement 12.3).
const String _kPermissionUnavailableMessage =
    'Camera is not available on this device.';

/// Bottom-control labels (Requirement 9.10).
const String _kCancelButtonLabel = 'Cancel';
const String _kManualEntryButtonLabel = 'Manual Entry';

/// Permission-region action labels (Requirements 11.1, 11.2, 11.3).
const String _kGrantPermissionLabel = 'Grant Permission';
const String _kOpenSettingsLabel = 'Open Settings';
const String _kUseManualEntryLabel = 'Use Manual Entry';

/// Modal action labels (Requirements 9.4, 11.4, 11.5).
const String _kTryAgainLabel = 'Try Again';
const String _kRetryLabel = 'Retry';

/// Dimension of the centred viewfinder overlay rendered while the camera
/// preview is up (Requirement 9.1).
const double _kViewfinderSizeLogicalPixels = 250;

/// Length of each corner marker stroke drawn on the four corners of the
/// viewfinder. Kept short so the markers read as L-shaped indicators
/// rather than a full rectangle.
const double _kViewfinderCornerLength = 24;

/// Stroke width of the corner markers.
const double _kViewfinderCornerStrokeWidth = 4;

/// URI handed to `package:url_launcher` to open the device-level Settings
/// page from the `"Open Settings"` button rendered while
/// `Scan_State == ScanPermissionDenied(permanentlyDenied)`. iOS resolves
/// `app-settings:` to the app-specific Settings page; Android falls back
/// to the failure path documented in `_handleOpenSettings` when the URI
/// is not handled.
const String _kAppSettingsUriString = 'app-settings:';

/// `BarcodeScannerScreen` — the viewport for the barcode-scan-to-pantry
/// flow.
///
/// Stateful so it can register as a [WidgetsBindingObserver] for
/// application lifecycle events. The screen owns no domain state: every
/// branch reads from `barcodeNotifierProvider`.
class BarcodeScannerScreen extends ConsumerStatefulWidget {
  const BarcodeScannerScreen({super.key});

  @override
  ConsumerState<BarcodeScannerScreen> createState() =>
      _BarcodeScannerScreenState();
}

class _BarcodeScannerScreenState extends ConsumerState<BarcodeScannerScreen>
    with WidgetsBindingObserver {
  /// Tracks whether a `ScanProductNotFound` / `ScanFailed` modal is
  /// currently on top of the navigator stack so duplicate transitions
  /// (e.g. a no-op re-emit of the same `ScanFailed` value) do not
  /// stack a second dialog. The flag is cleared in the dialog's
  /// `then` callback, which runs whether the user dismissed via a
  /// button, the back gesture, or a tap outside the modal.
  bool _modalOpen = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Schedule the first session start after the initial frame so the
    // notifier's permission cascade does not race the widget tree's
    // first paint (Requirement 9.2 — the "Point camera at barcode"
    // viewfinder must appear within 100 ms of `ScanCameraActive`).
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      ref.read(barcodeNotifierProvider.notifier).startSession();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    // The notifier owns lifecycle bookkeeping per Requirements 2.7,
    // 2.8, 2.9, 2.10. Forwarding here keeps the screen free of
    // camera-pause state that would otherwise need to be mirrored
    // alongside `Scan_State`.
    ref.read(barcodeNotifierProvider.notifier).notifyLifecycleEvent(state);
  }

  /// Handles a user-driven pop (system back gesture or `"Cancel"`
  /// button). Resets the notifier so the in-flight `Scan_Session`
  /// returns to `ScanIdle` and the camera releases per Requirement
  /// 9.11. Returns `true` to allow the navigator to perform the pop;
  /// the `PopScope.canPop` flag is left as `true` so the system back
  /// gesture is not blocked.
  Future<void> _handlePop() async {
    await ref.read(barcodeNotifierProvider.notifier).reset();
  }

  /// Opens the device app-settings page via `url_launcher ^6.3.0`
  /// (Foundation Requirement 10.6 / Requirement 11.2).
  ///
  /// `app-settings:` resolves to the per-app settings page on iOS.
  /// On Android the URI is not registered, and `launchUrl` returns
  /// `false`; the screen surfaces a [SnackBar] in that case so the
  /// user understands the action did not run rather than silently
  /// no-opping. A future spec MAY introduce
  /// `package:permission_handler` for a robust cross-platform
  /// `openAppSettings()` call, but Foundation Requirement 10.6 pins
  /// `url_launcher` for now.
  Future<void> _handleOpenSettings() async {
    final uri = Uri.parse(_kAppSettingsUriString);
    final launched = await launchUrl(
      uri,
      mode: LaunchMode.externalApplication,
    );
    if (!launched && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(_kPermissionPermanentlyDeniedMessage),
        ),
      );
    }
  }

  /// Pushes the `ManualBarcodeEntryScreen` route (Requirement 9.10 /
  /// Requirement 10.7). Used by both the bottom-control "Manual
  /// Entry" button and the "Use Manual Entry" affordance surfaced by
  /// the inline error regions for `unavailable` /
  /// `cameraUnavailable`.
  void _pushManualEntry() {
    context.push(Routes.barcodeManualEntryPath);
  }

  /// Side-effect dispatcher for `Scan_State` transitions.
  ///
  /// Registered via `ref.listen` in [build]. Drives:
  ///
  ///   * Haptic-feedback impulse on entry to `ScanLookingUp`
  ///     (Requirement 9.2).
  ///   * Route push on entry to `ScanProductFound`
  ///     (Requirement 9.6).
  ///   * Route pop on entry to `ScanAdded` (Requirement 9.9).
  ///   * `showDialog` for `ScanProductNotFound` and the lookup-failure
  ///     `ScanFailed` reasons (Requirements 9.4, 11.4, 11.5).
  ///
  /// Listener is idempotent — every callback fires only on the
  /// previous → next transition the notifier emits, never on
  /// accumulated state.
  void _handleScanStateTransition(
    AsyncValue<ScanState>? previous,
    AsyncValue<ScanState> next,
  ) {
    final previousState = previous?.valueOrNull;
    final nextState = next.valueOrNull;
    if (nextState == null) return;

    // Single medium-intensity haptic impulse on entry to ScanLookingUp
    // (Requirement 9.2). The impulse is gated to the transition itself
    // — re-renders that observe the same state must not re-trigger.
    if (nextState is ScanLookingUp && previousState is! ScanLookingUp) {
      HapticFeedback.mediumImpact();
    }

    // Push the confirmation screen on `ScanProductFound`
    // (Requirement 9.6). The confirmation screen reads the same
    // `barcodeNotifierProvider`, so the ingredient flow continues
    // across the route push without re-fetching the product.
    if (nextState is ScanProductFound &&
        previousState is! ScanProductFound) {
      context.push(Routes.barcodeConfirmPath);
    }

    // Pop the scanner on `ScanAdded` so the user returns to the
    // previous tab once the confirmation screen has surfaced its
    // success banner (Requirement 9.9).
    if (nextState is ScanAdded && previousState is! ScanAdded) {
      if (Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      } else {
        context.go(Routes.homePath);
      }
    }

    // Modal alerts. Each helper short-circuits when a modal is
    // already open or when the screen has been unmounted.
    if (nextState is ScanProductNotFound &&
        previousState is! ScanProductNotFound) {
      _showProductNotFoundModal(nextState);
    }

    if (nextState is ScanFailed &&
        (nextState.reason == ScanFailureReason.network ||
            nextState.reason == ScanFailureReason.server) &&
        !_isLookupFailedRepeat(previousState, nextState)) {
      _showLookupFailedModal(nextState);
    }
  }

  /// Returns `true` when [next] is a `ScanFailed` value identical to
  /// [previous] — guarding against the modal opening twice on a
  /// no-op re-emit (Riverpod's `AsyncNotifier` does not collapse
  /// `==`-equal `state =` writes by default).
  bool _isLookupFailedRepeat(ScanState? previous, ScanFailed next) {
    if (previous is! ScanFailed) return false;
    return previous.reason == next.reason &&
        previous.description == next.description;
  }

  Future<void> _showProductNotFoundModal(ScanProductNotFound nextState) async {
    if (_modalOpen || !mounted) return;
    _modalOpen = true;
    final notifier = ref.read(barcodeNotifierProvider.notifier);
    await showDialog<void>(
      context: context,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          title: const Text(_kProductNotFoundTitle),
          content: const Text(_kProductNotFoundBody),
          actions: <Widget>[
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                _pushManualEntry();
              },
              child: const Text(_kManualEntryButtonLabel),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                notifier.resetToCameraActive();
              },
              child: const Text(_kTryAgainLabel),
            ),
          ],
        );
      },
    );
    _modalOpen = false;
  }

  Future<void> _showLookupFailedModal(ScanFailed failure) async {
    if (_modalOpen || !mounted) return;
    _modalOpen = true;
    final notifier = ref.read(barcodeNotifierProvider.notifier);
    await showDialog<void>(
      context: context,
      builder: (BuildContext dialogContext) {
        return _LookupFailedDialog(
          failure: failure,
          retriesRemaining: notifier.retriesRemainingForLookup,
          onRetry: () {
            Navigator.of(dialogContext).pop();
            notifier.retryLookup();
          },
          onManualEntry: () {
            Navigator.of(dialogContext).pop();
            _pushManualEntry();
          },
        );
      },
    );
    _modalOpen = false;
  }

  @override
  Widget build(BuildContext context) {
    // Register listeners on every build (per Riverpod's documented
    // cadence — `ConsumerStatefulWidget` clears `ref.listen`
    // subscriptions at the start of each build, so a "register once
    // in initState" pattern silently disables the listener after the
    // first state change).
    ref.listen<AsyncValue<ScanState>>(
      barcodeNotifierProvider,
      _handleScanStateTransition,
    );

    final asyncState = ref.watch(barcodeNotifierProvider);

    return PopScope(
      onPopInvokedWithResult: (bool didPop, Object? result) {
        if (didPop) {
          // Fire-and-forget: the navigator has already popped; the
          // notifier is auto-disposed by Riverpod when the scanner
          // subtree unmounts, but a stale `Scan_State` between pop
          // and dispose would leak briefly. `reset()` collapses to
          // `ScanIdle` and stops the camera within the 500 ms budget.
          _handlePop();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Scan Barcode'),
        ),
        body: SafeArea(
          // Foundation Requirement 3.5 / Requirement 9.12 — every
          // `AsyncValue` branch is rendered with a non-null
          // callback. Loading and error are thin surfaces; the
          // actual per-`Scan_State` UI lives in the data branch.
          child: asyncState.when(
            data: _buildScanStateBody,
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (Object error, StackTrace _) =>
                _InlineErrorRegion(message: error.toString()),
          ),
        ),
        bottomNavigationBar: _buildBottomControls(asyncState),
      ),
    );
  }

  /// Renders the per-state UI for an `AsyncData(ScanState)` value.
  ///
  /// The branch table follows the design's "BarcodeScannerScreen"
  /// section verbatim. Every branch returns a widget; states whose
  /// design entry is "blank" (the user has navigated elsewhere by
  /// the time they could be observed) return an empty
  /// [SizedBox.shrink].
  Widget _buildScanStateBody(ScanState state) {
    switch (state) {
      case ScanIdle():
        return const _IdleStartCta();
      case ScanRequestingPermission():
        return const Center(child: CircularProgressIndicator());
      case ScanPermissionDenied(:final reason):
        switch (reason) {
          case CameraPermissionDenialReason.denied:
            return _InlineErrorRegion(
              message: _kPermissionDeniedMessage,
              actionLabel: _kGrantPermissionLabel,
              onAction: () => ref
                  .read(barcodeNotifierProvider.notifier)
                  .startSession(),
            );
          case CameraPermissionDenialReason.permanentlyDenied:
            return _InlineErrorRegion(
              message: _kPermissionPermanentlyDeniedMessage,
              actionLabel: _kOpenSettingsLabel,
              onAction: _handleOpenSettings,
            );
          case CameraPermissionDenialReason.unavailable:
            return _InlineErrorRegion(
              message: _kPermissionUnavailableMessage,
              actionLabel: _kUseManualEntryLabel,
              onAction: _pushManualEntry,
            );
        }
      case ScanCameraActive():
        return const _CameraPreviewWithViewfinder();
      case ScanLookingUp():
        return const _CameraPreviewWithLoadingCard(
          label: _kLookingUpProductLabel,
        );
      case ScanProductFound():
      case ScanProductNotFound():
      case ScanAdding():
      case ScanAdded():
        // Design table: the modal / route push runs from
        // `_handleScanStateTransition`; the underlying screen retains
        // the live preview so the user has continuous visual context.
        return const _CameraPreviewWithViewfinder();
      case ScanFailed(:final reason):
        switch (reason) {
          case ScanFailureReason.network:
          case ScanFailureReason.server:
            // The "Lookup Failed" modal renders from the
            // `ref.listen` callback. The screen behind the modal
            // shows the live preview so the user has continuous
            // visual context (Requirement 11.11).
            return const _CameraPreviewWithViewfinder();
          case ScanFailureReason.cameraUnavailable:
            return _InlineErrorRegion(
              message: _kPermissionUnavailableMessage,
              actionLabel: _kUseManualEntryLabel,
              onAction: _pushManualEntry,
            );
          case ScanFailureReason.validation:
          case ScanFailureReason.notAuthenticated:
          case ScanFailureReason.sessionExpired:
            // Design table: blank. Validation is rendered on the
            // confirmation screen; the two auth-related reasons are
            // accompanied by the router redirect to /auth/login,
            // which replaces this screen before the user could see
            // the failure UI.
            return const SizedBox.shrink();
        }
    }
  }

  /// Bottom-control bar with the "Cancel" and "Manual Entry" buttons
  /// that remain interactive in every `Scan_State` except
  /// `ScanAdding` (Requirement 9.10).
  Widget _buildBottomControls(AsyncValue<ScanState> asyncState) {
    final scanState = asyncState.valueOrNull;
    final disabled = scanState is ScanAdding;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: <Widget>[
            Expanded(
              child: OutlinedButton(
                onPressed: disabled ? null : () => Navigator.of(context).pop(),
                child: const Text(_kCancelButtonLabel),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton(
                onPressed: disabled ? null : _pushManualEntry,
                child: const Text(_kManualEntryButtonLabel),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Idle CTA — visible briefly between provider creation and the
// post-frame `startSession` call.
// ---------------------------------------------------------------------------

class _IdleStartCta extends ConsumerWidget {
  const _IdleStartCta();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Icon(Icons.qr_code_scanner, size: 64),
            const SizedBox(height: 16),
            Text(
              'Tap below to start scanning.',
              style: theme.textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () =>
                  ref.read(barcodeNotifierProvider.notifier).startSession(),
              child: const Text('Start Scanner'),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Camera-preview composition.
//
// The preview is rendered by delegating to
// `cameraControllerProvider.buildPreview()`, which returns a
// `MobileScanner` widget driven by the live underlying controller.
// The 250-logical-pixel viewfinder overlay and the "Point camera at
// barcode" instruction sit on top of the preview (Requirement 9.1).
// The notifier owns barcode detection through the adapter's
// `rawDetections` stream — the preview widget only renders the feed.
// ---------------------------------------------------------------------------

class _CameraPreviewWithViewfinder extends StatelessWidget {
  const _CameraPreviewWithViewfinder();

  @override
  Widget build(BuildContext context) {
    return const Stack(
      fit: StackFit.expand,
      alignment: Alignment.center,
      children: <Widget>[
        _LiveCameraPreview(),
        _ViewfinderOverlay(),
      ],
    );
  }
}

class _CameraPreviewWithLoadingCard extends StatelessWidget {
  const _CameraPreviewWithLoadingCard({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Stack(
      fit: StackFit.expand,
      alignment: Alignment.center,
      children: <Widget>[
        const _LiveCameraPreview(),
        const _ViewfinderOverlay(),
        Center(
          child: Card(
            color: AppColours.surface,
            elevation: 4,
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(12)),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 20,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 3,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        AppColours.scannerLoadingIndicator,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Text(label, style: textTheme.bodyLarge),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Bottom layer of the scanner [Stack]. Reads the
/// [cameraControllerProvider] and asks it for its preview widget.
///
/// The adapter's `CameraController.buildPreview` returns an empty
/// surface ([SizedBox.shrink]) before `CameraController.start` has
/// run and the live `MobileScanner` widget once a controller is
/// attached, so this widget is safe to mount in any `Scan_State`
/// where the preview is part of the visual composition. The adapter
/// owns rebuild plumbing internally — wrapping the call in a
/// [ConsumerWidget] is enough; no `ListenableBuilder` is needed at
/// this layer.
class _LiveCameraPreview extends ConsumerWidget {
  const _LiveCameraPreview();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ref.watch(cameraControllerProvider).buildPreview();
  }
}

/// 250-logical-pixel centred viewfinder overlay with four corner
/// markers and the literal "Point camera at barcode" instruction
/// rendered underneath (Requirement 9.1). Stateless — the notifier
/// owns barcode detection, not this widget.
class _ViewfinderOverlay extends StatelessWidget {
  const _ViewfinderOverlay();

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const SizedBox(
            width: _kViewfinderSizeLogicalPixels,
            height: _kViewfinderSizeLogicalPixels,
            child: _ViewfinderCornerMarkers(),
          ),
          const SizedBox(height: 16),
          Text(
            _kViewfinderInstructionLabel,
            style: textTheme.titleMedium?.copyWith(
              color: AppColours.onPrimary,
              shadows: const <Shadow>[
                Shadow(blurRadius: 8, offset: Offset(0, 1)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Renders four L-shaped markers, one at each corner of the
/// 250-logical-pixel viewfinder. The colour token comes from
/// [AppColours.scannerViewfinderCorner] per Requirement 1.7.
class _ViewfinderCornerMarkers extends StatelessWidget {
  const _ViewfinderCornerMarkers();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _ViewfinderCornerPainter(
        color: AppColours.scannerViewfinderCorner,
      ),
    );
  }
}

class _ViewfinderCornerPainter extends CustomPainter {
  _ViewfinderCornerPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = _kViewfinderCornerStrokeWidth
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    const corner = _kViewfinderCornerLength;
    final w = size.width;
    final h = size.height;

    // Top-left.
    canvas
      ..drawLine(Offset.zero, const Offset(corner, 0), paint)
      ..drawLine(Offset.zero, const Offset(0, corner), paint)
      // Top-right.
      ..drawLine(Offset(w - corner, 0), Offset(w, 0), paint)
      ..drawLine(Offset(w, 0), Offset(w, corner), paint)
      // Bottom-left.
      ..drawLine(Offset(0, h - corner), Offset(0, h), paint)
      ..drawLine(Offset(0, h), Offset(corner, h), paint)
      // Bottom-right.
      ..drawLine(Offset(w, h - corner), Offset(w, h), paint)
      ..drawLine(Offset(w - corner, h), Offset(w, h), paint);
  }

  @override
  bool shouldRepaint(_ViewfinderCornerPainter oldDelegate) =>
      oldDelegate.color != color;
}

// ---------------------------------------------------------------------------
// Inline error region used for the three permission-denial reasons
// (Requirements 11.1, 11.2, 11.3) and the `cameraUnavailable` failure
// (Requirement 12.3).
// ---------------------------------------------------------------------------

class _InlineErrorRegion extends StatelessWidget {
  const _InlineErrorRegion({
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Icon(
              Icons.error_outline,
              size: 48,
              color: AppColours.scannerErrorBanner,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: textTheme.bodyLarge,
            ),
            if (actionLabel != null && onAction != null) ...<Widget>[
              const SizedBox(height: 24),
              FilledButton(
                onPressed: onAction,
                child: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// "Lookup Failed" dialog — shown on `ScanFailed(network|server)` from
// the OFF lookup path (Requirements 11.4, 11.5).
// ---------------------------------------------------------------------------

class _LookupFailedDialog extends StatelessWidget {
  const _LookupFailedDialog({
    required this.failure,
    required this.retriesRemaining,
    required this.onRetry,
    required this.onManualEntry,
  });

  final ScanFailed failure;
  final int retriesRemaining;
  final VoidCallback onRetry;
  final VoidCallback onManualEntry;

  String get _bodyText {
    switch (failure.reason) {
      case ScanFailureReason.network:
        return 'Could not reach Open Food Facts. Check your connection '
            'and try again.';
      case ScanFailureReason.server:
        return 'Open Food Facts is having trouble. Try again or enter the '
            'barcode by hand.';
      // Defensive: this dialog is opened only for network/server, but the
      // switch must be exhaustive.
      // ignore: no_default_cases
      default:
        return failure.description;
    }
  }

  @override
  Widget build(BuildContext context) {
    final retryEnabled = retriesRemaining > 0;
    final retryButton = TextButton(
      onPressed: retryEnabled ? onRetry : null,
      child: const Text(_kRetryLabel),
    );
    return AlertDialog(
      title: const Text(_kLookupFailedTitle),
      content: Text(_bodyText),
      actions: <Widget>[
        TextButton(
          onPressed: onManualEntry,
          child: const Text(_kManualEntryButtonLabel),
        ),
        if (retryEnabled)
          retryButton
        else
          Tooltip(
            message: _kLookupRetryLimitTooltip,
            child: retryButton,
          ),
      ],
    );
  }
}
