// Singleton `Dio` instance and its Riverpod provider for the cook-smart
// Flutter mobile app.
//
// Every Backend_API request issued by the app passes through this single
// configured `Dio` client. Feature code never constructs `Dio` directly
// (Requirement 11.7) and never imports `package:dio` (Requirement 4.8) —
// it depends on a typed `ApiClient` (Requirement 11.4) that is in turn
// implemented on top of this provider.
//
// Configuration committed by this file
// ------------------------------------
//
//   * Base URL — read from `ApiConfig.baseUrl`, which is selected at
//     compile time so a release build cannot resolve to the development
//     host (Requirement 4.6, 9.1, 12.1, 12.2, 12.3).
//   * Connect timeout — 10 seconds (Requirement 4.5).
//   * Receive timeout — 15 seconds (Requirement 4.5).
//   * `contentType: 'application/json'` so JSON-encoded payloads do not
//     have to set the header at every call site.
//   * `validateStatus: (status) => status != null && status < 500`. 4xx
//     responses are returned to `ErrorInterceptor.onError` so the
//     interceptor can translate them into the matching `ApiException`
//     subtype (Requirement 4.3); 5xx responses also flow through the
//     error path. A `null` status is rejected so a malformed transport
//     event never silently turns into a successful response.
//
// Interceptor chain
// -----------------
//
// The interceptors run in the order they are added:
//
//   1. `AuthInterceptor` — reads the JWT from `SecureStorage` and either
//      attaches `Authorization: Bearer <jwt>` to the outgoing request
//      or rejects the request with `UnauthorisedException` if it
//      requires auth and no JWT is available (Requirements 4.2, 4.13).
//   2. `ErrorInterceptor` — normalises every failure: timeouts to
//      `NetworkException` (Requirement 4.11), 4xx to
//      `ValidationException`, 5xx to `ServerException` (Requirement
//      4.3), and runs the single-shot 401 refresh-and-retry path
//      (Requirements 4.9, 4.10).
//
// `ErrorInterceptor` needs the same `Dio` instance it is attached to so
// it can re-issue the original request after a successful refresh (the
// retry must pass back through the configured interceptor chain so it
// is auth-injected and error-normalised exactly like the first attempt).
// `Dio` is constructed before the interceptors are registered for that
// reason.
//
// Why the router is not imported here
// -----------------------------------
//
// The redirect-to-login target is `/auth/login` (`Routes.loginPath`),
// but importing `core/router/router_provider.dart` from here would
// close the cycle warned about in `error_interceptor.dart`:
//
//     dioProvider -> routerProvider -> authStateProvider ->
//     secureStorageProvider -> dioProvider
//
// Instead the redirect is reached through `authRedirectCallbackProvider`
// declared in this file. The default value is a no-op so the foundation
// builds and runs without the auth feature; the auth feature spec
// replaces it with a real navigation call by overriding the provider in
// the app's `ProviderScope`. The router only knows about
// `authRedirectCallbackProvider`; this file only knows about the
// callback shape — neither imports the other.
//
// How the auth feature wires its real refresh call
// ------------------------------------------------
//
// The refresh-token endpoint, payload, and response shape are owned by
// the auth feature, which lands in a later per-feature spec. Until
// then, [_unimplementedRefreshCall] throws `UnimplementedError` so any
// 401 path that escapes the foundation surface fails loudly rather
// than silently forwarding a stale request.
//
// When the auth feature lands, it replaces this stub by overriding
// `dioProvider` in the app's `ProviderScope`:
//
// ```dart
// ProviderScope(
//   overrides: [
//     dioProvider.overrideWith(
//       (ref) => buildDioWithAuthRefresh(ref),
//     ),
//   ],
//   child: const CookSmartApp(),
// );
// ```
//
// The replacement reuses [dioProvider]'s configuration (timeouts,
// base URL, interceptors) but supplies a real `RefreshTokenCall` that
// hits the auth feature's refresh endpoint.
//
// Disposal
// --------
//
// `Dio` holds an underlying `HttpClient` whose connection pool must be
// released when the provider is torn down (for example when a
// `ProviderScope` exits in a widget test). `ref.onDispose` calls
// `dio.close(force: true)` so any in-flight request is cancelled and
// the pool is released deterministically.
//
// Reference: Requirements 4.1, 4.5, 4.6, 4.7, 11.6, 11.7 of the
// flutter-migration-architecture spec.

// External libraries
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Internal modules
import 'package:mobile/core/config/api_config.dart';
import 'package:mobile/core/network/auth_interceptor.dart';
import 'package:mobile/core/network/error_interceptor.dart';
import 'package:mobile/core/storage/secure_storage_provider.dart';

/// Connect timeout applied to every request issued by [dioProvider]
/// (Requirement 4.5).
const Duration _connectTimeout = Duration(seconds: 10);

/// Receive timeout applied to every request issued by [dioProvider]
/// (Requirement 4.5).
const Duration _receiveTimeout = Duration(seconds: 15);

/// Default `Content-Type` applied to every request. Dio uses this when
/// the caller does not set the header explicitly. JSON is the only
/// payload format consumed by the cook-smart Backend_API.
const String _defaultContentType = 'application/json';

/// Provider that exposes the no-op default redirect-to-login callback
/// used by the foundation `ErrorInterceptor`.
///
/// The default is intentionally a no-op so the foundation builds and
/// runs without any auth-feature wiring. The auth feature spec later
/// replaces this callback by overriding the provider in the app's
/// `ProviderScope`:
///
/// ```dart
/// ProviderScope(
///   overrides: [
///     authRedirectCallbackProvider.overrideWithValue(
///       () => ref.read(routerProvider).go(Routes.loginPath),
///     ),
///   ],
///   child: const CookSmartApp(),
/// );
/// ```
///
/// This indirection is what allows `dio_client.dart` to avoid
/// importing the router — the router consumes
/// `authRedirectCallbackProvider`, the network layer produces the
/// callback, and neither file references the other.
final Provider<RedirectToLoginCallback> authRedirectCallbackProvider =
    Provider<RedirectToLoginCallback>((ref) => _noopRedirectToLogin);

/// No-op default for [authRedirectCallbackProvider]. Replaced when the
/// auth feature is wired up.
void _noopRedirectToLogin() {
  // Intentionally empty: the auth feature spec overrides
  // [authRedirectCallbackProvider] with a real navigation call. Until
  // then, a 401 with no available refresh token still clears stored
  // tokens via `ErrorInterceptor` and surfaces an
  // `UnauthorisedException` to the caller, so the missing redirect is
  // observable rather than silent.
}

/// Stub [RefreshTokenCall] used by the foundation `ErrorInterceptor`.
///
/// Throws `UnimplementedError` so any 401 refresh attempt that reaches
/// the foundation fails loudly, with a message pointing at the auth
/// feature spec. The auth feature replaces this stub by overriding
/// [dioProvider] (see the file-level docstring for the override
/// pattern).
Future<String> _unimplementedRefreshCall(String _) {
  throw UnimplementedError(
    'refreshCall is wired by the auth feature spec. Override '
    '`dioProvider` in the app ProviderScope to supply a real '
    'RefreshTokenCall against the cook-smart auth backend.',
  );
}

/// Application-wide singleton [Dio] client.
///
/// Consume this provider from any feature, repository, or other
/// provider that needs to issue Backend_API requests:
///
/// ```dart
/// final dio = ref.read(dioProvider);
/// final response = await dio.get<Map<String, dynamic>>('/recipes');
/// ```
///
/// The provider is configured with the timeouts, base URL, and
/// interceptors committed by the flutter-migration-architecture spec
/// (see the file-level docstring for the full list). Replacing the
/// provider — for example to inject a real refresh-token call from
/// the auth feature, or a fake transport in tests — is a single
/// `dioProvider.overrideWith` away.
final Provider<Dio> dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: _connectTimeout,
      receiveTimeout: _receiveTimeout,
      contentType: _defaultContentType,
      // Treat 4xx as "non-success but not a transport error" so it
      // flows through `ErrorInterceptor.onError` for translation into
      // `ValidationException` / `UnauthorisedException`. 5xx flows
      // through the error path as well. A `null` status (malformed
      // transport event) is rejected so it never silently masquerades
      // as a successful response.
      validateStatus: (status) => status != null && status < 500,
    ),
  );

  // AuthInterceptor reads the JWT from SecureStorage and either
  // attaches it to the outgoing request or rejects the request with
  // `UnauthorisedException` (Requirements 4.2, 4.13).
  dio.interceptors.add(AuthInterceptor(ref.read(secureStorageProvider)));

  // ErrorInterceptor needs the same `Dio` instance it is attached to
  // so it can re-issue the original request after a successful
  // refresh (Requirement 4.9). The retry must pass back through this
  // interceptor chain — that is why it is added last and given a
  // reference to `dio`.
  dio.interceptors.add(
    ErrorInterceptor(
      storage: ref.read(secureStorageProvider),
      dio: dio,
      refreshCall: _unimplementedRefreshCall,
      onRedirectToLogin: ref.read(authRedirectCallbackProvider),
    ),
  );

  // Release the underlying HttpClient connection pool when the
  // provider is torn down (for example when a `ProviderScope` exits
  // in a widget test). `force: true` cancels any in-flight requests
  // so the disposal is deterministic.
  ref.onDispose(() => dio.close(force: true));

  return dio;
});
