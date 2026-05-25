// Auth header injection for the cook-smart Dio client.
//
// `AuthInterceptor` is wired into the singleton `Dio` instance constructed
// by `dio_client.dart` (Requirement 4.1). It runs on every outgoing
// request and is responsible for:
//
//   * Reading the JWT from `SecureStorage` and attaching it as an
//     `Authorization: Bearer <jwt>` header on every request that requires
//     authentication (Requirement 4.2).
//   * Refusing to send a request that requires authentication when no JWT
//     is available — the request is rejected before it leaves the client
//     and the caller observes an `UnauthorisedException` (Requirement
//     4.13).
//
// Opting a request out of authentication
// --------------------------------------
//
// Almost every cook-smart endpoint requires a JWT. The handful that do
// not (login, signup, password reset, public health-check) opt out by
// setting `requiresAuth` to `false` on the per-request `extra` map:
//
// ```dart
// final response = await dio.post<Map<String, dynamic>>(
//   '/auth/login',
//   data: payload,
//   options: Options(extra: <String, dynamic>{
//     AuthInterceptor.requiresAuthExtraKey: false,
//   }),
// );
// ```
//
// When the `requiresAuth` key is absent the interceptor treats the
// request as authenticated. Defaulting to "auth required" matches the
// least-surprise rule: a missing flag must never cause a sensitive
// endpoint to be called without a token.
//
// JWT storage key
// ---------------
//
// The JWT is stored in `SecureStorage` under the constant
// `AuthInterceptor.jwtTokenKey` (`'jwt'`). The auth feature's repository
// (landed in a later per-feature spec) writes and clears the value;
// this interceptor only reads it. Both ends of the contract reference
// the same constant to avoid string-literal drift.
//
// Failure surface
// ---------------
//
// Every failure path produces a `DioException` whose `.error` is an
// `UnauthorisedException`, which the network layer's `ErrorInterceptor`
// then unwraps to an `ApiException` for the caller (Requirements 4.3,
// 11.5). Two failure paths are possible:
//
//   * `SecureStorage.readToken` throws a `StorageException` — for
//     example because the platform keystore is denied or unavailable.
//     The request is not sent; the caller sees an
//     `UnauthorisedException` describing the storage failure.
//   * `SecureStorage.readToken` returns `null` or the empty string —
//     no JWT has been stored, so the user is not authenticated. The
//     request is not sent; the caller sees an
//     `UnauthorisedException` describing the missing token.
//
// Reference: Requirements 4.2, 4.13 of the
// flutter-migration-architecture spec.

// External libraries
import 'package:dio/dio.dart';

// Internal modules
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/storage/secure_storage.dart';

/// Dio interceptor that injects the cook-smart JWT on authenticated
/// requests and refuses to send unauthenticated ones.
///
/// Construct one instance per `Dio` client and add it to the client's
/// `interceptors` list. The interceptor is stateless apart from the
/// `SecureStorage` handle it borrows, so it is safe to share across the
/// app.
class AuthInterceptor extends Interceptor {
  /// Creates an interceptor that reads the JWT from [storage].
  AuthInterceptor(SecureStorage storage) : _storage = storage;

  /// `SecureStorage` key under which the JWT is persisted by the auth
  /// repository and read by this interceptor. Both sides reference this
  /// constant so the key cannot drift between writers and readers.
  static const String jwtTokenKey = 'jwt';

  /// Key on `RequestOptions.extra` used to opt a request out of
  /// authentication. When the value resolves to `false` the request is
  /// forwarded with no `Authorization` header; otherwise — including
  /// when the key is absent — the request is treated as authenticated.
  static const String requiresAuthExtraKey = 'requiresAuth';

  /// HTTP header name used to transmit the bearer token. Mirrors the
  /// existing backend contract (Requirement 9.5: the auth flow is not
  /// changed by this migration).
  static const String _authorizationHeaderName = 'Authorization';

  final SecureStorage _storage;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (!_requestRequiresAuth(options)) {
      handler.next(options);
      return;
    }

    final String? token;
    try {
      token = await _storage.readToken(jwtTokenKey);
    } on StorageException catch (error, stackTrace) {
      handler.reject(
        DioException(
          requestOptions: options,
          error: UnauthorisedException(
            'Could not read JWT from secure storage; '
            'authenticated request to ${options.path} was not sent. '
            'Underlying storage failure: ${error.message}',
          ),
          stackTrace: stackTrace,
        ),
        true,
      );
      return;
    }

    if (token == null || token.isEmpty) {
      handler.reject(
        DioException(
          requestOptions: options,
          error: UnauthorisedException(
            'No JWT available in secure storage; '
            'authenticated request to ${options.path} was not sent.',
          ),
        ),
        true,
      );
      return;
    }

    options.headers[_authorizationHeaderName] = 'Bearer $token';
    handler.next(options);
  }

  /// Reads the `requiresAuth` flag from `options.extra`. Returns `true`
  /// when the flag is absent, missing, or any value other than the
  /// literal boolean `false`, so a forgotten flag never causes a
  /// sensitive endpoint to be called without a token.
  bool _requestRequiresAuth(RequestOptions options) {
    final raw = options.extra[requiresAuthExtraKey];
    if (raw is bool) {
      return raw;
    }
    return true;
  }
}
