// Ingredient_To_Add domain model — the typed body sent to the cook-smart
// Ingredient_Endpoint (`POST /api/v1/ingredients`) when the user confirms
// adding a scanned product to the pantry.
//
// An `IngredientToAdd` is constructed either by
// [IngredientToAdd.fromScannedProduct] (the "happy default" entry point
// used after an `Off_Lookup_Response` resolves to a `ScannedProduct`) or
// by direct construction in the confirmation flow when the user
// overrides `quantity` or `unit`. The
// default constructor is `const` so the type composes cheaply with the
// Riverpod `Scan_State == ScanAdding(ingredient)` comparison and so
// generated/fixture instances stay canonical.
//
// Field bounds, per the design's Data Models table:
//
//   * `barcode`    — 8–13 ASCII digits matching `^[0-9]{8,13}$` (upstream
//                    invariant, validated by `BarcodeRepository` before
//                    construction; not re-validated here)
//   * `customName` — 1–200 chars after trimming
//   * `category`   — 1–100 chars
//   * `quantity`   — `0 < quantity <= 9999`
//   * `unit`       — 1–32 chars
//
// The four user-facing bounds (everything except `barcode`) are
// re-validated by [toBackendJson] on every call. A perturbation outside
// those bounds raises `StateError` identifying the offending field and
// emits no JSON, so the React Native predecessor's behaviour of catching
// invalid form input before the request leaves the device is preserved.
//
// See `flutter-port-barcode` Requirements 5.2, 7.4, 7.5.

import 'package:flutter/foundation.dart';
import 'package:mobile/features/barcode/domain/scanned_product.dart';

/// Body sent to `POST /api/v1/ingredients` when the user confirms adding
/// a scanned product to the pantry.
///
/// Constructed by [IngredientToAdd.fromScannedProduct] in the camera and
/// manual-entry happy paths, and by direct construction in the
/// confirmation flow when the user overrides [quantity] or [unit]. The
/// default constructor is `const` so the type composes cheaply with the
/// Riverpod `Scan_State` sealed family.
@immutable
final class IngredientToAdd {
  /// Constructs an [IngredientToAdd] with all five fields explicitly.
  ///
  /// Bounds are documented in the file-level dartdoc and re-validated
  /// by [toBackendJson] on every call. Direct construction is the
  /// supported way for the confirmation flow to surface user-edited
  /// `quantity`/`unit` values without losing the rest of the source
  /// `ScannedProduct`'s data.
  const IngredientToAdd({
    required this.barcode,
    required this.customName,
    required this.category,
    required this.quantity,
    required this.unit,
  });

  /// Maps a [ScannedProduct] to a default-shaped [IngredientToAdd].
  ///
  /// Applies the rule "category defaults to the literal string `'other'`
  /// when the source [ScannedProduct]'s category is null" per
  /// Requirement 7.5. The user-confirmation flow MAY override
  /// [quantity] and [unit] before calling [toBackendJson].
  ///
  /// Bounds are intentionally **not** validated here — this is the
  /// "happy default" entry point. An explicit perturbation (for example
  /// an empty `customName` from a malformed upstream parse, or a
  /// `quantity` outside `(0, 9999]` typed by the user on the
  /// confirmation screen) is what surfaces the failure later in
  /// [toBackendJson].
  factory IngredientToAdd.fromScannedProduct(
    ScannedProduct product, {
    num quantity = 1,
    String unit = 'piece',
  }) {
    return IngredientToAdd(
      barcode: product.barcode,
      customName: product.name,
      category: product.category ?? 'other',
      quantity: quantity,
      unit: unit,
    );
  }

  /// 8–13 ASCII digits matching `^[0-9]{8,13}$`, copied from the source
  /// [ScannedProduct]. Validated upstream by `BarcodeRepository`.
  final String barcode;

  /// Resolved product name, 1–200 chars after trimming. Sourced from
  /// the [ScannedProduct.name] field (which has already had its
  /// `"Unknown Product"` fallback applied per Requirement 4.4) when
  /// constructed via [IngredientToAdd.fromScannedProduct].
  final String customName;

  /// Resolved category, 1–100 chars. Defaults to the literal string
  /// `'other'` when the source [ScannedProduct]'s category is null.
  final String category;

  /// User-confirmed quantity, satisfying `0 < quantity <= 9999`.
  /// Defaults to `1` when constructed via
  /// [IngredientToAdd.fromScannedProduct].
  final num quantity;

  /// User-confirmed unit, 1–32 chars. Defaults to the literal string
  /// `'piece'` when constructed via
  /// [IngredientToAdd.fromScannedProduct].
  final String unit;

  /// Emits the JSON body shape consumed by `POST /api/v1/ingredients`
  /// per Requirement 5.2.
  ///
  /// Returns a `Map<String, dynamic>` with exactly the five keys
  /// `customName`, `category`, `quantity`, `unit`, and `notes`. The
  /// `notes` value is synthesised as the literal pattern
  /// `"Added via barcode scan ($barcode)"` so the cook-smart pantry's
  /// existing audit trail is preserved.
  ///
  /// Re-validates the four user-facing bounds (`customName` trimmed
  /// length 1–200, `category` length 1–100, `quantity` in `(0, 9999]`,
  /// `unit` length 1–32) and raises [StateError] identifying the
  /// offending field on the first violation, emitting no JSON. The
  /// `barcode` field is the upstream invariant validated by
  /// `BarcodeRepository` and is not re-checked here.
  Map<String, dynamic> toBackendJson() {
    final trimmedCustomName = customName.trim();
    if (trimmedCustomName.isEmpty || trimmedCustomName.length > 200) {
      throw StateError(
        'IngredientToAdd.customName must be 1-200 characters after '
        'trimming (got: ${trimmedCustomName.length} chars).',
      );
    }
    if (category.isEmpty || category.length > 100) {
      throw StateError(
        'IngredientToAdd.category must be 1-100 characters '
        '(got: ${category.length} chars).',
      );
    }
    if (quantity.isNaN || quantity <= 0 || quantity > 9999) {
      throw StateError(
        'IngredientToAdd.quantity must satisfy 0 < quantity <= 9999 '
        '(got: $quantity).',
      );
    }
    if (unit.isEmpty || unit.length > 32) {
      throw StateError(
        'IngredientToAdd.unit must be 1-32 characters '
        '(got: ${unit.length} chars).',
      );
    }
    return <String, dynamic>{
      'customName': customName,
      'category': category,
      'quantity': quantity,
      'unit': unit,
      'notes': 'Added via barcode scan ($barcode)',
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! IngredientToAdd) return false;
    return other.barcode == barcode &&
        other.customName == customName &&
        other.category == category &&
        other.quantity == quantity &&
        other.unit == unit;
  }

  @override
  int get hashCode =>
      Object.hash(barcode, customName, category, quantity, unit);

  @override
  String toString() {
    return 'IngredientToAdd('
        'barcode: $barcode, '
        'customName: $customName, '
        'category: $category, '
        'quantity: $quantity, '
        'unit: $unit'
        ')';
  }
}
