// Barcode-feature transport seam.
//
// The cook-smart barcode feature needs three things `core/network/`'s
// general [ApiClient] does not currently expose:
//
//   1. A per-request `requiresAuth` flag so the unauthenticated
//      Open Food Facts lookup (`GET .../product/<barcode>.json`) can
//      opt out of `AuthInterceptor`'s JWT injection while the
//      authenticated `POST /api/v1/ingredients` opts in.
//   2. A per-request timeout override so the Open Food Facts call
//      can use a 5s connect / 10s receive budget (per
//      flutter-port-barcode Requirement 4.2 — Open Food Facts is a
//      free best-effort service and tighter deadlines keep the
//      user-perceived latency bounded), while the authenticated
//      ingredient-add call inherits the foundation-default
//      10s connect / 15s receive timeouts (Requirement 12.4).
//   3. A 512 KiB body-size guard on the Open Food Facts response so a
//      pathological payload cannot OOM the JSON decoder (Requirement
//      4.3). The guard runs at the seam, before the body is decoded,
//      so the parser layer in `features/barcode/data/` never sees an
//      oversized body.
//
// `BarcodeApiClient` is the abstract interface. `DioBarcodeApiClient`,
// declared below, is the concrete adapter that fulfils the interface
// against the foundation's [dioProvider]. Living under
// `lib/core/network/` keeps `package:dio` confined to that directory
// per the foundation architecture lint and per
// flutter-port-barcode Requirement 1.1.
//
// Why this is in `core/network/` rather than `features/barcode/data/`
// -------------------------------------------------------------------
//
// This is the second instance of the feature-shaped transport-seam
// pattern, following the [AuthApiClient] established by Auth Decision 4
// (see `auth_api_client.dart`). The architectural-enforcement script
// `tool/check_architecture.dart` forbids `package:dio` outside
// `lib/core/network/`, so any feature that needs feature-shaped
// transport (per-request `requiresAuth`, per-request timeout overrides,
// or per-endpoint body validation) lands the seam here. The
// `BarcodeRepository` under `features/barcode/data/` consumes the
// seam through [barcodeApiClientProvider] and never imports
// `package:dio` itself. See flutter-port-barcode Decision (Auth
// Decision 4 reused) and Requirements 1.1, 8.1, 13.7.
//
// The seam exposes only the two endpoints the barcode feature needs.
// Other features continue to depend on the general [ApiClient] interface
// or — in the auth feature's case — on [AuthApiClient]. Neither this
// seam nor those others depend on each other.
//
// Reference: flutter-port-barcode Requirements 1.1, 4.1, 4.2, 4.3,
// 5.1, 5.6, 8.1, 13.7; flutter-migration-architecture Requirements
// 4.5, 4.8, 11.4, 11.5, 11.6, 11.7.

// External libraries
import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Internal modules
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/network/auth_interceptor.dart';
import 'package:mobile/core/network/dio_client.dart';

/// Result of a successful barcode-endpoint request.
///
/// Carries only transport-agnostic primitives: the HTTP status code and
/// the JSON-decoded body. Headers are intentionally omitted because no
/// barcode endpoint relies on response headers; if a future endpoint
/// does, add a typed accessor here rather than exposing raw header
/// maps.
///
/// `body` is typed as `dynamic` because the two endpoints return
/// genuinely different shapes:
///
///   * The Open Food Facts lookup returns a JSON object whose envelope
///     `Off_Lookup_Response.fromJson` validates strictly under
///     `features/barcode/data/`.
///   * The cook-smart `POST /api/v1/ingredients` endpoint normally
///     returns a JSON object on 201, but `Ingredient_Add_Response`
///     parses it leniently (per flutter-port-barcode Requirement 5.6),
///     so the seam tolerates non-`Map` 2xx bodies and forwards them to
///     the parser layer.
///
/// Construction is `const`-friendly so the adapter can build the value
/// directly from a successful response without allocating intermediate
/// state.
class BarcodeApiResponse {
  /// Constructs a typed barcode response.
  const BarcodeApiResponse({
    required this.statusCode,
    required this.body,
  });

  /// HTTP status code returned by the upstream service (e.g. `200`,
  /// `201`).
  final int statusCode;

  /// JSON-decoded response body. May be a `Map<String, dynamic>` (the
  /// expected shape for both endpoints), `null` (a 2xx empty body
  /// tolerated for `POST /api/v1/ingredients` per Requirement 5.6), or
  /// any other JSON-compatible value the parser layer is responsible
  /// for handling.
  final dynamic body;
}

/// Transport-agnostic surface for the two endpoints the barcode
/// feature consumes.
///
/// Implementations live under `lib/core/network/` and are exposed to
/// `features/barcode/data/` exclusively through
/// [barcodeApiClientProvider]. Nothing under `lib/features/`
/// constructs an implementation directly (foundation Requirement
/// 11.6).
///
/// On failure every method raises one of the typed [ApiException]
/// subtypes — see `api_exception.dart` for the taxonomy.
/// Implementations MUST translate transport errors before they leak to
/// callers.
abstract class BarcodeApiClient {
  /// Issues `GET https://world.openfoodfacts.org/api/v2/product/<barcode>.json`
  /// against the public Open Food Facts service.
  ///
  /// Implementations apply a 5s connect / 10s receive timeout override
  /// (Requirement 4.2), opt out of `AuthInterceptor`'s JWT injection
  /// via `requiresAuth=false` (Requirement 4.1 — Open Food Facts does
  /// not authenticate), and reject responses larger than 512 KiB
  /// (Requirement 4.3) before any JSON decoding runs.
  ///
  /// The absolute URL is intentional: it bypasses the foundation's
  /// base URL so the cook-smart `Backend_API` is not consulted for
  /// the public-database lookup.
  ///
  /// `cancelToken` lets the notifier's auto-dispose path cancel an
  /// in-flight lookup deterministically (Requirement 8.11).
  Future<BarcodeApiResponse> lookupOpenFoodFacts(
    String barcode, {
    CancelToken? cancelToken,
  });

  /// Issues `POST /api/v1/ingredients` against the cook-smart
  /// `Backend_API`.
  ///
  /// Implementations attach `requiresAuth=true` so
  /// `AuthInterceptor` injects the JWT minted by the auth feature
  /// (Requirement 5.1). Foundation-default 10s/15s timeouts apply
  /// (Requirement 12.4). On a 2xx response with a body that is not a
  /// JSON object, the optional malformed-body hook (supplied at
  /// construction) is invoked with a description of the offending
  /// shape and the call resolves as success (Requirement 5.6) —
  /// because the user-visible add-to-pantry side effect has already
  /// occurred on the backend.
  ///
  /// `cancelToken` lets the notifier's auto-dispose path cancel an
  /// in-flight add deterministically.
  Future<BarcodeApiResponse> addIngredient(
    Map<String, dynamic> body, {
    CancelToken? cancelToken,
  });
}

/// Concrete [BarcodeApiClient] backed by the foundation's
/// [dioProvider].
///
/// The adapter is the single place that knows about
/// [AuthInterceptor.requiresAuthExtraKey], the per-request timeout
/// override for Open Food Facts, the 512 KiB body-size guard, and the
/// JSON-decoded `Response<dynamic>` shape Dio returns. It catches
/// `DioException`, unwraps the typed [ApiException] that
/// `ErrorInterceptor` already attached to `error.error`, and rethrows
/// that — so callers never observe `package:dio` types.
class DioBarcodeApiClient implements BarcodeApiClient {
  /// Creates an adapter that issues requests through the supplied
  /// [Dio].
  ///
  /// `onMalformedAddBody` is the optional logging hook invoked when
  /// `addIngredient` observes a 2xx response whose body is not a JSON
  /// object (Requirement 5.6). The hook receives a short human-readable
  /// description of the offending body's runtime type so a future log
  /// aggregator can surface backend regressions without surfacing them
  /// to the user. When omitted, malformed 2xx bodies are still
  /// resolved as success but no log line is emitted.
  DioBarcodeApiClient(
    this._dio, {
    void Function(String description)? onMalformedAddBody,
  }) : _onMalformedAddBody = onMalformedAddBody;

  /// Absolute URL of the Open Food Facts product-lookup endpoint.
  /// `<barcode>` is interpolated by [lookupOpenFoodFacts].
  static const String _openFoodFactsBaseUrl =
      'https://world.openfoodfacts.org/api/v2/product/';

  /// Path of the cook-smart ingredient-add endpoint, relative to the
  /// foundation-resolved `Backend_API` base URL.
  static const String _addIngredientPath = '/api/v1/ingredients';

  /// Connect timeout applied to the Open Food Facts lookup, overriding
  /// the foundation default (Requirement 4.2).
  static const Duration _offConnectTimeout = Duration(seconds: 5);

  /// Receive timeout applied to the Open Food Facts lookup, overriding
  /// the foundation default (Requirement 4.2).
  static const Duration _offReceiveTimeout = Duration(seconds: 10);

  /// Maximum tolerated Open Food Facts response body size, in bytes
  /// (Requirement 4.3). 512 KiB is comfortably larger than every
  /// real-world Open Food Facts product document but small enough that
  /// a pathological payload cannot OOM the JSON decoder.
  static const int _maxOffBodyBytes = 512 * 1024;

  /// Extra-key payload that opts a request out of JWT injection.
  ///
  /// `AuthInterceptor` reads this key off `RequestOptions.extra`; when
  /// the value is the literal `false` it skips the `Authorization`
  /// header entirely. Used by [lookupOpenFoodFacts] because
  /// Open Food Facts does not authenticate.
  static const Map<String, dynamic> _requiresAuthFalseExtra =
      <String, dynamic>{
    AuthInterceptor.requiresAuthExtraKey: false,
  };

  /// Extra-key payload that opts a request into JWT injection.
  ///
  /// Setting `requiresAuth=true` is technically redundant — the
  /// interceptor's least-surprise default already treats absence as
  /// `true` — but the explicit flag documents the intent at the call
  /// site and matches the literal pinned by Requirement 5.1.
  static const Map<String, dynamic> _requiresAuthTrueExtra =
      <String, dynamic>{
    AuthInterceptor.requiresAuthExtraKey: true,
  };

  final Dio _dio;
  final void Function(String description)? _onMalformedAddBody;

  @override
  Future<BarcodeApiResponse> lookupOpenFoodFacts(
    String barcode, {
    CancelToken? cancelToken,
  }) async {
    final url = '$_openFoodFactsBaseUrl$barcode.json';

    // `responseType: ResponseType.bytes` lets us measure the response
    // body length in real bytes (Requirement 4.3 is byte-denominated)
    // before any JSON decoder allocates the parsed structure.
    // Auto-decoding via `ResponseType.json` would parse first and
    // measure later, which defeats the purpose of the guard.
    final Response<List<int>> response;
    try {
      response = await _dio.get<List<int>>(
        url,
        cancelToken: cancelToken,
        options: Options(
          responseType: ResponseType.bytes,
          connectTimeout: _offConnectTimeout,
          receiveTimeout: _offReceiveTimeout,
          extra: _requiresAuthFalseExtra,
        ),
      );
    } on DioException catch (error) {
      throw _unwrap(error, url);
    }

    final bytes = response.data;
    final statusCode = response.statusCode ?? 0;
    if (bytes == null) {
      throw ServerException(
        'Open Food Facts response for barcode $barcode '
        'returned no body.',
        statusCode,
      );
    }

    if (bytes.length > _maxOffBodyBytes) {
      throw ServerException(
        'Open Food Facts response for barcode $barcode '
        'exceeded the ${_maxOffBodyBytes ~/ 1024} KiB body-size guard '
        '(${bytes.length} bytes).',
        statusCode,
      );
    }

    final dynamic decoded;
    try {
      decoded = jsonDecode(utf8.decode(_asUint8List(bytes)));
    } on FormatException catch (error) {
      throw ServerException(
        'Open Food Facts response for barcode $barcode '
        'was not valid UTF-8 JSON: ${error.message}',
        statusCode,
      );
    }

    return BarcodeApiResponse(statusCode: statusCode, body: decoded);
  }

  @override
  Future<BarcodeApiResponse> addIngredient(
    Map<String, dynamic> body, {
    CancelToken? cancelToken,
  }) async {
    final Response<dynamic> response;
    try {
      response = await _dio.post<dynamic>(
        _addIngredientPath,
        data: body,
        cancelToken: cancelToken,
        options: Options(extra: _requiresAuthTrueExtra),
      );
    } on DioException catch (error) {
      throw _unwrap(error, _addIngredientPath);
    }

    final statusCode = response.statusCode ?? 0;
    final dynamic data = response.data;

    // Lenient 2xx body shape per Requirement 5.6: the side effect on
    // the backend has already occurred, so a malformed body is a
    // logging concern, not a user-facing failure. The parser layer
    // (`Ingredient_Add_Response.fromJson`) reduces a non-Map body to
    // `IngredientAddResponse(message: null, ingredient: null)`.
    if (statusCode >= 200 &&
        statusCode < 300 &&
        data != null &&
        data is! Map<String, dynamic>) {
      _onMalformedAddBody?.call(
        'POST $_addIngredientPath returned $statusCode with a '
        '${data.runtimeType} body (expected Map<String, dynamic>).',
      );
    }

    return BarcodeApiResponse(statusCode: statusCode, body: data);
  }

  // -- Private helpers -----------------------------------------------------

  /// Coerces an arbitrary `List<int>` byte buffer into a
  /// [Uint8List] without copying when the underlying buffer already
  /// is one. `utf8.decode` accepts either, but typing the intermediate
  /// value as [Uint8List] avoids a needless O(n) copy on the hot
  /// lookup path.
  Uint8List _asUint8List(List<int> bytes) {
    if (bytes is Uint8List) return bytes;
    return Uint8List.fromList(bytes);
  }

  /// Unwraps a [DioException] raised by `_dio` into the typed
  /// [ApiException] that `ErrorInterceptor` attached to its `error`
  /// field. Falls back to a [NetworkException] when the error payload
  /// is missing — defensive: the foundation's interceptors always
  /// attach an [ApiException], but a future interceptor could escape
  /// the `_dio` instance before reaching `ErrorInterceptor`.
  ApiException _unwrap(DioException error, String path) {
    final wrapped = error.error;
    if (wrapped is ApiException) return wrapped;
    return NetworkException(
      'Unexpected transport failure for $path: '
      '${error.message ?? error.type.name}',
    );
  }
}

/// Application-wide [BarcodeApiClient] singleton.
///
/// Reads the foundation's [dioProvider] so swapping the underlying
/// transport in tests is a single `dioProvider.overrideWith` away.
/// Tests that want to fake the barcode-endpoint surface specifically
/// can override this provider instead with their own
/// [BarcodeApiClient] implementation.
final Provider<BarcodeApiClient> barcodeApiClientProvider =
    Provider<BarcodeApiClient>(
  (ref) => DioBarcodeApiClient(ref.read(dioProvider)),
);
