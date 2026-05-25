// Typed wrapper for `POST /api/v1/auth/logout`.
//
// The endpoint returns `{ success: true, message }` on success, but neither
// field changes any consumer's behaviour: the existence of a 2xx response is
// itself the success signal (Requirement 3.5). [AuthLogoutResponse] therefore
// carries no fields. The repository instantiates it only to keep its
// return-type uniform with the other three response classes (design
// "Components and Interfaces").
//
// Like its siblings, this class is private to `data/`: no presentation-layer
// file imports it.
//
// See `flutter-port-auth` Requirements 3.1 and 3.5.

import 'package:flutter/foundation.dart';

/// Marker value type for a successful logout response.
///
/// [fromJson] accepts any map (including `null` or empty bodies, surfaced as
/// `<String, dynamic>{}` by the network layer) because the cook-smart
/// backend's success contract is the HTTP status alone. The optional
/// `success` and `message` fields are intentionally ignored
/// (Requirement 3.5).
@immutable
final class AuthLogoutResponse {
  const AuthLogoutResponse();

  /// Builds an [AuthLogoutResponse] from a logout response body.
  ///
  /// The body is intentionally ignored — the existence of a 2xx response is
  /// the success signal (Requirement 3.5). The parameter is named with a
  /// leading underscore to make the intent clear at every call site.
  factory AuthLogoutResponse.fromJson(Map<String, dynamic> _) {
    return const AuthLogoutResponse();
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is AuthLogoutResponse;

  @override
  int get hashCode => (AuthLogoutResponse).hashCode;

  @override
  String toString() => 'AuthLogoutResponse()';
}
