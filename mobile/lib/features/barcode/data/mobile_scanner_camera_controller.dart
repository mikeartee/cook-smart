// MobileScannerCameraController — the Android implementation of the
// platform-agnostic [CameraController] interface declared in
// `mobile/lib/features/barcode/domain/camera_controller.dart`.
//
// Decision 1 of `flutter-port-barcode/design.md` pins this file as the
// **only** source under `features/barcode/` that imports
// `package:mobile_scanner`. The notifier and screens hold a
// [CameraController] reference, never a [MobileScannerController]
// directly, so when iOS lands in a future spec it ships as a single
// new `data/` adapter without any change to the notifier, the screens,
// or this file's interface (Requirement 2.12).
//
// API surface (per the [CameraController] contract):
//
//   * [start] — constructs (or reuses) a [MobileScannerController] with
//     the format set restricted to EAN-8, EAN-13, UPC-A, UPC-E
//     (Requirement 3.2). QR-code detection is intentionally *not*
//     enabled because the cook-smart product database does not store
//     QR-keyed products.
//   * [stop] — cancels the in-flight detection subscription and
//     `dispose()`s the underlying [MobileScannerController]. Safe to
//     call before [start] and after a previous [stop]; completes well
//     within the 500 ms budget pinned by Requirement 2.7.
//   * [rawDetections] — broadcast `Stream<String>` derived from
//     [MobileScannerController.barcodes]. Every detected
//     [Barcode.rawValue] is emitted regardless of length, format, or
//     validity. Validation against `^[0-9]{8,13}$` is the notifier's
//     responsibility per Requirement 3.3.
//   * [queryPermission] / [requestPermission] — translate the
//     `mobile_scanner` outcome (the [MobileScannerErrorCode]
//     surfaced via `MobileScannerController.value.error`) to the
//     four-way [CameraPermissionState] enum required by Requirements
//     2.5 and 2.6.
//
// Permission mapping notes
// ------------------------
//
// `mobile_scanner ^5.1.1` does not expose a *separate* "query
// permission without prompting" helper. The only signal is the
// post-`start()` value of [MobileScannerState.error]:
//
//   * `error == null` and `isRunning == true` → granted.
//   * `errorCode == permissionDenied` → denied. After a prior denial
//     in the same wrapper session, a second `permissionDenied` is
//     mapped to `permanentlyDenied` so the screen can surface the
//     "Open Settings" affordance per Requirement 2.5. This mirrors
//     the four-way distinction the React Native predecessor's
//     `barcodeService` already makes.
//   * `errorCode == unsupported` → unavailable (Requirement 2.6).
//   * Any other [MobileScannerErrorCode] (`controllerAlreadyInitialized`,
//     `controllerDisposed`, `controllerUninitialized`,
//     `genericError`) is mapped to `unavailable` so the notifier
//     branches to manual entry rather than spinning on a broken
//     camera.
//
// Because there is no separate prompt-only API in the package, both
// [start] and [requestPermission] route through the same
// `_internalStart` helper. After [requestPermission] returns
// `granted`, the underlying controller is already running, so the
// notifier's subsequent [start] call is a no-op rather than a second
// camera initialisation. After [requestPermission] returns a
// non-granted state, the underlying controller is disposed so a later
// [start] can re-prompt.
//
// `cameraControllerProvider` lifetime
// -----------------------------------
//
// The provider is `Provider.autoDispose<CameraController>` so its
// lifetime tracks the [BarcodeNotifier]'s (Decision 1, Decision 2).
// `ref.onDispose(c.stop)` releases the camera when the notifier — and
// with it the entire scanner subtree — is unmounted. Tests can
// override the provider with a fake [CameraController] without ever
// importing `package:mobile_scanner` (the test surface stays clean).
//
// See `flutter-port-barcode` Requirements 2.5, 2.6, 2.7, 2.12, 3.2,
// 3.3 and Decision 1.

import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/barcode/domain/camera_controller.dart';
import 'package:mobile/features/barcode/domain/camera_permission_state.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

/// Concrete [CameraController] backed by `package:mobile_scanner`.
///
/// Wraps a single [MobileScannerController] instance for the duration
/// of an active scan. The instance is created on [start] (or on the
/// first [requestPermission] call), held while the camera is running,
/// and disposed on [stop] or on an unrecoverable permission outcome.
///
/// Implementors of test fakes should subclass [CameraController]
/// directly rather than extending this class — there is no test value
/// in stubbing `mobile_scanner` types when a hand-rolled fake of the
/// `domain/` interface gives the same coverage with no plugin
/// dependency.
class MobileScannerCameraController implements CameraController {
  /// Creates a wrapper that lazily constructs its underlying
  /// [MobileScannerController] on [start] / [requestPermission].
  ///
  /// No camera resources are acquired until the first activation
  /// call, so constructing the wrapper inside
  /// `cameraControllerProvider.create` is free of side effects until
  /// the notifier explicitly enters the permission cascade.
  MobileScannerCameraController();

  /// Format set the underlying [MobileScannerController] is
  /// restricted to per Requirement 3.2.
  ///
  /// EAN-8, EAN-13, UPC-A and UPC-E cover every product format the
  /// cook-smart pantry is keyed by. QR-code detection is intentionally
  /// excluded — the React Native predecessor's `react-native-camera-kit`
  /// integration accepts the same set, and the cook-smart product
  /// database does not store QR-keyed products.
  static const List<BarcodeFormat> _supportedFormats = <BarcodeFormat>[
    BarcodeFormat.ean8,
    BarcodeFormat.ean13,
    BarcodeFormat.upcA,
    BarcodeFormat.upcE,
  ];

  /// Broadcast pump for raw detections.
  ///
  /// Lives for the lifetime of the wrapper. Subscribers added before
  /// [start] are valid — they simply receive nothing until the camera
  /// is running — and surviving [stop] is a feature, not a bug: the
  /// notifier's flag-gated consumption pattern (Decision 3) relies on
  /// a long-lived subscription that does not need to be re-established
  /// across `paused`/`resumed` lifecycle cycles.
  final StreamController<String> _detectionsController =
      StreamController<String>.broadcast();

  /// The active underlying controller, or `null` when no camera is
  /// running.
  ///
  /// Exactly one [MobileScannerController] is held at a time; the
  /// invariant in [_internalStart] is "we either successfully run a
  /// fresh controller or hold no controller at all".
  ///
  /// Wrapped in a [ValueNotifier] so [buildPreview] can re-render via
  /// a [ValueListenableBuilder] whenever the field flips between
  /// `null` and an instance. The field is read through [_controller]
  /// and assigned via the [_controllerNotifier]'s `value` setter.
  final ValueNotifier<MobileScannerController?> _controllerNotifier =
      ValueNotifier<MobileScannerController?>(null);

  MobileScannerController? get _controller => _controllerNotifier.value;

  /// Subscription to [MobileScannerController.barcodes] for the
  /// currently active controller, if any.
  ///
  /// The lint cannot statically prove cancellation because the
  /// subscription is created in [_internalStart] and cancelled in
  /// [stop]; the wrapper's lifecycle invariant ("either we hold a
  /// running controller plus its subscription, or we hold neither")
  /// makes the cleanup contract correct, so the warning is suppressed
  /// at the field declaration.
  // ignore: cancel_subscriptions
  StreamSubscription<BarcodeCapture>? _barcodesSubscription;

  /// The most recent [CameraPermissionState] derived from a [start]
  /// or [requestPermission] outcome, or `null` when no probe has run
  /// in the wrapper's lifetime.
  ///
  /// [queryPermission] returns this value (defaulting to
  /// [CameraPermissionState.denied] before the first probe) so the
  /// notifier's permission cascade always has a defined starting
  /// state. Defaulting to `denied` rather than `granted` keeps the
  /// cascade safe — the notifier never activates the preview without
  /// an explicit `granted` observation.
  CameraPermissionState? _lastKnownPermissionState;

  /// Tracks whether the wrapper has observed a `permissionDenied`
  /// outcome at least once.
  ///
  /// A second `permissionDenied` in the same wrapper session is
  /// mapped to [CameraPermissionState.permanentlyDenied] so the
  /// screen can surface the "Open Settings" affordance instead of an
  /// affordance that re-triggers the system dialogue (Requirement
  /// 2.5). This mirrors the React Native predecessor's heuristic.
  bool _hasBeenDeniedOnce = false;

  @override
  Stream<String> get rawDetections => _detectionsController.stream;

  @override
  Widget buildPreview() {
    // Self-contained `ValueListenableBuilder` so the screen does not
    // need to know the controller flips between `null` and an
    // instance internally. When `_controllerNotifier.value` is
    // `null` (camera not started, or a permission probe failed and
    // the wrapped controller was disposed) the builder returns an
    // empty surface so the widget tree stays valid. Once
    // `_internalStart` succeeds and a fresh
    // [MobileScannerController] is set, the builder rebuilds and
    // mounts the live preview.
    //
    // `onDetect` is intentionally not passed — the wrapper already
    // listens to `controller.barcodes` in `_internalStart` and
    // forwards every raw value through `_detectionsController`. The
    // [MobileScanner] widget shares the same controller, so a
    // second `onDetect` callback would surface duplicate events to
    // the notifier.
    return ValueListenableBuilder<MobileScannerController?>(
      valueListenable: _controllerNotifier,
      builder: (
        BuildContext context,
        MobileScannerController? controller,
        Widget? _,
      ) {
        if (controller == null) {
          return const SizedBox.shrink();
        }
        return MobileScanner(controller: controller);
      },
    );
  }

  @override
  Future<CameraPermissionState> queryPermission() async {
    return _lastKnownPermissionState ?? CameraPermissionState.denied;
  }

  @override
  Future<CameraPermissionState> requestPermission() async {
    // `mobile_scanner ^5.1.1` exposes no prompt-only API; the only way
    // to surface the system dialogue is to call
    // [MobileScannerController.start]. Routing through the same
    // `_internalStart` helper that [start] uses keeps the
    // permission-then-camera flow free of an avoidable second
    // initialisation: when the OS grants permission, the underlying
    // controller is already running on return, so the notifier's
    // subsequent [start] call observes `_controller != null` and
    // short-circuits.
    await _internalStart();
    return _lastKnownPermissionState ?? CameraPermissionState.denied;
  }

  @override
  Future<void> start() async {
    await _internalStart();
  }

  @override
  Future<void> stop() async {
    final subscription = _barcodesSubscription;
    _barcodesSubscription = null;
    if (subscription != null) {
      await subscription.cancel();
    }

    final controller = _controller;
    _controllerNotifier.value = null;
    if (controller != null) {
      // [MobileScannerController.dispose] is the documented release
      // path — calling it before `stop()` is supported when the
      // controller is not running, which is true after a
      // permission-denied outcome (Requirement 2.7's 500 ms budget
      // covers this in practice on Android).
      await controller.dispose();
    }
  }

  /// Acquires (or reuses) the underlying [MobileScannerController]
  /// and triggers `start()`.
  ///
  /// Behaviour follows the design's permission cascade:
  ///
  ///   * If a controller is already running, no work is done.
  ///   * If a controller exists but is not running (e.g. it was left
  ///     in a `permissionDenied` state from a prior probe), it is
  ///     disposed first so a fresh prompt is possible.
  ///   * A new controller is constructed with [_supportedFormats] and
  ///     `autoStart: false` so this wrapper owns lifecycle entirely.
  ///   * After [MobileScannerController.start] returns, the wrapper
  ///     reads [MobileScannerState.error] to update
  ///     [_lastKnownPermissionState] and, on a non-granted outcome,
  ///     disposes the controller so the next call can re-prompt.
  ///
  /// [MobileScannerController.start] catches its own
  /// [MobileScannerException] internally (the package's source
  /// reflects the failure on `value.error` rather than throwing),
  /// so the helper does not need a `try`/`catch` around the call.
  Future<void> _internalStart() async {
    final existing = _controller;
    if (existing != null) {
      if (existing.value.isRunning) {
        return;
      }
      // The controller exists but is wedged in a non-running state
      // (typically a `permissionDenied` error from a previous
      // probe). Dispose it before re-prompting.
      await stop();
    }

    final controller = MobileScannerController(
      autoStart: false,
      formats: _supportedFormats,
    );
    _controllerNotifier.value = controller;
    _barcodesSubscription = controller.barcodes.listen(_onBarcodes);

    await controller.start();

    final state = _mapState(controller.value);
    _lastKnownPermissionState = state;
    if (state == CameraPermissionState.denied) {
      _hasBeenDeniedOnce = true;
    }

    if (state != CameraPermissionState.granted) {
      // Release the wedged controller so the next call can re-prompt
      // (or, on `unavailable`, so a future spec's iOS adapter inherits
      // a clean slate).
      await stop();
    }
  }

  /// Translates a [MobileScannerState] outcome to the four-way
  /// [CameraPermissionState] enum per Requirements 2.5 and 2.6.
  CameraPermissionState _mapState(MobileScannerState state) {
    final error = state.error;
    if (error == null) {
      // Absence of an error after `start()` returned implies the
      // platform accepted the request. `state.isRunning` is the
      // stronger signal but it can lag the value update on Android by
      // a frame; treating "no error" as granted is the same heuristic
      // the package's own example apps use.
      return CameraPermissionState.granted;
    }
    switch (error.errorCode) {
      case MobileScannerErrorCode.permissionDenied:
        return _hasBeenDeniedOnce
            ? CameraPermissionState.permanentlyDenied
            : CameraPermissionState.denied;
      case MobileScannerErrorCode.unsupported:
        return CameraPermissionState.unavailable;
      case MobileScannerErrorCode.controllerAlreadyInitialized:
      case MobileScannerErrorCode.controllerDisposed:
      case MobileScannerErrorCode.controllerUninitialized:
      case MobileScannerErrorCode.genericError:
        // Any non-permission failure is reported as `unavailable` so
        // the notifier branches to manual entry per Requirement 2.6
        // rather than spinning on a broken camera.
        return CameraPermissionState.unavailable;
    }
  }

  /// Forwards every [Barcode.rawValue] from a [BarcodeCapture] event
  /// onto [_detectionsController] without filtering.
  ///
  /// `null` raw values are silently skipped — they cannot satisfy the
  /// notifier's `^[0-9]{8,13}$` validator anyway, and forwarding them
  /// would force every subscriber to filter `null` redundantly.
  /// Length, format, and validity are not checked here; the notifier
  /// owns those checks per Requirement 3.3.
  void _onBarcodes(BarcodeCapture capture) {
    if (_detectionsController.isClosed) {
      return;
    }
    for (final barcode in capture.barcodes) {
      final raw = barcode.rawValue;
      if (raw == null) {
        continue;
      }
      _detectionsController.add(raw);
    }
  }
}

/// Application-wide [CameraController] for the Barcode_Feature.
///
/// `Provider.autoDispose<CameraController>` ties the controller's
/// lifetime to the notifier subtree (Decision 2). When the user pops
/// out of the scanner stack the provider tears down,
/// `ref.onDispose(controller.stop)` releases the camera within the
/// 500 ms budget (Requirement 2.7), and the next entry into the
/// scanner constructs a fresh wrapper.
///
/// Tests override this provider with a hand-rolled
/// `_FakeCameraController` (see the design's "Mock surface" section)
/// — there is no test value in stubbing `mobile_scanner` types when
/// the abstract surface gives the same coverage with no plugin
/// dependency.
final AutoDisposeProvider<CameraController> cameraControllerProvider =
    Provider.autoDispose<CameraController>((ref) {
  final controller = MobileScannerCameraController();
  ref.onDispose(controller.stop);
  return controller;
});
