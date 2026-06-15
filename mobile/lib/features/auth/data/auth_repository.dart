// Cook-smart authentication repository.
//
// `AuthRepository` is the single owner of every call to the four
// `/api/v1/auth/*` endpoints the cook-smart Backend_API exposes today
// (`POST /login`, `POST /register`, `GET /me`, `POST /logout`). It is
// also the only file under `features/auth/` that writes to or reads
// from `SecureStorage` — every other layer reaches the persisted JWT
// and user record through the methods on this class.
//
// The repository depends on two foundation seams:
//
//   * [authApiClientProvider] from
//     `core/network/auth_api_client.dart` for the HTTP transport.
//     The provider's [AuthApiClient] is a thin wrapper around the
//     foundation's `Dio` that bakes in the `requiresAuth` extra-key
//     contract per endpoint and exposes a transport-agnostic
//     [AuthApiResponse] — so this file never imports `package:dio`
//     and never sees `DioException`. `ErrorInterceptor` translates
//     every transport failure into an [ApiException] subtype before
//     it reaches the adapter, so callers of [AuthRepository] only
//     ever see typed [ApiException]s.
//   * [secureStorageProvider] from `core/storage/secure_storage_provider.dart`
//     for persisting the JWT under [AuthInterceptor.jwtTokenKey] (the
//     literal `'jwt'`) and the user record under [userRecordKey]
//     (the literal `'auth_user'`).
//
// `requiresAuth` per endpoint (Requirement 2.6)
// ---------------------------------------------
//
// `AuthApiClient` already encodes the per-endpoint contract:
//
//   * `login` and `register` call with `requiresAuth=false` because
//     these endpoints are exactly what the user calls *to obtain* a
//     JWT — sending one would be a contradiction.
//   * `me` and `logout` call with `requiresAuth=true` so
//     `AuthInterceptor` attaches the persisted JWT.
//
// The repository does not have to manage that flag itself; passing
// the wrong one is a compile-time impossibility because the methods
// on [AuthApiClient] are endpoint-typed.
//
// Persistence contract (Requirements 5.1, 5.2)
// --------------------------------------------
//
// On a successful `login` or `register`:
//
//   * Write the JWT under [AuthInterceptor.jwtTokenKey].
//   * Write `jsonEncode(user.toJson())` under [userRecordKey].
//
// Both writes are awaited before the operation resolves so any
// caller that reads the storage after `await login(...)` is
// guaranteed to see the new values.
//
// `restoreSession` (Requirements 5.3, 12.1–12.7)
// ----------------------------------------------
//
// 1. Read the JWT under [AuthInterceptor.jwtTokenKey].
// 2. If the JWT is null or empty, return `null` immediately — no
//    `/me` request is issued (Requirement 12.2).
// 3. Otherwise call `AuthApiClient.me()`.
// 4. On success, refresh the persisted user record with the body
//    returned by `/me` so the four `/me`-only fields hydrate
//    (Requirement 12.4) and return the [User].
// 5. On [UnauthorisedException], invoke `SecureStorage.clearAll`
//    and rethrow (Requirement 12.5). The notifier maps the
//    rethrown exception to `AuthUnauthenticated('Session expired')`.
// 6. On [NetworkException] or [ServerException], leave storage
//    intact and rethrow (Requirement 12.6) — a poor network on
//    cold start must not silently log the user out.
//
// `logout` (Requirements 5.4, 5.5, 11.5)
// --------------------------------------
//
// Try-then-clear sequence:
//
//   1. Best-effort `AuthApiClient.logout()`, wrapped in a
//      swallow-all `try/catch` so no transport failure can prevent
//      the local clear.
//   2. `SecureStorage.clearAll()` runs unconditionally outside the
//      catch.
//
// The notifier emits `AuthUnauthenticated(errorMessage: null)`
// after this method resolves regardless of network outcome, so the
// UX is identical whether the backend is reachable or not.
//
// Foundation refresh-token dead code (Requirement 8.6)
// ----------------------------------------------------
//
// The foundation's `RefreshTokenCall` typedef in
// `core/network/error_interceptor.dart` and the refresh-and-retry
// block inside `ErrorInterceptor.onError` are intentionally kept in
// place but are dead code in the cook-smart context. The cook-smart
// Backend_API exposes no refresh endpoint on `/api/v1/auth/*`, so
// `dioProvider` is overridden in `main.dart` to inject
// [cookSmartRefreshNotSupported] as the [RefreshTokenCall]; that
// stub raises [UnauthorisedException] synchronously the moment a
// 401 reaches the refresh seam, which makes the foundation's
// existing clear-and-redirect path the only 401 path that actually
// runs in production. Future refresh support requires a backend
// change outside this migration's scope (Decision 2 of the
// flutter-port-auth design).
//
// See `flutter-port-auth` Requirements 1.3, 2.1, 2.2, 2.3, 2.4,
// 2.5, 2.6, 2.7, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 8.6, 11.1,
// 11.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7.

import 'dart:convert';

// External libraries
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Internal modules
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/network/auth_api_client.dart';
import 'package:mobile/core/network/auth_interceptor.dart';
import 'package:mobile/core/storage/secure_storage.dart';
import 'package:mobile/core/storage/secure_storage_provider.dart';
import 'package:mobile/features/auth/data/auth_login_response.dart';
import 'package:mobile/features/auth/data/auth_me_response.dart';
import 'package:mobile/features/auth/data/auth_register_response.dart';
import 'package:mobile/features/auth/domain/user.dart';

/// Repository owning every call to the cook-smart `/api/v1/auth/*`
/// endpoints and every read/write of the persisted JWT and user
/// record.
///
/// All four methods raise typed [ApiException] subtypes only — never
/// `DioException` — because the [AuthApiClient] adapter under
/// `core/network/` has already converted every transport failure
/// into an [ApiException]. Callers handle [UnauthorisedException],
/// [ValidationException], [NetworkException], [ServerException],
/// and [StorageException] explicitly and never depend on
/// `package:dio` types.
class AuthRepository {
  /// Creates an [AuthRepository] backed by an [AuthApiClient] and a
  /// [SecureStorage] handle.
  ///
  /// Both dependencies are injected so tests can supply fakes and
  /// the production `ProviderScope` can supply the foundation's
  /// configured singletons via [authRepositoryProvider].
  AuthRepository(this._client, this._storage);

  /// `SecureStorage` key under which the JSON-encoded [User] record
  /// is persisted. Both this writer and any future reader (for
  /// example, an offline-mode bootstrap that wants to render the
  /// last-known user before a network round-trip) reference this
  /// constant so the key cannot drift.
  static const String userRecordKey = 'auth_user';

  final AuthApiClient _client;
  final SecureStorage _storage;

  /// Issues `POST /api/v1/auth/login` with [email] and [password].
  ///
  /// On success, persists the returned JWT under
  /// [AuthInterceptor.jwtTokenKey] and the JSON-encoded [User]
  /// under [userRecordKey] (Requirements 5.1, 5.2). Returns a
  /// record carrying the [User] and JWT for the caller to install
  /// on `AuthAuthenticated`.
  ///
  /// Raises [UnauthorisedException] for a 401, [ValidationException]
  /// for any other 4xx, [ServerException] for a 5xx or a malformed
  /// success body, [NetworkException] for transport / timeout
  /// failures, and [StorageException] for keystore failures during
  /// the post-success persistence step.
  Future<({User user, String token})> login(
    String email,
    String password,
  ) async {
    final response = await _client.login(email: email, password: password);
    final parsed = AuthLoginResponse.fromJson(response.body);
    await _persistSession(token: parsed.token, user: parsed.user);
    return (user: parsed.user, token: parsed.token);
  }

  /// Issues `POST /api/v1/auth/register` with the supplied account
  /// fields.
  ///
  /// [firstName] and [lastName] are included in the request body
  /// only when their trimmed value is non-empty (Requirement 2.2);
  /// `null` and whitespace-only inputs are dropped so the backend
  /// does not store a nominally-blank profile.
  ///
  /// On success, persists the returned JWT and JSON-encoded [User]
  /// (Requirements 5.1, 5.2) and returns a record carrying the
  /// [User], JWT, and the optional `special_message` blurb from the
  /// response (used by `SignupScreen` to render the co-founder /
  /// creator / special-user welcome banner, Requirement 10.10).
  ///
  /// Raises the same [ApiException] subtypes as [login].
  Future<({User user, String token, String? specialMessage})> register({
    required String email,
    required String password,
    required bool ageVerified,
    String? firstName,
    String? lastName,
  }) async {
    final requestBody = <String, dynamic>{
      'email': email,
      'password': password,
      'age_verified': ageVerified,
    };
    final trimmedFirstName = firstName?.trim();
    if (trimmedFirstName != null && trimmedFirstName.isNotEmpty) {
      requestBody['first_name'] = trimmedFirstName;
    }
    final trimmedLastName = lastName?.trim();
    if (trimmedLastName != null && trimmedLastName.isNotEmpty) {
      requestBody['last_name'] = trimmedLastName;
    }

    final response = await _client.register(requestBody);
    final parsed = AuthRegisterResponse.fromJson(response.body);
    await _persistSession(token: parsed.token, user: parsed.user);
    return (
      user: parsed.user,
      token: parsed.token,
      specialMessage: parsed.specialMessage,
    );
  }

  /// Validates the persisted JWT against `GET /api/v1/auth/me`.
  ///
  /// Returns:
  ///
  ///   * `null` when no JWT is persisted or the persisted value is
  ///     the empty string (Requirement 12.2). No network request
  ///     is issued.
  ///   * The freshly-hydrated [User] when `/me` returns a 2xx; the
  ///     persisted user record under [userRecordKey] is refreshed
  ///     with the new [User] before the future resolves
  ///     (Requirement 12.4) so subsequent reads see the four
  ///     `/me`-only fields.
  ///
  /// Raises:
  ///
  ///   * [UnauthorisedException] when `/me` returns a 401. Storage
  ///     is cleared via [SecureStorage.clearAll] before the
  ///     exception is rethrown (Requirement 12.5).
  ///   * [NetworkException] or [ServerException] when `/me` fails
  ///     for transport or server reasons. Storage is left intact
  ///     (Requirement 12.6) so a transient failure does not log
  ///     the user out.
  ///   * [ValidationException] when `/me` returns a 4xx other than
  ///     401 (rare in practice for `/me`). Storage is left intact;
  ///     the notifier maps this to a generic
  ///     `AuthUnauthenticated(<server-error message>)`.
  ///   * [StorageException] when the keystore read or the
  ///     post-success write fails. Storage state is unchanged from
  ///     before the failed call.
  Future<User?> restoreSession() async {
    final jwt = await _storage.readToken(AuthInterceptor.jwtTokenKey);
    if (jwt == null || jwt.isEmpty) {
      return null;
    }

    final AuthApiResponse response;
    try {
      response = await _client.me();
    } on UnauthorisedException {
      // Persisted JWT is no longer valid — wipe everything (Req 12.5).
      // Wrap the clear in its own try/catch so a keystore failure
      // during the wipe does not mask the original UnauthorisedException
      // the notifier is contractually obliged to handle.
      try {
        await _storage.clearAll();
      } on StorageException {
        // Best-effort: even if the local wipe fails, the session is
        // already invalid against the backend. The notifier will
        // navigate to /auth/login and the next successful auth call
        // will overwrite the stale values.
      }
      rethrow;
    }
    // NetworkException, ServerException, ValidationException,
    // StorageException all propagate without touching storage
    // (Requirement 12.6).

    final parsed = AuthMeResponse.fromJson(response.body);

    // Refresh the persisted user record so subsequent reads see the
    // four /me-only fields (Requirement 12.4). The JWT is unchanged
    // — this is the same JWT that was just validated — so we do not
    // rewrite [AuthInterceptor.jwtTokenKey].
    await _storage.writeToken(
      userRecordKey,
      jsonEncode(parsed.user.toJson()),
    );
    return parsed.user;
  }

  /// Performs a best-effort logout, then unconditionally clears
  /// every persisted value.
  ///
  /// The `POST /api/v1/auth/logout` request is wrapped in a
  /// swallow-all `try/catch` (Requirement 11.5) so any transport
  /// failure — including [NetworkException], [ServerException],
  /// and [UnauthorisedException] — is suppressed. The
  /// [SecureStorage.clearAll] call lives outside the catch so it
  /// always runs (Requirements 5.4, 5.5).
  ///
  /// Does not raise to the caller in the normal path. The only
  /// exception this method can ever propagate is a
  /// [StorageException] from `clearAll` itself, which the notifier
  /// observes per Requirement 5.7. (The `/logout` swallow does not
  /// extend to the wipe because failing to wipe the local session
  /// is materially different from failing to notify the backend
  /// about the logout — the former leaves a stale JWT that the
  /// next request would still send.)
  Future<void> logout() async {
    try {
      await _client.logout();
    } catch (_) {
      // Swallow per Requirements 5.5 and 11.5: NetworkException,
      // ServerException, UnauthorisedException, ValidationException,
      // StorageException originating from AuthInterceptor's JWT
      // read, and any unexpected error are all silenced so the local
      // wipe below always runs.
    }
    await _storage.clearAll();
  }

  // -- Private helpers -----------------------------------------------------

  /// Persists the JWT and the JSON-encoded [User] under the foundation's
  /// reserved keys.
  ///
  /// Both writes are awaited so the storage is consistent before the
  /// operation resolves. A [StorageException] from either write
  /// propagates to the caller; partial state may exist on the rare
  /// keystore-failure path, but the next successful login or
  /// session restore overwrites both keys atomically and the
  /// next-startup `restoreSession` validates the JWT against
  /// `/me` before treating the session as live.
  Future<void> _persistSession({
    required String token,
    required User user,
  }) async {
    await _storage.writeToken(AuthInterceptor.jwtTokenKey, token);
    await _storage.writeToken(
      userRecordKey,
      jsonEncode(user.toJson()),
    );
  }
}

/// Application-wide [AuthRepository] singleton.
///
/// Reads the foundation's [authApiClientProvider] and
/// [secureStorageProvider] so swapping either dependency in tests is a
/// single `authApiClientProvider.overrideWith` or
/// `secureStorageProvider.overrideWithValue` away.
final Provider<AuthRepository> authRepositoryProvider =
    Provider<AuthRepository>(
  (ref) => AuthRepository(
    ref.read(authApiClientProvider),
    ref.read(secureStorageProvider),
  ),
);
