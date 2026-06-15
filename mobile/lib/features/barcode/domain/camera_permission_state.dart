// Four-way camera permission distinction consumed by the
// [BarcodeNotifier] permission cascade and the [CameraController]
// abstraction declared in `camera_controller.dart`.
//
// Mirrors the four-way distinction the React Native predecessor's
// `barcodeService` already makes (`'granted' | 'denied' | 'blocked' |
// 'unavailable'`), translated to the Flutter terminology used by
// `mobile_scanner ^5.1.1` and `permission_handler` (where `blocked` is
// renamed to `permanentlyDenied`).
//
// See `flutter-port-barcode` Requirements 2.5, 2.6 and the Glossary
// definition of `Camera_Permission_State`.

/// The current state of the device camera permission for the
/// barcode-scanning flow.
///
/// Used by the [BarcodeNotifier] to decide whether to activate the
/// camera preview, request permission, surface an "Open Settings"
/// affordance, or fall back to manual entry.
///
/// - [granted]: the user has granted camera access; the preview may
///   activate.
/// - [denied]: the user has denied camera access but has not selected
///   "Don't ask again"; a permission request may still surface the
///   system dialogue.
/// - [permanentlyDenied]: the user has denied camera access and
///   selected "Don't ask again" (Android) or revoked the permission in
///   Settings (iOS); the system dialogue will no longer appear and the
///   user must re-grant access manually via the device settings
///   (Requirement 2.5).
/// - [unavailable]: the device has no camera hardware, the camera
///   service is suspended, or the platform reports an unrecoverable
///   error (Requirement 2.6); manual entry is the only available path.
enum CameraPermissionState {
  granted,
  denied,
  permanentlyDenied,
  unavailable,
}
