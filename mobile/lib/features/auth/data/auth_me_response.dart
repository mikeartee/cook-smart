// Typed response value for `GET /api/v1/auth/me`.
//
// The `/me` endpoint returns `{ user }` with no envelope (Auth_Me_Response
// per the requirements glossary). The foundation's
// `ApiResponse<DataType>.fromJson` envelope parser cannot read this shape, so
// the auth feature parses it locally per Decision 1 of the design.
//
// [AuthMeResponse.fromJson] reads exactly the top-level `user` object and
// builds a [User] via [User.fromMeJson], which populates every field
// declared in Requirements 4.1 and 4.2 (the four `/me`-only nullable
// fields are populated only here). A malformed body — `user` missing or
// not a JSON object — raises a [ServerException] whose message
// identifies the offending endpoint, satisfying Requirement 3.6.
// Per-field parse failures inside the embedded `user` object are raised
// by [User.fromMeJson] itself with the same endpoint name, so all
// `/me`-shape parse errors surface uniformly.
//
// See `flutter-port-auth` Requirements 3.1, 3.4, 3.6.

import 'package:flutter/foundation.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/features/auth/domain/user.dart';

const String _endpoint = 'GET /api/v1/auth/me';

/// Parsed body of a successful `GET /api/v1/auth/me` response.
///
/// The class is a thin wrapper around the resolved [user]; it exists so
/// that `AuthRepository.restoreSession` returns a typed value rather
/// than a raw [User] from a `Map`-shaped intermediate, keeping the
/// repository's call sites symmetrical with the other three response
/// classes under `data/`.
@immutable
final class AuthMeResponse {
  const AuthMeResponse._({required this.user});

  /// Parses the top-level `{ user }` shape returned by `GET /api/v1/auth/me`.
  ///
  /// Raises [ServerException] when the `user` field is missing or is not
  /// a JSON object. Per-field failures inside the `user` object are
  /// raised by [User.fromMeJson] with the same endpoint identifier.
  factory AuthMeResponse.fromJson(Map<String, dynamic> json) {
    final Object? rawUser = json['user'];
    if (rawUser is! Map<String, dynamic>) {
      throw ServerException(
        'Auth response from $_endpoint is malformed: '
        '"user" is missing or not a JSON object '
        '(got: ${_describe(rawUser)}).',
        0,
      );
    }
    return AuthMeResponse._(user: User.fromMeJson(rawUser));
  }

  /// The authenticated user resolved from the response body.
  final User user;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is AuthMeResponse && other.user == user;
  }

  @override
  int get hashCode => user.hashCode;

  @override
  String toString() => 'AuthMeResponse(user: $user)';
}

String _describe(Object? value) {
  if (value == null) return 'null';
  return '${value.runtimeType}';
}
