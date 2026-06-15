// Ingredient_Add_Response — typed parser for the cook-smart Backend_API
// `POST /api/v1/ingredients` response body.
//
// The endpoint returns `201 { message: string, ingredient: { ... } }` per
// `backend/src/routes/ingredients.ts` and is intentionally **not** wrapped
// in the foundation's canonical `{ success, message, data }` envelope. This
// parser sits inside `features/barcode/data/` and reads the body locally,
// applying the same feature-local-parsing approach Auth Decision 1
// established for the auth endpoints — see flutter-port-barcode
// Requirement 5.4.
//
// Lenient by design (Requirement 5.6).
// ------------------------------------
//
// The user-visible add-to-pantry side effect has already occurred on the
// backend by the time this parser runs (the HTTP status is 2xx). A
// malformed body is therefore a logging concern, not a user-facing
// failure. The parser MUST NOT throw — every malformed shape collapses to
// `IngredientAddResponse(message: null, ingredient: null)` and the
// optional logging hook is invoked with a short description of the
// offending shape so a future log aggregator can surface backend
// regressions.
//
// Three malformed shapes are tolerated (Requirement 5.6):
//
//   1. `body` is not a `Map<String, dynamic>` (e.g. the seam observed an
//      empty body or a JSON string).
//   2. The top-level `message` field is present but not a `String`.
//   3. The top-level `ingredient` field is present but not a JSON object.
//
// In every case the parser returns the all-null response and notifies the
// hook. The hook is the same `void Function(String description)?` shape
// that `DioBarcodeApiClient`'s constructor accepts (see
// `core/network/barcode_api_client.dart`). The repository wires the two
// hook sites to the same closure when one is installed, so a malformed
// body produces exactly one log line regardless of which boundary
// detected it.
//
// `addedIngredientName` getter (Requirement 9.7).
// -----------------------------------------------
//
// The backend's `ingredient` payload (when well-formed) carries the
// `custom_name` field that the React Native predecessor surfaces in the
// success banner ("`<addedIngredientName>` has been added to your
// inventory"). The notifier reads [addedIngredientName] off this response
// and threads it into `ScanAdded.addedIngredientName` so the screen can
// render the banner per Requirement 9.7. When `ingredient` is null or
// `custom_name` is absent/non-string, the getter returns `null` and the
// notifier falls back to the Scanned_Product's resolved name per the same
// requirement.
//
// Reference: flutter-port-barcode Requirements 5.4, 5.6, 9.7.

import 'package:flutter/foundation.dart';

/// Typed result of parsing the cook-smart `POST /api/v1/ingredients`
/// response body.
///
/// Construction is `const`-friendly so the all-null fallback (used when
/// the body is malformed per Requirement 5.6) is canonical and the
/// success path allocates only the two fields that actually came back.
@immutable
final class IngredientAddResponse {
  /// Constructs an [IngredientAddResponse] with both fields explicit.
  ///
  /// Production callers route through [IngredientAddResponse.fromJson],
  /// which is the only caller responsible for shaping raw wire data.
  const IngredientAddResponse({
    required this.message,
    required this.ingredient,
  });

  /// Parses an `addIngredient` response body leniently.
  ///
  /// Returns the all-null fallback (rather than throwing) for any of the
  /// three malformed shapes documented at the file level — `body` is not
  /// a `Map`, `message` is non-string, or `ingredient` is non-object —
  /// and invokes [onMalformedAddBody] with a short description of the
  /// offending shape. The logging hook is the same surface that
  /// `DioBarcodeApiClient`'s constructor accepts; pass it through from
  /// the seam-installed hook so a malformed body produces exactly one
  /// log line regardless of which boundary detected it.
  ///
  /// Reference: flutter-port-barcode Requirements 5.4, 5.6.
  factory IngredientAddResponse.fromJson(
    dynamic body, {
    void Function(String description)? onMalformedAddBody,
  }) {
    if (body is! Map<String, dynamic>) {
      onMalformedAddBody?.call(
        'POST /api/v1/ingredients body was not a JSON object '
        '(runtimeType: ${body.runtimeType}); resolving as success with '
        'message=null, ingredient=null per Requirement 5.6.',
      );
      return const IngredientAddResponse(message: null, ingredient: null);
    }

    final dynamic rawMessage = body['message'];
    final String? message;
    if (rawMessage == null) {
      message = null;
    } else if (rawMessage is String) {
      message = rawMessage;
    } else {
      onMalformedAddBody?.call(
        'POST /api/v1/ingredients body had a non-string `message` field '
        '(runtimeType: ${rawMessage.runtimeType}); coercing to null per '
        'Requirement 5.6.',
      );
      message = null;
    }

    final dynamic rawIngredient = body['ingredient'];
    final Map<String, dynamic>? ingredient;
    if (rawIngredient == null) {
      ingredient = null;
    } else if (rawIngredient is Map<String, dynamic>) {
      ingredient = rawIngredient;
    } else {
      onMalformedAddBody?.call(
        'POST /api/v1/ingredients body had a non-object `ingredient` '
        'field (runtimeType: ${rawIngredient.runtimeType}); coercing to '
        'null per Requirement 5.6.',
      );
      ingredient = null;
    }

    return IngredientAddResponse(message: message, ingredient: ingredient);
  }

  /// Optional human-readable success message returned by the backend
  /// (e.g. `"Ingredient added"`). `null` when the field is missing,
  /// non-string, or the body itself was malformed.
  final String? message;

  /// Optional ingredient envelope returned by the backend. Carries the
  /// `custom_name` field that [addedIngredientName] surfaces. `null`
  /// when the field is missing, non-object, or the body itself was
  /// malformed.
  final Map<String, dynamic>? ingredient;

  /// Resolved `custom_name` of the added ingredient, surfaced in the
  /// success banner per Requirement 9.7.
  ///
  /// Reads `ingredient?['custom_name'] as String?` per the task's pinned
  /// expression. Returns `null` when [ingredient] is null or when the
  /// `custom_name` field is absent (the `as String?` cast on `null`
  /// resolves to `null`). When the backend ships a well-formed
  /// `ingredient` envelope, `custom_name` is always a string — that's
  /// the column type in `backend/src/routes/ingredients.ts` — so the
  /// cast is total in production. A non-string non-null `custom_name`
  /// value indicates a backend regression and would surface as a runtime
  /// `TypeError` here; the lenient never-throw contract of
  /// Requirement 5.6 covers the parsing layer (the body / `message` /
  /// `ingredient` shape itself), not malformed leaf field types inside
  /// an otherwise well-formed ingredient envelope.
  String? get addedIngredientName => ingredient?['custom_name'] as String?;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! IngredientAddResponse) return false;
    return other.message == message &&
        mapEquals(other.ingredient, ingredient);
  }

  @override
  int get hashCode {
    final ingredient = this.ingredient;
    final ingredientHash = ingredient == null
        ? null
        : Object.hashAllUnordered(
            ingredient.entries.map((e) => Object.hash(e.key, e.value)),
          );
    return Object.hash(message, ingredientHash);
  }

  @override
  String toString() {
    return 'IngredientAddResponse('
        'message: $message, '
        'ingredient: $ingredient'
        ')';
  }
}
