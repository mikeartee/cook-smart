// Sealed Scan_State family consumed by the [BarcodeNotifier] presentation
// layer and observed by the three barcode screens (`BarcodeScannerScreen`,
// `ManualBarcodeEntryScreen`, `ScannedProductConfirmationScreen`).
//
// The ten variants are exhaustive (the parent is `sealed`, every child is
// `final class`) so every consumer must handle all ten at compile time.
// Each variant has a `const` constructor and value-equality across all of
// its fields, so the notifier can compare its previous and next states with
// `==` (avoiding redundant rebuilds) and Riverpod's `AsyncValue` semantics
// behave as expected.
//
// The variant order, names, and payload shapes are pinned by Requirement
// 7.8 and MUST NOT be reordered or renamed without amending that
// requirement first. Two enums sharing this file (per the task contract)
// describe the sub-reasons carried by [ScanPermissionDenied] and
// [ScanFailed]:
//
//   * [CameraPermissionDenialReason] — `denied`, `permanentlyDenied`,
//     `unavailable`. Mirrors the three "not-granted" variants of
//     [CameraPermissionState] without re-spelling `granted`, since by
//     construction a [ScanPermissionDenied] payload is never `granted`.
//   * [ScanFailureReason] — `network`, `server`, `validation`,
//     `notAuthenticated`, `sessionExpired`, `cameraUnavailable`. The
//     six failure categories the design's "Notifier-level handling"
//     table maps repository exceptions onto.
//
// See `flutter-port-barcode` Requirements 7.8, 7.9.

import 'package:flutter/foundation.dart';
import 'package:mobile/features/barcode/domain/ingredient_to_add.dart';
import 'package:mobile/features/barcode/domain/scanned_product.dart';

/// Sub-reason carried by [ScanPermissionDenied].
///
/// Mirrors the three "not-granted" variants of `CameraPermissionState`:
/// [denied] (the user has refused but may be re-prompted),
/// [permanentlyDenied] (the user has refused with "don't ask again" or
/// the equivalent — the screen MUST surface an "Open Settings"
/// affordance per Requirement 2.5), and [unavailable] (the device has
/// no camera hardware or the camera service is suspended per
/// Requirement 2.6).
enum CameraPermissionDenialReason {
  denied,
  permanentlyDenied,
  unavailable,
}

/// Sub-reason carried by [ScanFailed].
///
/// The six failure categories the design's "Notifier-level handling"
/// table maps repository exceptions onto:
///
///   * [network] — transport-level failure (timeout, DNS, TLS, etc.) per
///     Requirements 4.7 and 5.11.
///   * [server] — non-2xx HTTP status from Open Food Facts (Requirement
///     4.8) or 5xx from the cook-smart Ingredient_Endpoint (Requirement
///     5.10), or a malformed Open Food Facts envelope (Requirement 4.6).
///   * [validation] — 400 with `{error, details}` from the Ingredient_
///     Endpoint (Requirement 5.7) or any other 4xx that is not 401
///     (Requirement 5.9).
///   * [notAuthenticated] — defence-in-depth check at session start
///     observed Auth_State other than `AuthAuthenticated` (Requirement
///     6.4); the router redirect is the primary gate.
///   * [sessionExpired] — 401 from the Ingredient_Endpoint (Requirement
///     5.8) or an `AuthUnauthenticated` emission while a Scan_Session
///     is in flight (Requirement 6.5).
///   * [cameraUnavailable] — the camera hardware became unavailable
///     mid-session (Requirement 12.3).
enum ScanFailureReason {
  network,
  server,
  validation,
  notAuthenticated,
  sessionExpired,
  cameraUnavailable,
}

/// Sealed Scan_State with exactly ten variants in the order Requirement
/// 7.8 pins.
///
/// Variant order (also the order in which they appear in this file):
///
///   1. [ScanIdle]                — no payload
///   2. [ScanRequestingPermission] — no payload
///   3. [ScanPermissionDenied]    — `reason: CameraPermissionDenialReason`
///   4. [ScanCameraActive]        — no payload
///   5. [ScanLookingUp]           — `barcode: String`
///   6. [ScanProductFound]        — `product: ScannedProduct`
///   7. [ScanProductNotFound]     — `barcode: String`
///   8. [ScanAdding]              — `ingredient: IngredientToAdd`
///   9. [ScanAdded]               — `addedIngredientName: String?`
///  10. [ScanFailed]              — `reason: ScanFailureReason,
///                                   description: String`
sealed class ScanState {
  const ScanState();
}

/// The notifier has been constructed but the user has not yet invoked the
/// scan action. The `BarcodeScannerScreen` renders a tap-to-start CTA
/// while observing this variant.
///
/// Carries no payload (Requirement 7.8). All instances are equal so two
/// successive transitions through `ScanIdle` compare as `==`.
@immutable
final class ScanIdle extends ScanState {
  const ScanIdle();

  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is ScanIdle;

  @override
  int get hashCode => (ScanIdle).hashCode;

  @override
  String toString() => 'ScanIdle()';
}

/// The notifier has invoked `requestPermission` on the camera controller
/// and is awaiting the OS prompt result. The screen renders a spinner
/// while observing this variant.
///
/// Carries no payload (Requirement 7.8). All instances are equal.
@immutable
final class ScanRequestingPermission extends ScanState {
  const ScanRequestingPermission();

  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is ScanRequestingPermission;

  @override
  int get hashCode => (ScanRequestingPermission).hashCode;

  @override
  String toString() => 'ScanRequestingPermission()';
}

/// Camera permission was queried or requested and resolved to anything
/// other than `granted`. The carried [reason] decides which inline error
/// region the screen renders per Requirements 11.1, 11.2, 11.3.
@immutable
final class ScanPermissionDenied extends ScanState {
  const ScanPermissionDenied({required this.reason});

  final CameraPermissionDenialReason reason;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ScanPermissionDenied && other.reason == reason;

  @override
  int get hashCode => reason.hashCode;

  @override
  String toString() => 'ScanPermissionDenied(reason: $reason)';
}

/// Camera permission is `granted` and the live preview is up. The screen
/// renders the viewfinder and the "Point camera at barcode" instruction
/// (Requirement 9.1) while observing this variant.
///
/// Carries no payload (Requirement 7.8). All instances are equal.
@immutable
final class ScanCameraActive extends ScanState {
  const ScanCameraActive();

  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is ScanCameraActive;

  @override
  int get hashCode => (ScanCameraActive).hashCode;

  @override
  String toString() => 'ScanCameraActive()';
}

/// A valid barcode has been captured (either from the camera detection
/// stream or from manual entry) and the Open Food Facts lookup is in
/// flight. The screen renders the non-blocking "Looking up product..."
/// loading card (Requirement 9.3) while observing this variant.
///
/// [barcode] is the validated 8-to-13-digit string from Requirement 3.1.
@immutable
final class ScanLookingUp extends ScanState {
  const ScanLookingUp({required this.barcode});

  final String barcode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ScanLookingUp && other.barcode == barcode;

  @override
  int get hashCode => barcode.hashCode;

  @override
  String toString() => 'ScanLookingUp(barcode: $barcode)';
}

/// The Open Food Facts lookup resolved the barcode to a [ScannedProduct].
/// The notifier pushes the `ScannedProductConfirmationScreen` on this
/// transition (Requirement 9.6).
@immutable
final class ScanProductFound extends ScanState {
  const ScanProductFound({required this.product});

  final ScannedProduct product;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ScanProductFound && other.product == product;

  @override
  int get hashCode => product.hashCode;

  @override
  String toString() => 'ScanProductFound(product: $product)';
}

/// The Open Food Facts lookup resolved as a "product not found" outcome
/// (Requirement 4.5). The screen renders the "Product Not Found" modal
/// with the "Manual Entry" / "Try Again" buttons (Requirement 9.5)
/// while observing this variant.
///
/// [barcode] is preserved so a "Try Again" resumes camera detection and
/// "Manual Entry" pre-fills the manual-entry input.
@immutable
final class ScanProductNotFound extends ScanState {
  const ScanProductNotFound({required this.barcode});

  final String barcode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ScanProductNotFound && other.barcode == barcode;

  @override
  int get hashCode => barcode.hashCode;

  @override
  String toString() => 'ScanProductNotFound(barcode: $barcode)';
}

/// The user has confirmed adding the product to the pantry and the
/// `POST /api/v1/ingredients` request is in flight (Requirement 9.7).
/// The "Add to Pantry" button is disabled while observing this variant.
@immutable
final class ScanAdding extends ScanState {
  const ScanAdding({required this.ingredient});

  final IngredientToAdd ingredient;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ScanAdding && other.ingredient == ingredient;

  @override
  int get hashCode => ingredient.hashCode;

  @override
  String toString() => 'ScanAdding(ingredient: $ingredient)';
}

/// The `POST /api/v1/ingredients` request resolved as success. The
/// optional [addedIngredientName] is populated from the Ingredient_Add_
/// Response per Requirement 5.4 when the backend included a usable name
/// in the response body; the screen falls back to the Scanned_Product's
/// `name` otherwise (Requirement 9.9).
@immutable
final class ScanAdded extends ScanState {
  const ScanAdded({this.addedIngredientName});

  final String? addedIngredientName;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ScanAdded &&
          other.addedIngredientName == addedIngredientName;

  @override
  int get hashCode => addedIngredientName.hashCode;

  @override
  String toString() => 'ScanAdded(addedIngredientName: $addedIngredientName)';
}

/// A failure terminated the Scan_Session. The carried [reason] decides
/// which UI affordance the screen renders (inline error region, modal
/// alert with retry, redirect-to-login banner) per Requirements 11.4
/// through 11.8 and Requirement 12.3.
///
/// [description] is a human-readable diagnostic string built by the
/// notifier from the underlying `ApiException` and the offending
/// barcode. Two failures with the same [reason] but different
/// [description] strings compare as `!=` so the screen can re-render
/// when, for example, a retry produces a different status code.
@immutable
final class ScanFailed extends ScanState {
  const ScanFailed({required this.reason, required this.description});

  final ScanFailureReason reason;
  final String description;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ScanFailed &&
          other.reason == reason &&
          other.description == description;

  @override
  int get hashCode => Object.hash(reason, description);

  @override
  String toString() =>
      'ScanFailed(reason: $reason, description: $description)';
}
