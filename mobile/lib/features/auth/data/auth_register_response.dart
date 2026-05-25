// Typed response for `POST /api/v1/auth/register`.
//
// The cook-smart backend's register handler returns a body shaped
// `{ message, token, user, special_message?, lifetime_access? }` —
// note the absence of a `success` field and the JWT carried at the
// top level rather than inside a `data` envelope. The foundation's
// canonical `ApiResponse<DataType>` parser does not match this
// shape, so `flutter-port-auth` Decision 1 keeps the parsing inside
// the auth feature rather than amending the foundation contract.
//
// `message` and `lifetime_access` are intentionally ignored:
//
//   * `message` is a human-readable success blurb that does not
//     change application behaviour.
//   * `lifetime_access` is redundant with `special_message`: its
//     presence equals `specialMessage != null` (design "Data
//     Models"). Tracking it would add a second source of truth for
//     the same fact.
//
// Malformed bodies (missing `token`, empty `token`, non-object
// `user`, or a non-string `special_message`) raise [ServerException]
// whose message names `POST /api/v1/auth/register` so backend
// regressions surface with diagnostic context.
//
// See `flutter-port-auth` Requirements 3.1, 3.3, 3.6.

import 'package:flutter/foundation.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/features/auth/domain/user.dart';

const String _registerEndpoint = 'POST /api/v1/auth/register';

/// Parsed body of a successful `POST /api/v1/auth/register` response.
///
/// Constructed only via [AuthRegisterResponse.fromJson], which
/// validates the wire shape against the contract above and raises
/// [ServerException] on any deviation. The class is private to
/// `data/`: presentation code consumes the [User] and [token] via
/// the auth repository's return type rather than handling this
/// response directly.
@immutable
final class AuthRegisterResponse {
  const AuthRegisterResponse._({
    required this.token,
    required this.user,
    required this.specialMessage,
  });

  /// Parses the top-level body returned by the register endpoint.
  ///
  /// Reads:
  ///
  ///   * `token` — non-empty `String`. Empty strings are rejected
  ///     because they cannot identify a session and would silently
  ///     break the persisted-JWT contract in
  ///     `AuthInterceptor.jwtTokenKey`.
  ///   * `user` — `Map<String, dynamic>`, parsed via
  ///     [User.fromRegisterJson].
  ///   * `special_message` — optional `String?`. Absent or JSON-`null`
  ///     becomes Dart `null`; any non-string value is rejected.
  ///
  /// `message` and `lifetime_access` are not read.
  factory AuthRegisterResponse.fromJson(Map<String, dynamic> json) {
    final Object? rawToken = json['token'];
    if (rawToken is! String) {
      throw ServerException(
        'Auth response from $_registerEndpoint is missing required '
        'string field "token" (got: ${_describe(rawToken)}).',
        0,
      );
    }
    if (rawToken.isEmpty) {
      throw const ServerException(
        'Auth response from $_registerEndpoint has empty '
        '"token" field; expected a non-empty JWT string.',
        0,
      );
    }

    final Object? rawUser = json['user'];
    if (rawUser is! Map<String, dynamic>) {
      throw ServerException(
        'Auth response from $_registerEndpoint is missing required '
        'object field "user" (got: ${_describe(rawUser)}).',
        0,
      );
    }

    final specialMessage =
        _parseOptionalSpecialMessage(json, _registerEndpoint);

    return AuthRegisterResponse._(
      token: rawToken,
      user: User.fromRegisterJson(rawUser),
      specialMessage: specialMessage,
    );
  }

  /// JWT issued by the backend. Persisted by the auth repository
  /// under `AuthInterceptor.jwtTokenKey` (`'jwt'`).
  final String token;

  /// User record echoed by the backend, populated via
  /// [User.fromRegisterJson]. The four `/me`-only fields
  /// (`dietary_restrictions`, `allergies`, `show_nutrition`,
  /// `preferred_units`) are `null`; they hydrate on the next
  /// [User.fromMeJson] call during Session_Restore.
  final User user;

  /// Optional welcome blurb for co-founder, creator, or special
  /// users. Surfaced by `SignupScreen` as a non-blocking
  /// `MaterialBanner` before navigating to `/` (Requirement 10.10).
  final String? specialMessage;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! AuthRegisterResponse) return false;
    return other.token == token &&
        other.user == user &&
        other.specialMessage == specialMessage;
  }

  @override
  int get hashCode => Object.hash(token, user, specialMessage);

  @override
  String toString() {
    return 'AuthRegisterResponse('
        'token: <redacted>, '
        'user: $user, '
        'specialMessage: $specialMessage'
        ')';
  }
}

String? _parseOptionalSpecialMessage(
  Map<String, dynamic> json,
  String endpoint,
) {
  if (!json.containsKey('special_message')) return null;
  final Object? value = json['special_message'];
  if (value == null) return null;
  if (value is String) return value;
  throw ServerException(
    'Auth response from $endpoint has malformed optional string '
    'field "special_message" (got: ${_describe(value)}).',
    0,
  );
}

String _describe(Object? value) {
  if (value == null) return 'null';
  return '${value.runtimeType}';
}
