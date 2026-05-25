// External libraries: none — this file deliberately does not import `dio`
// or any other transport package. See Requirements 4.8 and 11.5 of the
// flutter-migration-architecture spec.

// Internal modules
import 'package:mobile/core/network/api_exception.dart';

/// Typed response returned from every [ApiClient] method.
///
/// Carries only transport-agnostic primitives: the HTTP status code, the
/// raw response headers, and the JSON-decoded response body. Envelope
/// parsing of the cook-smart `{ success, message, data }` response shape
/// is owned by `ApiResponse<T>` (see `api_response.dart`), not this type.
///
/// This value object is the contract surface for Requirement 11.4: every
/// [ApiClient] method returns a response with status, headers, and decoded
/// body, and Requirement 11.5: no transport-library type (`Response`,
/// `RequestOptions`, etc. from `package:dio`) is exposed to callers.
class ApiClientResponse {
  /// Constructs a response. All fields are required so adapters cannot
  /// silently omit headers or status while still satisfying the contract.
  const ApiClientResponse({
    required this.statusCode,
    required this.headers,
    required this.decodedBody,
  });

  /// HTTP status code returned by the backend (e.g. `200`, `404`, `500`).
  ///
  /// Adapters guarantee this is set for every successful response. When a
  /// request fails before a response is received (timeout, DNS failure,
  /// connection refused), the adapter raises a [NetworkException] instead
  /// of constructing an [ApiClientResponse].
  final int statusCode;

  /// Response headers keyed by lowercase header name.
  ///
  /// Each value is a list because some HTTP headers (e.g. `set-cookie`)
  /// may legitimately appear multiple times in a single response. Adapters
  /// MUST lowercase the keys so callers can look up headers without
  /// guessing the casing the server used.
  final Map<String, List<String>> headers;

  /// JSON-decoded response body.
  ///
  /// Typically a `Map<String, dynamic>` for the cook-smart envelope, but
  /// may also be a `List`, a primitive, or `null` depending on the
  /// endpoint. The body is exposed as `dynamic` because it is the raw
  /// JSON shape; consumers parse it into typed models via
  /// `ApiResponse.fromJson` rather than reading fields off this value
  /// directly.
  final dynamic decodedBody;
}

/// Transport-agnostic HTTP surface used by feature repositories.
///
/// Implementations (for example, a Dio-backed adapter living elsewhere in
/// `lib/core/network/`) are constructed inside the network layer and
/// exposed to the rest of the app exclusively through Riverpod providers
/// declared in `lib/core/network/`. Nothing under `lib/features/` or
/// `lib/shared/` may import a concrete adapter or `package:dio` directly;
/// the architectural-enforcement script `tool/check_architecture.dart`
/// fails the build on violations.
///
/// On failure, every method raises one of the typed [ApiException]
/// subtypes defined in `api_exception.dart`:
///
///   * [NetworkException]      — transport, DNS, or timeout failure
///                               (Requirements 4.3, 4.11).
///   * [UnauthorisedException] — HTTP 401 or a request that required auth
///                               with no JWT available
///                               (Requirements 4.3, 4.13).
///   * [ValidationException]   — client-side validation rejection
///                               (Requirement 4.3).
///   * [ServerException]       — HTTP 5xx or an unparseable envelope
///                               (Requirements 4.3, 4.12).
///
/// Implementations MUST translate transport errors before they leak to
/// callers (Requirement 11.5).
///
/// See Requirement 11.4 of the flutter-migration-architecture spec.
abstract class ApiClient {
  /// Issues an HTTP `GET` request to [path] on the configured base URL.
  ///
  /// [path] is a path-relative URL such as `/recipes/42`; the implementation
  /// resolves it against the base URL configured in `ApiConfig`.
  /// [queryParameters], when non-null, are appended to the URL as a query
  /// string. Values may be `String`, `num`, `bool`, or `List` of those
  /// primitives; the implementation is responsible for URL-encoding.
  ///
  /// Throws an [ApiException] subtype on failure — see the class-level
  /// docs of [ApiClient] for the failure taxonomy.
  Future<ApiClientResponse> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  });

  /// Issues an HTTP `POST` request to [path] with an optional JSON [body].
  ///
  /// [body], when non-null, is JSON-encoded by the implementation and sent
  /// with `Content-Type: application/json`. [queryParameters] are appended
  /// to the URL when supplied; see [get] for query-parameter semantics.
  ///
  /// Throws an [ApiException] subtype on failure — see the class-level
  /// docs of [ApiClient] for the failure taxonomy.
  Future<ApiClientResponse> post(
    String path, {
    Map<String, dynamic>? body,
    Map<String, dynamic>? queryParameters,
  });

  /// Issues an HTTP `PUT` request to [path] with an optional JSON [body].
  ///
  /// See [post] for the request-encoding contract and the class-level
  /// docs of [ApiClient] for the failure taxonomy.
  Future<ApiClientResponse> put(
    String path, {
    Map<String, dynamic>? body,
    Map<String, dynamic>? queryParameters,
  });

  /// Issues an HTTP `DELETE` request to [path].
  ///
  /// [queryParameters] are appended to the URL when supplied; see [get]
  /// for query-parameter semantics. The cook-smart backend does not
  /// currently accept a body on DELETE, so none is exposed here.
  ///
  /// Throws an [ApiException] subtype on failure — see the class-level
  /// docs of [ApiClient] for the failure taxonomy.
  Future<ApiClientResponse> delete(
    String path, {
    Map<String, dynamic>? queryParameters,
  });
}
