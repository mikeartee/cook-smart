// Typed parser for the Open_Food_Facts_API response body
// (`GET https://world.openfoodfacts.org/api/v2/product/<barcode>.json`).
//
// Per Decision 4 of the `flutter-port-barcode` design, this parser is
// **strict about the envelope** and **lenient about the product object**:
//
//   * Strict envelope (Requirement 4.6): the top-level body must be a JSON
//     object; `status` must be an integer in `{0, 1}`; when present, the
//     top-level `product` must be a JSON object. Any deviation raises a
//     [ServerException] whose message identifies both the offending
//     barcode and the offending field.
//   * Lenient product (Requirements 4.4, 7.10): once past the envelope
//     check, the parser builds a [ScannedProduct] from whatever fields
//     are present, applying the length caps from the design's Data
//     Models table and falling back to the literal `"Unknown Product"`
//     when `product_name` is null, missing, empty after trimming, or
//     longer than 200 characters after trimming. This preserves the
//     React Native predecessor's user-visible behaviour for sparsely
//     curated OFF entries.
//
// The factory yields an [OffLookupOutcome] that the [BarcodeRepository]
// passes through verbatim:
//
//   * [OffLookupProduct]   — the lookup resolved to a [ScannedProduct].
//   * [OffLookupNotFound]  — `status == 0`, or `status == 1` with the
//                            `product` field null or missing
//                            (Requirement 4.5). Distinguishable from
//                            both success and failure so the notifier
//                            can render the "Product Not Found" modal
//                            without inferring it from a thrown
//                            exception.
//
// See `flutter-port-barcode` Requirements 4.4, 4.5, 4.6, 7.10.

import 'package:flutter/foundation.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/features/barcode/domain/scanned_product.dart';

const String _endpoint = 'GET /api/v2/product/<barcode>.json';
const int _maxNameLength = 200;
const int _maxBrandLength = 200;
const int _maxCategoryLength = 200;
const int _maxImageUrlLength = 2048;
const String _unknownProductName = 'Unknown Product';

/// Outcome of decoding an Open_Food_Facts_API product response.
///
/// Distinguishes a resolved [ScannedProduct] from a typed
/// "product not found" sentinel so the notifier can branch without
/// catching an exception (Requirement 4.5).
@immutable
sealed class OffLookupOutcome {
  const OffLookupOutcome();
}

/// Lookup resolved to a [ScannedProduct].
@immutable
final class OffLookupProduct extends OffLookupOutcome {
  const OffLookupProduct(this.product);

  /// The product resolved from the response's `product` object, with
  /// length caps and the `"Unknown Product"` fallback already applied.
  final ScannedProduct product;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is OffLookupProduct && other.product == product;
  }

  @override
  int get hashCode => product.hashCode;

  @override
  String toString() => 'OffLookupProduct(product: $product)';
}

/// Lookup resolved to "product not found".
///
/// Emitted when the response envelope reports `status == 0`, or when
/// `status == 1` but the `product` field is null or missing
/// (Requirement 4.5).
@immutable
final class OffLookupNotFound extends OffLookupOutcome {
  const OffLookupNotFound(this.barcode);

  /// The barcode that was looked up.
  final String barcode;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is OffLookupNotFound && other.barcode == barcode;
  }

  @override
  int get hashCode => barcode.hashCode;

  @override
  String toString() => 'OffLookupNotFound(barcode: $barcode)';
}

/// Parser for the Open_Food_Facts_API product response body.
///
/// The class is a thin namespace around [fromJson]; instances are
/// neither constructed nor returned. Callers receive an
/// [OffLookupOutcome] directly.
abstract final class OffLookupResponse {
  /// Decodes [body] (as already-parsed JSON) for the given [barcode].
  ///
  /// Validates the envelope strictly and raises [ServerException] on
  /// malformed shapes (Requirement 4.6). Once past the envelope check,
  /// produces an [OffLookupNotFound] for status-zero or product-missing
  /// responses (Requirement 4.5), and an [OffLookupProduct] otherwise
  /// (Requirements 4.4, 7.10).
  static OffLookupOutcome fromJson(
    Map<String, dynamic> body,
    String barcode,
  ) {
    // Envelope: `status` must be an integer in `{0, 1}`.
    final Object? rawStatus = body['status'];
    if (rawStatus is! int) {
      throw ServerException(
        'OFF response for barcode "$barcode" from $_endpoint is malformed: '
        '"status" is missing or not an integer '
        '(got: ${_describe(rawStatus)}).',
        0,
      );
    }
    if (rawStatus != 0 && rawStatus != 1) {
      throw ServerException(
        'OFF response for barcode "$barcode" from $_endpoint is malformed: '
        '"status" must be 0 or 1 (got: $rawStatus).',
        0,
      );
    }

    // status == 0 → typed "not found" sentinel (Requirement 4.5).
    if (rawStatus == 0) {
      return OffLookupNotFound(barcode);
    }

    // status == 1 → `product` may still be null/missing per Requirement
    // 4.5, in which case the lookup also resolves to "not found". Only
    // a present-but-non-object `product` is an envelope violation.
    final Object? rawProduct = body['product'];
    if (rawProduct == null) {
      return OffLookupNotFound(barcode);
    }
    if (rawProduct is! Map<String, dynamic>) {
      throw ServerException(
        'OFF response for barcode "$barcode" from $_endpoint is malformed: '
        '"product" is present but not a JSON object '
        '(got: ${_describe(rawProduct)}).',
        0,
      );
    }

    // Lenient product fields per Requirements 4.4 and 7.10. Each field
    // is read defensively: a non-string or oversized value is treated
    // exactly like a missing one, rather than as an envelope error,
    // because the predecessor's behaviour is to surface "Unknown
    // Product" instead of failing the whole lookup.
    final product = ScannedProduct(
      barcode: barcode,
      name: _resolveName(rawProduct['product_name']),
      brand: _resolveFirstCommaEntry(
        rawProduct['brands'],
        maxLength: _maxBrandLength,
      ),
      category: _resolveFirstCommaEntry(
        rawProduct['categories'],
        maxLength: _maxCategoryLength,
      ),
      imageUrl: _resolveImageUrl(rawProduct['image_url']),
    );

    return OffLookupProduct(product);
  }
}

/// Resolves [rawProductName] to a non-empty [String] suitable for
/// [ScannedProduct.name].
///
/// Trims the value and returns it when it is a non-empty string of at
/// most [_maxNameLength] characters; otherwise returns the literal
/// `"Unknown Product"` per Requirements 4.4 and 7.10.
String _resolveName(Object? rawProductName) {
  if (rawProductName is! String) return _unknownProductName;
  final trimmed = rawProductName.trim();
  if (trimmed.isEmpty) return _unknownProductName;
  if (trimmed.length > _maxNameLength) return _unknownProductName;
  return trimmed;
}

/// Resolves a comma-separated OFF field (`brands` or `categories`) to
/// the first trimmed entry, or `null` when the source value is missing,
/// empty, or longer than [maxLength] characters after trimming.
String? _resolveFirstCommaEntry(
  Object? rawValue, {
  required int maxLength,
}) {
  if (rawValue is! String) return null;
  final trimmed = rawValue.trim();
  if (trimmed.isEmpty) return null;
  if (trimmed.length > maxLength) return null;
  final firstEntry = trimmed.split(',').first.trim();
  if (firstEntry.isEmpty) return null;
  return firstEntry;
}

/// Resolves the OFF `image_url` field verbatim, returning `null` when
/// the source value is missing, empty, or longer than
/// [_maxImageUrlLength] characters.
String? _resolveImageUrl(Object? rawImageUrl) {
  if (rawImageUrl is! String) return null;
  if (rawImageUrl.isEmpty) return null;
  if (rawImageUrl.length > _maxImageUrlLength) return null;
  return rawImageUrl;
}

String _describe(Object? value) {
  if (value == null) return 'null';
  return '${value.runtimeType}';
}
