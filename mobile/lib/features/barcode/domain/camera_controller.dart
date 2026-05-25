// CameraController — the platform-agnostic camera abstraction the
// Barcode_Feature consumes. Decision 1 of `flutter-port-barcode/design.md`
// pins the abstraction in `domain/` so the concrete `mobile_scanner`
// adapter can live in `data/` as the *only* file under
// `features/barcode/` that imports `package:mobile_scanner`. When iOS
// lands in a later spec it ships as a single new `data/` adapter, with
// no notifier or screen change required (Requirement 2.12).
//
// The interface is deliberately narrow — four methods plus one stream:
//
//   * [queryPermission] — read the current device camera permission
//     state without prompting (used by the `BarcodeNotifier`'s permission
//     cascade in [`startSession`] and on [`AppLifecycleState.resumed`]
//     per Requirements 2.3, 2.8, 2.9, 2.10).
//   * [requestPermission] — prompt the user when [queryPermission]
//     returned [CameraPermissionState.denied] and the request has not
//     been issued in this install (Requirement 2.4).
//   * [start] — activate exactly one camera preview. The concrete
//     adapter restricts the format set to EAN-8 / EAN-13 / UPC-A / UPC-E
//     per Requirement 3.2 and emits raw detections on [rawDetections].
//   * [stop] — release the camera within 500 ms (Requirement 2.7). Safe
//     to call in any state, including before [start] and after [stop].
//   * [rawDetections] — broadcast `Stream<String>` emitting the digit
//     string of every detected candidate, *regardless of validity*. The
//     `BarcodeNotifier` owns validation against `^[0-9]{8,13}$` per
//     Requirement 3.3 — silently discarding invalid candidates without
//     transitioning out of `ScanCameraActive` is the notifier's job, not
//     the controller's.
//
// This file deliberately contains no implementation and **must not**
// import `package:mobile_scanner/...`. The file's job is to declare
// contract; concrete behaviour lives in `mobile_scanner_camera_controller.dart`
// under `data/`.
//
// `package:flutter/widgets.dart` is imported solely for the [Widget]
// return type of [buildPreview]. The architecture lint forbids
// `package:mobile_scanner` outside the data adapter — it does not
// forbid Flutter widgets in `domain/`, since [Widget] is a
// platform-neutral abstraction (the same import already lives in the
// `BarcodeNotifier` next door).
//
// See `flutter-port-barcode` Requirement 2.12 and Decision 1.

import 'package:flutter/widgets.dart';
import 'package:mobile/features/barcode/domain/camera_permission_state.dart';

/// Platform-agnostic camera surface the Barcode_Feature consumes.
///
/// Implemented by `MobileScannerCameraController` in
/// `mobile/lib/features/barcode/data/mobile_scanner_camera_controller.dart`
/// for Android. iOS support — when it lands in a future spec — ships as
/// an additional `data/` adapter without any change to this interface,
/// the [BarcodeNotifier], or any screen.
///
/// Implementors MUST satisfy the following invariants:
///
///   * [start] activates exactly one preview at a time. Calling [start]
///     while already started is a no-op (or, equivalently, restarts the
///     same single preview).
///   * [stop] releases the camera within 500 ms (Requirement 2.7). It is
///     safe to call before [start] and after a previous [stop].
///   * [rawDetections] is a *broadcast* stream — multiple subscribers
///     are supported, and unsubscribing the last subscriber does not
///     stop the camera (the notifier owns lifecycle, not subscribers).
///   * Detections are emitted unfiltered: every candidate digit string
///     the underlying engine reports is forwarded, regardless of
///     length, format, or validity. Validation against
///     `^[0-9]{8,13}$` (Requirement 3.3) is the notifier's
///     responsibility.
abstract class CameraController {
  /// Read the current device camera permission state without surfacing
  /// the system dialogue.
  ///
  /// Returns one of the four [CameraPermissionState] values per the
  /// four-way mapping documented in Requirements 2.5 and 2.6. This is
  /// a defence-in-depth check on top of the router-level auth gate — it
  /// is invoked by `BarcodeNotifier.startSession` (Requirement 2.3)
  /// before any camera activation, and re-invoked on
  /// `AppLifecycleState.resumed` (Requirement 2.9) before re-activating
  /// a previously-active preview.
  Future<CameraPermissionState> queryPermission();

  /// Prompt the user for camera permission, surfacing the platform
  /// system dialogue.
  ///
  /// Called by `BarcodeNotifier` only when [queryPermission] returned
  /// [CameraPermissionState.denied] and the request has not yet been
  /// issued in the current install (Requirement 2.4). When
  /// [queryPermission] returned [CameraPermissionState.permanentlyDenied]
  /// or [CameraPermissionState.unavailable], the notifier does *not*
  /// call this method — the system dialogue would not surface — and
  /// instead transitions to `ScanPermissionDenied` so the screen can
  /// expose an "Open Settings" affordance (Requirement 2.5).
  Future<CameraPermissionState> requestPermission();

  /// Activate exactly one camera preview.
  ///
  /// The concrete adapter restricts the underlying format set to
  /// EAN-8 / EAN-13 / UPC-A / UPC-E per Requirement 3.2 — QR-code
  /// detection is intentionally *not* enabled because the cook-smart
  /// product database does not store QR-keyed products.
  ///
  /// Detected candidates are emitted on [rawDetections] without
  /// filtering; validation is the notifier's responsibility per
  /// Requirement 3.3.
  Future<void> start();

  /// Release the camera within 500 ms (Requirement 2.7).
  ///
  /// Safe to call in any state, including before [start] and after a
  /// previous [stop]. The notifier invokes this on every transition out
  /// of `ScanCameraActive`, on `BarcodeScannerScreen` pop, on
  /// `AppLifecycleState.paused`/`inactive`, and from the
  /// `ref.onDispose` hook registered in
  /// `BarcodeNotifier.build` (Decision 2).
  Future<void> stop();

  /// Broadcast stream of every candidate barcode the underlying engine
  /// reports, emitted as the raw digit string regardless of length,
  /// format, or validity.
  ///
  /// The notifier subscribes to this stream while
  /// `Scan_State == ScanCameraActive`, validates each candidate against
  /// `^[0-9]{8,13}$`, and silently discards mismatches per
  /// Requirement 3.3. Detection debounce (Decision 3) is also enforced
  /// at the notifier level so that the camera need not be restarted on
  /// a "Try Again" outcome.
  Stream<String> get rawDetections;

  /// Returns a [Widget] that renders the live camera feed when [start]
  /// has been called and an empty surface otherwise.
  ///
  /// Implementors MUST satisfy the following invariants:
  ///
  ///   * The returned widget is safe to use in any state. Calling it
  ///     before [start], after [stop], or after a permission failure
  ///     returns an empty surface (e.g. [SizedBox.shrink]) instead of
  ///     crashing or rendering an error icon.
  ///   * The widget rebuilds on its own when the underlying camera
  ///     surface attaches or detaches — callers are not expected to
  ///     wrap the result in a `ListenableBuilder` or `setState` to
  ///     observe `start` / `stop` transitions.
  ///   * No `package:mobile_scanner` types leak through this contract.
  ///   The Android adapter constructs a `MobileScanner` widget
  ///   internally; future-iOS or test adapters return whatever surface
  ///   makes sense for their backend (a [Container], a fake widget,
  ///   etc.).
  ///
  /// The screen calls this method from its build path while
  /// `Scan_State` is in `{ScanCameraActive, ScanLookingUp,
  /// ScanProductFound, ScanProductNotFound, ScanAdding, ScanAdded,
  /// ScanFailed(network|server)}` — every state where the live
  /// preview is part of the visual composition.
  Widget buildPreview();
}
