// Auth-feature transport seam.
//
// The cook-smart auth feature needs three things `core/network/`'s general
// [ApiClient] does not currently expose:
//
//   1. A per-request `requiresAuth` flag so `POST /api/v1/auth/login` and
//      `POST /api/v1/auth/register` can opt out of `AuthInterceptor`'s JWT
//      injection. Both endpoints exist precisely to issue a JWT, so
//      attaching one would be a contradiction.
//   2. A typed return value that carries the HTTP status code (so a 201
//      from `/register` can be distinguished from a 200 from `/login`)
//      and the JSON-decoded body, without leaking `package:dio`'s
//      `Response<dynamic>` past the network layer.
//   3. A failure surface that consists of `ApiException` subtypes only,
//      not `DioException`, so feature code never depends on a transport
//      library type (Foundation Requirement 11.5).
//
// `AuthApiClient` is the abstract interface. `DioAuthApiClient`, declared
// below, is the concrete adapter that fulfils the interface against the
// foundation's [dioProvider]. Living under `lib/core/network/` keeps
// `package:dio` confined to that directory per Foundation Requirement 4.8
// and `tool/check_architecture.dart` rule R-4.8.
//
// Why this is in `core/network/` rather than `features/auth/data/`
// ----------------------------------------------------------------
//
// The auth-port spec originally proposed having `AuthRepository` consume
// `Dio` directly. That proposal conflicted with the foundation's
// architecture-enforcement script, which forbids `package:dio` outside
// `lib/core/network/`. Adding `requiresAuth` to the existing [ApiClient]
// would have modified an existing core file (Foundation Requirement 7.6
// limits which core files the auth-port spec may modify), so a new
// auth-shaped file lives here instead. The auth-port design and tasks
// were amended to consume `AuthApiClient` rather than `Dio`. See
// `flutter-port-auth/design.md` Decision 4 for the full rationale.
//
// The seam exposes only the four endpoints the auth feature needs. Other
// features continue to depend on the general [ApiClient] interface; they
// do not consume `AuthApiClient` and `AuthApiClient` does not depend on
// `ApiClient`.
//
// Reference: `flutter-port-auth` Requirements 1.3, 2.1-2.7, 3.1-3.6, 8.6;
// Foundation Requirements 4.8, 11.4, 11.5, 11.6, 11.7.

// External libraries
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Internal modules
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/network/auth_interceptor.dart';
import 'package:mobile/core/network/dio_client.dart';

/// Result of a successful auth-endpoint request.
///
/// Carries only transport-agnostic primitives: the HTTP status code and
/// the JSON-decoded body. Headers are intentionally omitted because no
/// auth endpoint relies on response headers; if a future endpoint does,
/// add a typed accessor here rather than exposing raw header maps.
///
/// Construction is `const`-friendly so the adapter can build the value
/// directly from a successful response without allocating intermediate
/// state.
class AuthApiResponse {
  /// Constructs a typed auth response.
  const AuthApiResponse({
    required this.statusCode,
    required this.body,
  });

  /// HTTP status code returned by the backend (e.g. `200`, `201`).
  final int statusCode;

  /// JSON-decoded response body. Always a `Map<String, dynamic>` for the
  /// four cook-smart auth endpoints; the per-endpoint response classes
  /// under `features/auth/data/` validate the shape further.
  final Map<String, dynamic> body;
}

/// Transport-agnostic surface for the four `/api/v1/auth/*` endpoints.
///
/// Implementations live under `lib/core/network/` and are exposed to
/// `features/auth/data/` exclusively through [authApiClientProvider].
/// Nothing under `lib/features/` constructs an implementation directly
/// (Foundation Requirement 11.6).
///
/// On failure every method raises one of the typed [ApiException]
/// subtypes — see `api_exception.dart` for the taxonomy. Implementations
/// MUST translate transport errors before they leak to callers.
abstract class AuthApiClient {
  /// Issues `POST /api/v1/auth/login` with `requiresAuth=false`.
  Future<AuthApiResponse> login({
    required String email,
    required String password,
  });

  /// Issues `POST /api/v1/auth/register` with `requiresAuth=false`.
  ///
  /// Implementations forward [body] verbatim — the auth repository owns
  /// the optional-name trimming rule (auth-port Requirement 2.2).
  Future<AuthApiResponse> register(Map<String, dynamic> body);

  /// Issues `GET /api/v1/auth/me` with `requiresAuth=true`.
  Future<AuthApiResponse> me();

  /// Issues `POST /api/v1/auth/logout` with `requiresAuth=true`.
  Future<AuthApiResponse> logout();
}

/// Concrete [AuthApiClient] backed by the foundation's [dioProvider].
///
/// The adapter is the single place that knows about
/// [AuthInterceptor.requiresAuthExtraKey] and the JSON-decoded
/// `Response<dynamic>` shape Dio returns. It catches `DioException`,
/// unwraps the typed [ApiException] that `ErrorInterceptor` already
/// attached to `error.error`, and rethrows that — so callers never
/// observe `package:dio` types.
class DioAuthApiClient implements AuthApiClient {
  /// Creates an adapter that issues requests through the supplied [Dio].
  DioAuthApiClient(this._dio);

  /// Path of the login endpoint on the cook-smart Backend_API.
  static const String _loginPath = '/api/v1/auth/login';

  /// Path of the register endpoint on the cook-smart Backend_API.
  static const String _registerPath = '/api/v1/auth/register';

  /// Path of the `/me` endpoint on the cook-smart Backend_API.
  static const String _mePath = '/api/v1/auth/me';

  /// Path of the logout endpoint on the cook-smart Backend_API.
  static const String _logoutPath = '/api/v1/auth/logout';

  /// Extra-key payload that opts a request out of JWT injection.
  ///
  /// `AuthInterceptor` reads this key off `RequestOptions.extra`; when
  /// the value is the literal `false` it skips the `Authorization`
  /// header entirely. Any other value (including absence) is treated
  /// as `requiresAuth=true` per the foundation's least-surprise rule.
  static const Map<String, dynamic> _requiresAuthFalseExtra =
      <String, dynamic>{
    AuthInterceptor.requiresAuthExtraKey: false,
  };

  final Dio _dio;

  @override
  Future<AuthApiResponse> login({
    required String email,
    required String password,
  }) {
    return _post(
      path: _loginPath,
      data: <String, dynamic>{
        'email': email,
        'password': password,
      },
      requiresAuth: false,
    );
  }

  @override
  Future<AuthApiResponse> register(Map<String, dynamic> body) {
    return _post(
      path: _registerPath,
      data: body,
      requiresAuth: false,
    );
  }

  @override
  Future<AuthApiResponse> me() {
    return _get(path: _mePath, requiresAuth: true);
  }

  @override
  Future<AuthApiResponse> logout() {
    return _post(
      path: _logoutPath,
      data: const <String, dynamic>{},
      requiresAuth: true,
    );
  }

  // -- Private helpers -----------------------------------------------------

  Future<AuthApiResponse> _post({
    required String path,
    required Map<String, dynamic> data,
    required bool requiresAuth,
  }) async {
    final Response<dynamic> response;
    try {
      response = await _dio.post<dynamic>(
        path,
        data: data,
        options: requiresAuth ? null : Options(extra: _requiresAuthFalseExtra),
      );
    } on DioException catch (error) {
      throw _unwrap(error, path);
    }
    return _toAuthApiResponse(response, path);
  }

  Future<AuthApiResponse> _get({
    required String path,
    required bool requiresAuth,
  }) async {
    final Response<dynamic> response;
    try {
      response = await _dio.get<dynamic>(
        path,
        options: requiresAuth ? null : Options(extra: _requiresAuthFalseExtra),
      );
    } on DioException catch (error) {
      throw _unwrap(error, path);
    }
    return _toAuthApiResponse(response, path);
  }

  /// Translates a successful [Response] into [AuthApiResponse] and
  /// rejects bodies that are not JSON objects with [ServerException].
  ///
  /// The auth backend always returns a JSON object on success; a
  /// non-object body (a JSON array, string, or `null`) means the
  /// backend returned something we did not anticipate, so the parser
  /// layer below (`Auth*Response.fromJson`) only ever sees a real
  /// `Map<String, dynamic>`.
  AuthApiResponse _toAuthApiResponse(
    Response<dynamic> response,
    String path,
  ) {
    final dynamic data = response.data;
    final statusCode = response.statusCode ?? 0;
    if (data is Map<String, dynamic>) {
      return AuthApiResponse(statusCode: statusCode, body: data);
    }
    // Logout endpoint returns `{ success, message }` but we tolerate
    // an empty / null body too (auth-port Requirement 3.5). Other
    // endpoints require a populated object.
    if (path == _logoutPath && (data == null || data == '')) {
      return AuthApiResponse(
        statusCode: statusCode,
        body: const <String, dynamic>{},
      );
    }
    throw ServerException(
      'Expected JSON object body from $path '
      'but got ${data == null ? 'null' : data.runtimeType.toString()}.',
      statusCode,
    );
  }

  /// Unwraps a [DioException] raised by `_dio` into the typed
  /// [ApiException] that `ErrorInterceptor` attached to its `error`
  /// field. Falls back to a [NetworkException] when the error payload
  /// is missing — defensive: the foundation's interceptors always
  /// attach an [ApiException].
  ApiException _unwrap(DioException error, String path) {
    final wrapped = error.error;
    if (wrapped is ApiException) return wrapped;
    return NetworkException(
      'Unexpected transport failure for $path: '
      '${error.message ?? error.type.name}',
    );
  }
}

/// Application-wide [AuthApiClient] singleton.
///
/// Reads the foundation's [dioProvider] so swapping the underlying
/// transport in tests is a single `dioProvider.overrideWith` away.
/// Tests that want to fake the auth-endpoint surface specifically can
/// override this provider instead with their own [AuthApiClient]
/// implementation.
final Provider<AuthApiClient> authApiClientProvider = Provider<AuthApiClient>(
  (ref) => DioAuthApiClient(ref.read(dioProvider)),
);
