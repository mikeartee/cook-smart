// Cook-smart barcode-to-pantry repository.
//
// `BarcodeRepository` is the single owner of the two endpoint surfaces the
// barcode feature consumes:
//
//   * `GET https://world.openfoodfacts.org/api/v2/product/<barcode>.json`
//     for the unauthenticated product lookup.
//   * `POST /api/v1/ingredients` (cook-smart Backend_API) for the
//     authenticated add-to-pantry write.
//
// The repository depends on a single seam, [BarcodeApiClient] from
// `core/network/barcode_api_client.dart`, exposed via
// [barcodeApiClientProvider]. The seam already encodes the per-endpoint
// `requiresAuth` flag, the per-endpoint timeout overrides
// (5s/10s for OFF per flutter-port-barcode Requirement 4.2; the
// foundation-default 10s/15s for the Ingredient_Endpoint per
// Requirement 12.4), and the 512 KiB OFF body-size guard per
// Requirement 4.3 — so this file never sees `package:dio` types or
// `DioException`.
//
// The architectural-enforcement script `tool/check_architecture.dart`
// forbids `package:dio` imports outside `lib/core/network/`, forbids
// `package:flutter_secure_storage` imports outside `lib/core/storage/`,
// and forbids cross-feature imports between feature folders. This file
// honours all three:
//
//   * No `package:dio` import (per Requirement 8.2 and the feature's
//     transport-seam isolation pattern).
//   * No `package:flutter_secure_storage` import — the JWT and user
//     record are owned exclusively by the auth feature
//     (Requirement 6.4).
//   * No import of any file under `features/auth/` — the repository
//     interacts with auth state only via the foundation-exposed
//     `requiresAuth` flag on outgoing requests (Requirement 6.5),
//     attached for us by the seam.
//
// Cancellation passthrough
// ------------------------
//
// The seam's two methods accept an optional `CancelToken? cancelToken`
// so the [BarcodeNotifier]'s auto-dispose path can cancel an in-flight
// request deterministically (per Decision 2 of the design and
// Requirement 8.10). `CancelToken` lives in `package:dio`, which this
// file may not import. The repository therefore accepts an opaque
// `Object? cancelToken` at its boundary and forwards it to the seam
// via a `dynamic`-typed receiver — the seam's parameter is named only
// inside `core/network/`, where `package:dio` is allowed, and the
// dynamic dispatch elides the static type check on the named argument
// at the call site. Callers that want to cancel pass a real
// `CancelToken`; callers that do not pass `null`. An unrelated
// `Object` would surface as a runtime error from Dio when it tries to
// register the listener, which is the same diagnostic that would
// arise from a misuse of the seam directly.
//
// Validation discipline
// ---------------------
//
// `lookupOpenFoodFacts` rejects malformed barcodes synchronously
// against `^[0-9]{8,13}$` per Requirement 13.6 (c). An invalid input
// raises `ArgumentError` before any HTTP request is issued; the
// notifier catches and translates the error into the inline
// "Barcode must be 8 to 13 digits" message per Requirement 3.5.
//
// `addIngredient` calls `IngredientToAdd.toBackendJson()` before
// touching the seam (Requirement 7.6 — defensive re-validation): a
// perturbation outside the documented bounds raises `StateError`
// identifying the offending field and the request never leaves the
// device.
//
// Outcome shapes
// --------------
//
// `lookupOpenFoodFacts` returns:
//
//   * `OffLookupProduct(scannedProduct)` for a 2xx body that decodes
//     to a status-1 product per Requirements 4.4, 7.10.
//   * `OffLookupNotFound(barcode)` for status-0 or status-1 with a
//     missing/null `product` per Requirement 4.5.
//
// or raises:
//
//   * `ServerException` for malformed envelopes (Requirement 4.6),
//     non-2xx status codes (Requirement 4.8), or non-object 2xx
//     bodies. The seam already raises `ServerException` for the
//     body-size and JSON-parse cases (Requirement 4.3 / 4.6).
//   * `NetworkException` for transport / timeout failures (already
//     produced by the foundation's `ErrorInterceptor` per
//     Requirement 4.7).
//
// `addIngredient` returns an `IngredientAddResponse` parsed leniently
// per Requirement 5.6 — the user-visible add-to-pantry side effect
// has already occurred on the backend, so a malformed body is a
// logging concern, not a user-facing failure.
//
// Failure typing on the add path follows the foundation's existing
// `ErrorInterceptor` taxonomy:
//
//   * 401 → `UnauthorisedException` (foundation clears storage and
//     redirects to `/auth/login` via the auth feature's wiring per
//     Requirement 5.8).
//   * non-401 4xx → `ValidationException` (Requirement 5.7; the
//     foundation already constructs one for every 4xx).
//   * 5xx → `ServerException`. The repository wraps the foundation's
//     `ServerException` to enrich the message with the offending
//     barcode per Requirement 5.9 — the foundation does not know
//     about the barcode, so the enrichment lives here.
//   * transport / timeout → `NetworkException`.
//
// Other transport failures pass through as the typed [ApiException]
// already produced by the foundation's `ErrorInterceptor` — the
// repository never wraps them.
//
// See `flutter-port-barcode` Requirements 4.1, 4.2, 4.7, 4.8, 5.1,
// 5.3, 5.7, 5.9, 5.12, 6.4, 6.5, 6.6, 7.6, 8.2, 13.6 (c).

// External libraries
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Internal modules
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/network/barcode_api_client.dart';
import 'package:mobile/features/barcode/data/ingredient_add_response.dart';
import 'package:mobile/features/barcode/data/off_lookup_response.dart';
import 'package:mobile/features/barcode/domain/ingredient_to_add.dart';

/// Repository owning every call to the Open_Food_Facts_API and the
/// cook-smart `POST /api/v1/ingredients` endpoint.
///
/// All methods raise typed [ApiException] subtypes only — never
/// `DioException` — because the [BarcodeApiClient] adapter under
/// `core/network/` has already converted every transport failure into
/// an [ApiException]. Callers handle [ServerException],
/// [NetworkException], [ValidationException], and
/// [UnauthorisedException] explicitly and never depend on
/// `package:dio` types.
class BarcodeRepository {
  /// Creates a [BarcodeRepository] backed by a [BarcodeApiClient].
  ///
  /// The dependency is injected so tests can supply fakes and the
  /// production `ProviderScope` can supply the foundation's configured
  /// adapter via [barcodeRepositoryProvider].
  BarcodeRepository(this._client);

  /// Validation regex pinned by Requirement 3.1: 8–13 ASCII digits, no
  /// whitespace, no leading or trailing characters.
  static final RegExp _barcodePattern = RegExp(r'^[0-9]{8,13}$');

  final BarcodeApiClient _client;

  /// Looks up [barcode] against the Open_Food_Facts_API and decodes the
  /// response into an [OffLookupOutcome].
  ///
  /// Validates [barcode] eagerly against `^[0-9]{8,13}$` per
  /// Requirement 13.6 (c); an invalid input raises [ArgumentError]
  /// synchronously and zero HTTP requests are issued. The notifier
  /// catches the error and translates it to an inline field-level
  /// message per Requirement 3.5.
  ///
  /// Returns:
  ///
  ///   * [OffLookupProduct] when the response decodes to a status-1
  ///     product body per Requirements 4.4, 7.10.
  ///   * [OffLookupNotFound] when the response decodes to status-0 or
  ///     status-1 with a missing/null `product` per Requirement 4.5.
  ///
  /// Raises:
  ///
  ///   * [ServerException] for non-2xx statuses, non-object 2xx
  ///     bodies, or any envelope-shape failure
  ///     (Requirements 4.6, 4.8). The seam additionally enforces the
  ///     512 KiB body-size guard (Requirement 4.3) and JSON-parse
  ///     validity (Requirement 4.6) before this method sees the body.
  ///   * [NetworkException] for transport, timeout, or connection
  ///     failures (Requirement 4.7). No automatic retry is issued —
  ///     retry is initiated only by an explicit user action per
  ///     Requirement 9.4.
  ///
  /// [cancelToken] is typed `Object?` so this file does not import
  /// `package:dio`. Callers pass either a real `CancelToken` or
  /// `null`; the value is forwarded verbatim to the seam, which
  /// re-types it as `CancelToken?`.
  Future<OffLookupOutcome> lookupOpenFoodFacts(
    String barcode, {
    Object? cancelToken,
  }) async {
    if (!_barcodePattern.hasMatch(barcode)) {
      throw ArgumentError.value(
        barcode,
        'barcode',
        r'Barcode must match ^[0-9]{8,13}$ (8-13 ASCII digits).',
      );
    }

    final response = await (_client as dynamic).lookupOpenFoodFacts(
      barcode,
      // Forwarded via dynamic dispatch so this file does not have to
      // name `CancelToken` (which lives in `package:dio`) — see the
      // file-level "Cancellation passthrough" note above.
      cancelToken: cancelToken,
    ) as BarcodeApiResponse;

    final statusCode = response.statusCode;
    if (statusCode < 200 || statusCode >= 300) {
      // Non-2xx OFF responses: surface as `ServerException` whose
      // message includes the HTTP status and the requested barcode
      // for diagnostic clarity per Requirement 4.8. In practice the
      // foundation's `ErrorInterceptor` rejects non-2xx before this
      // method observes the response, so this branch is defensive
      // against a future seam that may resolve non-2xx without
      // throwing.
      throw ServerException(
        'Open Food Facts lookup for barcode "$barcode" returned '
        'HTTP $statusCode.',
        statusCode,
      );
    }

    final dynamic body = response.body;
    if (body is! Map<String, dynamic>) {
      throw ServerException(
        'Open Food Facts lookup for barcode "$barcode" returned a '
        'non-object 2xx body (runtimeType: ${body.runtimeType}).',
        statusCode,
      );
    }

    return OffLookupResponse.fromJson(body, barcode);
  }

  /// Persists [ingredient] to the user's pantry via
  /// `POST /api/v1/ingredients`.
  ///
  /// Calls [IngredientToAdd.toBackendJson] before touching the seam
  /// (Requirement 7.6 — defensive re-validation): a perturbation
  /// outside the documented bounds raises [StateError] identifying
  /// the offending field and the request never leaves the device.
  ///
  /// Returns an [IngredientAddResponse] parsed leniently per
  /// Requirement 5.6 — every malformed 2xx body shape collapses to
  /// `IngredientAddResponse(message: null, ingredient: null)` because
  /// the user-visible add-to-pantry side effect has already occurred
  /// on the backend.
  ///
  /// Raises:
  ///
  ///   * [UnauthorisedException] for a 401 (Requirement 5.8). The
  ///     foundation's `ErrorInterceptor` has already cleared storage
  ///     and triggered the redirect to `/auth/login` by the time the
  ///     exception reaches the caller.
  ///   * [ValidationException] for any 4xx other than 401
  ///     (Requirement 5.7). The foundation's `ErrorInterceptor`
  ///     constructs the exception from the response body's
  ///     `message` field plus any per-field details it can extract;
  ///     for a 400 with the express-validator `{error, details}`
  ///     shape the message resolves to the literal `error` value
  ///     when present.
  ///   * [ServerException] for any 5xx, with the message enriched to
  ///     include the offending barcode per Requirement 5.9. The
  ///     foundation's `ErrorInterceptor` does not know about the
  ///     barcode, so the enrichment lives here.
  ///   * [NetworkException] for transport / timeout failures
  ///     (foundation default).
  ///
  /// [cancelToken] is typed `Object?` for the same reason
  /// [lookupOpenFoodFacts] uses `Object?` — see the
  /// "Cancellation passthrough" note in the file-level dartdoc.
  Future<IngredientAddResponse> addIngredient(
    IngredientToAdd ingredient, {
    Object? cancelToken,
  }) async {
    // `toBackendJson` validates every user-facing bound and raises
    // `StateError` identifying the offending field on violation
    // (Requirement 7.6). A `StateError` from this call short-circuits
    // the future before any HTTP request is issued.
    final body = ingredient.toBackendJson();

    final BarcodeApiResponse response;
    try {
      response = await (_client as dynamic).addIngredient(
        body,
        cancelToken: cancelToken,
      ) as BarcodeApiResponse;
    } on ServerException catch (error) {
      // Enrich with the offending barcode per Requirement 5.9 — the
      // foundation does not have it. `UnauthorisedException`,
      // `ValidationException`, and `NetworkException` are propagated
      // verbatim because the foundation's typing already conveys the
      // user-actionable diagnostic for those subtypes.
      throw ServerException(
        'POST /api/v1/ingredients failed with HTTP ${error.statusCode} '
        'for barcode "${ingredient.barcode}": ${error.message}',
        error.statusCode,
      );
    }

    return IngredientAddResponse.fromJson(response.body);
  }
}

/// Application-wide [BarcodeRepository] singleton.
///
/// Reads the foundation's [barcodeApiClientProvider] so swapping the
/// underlying transport in tests is a single
/// `barcodeApiClientProvider.overrideWith` away. Tests that want to
/// fake the repository surface specifically can override this provider
/// instead with their own [BarcodeRepository] implementation.
final Provider<BarcodeRepository> barcodeRepositoryProvider =
    Provider<BarcodeRepository>(
  (ref) => BarcodeRepository(ref.read(barcodeApiClientProvider)),
);
