// Scanned_Product domain model — the typed result of resolving a barcode
// against the Open_Food_Facts_API.
//
// A `ScannedProduct` is constructed only by `Off_Lookup_Response.fromJson`
// (in production) or by [copyWith] (in tests and confirmation flows). The
// default constructor is `const` so generated/fixture instances stay
// canonical, and value-equality across all five fields makes the Riverpod
// `Scan_State == ScanProductFound(product)` comparison cheap.
//
// Field bounds, per the design's Data Models table:
//
//   * `barcode`  — matches `^[0-9]{8,13}$` (8–13 ASCII digits)
//   * `name`     — 1–200 chars after trimming, falling back to the literal
//                  string `"Unknown Product"` per Requirements 4.4 / 7.10
//   * `brand`    — 1–200 chars or `null`
//   * `category` — 1–200 chars or `null`
//   * `imageUrl` — 1–2048 chars or `null`
//
// Bounds are *documented* here and *enforced* by `Off_Lookup_Response`
// (the parser is the only producer that handles raw wire data). This
// matches the convention the Auth_Feature's [User] model established —
// the value type itself stays free of validation noise so it can be
// constructed cheaply in tests and `copyWith` cases.
//
// See `flutter-port-barcode` Requirements 7.1, 7.2, 7.3.

import 'package:flutter/foundation.dart';

/// Sentinel used by [ScannedProduct.copyWith] to distinguish "argument not
/// passed" from "argument passed as `null`" for the three nullable fields.
/// Any other instance compares unequal under [identical], so the public
/// surface is unambiguous.
const Object _unset = Object();

/// Product resolved from the Open_Food_Facts_API for a given barcode.
///
/// Constructed by `Off_Lookup_Response.fromJson` in production and by
/// [copyWith] in tests and the confirmation-screen flow. The default
/// constructor is `const` so the type composes cheaply with the Riverpod
/// `Scan_State` sealed family.
@immutable
final class ScannedProduct {
  /// Constructs a [ScannedProduct] with all five fields explicitly.
  ///
  /// Bounds are documented in the file-level dartdoc; production callers
  /// route through `Off_Lookup_Response.fromJson`, which is the only
  /// caller responsible for enforcing them against raw wire data.
  const ScannedProduct({
    required this.barcode,
    required this.name,
    required this.brand,
    required this.category,
    required this.imageUrl,
  });

  /// 8–13 ASCII digits matching `^[0-9]{8,13}$` (Requirement 3.1).
  final String barcode;

  /// Resolved product name, 1–200 chars after trimming. Falls back to
  /// the literal string `"Unknown Product"` per Requirements 4.4 / 7.10
  /// when the upstream `product_name` is null, missing, or empty.
  final String name;

  /// First comma-separated entry of OFF `product.brands` after trimming,
  /// 1–200 chars when non-null.
  final String? brand;

  /// First comma-separated entry of OFF `product.categories` after
  /// trimming, 1–200 chars when non-null.
  final String? category;

  /// OFF `product.image_url` verbatim, 1–2048 chars when non-null.
  final String? imageUrl;

  /// Returns a copy with the listed fields replaced.
  ///
  /// All five fields are covered (Requirement 7.3). The three nullable
  /// fields ([brand], [category], [imageUrl]) use the [_unset] sentinel
  /// as their default so a caller can explicitly clear them by passing
  /// `null` — that is, `copyWith(brand: null)` produces a product whose
  /// brand is `null`, while omitting the argument preserves the existing
  /// value.
  ScannedProduct copyWith({
    String? barcode,
    String? name,
    Object? brand = _unset,
    Object? category = _unset,
    Object? imageUrl = _unset,
  }) {
    return ScannedProduct(
      barcode: barcode ?? this.barcode,
      name: name ?? this.name,
      brand: identical(brand, _unset) ? this.brand : brand as String?,
      category:
          identical(category, _unset) ? this.category : category as String?,
      imageUrl:
          identical(imageUrl, _unset) ? this.imageUrl : imageUrl as String?,
    );
  }

  /// Emits the Open_Food_Facts_API response shape that
  /// `Off_Lookup_Response.fromJson` consumes, so the design's Property 1
  /// round-trip test can encode a generated [ScannedProduct], decode it,
  /// and assert equality (Requirement 13.6 (a)).
  ///
  /// **Test-fixture support only.** No production code path emits this
  /// shape — the cook-smart backend never consumes it, and the
  /// `Off_Lookup_Response` parser only ever reads it from real OFF
  /// responses. The method is exposed on the domain type rather than on
  /// the test harness so the round-trip property's generator can stay
  /// in `glados`-friendly pure-Dart territory.
  Map<String, dynamic> toOpenFoodFactsLikeJson() {
    return <String, dynamic>{
      'status': 1,
      'product': <String, dynamic>{
        'product_name': name,
        'brands': brand,
        'categories': category,
        'image_url': imageUrl,
      },
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! ScannedProduct) return false;
    return other.barcode == barcode &&
        other.name == name &&
        other.brand == brand &&
        other.category == category &&
        other.imageUrl == imageUrl;
  }

  @override
  int get hashCode => Object.hash(barcode, name, brand, category, imageUrl);

  @override
  String toString() {
    return 'ScannedProduct('
        'barcode: $barcode, '
        'name: $name, '
        'brand: $brand, '
        'category: $category, '
        'imageUrl: $imageUrl'
        ')';
  }
}
