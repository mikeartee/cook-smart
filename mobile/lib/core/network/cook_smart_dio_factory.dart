// Cook-smart `Dio` factory used by the auth feature's `dioProvider`
// override.
//
// The auth-port spec replaces the foundation's `_unimplementedRefreshCall`
// — a stub that exists precisely so the foundation builds without an auth
// feature — with [cookSmartRefreshNotSupported], a synchronous-throw stub
// that raises [UnauthorisedException] the moment `ErrorInterceptor`'s
// 401 path consults the [RefreshTokenCall]. This factory is the helper
// the auth feature's `dioProvider.overrideWith(...)` invokes.
//
// Why this factory lives in `lib/core/network/`
// ---------------------------------------------
//
// `tool/check_architecture.dart` enforces two rules that together
// prevent the helper from living in `lib/features/auth/presentation/`
// where the override list is composed:
//
//   * R-4.8 — `package:dio` may only be imported from `lib/core/network/`.
//     Constructing a `Dio` requires importing the package.
//   * R-11.7 — `Dio(` may not appear in any file under a feature's
//     `presentation/` folder. The check applies to every line in the
//     file, so a top-level helper inside `auth_overrides.dart` would
//     still be flagged.
//
// The auth-port design's Decision 4 already established the
// "feature-shaped seam under `lib/core/network/`" pattern for the
// auth-endpoint adapter (`auth_api_client.dart`). This factory follows
// the same pattern: a single top-level function that closes the
// dio-construction concern under `lib/core/network/`, with the auth
// feature consuming the function by name.
//
// Mirroring the foundation's `dioProvider` body
// ---------------------------------------------
//
// `buildDioWithCookSmartRefresh` mirrors `dio_client.dart`'s body
// exactly:
//
//   * Same `BaseOptions` (base URL, connect timeout, receive timeout,
//     content type, `validateStatus`).
//   * Same interceptor order: `AuthInterceptor` first, then
//     `ErrorInterceptor`.
//   * Same `ref.onDispose(() => dio.close(force: true))` to release the
//     underlying `HttpClient` connection pool when the `ProviderScope`
//     tears down.
//
// The only difference is the `refreshCall` argument passed to
// `ErrorInterceptor`: this factory passes [cookSmartRefreshNotSupported]
// instead of `_unimplementedRefreshCall`. Every other field is
// reproduced verbatim so a future change to the foundation's `Dio`
// configuration must be reflected here too — there is no inheritance
// shortcut, and the mirroring is intentional per the auth-port design's
// "mirroring the foundation's body (rather than calling into it)"
// commitment.
//
// See `flutter-port-auth` Requirements 7.4, 7.6, 8.2, 8.3 and design
// Decisions 2, 3, 4.

// External libraries
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Internal modules
import 'package:mobile/core/config/api_config.dart';
import 'package:mobile/core/network/auth_interceptor.dart';
import 'package:mobile/core/network/dio_client.dart';
import 'package:mobile/core/network/error_interceptor.dart';
import 'package:mobile/core/storage/secure_storage_provider.dart';
import 'package:mobile/features/auth/data/refresh_token_stub.dart';

/// Connect timeout — must match `_connectTimeout` in `dio_client.dart`
/// (Requirement 4.5 of the foundation spec).
const Duration _connectTimeout = Duration(seconds: 10);

/// Receive timeout — must match `_receiveTimeout` in `dio_client.dart`
/// (Requirement 4.5 of the foundation spec).
const Duration _receiveTimeout = Duration(seconds: 15);

/// Default `Content-Type` — must match `_defaultContentType` in
/// `dio_client.dart`.
const String _defaultContentType = 'application/json';

/// Builds the cook-smart-flavoured [Dio] singleton for the auth
/// feature's `dioProvider` override.
///
/// Used from `features/auth/presentation/auth_overrides.dart` as the
/// argument to `dioProvider.overrideWith(...)`. The function takes a
/// [Ref] so it can read the foundation's [secureStorageProvider] and
/// the foundation's [authRedirectCallbackProvider] (whose default
/// no-op is itself overridden by the auth feature's override 2), and
/// register an `onDispose` callback against the same provider lifecycle
/// the original `dioProvider` uses.
///
/// The result is configurally identical to the foundation's
/// `dioProvider` except that `ErrorInterceptor`'s `refreshCall` is
/// [cookSmartRefreshNotSupported] — a synchronous-throw stub that
/// makes the foundation's existing 401 clear-and-redirect path the
/// only 401 path that runs in production (Decision 2).
Dio buildDioWithCookSmartRefresh(Ref ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: _connectTimeout,
      receiveTimeout: _receiveTimeout,
      contentType: _defaultContentType,
      validateStatus: (status) => status != null && status < 500,
    ),
  );

  dio.interceptors.add(AuthInterceptor(ref.read(secureStorageProvider)));

  dio.interceptors.add(
    ErrorInterceptor(
      storage: ref.read(secureStorageProvider),
      dio: dio,
      refreshCall: cookSmartRefreshNotSupported,
      onRedirectToLogin: ref.read(authRedirectCallbackProvider),
    ),
  );

  ref.onDispose(() => dio.close(force: true));

  return dio;
}
