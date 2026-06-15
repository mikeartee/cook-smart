// Error normalisation and 401 refresh-and-retry for the cook-smart Dio
// client.
//
// `ErrorInterceptor` is wired into the singleton `Dio` instance
// constructed by `dio_client.dart` (Requirement 4.1). It runs on every
// failed response and is responsible for:
//
//   * Translating connect/receive/send timeouts into a typed
//     `NetworkException` (Requirement 4.11).
//   * Translating 4xx responses into `ValidationException` and 5xx
//     responses into `ServerException` so feature code never depends on
//     transport-library types (Requirements 4.3, 11.5).
//   * Owning the 401 refresh-and-retry path: when a 401 is observed and
//     a refresh token is available, the interceptor attempts exactly
//     one refresh-token call and retries the original request once on
//     success (Requirement 4.9). When the refresh call fails, times
//     out, or no refresh token is available, every stored auth token
//     is cleared via `SecureStorage.clearAll` and the user is sent back
//     to `/auth/login` (Requirement 4.10).
//
// Why the redirect is a callback instead of a router import
// ---------------------------------------------------------
//
// The redirect target is `/auth/login`, named by `Routes.loginPath`.
// This file does not import `core/router/router_provider.dart` because
// `routerProvider` watches the auth state, the auth state watches
// secure storage, and secure storage is consumed by this interceptor.
// Importing the router from here would close that cycle. Instead, the
// redirect is passed in as a `RedirectToLoginCallback` and wired up in
// `dio_client.dart`, which can read both the router and the
// interceptor without either knowing about the other.
//
// Why the refresh call is injected
// --------------------------------
//
// The refresh URL, payload, and response shape are owned by the auth
// feature, which lands in a later per-feature spec. `core/network/`
// stays free of auth-feature shapes by accepting a
// `RefreshTokenCall` — a function from `String refreshToken` to
// `Future<String> newJwt` — at construction time. The network-layer
// composition root wires the auth feature's refresh implementation
// into this interceptor.
//
// Token storage keys
// ------------------
//
// The JWT is read and written under `ErrorInterceptor.jwtTokenKey`,
// which equals `AuthInterceptor.jwtTokenKey` (`'jwt'`). The refresh
// token is stored under `ErrorInterceptor.refreshTokenKey`
// (`'refreshToken'`). The auth feature must use these exact constants
// so this interceptor can find the tokens on a 401.
//
// Single-retry guard
// ------------------
//
// A retried request is tagged via `RequestOptions.extra` so a second
// 401 cannot trigger another refresh loop. The retry goes through the
// same `Dio` instance (and therefore the same interceptor chain), so
// any error raised by the retry has already been normalised by this
// interceptor's first pass.
//
// Reference: Requirements 4.3, 4.9, 4.10, 4.11 of the
// flutter-migration-architecture spec.

import 'dart:async';

// External libraries
import 'package:dio/dio.dart';

// Internal modules
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/storage/secure_storage.dart';

/// Callback invoked when the interceptor has cleared all auth tokens
/// and the user must be sent back to the login screen.
///
/// The implementation is wired up in the network-layer composition
/// root (see `dio_client.dart`) so this file does not import the
/// router. The expected target is `Routes.loginPath` (`/auth/login`).
typedef RedirectToLoginCallback = void Function();

/// Callback that exchanges a refresh token for a fresh JWT.
///
/// The function receives the stored refresh token and resolves with
/// the new access token, or throws if the backend refuses the
/// refresh. The exact endpoint and payload are owned by the auth
/// feature; this interceptor only depends on the resulting token
/// string.
typedef RefreshTokenCall = Future<String> Function(String refreshToken);

/// Dio interceptor that handles every error raised by the cook-smart
/// `Dio` client.
///
/// Construct one instance per `Dio` client and add it to the client's
/// `interceptors` list after `AuthInterceptor`. The interceptor is
/// stateless apart from the handles it borrows, so it is safe to
/// share across the app.
class ErrorInterceptor extends Interceptor {
  /// Creates an [ErrorInterceptor].
  ///
  /// [storage] persists the JWT and refresh token. [dio] is the same
  /// instance the interceptor is attached to; it is used to retry the
  /// original request after a successful refresh, so the retry passes
  /// through the configured interceptor chain. [refreshCall] performs
  /// the refresh-token exchange. [onRedirectToLogin] is invoked
  /// whenever auth tokens have been cleared and the user must be sent
  /// to `/auth/login`. [refreshTimeout] bounds the refresh call so a
  /// stuck refresh never holds the original request open longer than
  /// the configured receive timeout.
  ErrorInterceptor({
    required SecureStorage storage,
    required Dio dio,
    required RefreshTokenCall refreshCall,
    required RedirectToLoginCallback onRedirectToLogin,
    Duration refreshTimeout = const Duration(seconds: 15),
  })  : _storage = storage,
        _dio = dio,
        _refreshCall = refreshCall,
        _onRedirectToLogin = onRedirectToLogin,
        _refreshTimeout = refreshTimeout;

  /// `SecureStorage` key under which the JWT is persisted.
  ///
  /// Equal to `AuthInterceptor.jwtTokenKey`. Both interceptors
  /// reference the same constant to avoid string-literal drift.
  static const String jwtTokenKey = 'jwt';

  /// `SecureStorage` key under which the refresh token is persisted.
  ///
  /// `AuthInterceptor` and the auth feature must persist the refresh
  /// token under this exact key so this interceptor can find it on
  /// 401.
  static const String refreshTokenKey = 'refreshToken';

  /// Marker stored under `RequestOptions.extra` to flag a request that
  /// has already been retried after a refresh, so a second 401 cannot
  /// trigger another refresh loop.
  static const String _retriedExtraKey = '__cs_error_interceptor_retried';

  /// HTTP header used to transmit the JWT on the retry. Mirrors the
  /// header used by `AuthInterceptor`.
  static const String _authorizationHeaderName = 'Authorization';

  final SecureStorage _storage;
  final Dio _dio;
  final RefreshTokenCall _refreshCall;
  final RedirectToLoginCallback _onRedirectToLogin;
  final Duration _refreshTimeout;

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    // Connect/receive/send timeouts surface as NetworkException
    // (Requirement 4.11). Send timeout is included for symmetry — the
    // current Dio config does not set a send timeout, but treating it
    // the same way avoids surprises if one is added later.
    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.sendTimeout) {
      handler.reject(
        _wrap(
          err,
          NetworkException(
            'Request timed out: ${err.requestOptions.path}',
          ),
        ),
      );
      return;
    }

    final response = err.response;
    final statusCode = response?.statusCode;

    // 401 handling: attempt exactly one refresh and retry the
    // original request once on success (Requirement 4.9). On refresh
    // failure, refresh timeout, or missing refresh token, clear all
    // tokens and redirect (Requirement 4.10).
    if (statusCode == 401) {
      await _handleUnauthorised(err, handler);
      return;
    }

    // Non-401 backend response: translate to the matching
    // ApiException subtype (Requirement 4.3).
    if (err.type == DioExceptionType.badResponse && statusCode != null) {
      if (statusCode >= 400 && statusCode < 500) {
        handler.reject(
          _wrap(
            err,
            ValidationException(
              _extractMessage(response) ?? 'Request validation failed',
              _extractFieldErrors(response),
            ),
          ),
        );
        return;
      }
      if (statusCode >= 500) {
        handler.reject(
          _wrap(
            err,
            ServerException(
              _extractMessage(response) ?? 'Server error',
              statusCode,
            ),
          ),
        );
        return;
      }
    }

    // Connection errors, bad certificates, cancellations, and unknown
    // transport failures all surface as NetworkException so callers
    // do not have to depend on `DioExceptionType`.
    handler.reject(
      _wrap(
        err,
        NetworkException(err.message ?? 'Network error'),
      ),
    );
  }

  Future<void> _handleUnauthorised(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    // Already retried once after a refresh — do not loop.
    if (err.requestOptions.extra[_retriedExtraKey] == true) {
      await _clearTokensAndRedirect();
      handler.reject(
        _wrap(
          err,
          const UnauthorisedException(
            'Authentication failed after refresh attempt',
          ),
        ),
      );
      return;
    }

    final refreshToken = await _readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      await _clearTokensAndRedirect();
      handler.reject(
        _wrap(
          err,
          const UnauthorisedException('No refresh token available'),
        ),
      );
      return;
    }

    final String newJwt;
    try {
      newJwt = await _refreshCall(refreshToken).timeout(_refreshTimeout);
      await _storage.writeToken(jwtTokenKey, newJwt);
    } on TimeoutException {
      await _clearTokensAndRedirect();
      handler.reject(
        _wrap(
          err,
          const NetworkException('Refresh-token call timed out'),
        ),
      );
      return;
    } catch (_) {
      // Any non-timeout failure of the refresh call (network error,
      // 4xx from the refresh endpoint, storage failure persisting the
      // new JWT) collapses to UnauthorisedException because the user
      // can no longer be authenticated against the backend.
      await _clearTokensAndRedirect();
      handler.reject(
        _wrap(
          err,
          const UnauthorisedException('Refresh-token call failed'),
        ),
      );
      return;
    }

    // Refresh succeeded — retry the original request exactly once.
    final retryOptions = err.requestOptions.copyWith(
      extra: <String, dynamic>{
        ...err.requestOptions.extra,
        _retriedExtraKey: true,
      },
      headers: <String, dynamic>{
        ...err.requestOptions.headers,
        _authorizationHeaderName: 'Bearer $newJwt',
      },
    );

    try {
      final retryResponse = await _dio.fetch<dynamic>(retryOptions);
      handler.resolve(retryResponse);
    } on DioException catch (retryErr) {
      // The retry already passed back through this interceptor (with
      // `_retriedExtraKey` set) so any error has already been
      // normalised. Propagate it as-is.
      handler.reject(retryErr);
    }
  }

  Future<String?> _readRefreshToken() async {
    try {
      return await _storage.readToken(refreshTokenKey);
    } on StorageException {
      // Treat a keystore failure the same as a missing refresh
      // token: an authenticated session cannot continue without it.
      return null;
    }
  }

  Future<void> _clearTokensAndRedirect() async {
    try {
      await _storage.clearAll();
    } on StorageException {
      // Best-effort: even if local tokens cannot be cleared, still
      // send the user back to login so the UI does not pretend the
      // session is valid.
    }
    _onRedirectToLogin();
  }

  String? _extractMessage(Response<dynamic>? response) {
    final data = response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String && message.isNotEmpty) {
        return message;
      }
    }
    return null;
  }

  Map<String, String> _extractFieldErrors(Response<dynamic>? response) {
    final data = response?.data;
    if (data is! Map<String, dynamic>) {
      return const <String, String>{};
    }

    // Backend validation errors arrive in one of three shapes:
    //   { fieldErrors: { field: msg } }
    //   { errors: { field: msg } }
    //   { data: { errors: { ... } } }   /   { data: { fieldErrors: ... } }
    // Probe each in turn and accept the first non-empty result.
    final nested = data['data'] is Map<String, dynamic>
        ? data['data'] as Map<String, dynamic>
        : null;

    final candidates = <Object?>[
      data['fieldErrors'],
      data['errors'],
      if (nested != null) nested['fieldErrors'],
      if (nested != null) nested['errors'],
    ];

    for (final candidate in candidates) {
      if (candidate is Map) {
        final result = <String, String>{};
        candidate.forEach((dynamic key, dynamic value) {
          if (key is! String) {
            return;
          }
          if (value is String) {
            result[key] = value;
          } else if (value is List &&
              value.isNotEmpty &&
              value.first is String) {
            result[key] = value.first as String;
          }
        });
        if (result.isNotEmpty) {
          return result;
        }
      }
    }
    return const <String, String>{};
  }

  /// Re-wraps [original] so it carries [apiException] as its `error`
  /// payload while preserving the original request options, response,
  /// type, and stack trace. Callers that catch the rejected
  /// `DioException` can read the typed exception off `error`.
  DioException _wrap(DioException original, ApiException apiException) {
    return DioException(
      requestOptions: original.requestOptions,
      response: original.response,
      type: original.type,
      error: apiException,
      stackTrace: original.stackTrace,
      message: apiException.message,
    );
  }
}
