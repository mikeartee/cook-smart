// User domain model — the union of every field any Auth_Endpoint can return.
//
// Three named factories cover the three response shapes the cook-smart
// backend exposes today:
//
//   * [User.fromLoginJson]    — `POST /api/v1/auth/login`
//   * [User.fromRegisterJson] — `POST /api/v1/auth/register` (defaults
//     `is_admin` to `false` when the backend omits the field, because
//     the register handler never marks a brand-new account as admin)
//   * [User.fromMeJson]       — `GET  /api/v1/auth/me`
//
// All three populate the nine non-null fields. The four `/me`-only
// fields (`dietary_restrictions`, `allergies`, `show_nutrition`,
// `preferred_units`) are populated only by [User.fromMeJson]; the other
// two factories leave them as `null` per Requirement 4.3.
//
// [User.toJson] emits all 15 fields with their snake_case JSON keys so
// that a `User` round-trips through `SecureStorage` via
// `User.fromMeJson(jsonDecode(jsonEncode(user.toJson())))` without
// loss (Requirement 4.6).
//
// Missing or malformed non-null fields raise [ServerException] whose
// message identifies the offending endpoint and field, so backend
// regressions surface with enough context to diagnose without a stack
// trace (Requirement 4.5).
//
// See `flutter-port-auth` Requirements 1.2, 4.1, 4.2, 4.3, 4.4, 4.5,
// 4.6, 4.7.

import 'package:flutter/foundation.dart';
import 'package:mobile/core/network/api_exception.dart';

const String _loginEndpoint = 'POST /api/v1/auth/login';
const String _registerEndpoint = 'POST /api/v1/auth/register';
const String _meEndpoint = 'GET /api/v1/auth/me';

/// Sentinel used by [User.copyWith] to distinguish "argument not passed"
/// from "argument passed as `null`" for the six nullable fields. Any
/// other instance compares unequal under [identical], so the public
/// surface is unambiguous.
const Object _unset = Object();

/// Authenticated cook-smart user.
///
/// Constructed only via the three named factories
/// ([User.fromLoginJson], [User.fromRegisterJson], [User.fromMeJson])
/// or via [copyWith]. The default constructor is private so that every
/// `User` instance comes from a parser that has validated the source
/// shape against its endpoint's contract.
@immutable
final class User {
  const User._({
    required this.id,
    required this.email,
    required this.isCoFounder,
    required this.isSpecialUser,
    required this.isCreator,
    required this.hasLifetimeSubscription,
    required this.subscriptionStatus,
    required this.points,
    required this.isAdmin,
    required this.firstName,
    required this.lastName,
    required this.dietaryRestrictions,
    required this.allergies,
    required this.showNutrition,
    required this.preferredUnits,
  });

  /// Parses a `user` object embedded in `Auth_Login_Response`.
  ///
  /// Populates the nine non-null fields plus the optional
  /// [firstName] and [lastName]. The four `/me`-only fields are set
  /// to `null` because the backend's `/login` handler does not return
  /// them (Requirement 4.3).
  factory User.fromLoginJson(Map<String, dynamic> json) {
    return User._(
      id: _requireString(json, 'id', _loginEndpoint),
      email: _requireString(json, 'email', _loginEndpoint),
      isCoFounder: _requireBool(json, 'is_co_founder', _loginEndpoint),
      isSpecialUser: _requireBool(json, 'is_special_user', _loginEndpoint),
      isCreator: _requireBool(json, 'is_creator', _loginEndpoint),
      hasLifetimeSubscription: _requireBool(
        json,
        'has_lifetime_subscription',
        _loginEndpoint,
      ),
      subscriptionStatus:
          _requireString(json, 'subscription_status', _loginEndpoint),
      points: _requireInt(json, 'points', _loginEndpoint),
      isAdmin: _requireBool(json, 'is_admin', _loginEndpoint),
      firstName: _optionalString(json, 'first_name', _loginEndpoint),
      lastName: _optionalString(json, 'last_name', _loginEndpoint),
      dietaryRestrictions: null,
      allergies: null,
      showNutrition: null,
      preferredUnits: null,
    );
  }

  /// Parses a `user` object embedded in `Auth_Register_Response`.
  ///
  /// Behaves like [User.fromLoginJson] except that [isAdmin] defaults
  /// to `false` when the JSON omits the `is_admin` key. The backend's
  /// `/register` handler does not echo `is_admin` because brand-new
  /// accounts are never admins; this default keeps the [User]
  /// contract uniform without forcing the requirements doc to track
  /// that asymmetry (design "Components and Interfaces").
  factory User.fromRegisterJson(Map<String, dynamic> json) {
    return User._(
      id: _requireString(json, 'id', _registerEndpoint),
      email: _requireString(json, 'email', _registerEndpoint),
      isCoFounder: _requireBool(json, 'is_co_founder', _registerEndpoint),
      isSpecialUser: _requireBool(json, 'is_special_user', _registerEndpoint),
      isCreator: _requireBool(json, 'is_creator', _registerEndpoint),
      hasLifetimeSubscription: _requireBool(
        json,
        'has_lifetime_subscription',
        _registerEndpoint,
      ),
      subscriptionStatus:
          _requireString(json, 'subscription_status', _registerEndpoint),
      points: _requireInt(json, 'points', _registerEndpoint),
      isAdmin: _boolWithDefault(
        json,
        'is_admin',
        defaultValue: false,
        endpoint: _registerEndpoint,
      ),
      firstName: _optionalString(json, 'first_name', _registerEndpoint),
      lastName: _optionalString(json, 'last_name', _registerEndpoint),
      dietaryRestrictions: null,
      allergies: null,
      showNutrition: null,
      preferredUnits: null,
    );
  }

  /// Parses a `user` object embedded in `Auth_Me_Response`.
  ///
  /// Populates every field declared in Requirements 4.1 and 4.2. A
  /// JSON `null` or absent value for any of the six nullable fields
  /// becomes the Dart `null`; a present value is type-checked and
  /// then assigned (Requirement 4.4).
  factory User.fromMeJson(Map<String, dynamic> json) {
    return User._(
      id: _requireString(json, 'id', _meEndpoint),
      email: _requireString(json, 'email', _meEndpoint),
      isCoFounder: _requireBool(json, 'is_co_founder', _meEndpoint),
      isSpecialUser: _requireBool(json, 'is_special_user', _meEndpoint),
      isCreator: _requireBool(json, 'is_creator', _meEndpoint),
      hasLifetimeSubscription: _requireBool(
        json,
        'has_lifetime_subscription',
        _meEndpoint,
      ),
      subscriptionStatus:
          _requireString(json, 'subscription_status', _meEndpoint),
      points: _requireInt(json, 'points', _meEndpoint),
      isAdmin: _requireBool(json, 'is_admin', _meEndpoint),
      firstName: _optionalString(json, 'first_name', _meEndpoint),
      lastName: _optionalString(json, 'last_name', _meEndpoint),
      dietaryRestrictions:
          _optionalStringList(json, 'dietary_restrictions', _meEndpoint),
      allergies: _optionalStringList(json, 'allergies', _meEndpoint),
      showNutrition: _optionalBool(json, 'show_nutrition', _meEndpoint),
      preferredUnits: _optionalString(json, 'preferred_units', _meEndpoint),
    );
  }

  // -- Non-null fields (Requirement 4.1) -----------------------------------

  final String id;
  final String email;
  final bool isCoFounder;
  final bool isSpecialUser;
  final bool isCreator;
  final bool hasLifetimeSubscription;
  final String subscriptionStatus;
  final int points;
  final bool isAdmin;

  // -- Nullable fields (Requirement 4.2) -----------------------------------

  final String? firstName;
  final String? lastName;
  final List<String>? dietaryRestrictions;
  final List<String>? allergies;
  final bool? showNutrition;
  final String? preferredUnits;

  /// Returns a copy with the listed fields replaced.
  ///
  /// All 15 fields are covered (Requirement 4.7). The six nullable
  /// fields use the [_unset] sentinel as their default so a caller
  /// can explicitly clear them by passing `null`; passing the
  /// argument by name with a `null` value is distinguishable from
  /// omitting it entirely.
  User copyWith({
    String? id,
    String? email,
    bool? isCoFounder,
    bool? isSpecialUser,
    bool? isCreator,
    bool? hasLifetimeSubscription,
    String? subscriptionStatus,
    int? points,
    bool? isAdmin,
    Object? firstName = _unset,
    Object? lastName = _unset,
    Object? dietaryRestrictions = _unset,
    Object? allergies = _unset,
    Object? showNutrition = _unset,
    Object? preferredUnits = _unset,
  }) {
    return User._(
      id: id ?? this.id,
      email: email ?? this.email,
      isCoFounder: isCoFounder ?? this.isCoFounder,
      isSpecialUser: isSpecialUser ?? this.isSpecialUser,
      isCreator: isCreator ?? this.isCreator,
      hasLifetimeSubscription:
          hasLifetimeSubscription ?? this.hasLifetimeSubscription,
      subscriptionStatus: subscriptionStatus ?? this.subscriptionStatus,
      points: points ?? this.points,
      isAdmin: isAdmin ?? this.isAdmin,
      firstName: identical(firstName, _unset)
          ? this.firstName
          : firstName as String?,
      lastName:
          identical(lastName, _unset) ? this.lastName : lastName as String?,
      dietaryRestrictions: identical(dietaryRestrictions, _unset)
          ? this.dietaryRestrictions
          : dietaryRestrictions as List<String>?,
      allergies: identical(allergies, _unset)
          ? this.allergies
          : allergies as List<String>?,
      showNutrition: identical(showNutrition, _unset)
          ? this.showNutrition
          : showNutrition as bool?,
      preferredUnits: identical(preferredUnits, _unset)
          ? this.preferredUnits
          : preferredUnits as String?,
    );
  }

  /// Emits the JSON shape consumed by [User.fromMeJson].
  ///
  /// All 15 fields are present in the output, using the same
  /// snake_case keys the backend uses, so a `User` written via
  /// `secureStorage.writeToken('auth_user', jsonEncode(user.toJson()))`
  /// round-trips to an equal `User` via
  /// `User.fromMeJson(jsonDecode(read))` (Requirement 4.6).
  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'email': email,
      'is_co_founder': isCoFounder,
      'is_special_user': isSpecialUser,
      'is_creator': isCreator,
      'has_lifetime_subscription': hasLifetimeSubscription,
      'subscription_status': subscriptionStatus,
      'points': points,
      'is_admin': isAdmin,
      'first_name': firstName,
      'last_name': lastName,
      'dietary_restrictions': dietaryRestrictions,
      'allergies': allergies,
      'show_nutrition': showNutrition,
      'preferred_units': preferredUnits,
    };
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! User) return false;
    return other.id == id &&
        other.email == email &&
        other.isCoFounder == isCoFounder &&
        other.isSpecialUser == isSpecialUser &&
        other.isCreator == isCreator &&
        other.hasLifetimeSubscription == hasLifetimeSubscription &&
        other.subscriptionStatus == subscriptionStatus &&
        other.points == points &&
        other.isAdmin == isAdmin &&
        other.firstName == firstName &&
        other.lastName == lastName &&
        _listEquals(other.dietaryRestrictions, dietaryRestrictions) &&
        _listEquals(other.allergies, allergies) &&
        other.showNutrition == showNutrition &&
        other.preferredUnits == preferredUnits;
  }

  @override
  int get hashCode => Object.hash(
        id,
        email,
        isCoFounder,
        isSpecialUser,
        isCreator,
        hasLifetimeSubscription,
        subscriptionStatus,
        points,
        isAdmin,
        firstName,
        lastName,
        Object.hashAll(dietaryRestrictions ?? const <String>[]),
        Object.hashAll(allergies ?? const <String>[]),
        showNutrition,
        preferredUnits,
      );

  @override
  String toString() {
    return 'User('
        'id: $id, '
        'email: $email, '
        'isCoFounder: $isCoFounder, '
        'isSpecialUser: $isSpecialUser, '
        'isCreator: $isCreator, '
        'hasLifetimeSubscription: $hasLifetimeSubscription, '
        'subscriptionStatus: $subscriptionStatus, '
        'points: $points, '
        'isAdmin: $isAdmin, '
        'firstName: $firstName, '
        'lastName: $lastName, '
        'dietaryRestrictions: $dietaryRestrictions, '
        'allergies: $allergies, '
        'showNutrition: $showNutrition, '
        'preferredUnits: $preferredUnits'
        ')';
  }
}

// ---------------------------------------------------------------------------
// Field readers — every helper raises a ServerException whose message
// identifies the offending endpoint and field, satisfying Requirements 4.5
// and 3.6. statusCode is 0 because the failure is a parse error rather
// than a transport-level HTTP status (matching the convention from
// `core/network/api_response.dart`).
// ---------------------------------------------------------------------------

String _requireString(
  Map<String, dynamic> json,
  String key,
  String endpoint,
) {
  final Object? value = json[key];
  if (value is String) return value;
  throw ServerException(
    'Auth response from $endpoint is missing required string '
    'field "$key" (got: ${_describe(value)}).',
    0,
  );
}

bool _requireBool(
  Map<String, dynamic> json,
  String key,
  String endpoint,
) {
  final Object? value = json[key];
  if (value is bool) return value;
  throw ServerException(
    'Auth response from $endpoint is missing required boolean '
    'field "$key" (got: ${_describe(value)}).',
    0,
  );
}

int _requireInt(
  Map<String, dynamic> json,
  String key,
  String endpoint,
) {
  final Object? value = json[key];
  if (value is int) return value;
  throw ServerException(
    'Auth response from $endpoint is missing required integer '
    'field "$key" (got: ${_describe(value)}).',
    0,
  );
}

bool _boolWithDefault(
  Map<String, dynamic> json,
  String key, {
  required bool defaultValue,
  required String endpoint,
}) {
  if (!json.containsKey(key) || json[key] == null) return defaultValue;
  final Object? value = json[key];
  if (value is bool) return value;
  throw ServerException(
    'Auth response from $endpoint has malformed boolean '
    'field "$key" (got: ${_describe(value)}).',
    0,
  );
}

String? _optionalString(
  Map<String, dynamic> json,
  String key,
  String endpoint,
) {
  if (!json.containsKey(key)) return null;
  final Object? value = json[key];
  if (value == null) return null;
  if (value is String) return value;
  throw ServerException(
    'Auth response from $endpoint has malformed optional string '
    'field "$key" (got: ${_describe(value)}).',
    0,
  );
}

bool? _optionalBool(
  Map<String, dynamic> json,
  String key,
  String endpoint,
) {
  if (!json.containsKey(key)) return null;
  final Object? value = json[key];
  if (value == null) return null;
  if (value is bool) return value;
  throw ServerException(
    'Auth response from $endpoint has malformed optional boolean '
    'field "$key" (got: ${_describe(value)}).',
    0,
  );
}

List<String>? _optionalStringList(
  Map<String, dynamic> json,
  String key,
  String endpoint,
) {
  if (!json.containsKey(key)) return null;
  final Object? value = json[key];
  if (value == null) return null;
  if (value is List) {
    final result = <String>[];
    for (var i = 0; i < value.length; i++) {
      final Object? element = value[i];
      if (element is String) {
        result.add(element);
        continue;
      }
      throw ServerException(
        'Auth response from $endpoint has malformed list element '
        'at "$key[$i]" (got: ${_describe(element)}).',
        0,
      );
    }
    return List<String>.unmodifiable(result);
  }
  throw ServerException(
    'Auth response from $endpoint has malformed optional list '
    'field "$key" (got: ${_describe(value)}).',
    0,
  );
}

String _describe(Object? value) {
  if (value == null) return 'null';
  return '${value.runtimeType}';
}

bool _listEquals<ElementType>(
  List<ElementType>? a,
  List<ElementType>? b,
) {
  if (identical(a, b)) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i] != b[i]) return false;
  }
  return true;
}
