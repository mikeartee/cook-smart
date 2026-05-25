// Sealed authentication state machine consumed by the [AuthNotifier]
// presentation layer and surfaced into the foundation's
// `authStateProvider` via the override declared by `auth_overrides.dart`.
//
// The three variants are exhaustive (the parent is `sealed`, every child is
// `final class`) so every consumer must handle all three at compile time.
// Each variant has a `const` constructor and value-equality across all of
// its fields, so the notifier can compare its previous and next states with
// `==` (avoiding redundant rebuilds) and Riverpod's `AsyncValue` semantics
// behave as expected.
//
// See `flutter-port-auth` Requirements 1.2, 6.1, 6.2, 6.3, 6.4.

import 'package:flutter/foundation.dart';
import 'package:mobile/features/auth/domain/user.dart';

/// Sealed authentication state with exactly three variants.
///
/// - [AuthLoading]: the notifier is still resolving a session-restore,
///   login, signup, or logout. Carries no payload.
/// - [AuthUnauthenticated]: there is no active session. The optional
///   [AuthUnauthenticated.errorMessage] is non-null only when the previous
///   transition was a failed login, signup, session-restore, or 401-driven
///   clear-and-redirect (Requirement 6.3).
/// - [AuthAuthenticated]: there is an active session, identified by
///   [AuthAuthenticated.user] and [AuthAuthenticated.token].
sealed class AuthState {
  const AuthState();
}

/// The notifier is in flight; the UI should render a loading indicator and
/// disable any auth-mutation affordance.
///
/// Carries no payload (Requirement 6.4). All instances are equal so two
/// successive transitions through `AuthLoading` compare as `==`.
@immutable
final class AuthLoading extends AuthState {
  const AuthLoading();

  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is AuthLoading;

  @override
  int get hashCode => (AuthLoading).hashCode;

  @override
  String toString() => 'AuthLoading()';
}

/// There is no active session.
///
/// [errorMessage] is `null` after a clean logout or when there was no
/// persisted JWT at startup. It is non-null when the previous transition
/// was a failed login, signup, session-restore, or 401 clear-and-redirect
/// (Requirements 6.3, 6.7, 6.9, 8.4).
@immutable
final class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated({this.errorMessage});

  final String? errorMessage;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AuthUnauthenticated && other.errorMessage == errorMessage;

  @override
  int get hashCode => errorMessage.hashCode;

  @override
  String toString() => 'AuthUnauthenticated(errorMessage: $errorMessage)';
}

/// There is an active session, identified by [user] and [token].
///
/// Both fields are required and non-null (Requirement 6.2). [token] is the
/// raw JWT string returned by the backend; [user] is the domain model
/// hydrated from the same response (or refreshed via `/me` on
/// session-restore).
@immutable
final class AuthAuthenticated extends AuthState {
  const AuthAuthenticated({required this.user, required this.token});

  final User user;
  final String token;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AuthAuthenticated &&
          other.user == user &&
          other.token == token;

  @override
  int get hashCode => Object.hash(user, token);

  @override
  String toString() => 'AuthAuthenticated(user: $user, token: $token)';
}
