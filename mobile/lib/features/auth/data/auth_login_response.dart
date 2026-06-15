// Typed response for `POST /api/v1/auth/login`.
//
// The cook-smart login endpoint returns the JWT and the user record
// at the top level of the response body, not inside the canonical
// `{ success, message, data }` envelope used elsewhere in the API:
//
//   ```json
//   {
//     "success": true,
//     "message": "Logged in",
//     "token":   "eyJhbGciOi...",
//     "user":    { ... }
//   }
//   ```
//
// Per Decision 1 of the `flutter-port-auth` design, the auth feature
// parses the real shape locally rather than amending the foundation's
// `ApiResponse<DataType>`. This file is the parser for the login
// shape.
//
// `success` and `message` are ignored on purpose — they don't change
// behaviour, the HTTP status already says it succeeded, and the
// presentation layer renders feature-specific copy.
//
// Malformed bodies (missing `token`, empty `token`, non-object `user`)
// raise a [ServerException] whose message names the offending
// endpoint, matching Requirement 3.6.
//
// See `flutter-port-auth` Requirements 3.1, 3.2, 3.6.

import 'package:flutter/foundation.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/features/auth/domain/user.dart';

const String _endpoint = 'POST /api/v1/auth/login';

/// Parsed body of a successful response from `POST /api/v1/auth/login`.
///
/// Constructed only via [AuthLoginResponse.fromJson]; the default
/// constructor is private so every instance comes from a parser that
/// has validated the source shape against the endpoint's contract.
@immutable
final class AuthLoginResponse {
  const AuthLoginResponse._({
    required this.token,
    required this.user,
  });

  /// Parses the top-level body returned by `POST /api/v1/auth/login`.
  ///
  /// Reads `token` (non-empty [String]) and `user`
  /// ([Map] of [String] to [dynamic]). The `success` and `message`
  /// fields are ignored. The nested `user` object is delegated to
  /// [User.fromLoginJson] so the field-level error messages stay
  /// consistent across endpoints.
  factory AuthLoginResponse.fromJson(Map<String, dynamic> json) {
    final String token = _requireNonEmptyString(json, 'token');
    final Map<String, dynamic> userJson = _requireJsonObject(json, 'user');
    return AuthLoginResponse._(
      token: token,
      user: User.fromLoginJson(userJson),
    );
  }

  /// JWT issued by the backend, persisted under
  /// `AuthInterceptor.jwtTokenKey` by `AuthRepository`.
  final String token;

  /// Authenticated user record, built via [User.fromLoginJson].
  final User user;
}

// ---------------------------------------------------------------------------
// Field readers — every helper raises a [ServerException] whose message
// identifies the offending endpoint and field, satisfying Requirement 3.6.
// `statusCode` is 0 because the failure is a parse error rather than a
// transport-level HTTP status (matching the convention from
// `core/network/api_response.dart` and `domain/user.dart`).
// ---------------------------------------------------------------------------

String _requireNonEmptyString(Map<String, dynamic> json, String key) {
  final Object? value = json[key];
  if (value is String && value.isNotEmpty) return value;
  throw ServerException(
    'Auth response from $_endpoint is missing required non-empty '
    'string field "$key" (got: ${_describe(value)}).',
    0,
  );
}

Map<String, dynamic> _requireJsonObject(Map<String, dynamic> json, String key) {
  final Object? value = json[key];
  if (value is Map<String, dynamic>) return value;
  throw ServerException(
    'Auth response from $_endpoint is missing required object '
    'field "$key" (got: ${_describe(value)}).',
    0,
  );
}

String _describe(Object? value) {
  if (value == null) return 'null';
  if (value is String && value.isEmpty) return 'empty String';
  return '${value.runtimeType}';
}
