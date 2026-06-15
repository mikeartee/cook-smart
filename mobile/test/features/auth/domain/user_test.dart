// Property-based tests for `lib/features/auth/domain/user.dart`.
//
// Three properties are exercised, each ≥100 random inputs per Glados's
// default `ExploreConfig.numRuns`:
//
//   * Property 1: User round-trip across all four endpoint shapes
//     (login, register, me, persistence). Both the direct
//     `Map<String, dynamic> -> from*Json` path and the
//     through-string `jsonEncode -> jsonDecode -> from*Json`
//     persistence path are exercised so a regression in either
//     surface fails fast.
//
//   * Property 2: Missing required field surfaces as ServerException.
//     For each non-null field declared by Requirement 4.1, drop that
//     field from the JSON object and assert
//     `User.from{Login,Register,Me}Json` raises a ServerException
//     whose message names both the offending endpoint and the
//     missing field. The /register subset excludes `is_admin`
//     because `User.fromRegisterJson` defaults it to `false` per
//     the Components-and-Interfaces section of design.md.
//
//   * Property 3: copyWith preserves all non-overridden fields.
//     For every (User, fieldName) pair, copyWith one field with a
//     guaranteed-different value and assert that no other field
//     changes.
//
// A small private `Generator<User>` lives at the top of the file
// rather than fighting Glados's combinators — User has 15 fields,
// which exceeds the arity of `combine10`. Shrinking on the User
// generator is intentionally trivial: we are testing universal
// properties, not searching for minimal counterexamples.
//
// Validates: Requirements 3.2, 3.3, 3.4, 3.6, 4.3, 4.4, 4.5, 4.6, 4.7.

import 'dart:convert';
import 'dart:math';

import 'package:glados/glados.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/features/auth/domain/user.dart';

// ---------------------------------------------------------------------------
// Generator<User> — constructs every User by building a /me-shape JSON
// object and parsing via `User.fromMeJson`. This means the generator both
// produces the value and exercises the most-permissive parser, so any
// generator-level malformedness fails the generator immediately rather
// than silently corrupting the property under test.
// ---------------------------------------------------------------------------

Generator<User> _userGenerator() {
  return (Random random, int size) {
    final user = User.fromMeJson(_randomMeJson(random, size));
    return Shrinkable<User>(user, () => const <Shrinkable<User>>[]);
  };
}

Map<String, dynamic> _randomMeJson(Random random, int size) {
  String genString() {
    final length = max(1, random.nextInt(max(1, size)));
    final buffer = StringBuffer();
    for (var i = 0; i < length; i++) {
      buffer.writeCharCode(97 + random.nextInt(26));
    }
    return buffer.toString();
  }

  List<String> genStringList() {
    final length = random.nextInt(min(5, max(1, size + 1)) + 1);
    return <String>[for (var i = 0; i < length; i++) genString()];
  }

  return <String, dynamic>{
    'id': genString(),
    'email': '${genString()}@example.com',
    'is_co_founder': random.nextBool(),
    'is_special_user': random.nextBool(),
    'is_creator': random.nextBool(),
    'has_lifetime_subscription': random.nextBool(),
    'subscription_status': genString(),
    'points': random.nextInt(1000000),
    'is_admin': random.nextBool(),
    'first_name': random.nextBool() ? null : genString(),
    'last_name': random.nextBool() ? null : genString(),
    'dietary_restrictions': random.nextBool() ? null : genStringList(),
    'allergies': random.nextBool() ? null : genStringList(),
    'show_nutrition': random.nextBool() ? null : random.nextBool(),
    'preferred_units': random.nextBool() ? null : genString(),
  };
}

// ---------------------------------------------------------------------------
// Endpoint shapes for Property 1
// ---------------------------------------------------------------------------

enum _ResponseShape { login, register, me, persistence }

extension _ResponseShapeEndpoint on _ResponseShape {
  User parse(Map<String, dynamic> json) => switch (this) {
        _ResponseShape.login => User.fromLoginJson(json),
        _ResponseShape.register => User.fromRegisterJson(json),
        _ResponseShape.me => User.fromMeJson(json),
        _ResponseShape.persistence => User.fromMeJson(json),
      };

  /// `true` iff the round-trip preserves the four /me-only nullable
  /// fields. The login and register factories always null those four
  /// fields (Requirement 4.3) so a round-trip through them is lossy
  /// for any User whose /me-only fields were originally non-null.
  bool get preservesMeOnlyFields => switch (this) {
        _ResponseShape.login => false,
        _ResponseShape.register => false,
        _ResponseShape.me => true,
        _ResponseShape.persistence => true,
      };
}

Generator<_ResponseShape> _responseShapeGenerator() =>
    any.choose<_ResponseShape>(_ResponseShape.values);

// ---------------------------------------------------------------------------
// Required-field enums for Property 2
// ---------------------------------------------------------------------------

enum _RequiredField {
  id,
  email,
  isCoFounder,
  isSpecialUser,
  isCreator,
  hasLifetimeSubscription,
  subscriptionStatus,
  points,
  isAdmin,
}

extension _RequiredFieldKey on _RequiredField {
  String get jsonKey => switch (this) {
        _RequiredField.id => 'id',
        _RequiredField.email => 'email',
        _RequiredField.isCoFounder => 'is_co_founder',
        _RequiredField.isSpecialUser => 'is_special_user',
        _RequiredField.isCreator => 'is_creator',
        _RequiredField.hasLifetimeSubscription => 'has_lifetime_subscription',
        _RequiredField.subscriptionStatus => 'subscription_status',
        _RequiredField.points => 'points',
        _RequiredField.isAdmin => 'is_admin',
      };
}

/// The /register endpoint omits `is_admin` because `User.fromRegisterJson`
/// defaults it to `false` (design.md "Components and Interfaces"). Every
/// other required field still raises ServerException when missing.
const List<_RequiredField> _registerRequiredFields = <_RequiredField>[
  _RequiredField.id,
  _RequiredField.email,
  _RequiredField.isCoFounder,
  _RequiredField.isSpecialUser,
  _RequiredField.isCreator,
  _RequiredField.hasLifetimeSubscription,
  _RequiredField.subscriptionStatus,
  _RequiredField.points,
];

// ---------------------------------------------------------------------------
// FieldName enum for Property 3 (covers all 15 fields)
// ---------------------------------------------------------------------------

enum _FieldName {
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
  dietaryRestrictions,
  allergies,
  showNutrition,
  preferredUnits,
}

/// Returns a copy of [u] in which exactly the field named [f] has been
/// changed to a guaranteed-different value. Booleans flip; numbers add
/// one; strings append a suffix; lists append an element; nullable
/// fields swap between `null` and a non-null sentinel value.
User _applyChange(User u, _FieldName f) {
  return switch (f) {
    _FieldName.id => u.copyWith(id: '${u.id}_x'),
    _FieldName.email => u.copyWith(email: '${u.email}_x'),
    _FieldName.isCoFounder => u.copyWith(isCoFounder: !u.isCoFounder),
    _FieldName.isSpecialUser => u.copyWith(isSpecialUser: !u.isSpecialUser),
    _FieldName.isCreator => u.copyWith(isCreator: !u.isCreator),
    _FieldName.hasLifetimeSubscription =>
      u.copyWith(hasLifetimeSubscription: !u.hasLifetimeSubscription),
    _FieldName.subscriptionStatus =>
      u.copyWith(subscriptionStatus: '${u.subscriptionStatus}_x'),
    _FieldName.points => u.copyWith(points: u.points + 1),
    _FieldName.isAdmin => u.copyWith(isAdmin: !u.isAdmin),
    _FieldName.firstName => u.copyWith(
        firstName: u.firstName == null ? 'Alice' : '${u.firstName}_x',
      ),
    _FieldName.lastName => u.copyWith(
        lastName: u.lastName == null ? 'Smith' : '${u.lastName}_x',
      ),
    _FieldName.dietaryRestrictions => u.copyWith(
        dietaryRestrictions: u.dietaryRestrictions == null
            ? const <String>['vegan']
            : <String>[...u.dietaryRestrictions!, 'extra'],
      ),
    _FieldName.allergies => u.copyWith(
        allergies: u.allergies == null
            ? const <String>['nuts']
            : <String>[...u.allergies!, 'extra'],
      ),
    _FieldName.showNutrition => u.copyWith(
        showNutrition: !(u.showNutrition ?? false),
      ),
    _FieldName.preferredUnits => u.copyWith(
        preferredUnits:
            u.preferredUnits == null ? 'metric' : '${u.preferredUnits}_x',
      ),
  };
}

Object? _readField(User u, _FieldName f) => switch (f) {
      _FieldName.id => u.id,
      _FieldName.email => u.email,
      _FieldName.isCoFounder => u.isCoFounder,
      _FieldName.isSpecialUser => u.isSpecialUser,
      _FieldName.isCreator => u.isCreator,
      _FieldName.hasLifetimeSubscription => u.hasLifetimeSubscription,
      _FieldName.subscriptionStatus => u.subscriptionStatus,
      _FieldName.points => u.points,
      _FieldName.isAdmin => u.isAdmin,
      _FieldName.firstName => u.firstName,
      _FieldName.lastName => u.lastName,
      _FieldName.dietaryRestrictions => u.dietaryRestrictions,
      _FieldName.allergies => u.allergies,
      _FieldName.showNutrition => u.showNutrition,
      _FieldName.preferredUnits => u.preferredUnits,
    };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  group('User', () {
    // -- Property 1: round-trip across every endpoint shape --------------

    Glados2<User, _ResponseShape>(
      _userGenerator(),
      _responseShapeGenerator(),
    ).test('Property 1: round-trip across all four endpoint shapes',
        (User original, _ResponseShape shape) {
      final Map<String, dynamic> directJson = original.toJson();
      final User directParsed = shape.parse(directJson);

      final Map<String, dynamic> throughString =
          jsonDecode(jsonEncode(directJson)) as Map<String, dynamic>;
      final User stringParsed = shape.parse(throughString);

      // login and register factories null the four /me-only fields
      // unconditionally (Requirement 4.3); /me and persistence preserve
      // every field.
      final User expected = shape.preservesMeOnlyFields
          ? original
          : original.copyWith(
              dietaryRestrictions: null,
              allergies: null,
              showNutrition: null,
              preferredUnits: null,
            );

      expect(directParsed, equals(expected),
          reason: 'direct round-trip mismatch for ${shape.name}');
      expect(stringParsed, equals(expected),
          reason: 'through-string round-trip mismatch for ${shape.name}');
    });

    // -- Property 2: missing required field surfaces as ServerException --

    Glados2<User, _RequiredField>(
      _userGenerator(),
      any.choose<_RequiredField>(_RequiredField.values),
    ).test('Property 2 (/me): missing required field throws ServerException',
        (User user, _RequiredField field) {
      _expectServerExceptionForMissingField(
        user: user,
        endpointString: 'GET /api/v1/auth/me',
        droppedKey: field.jsonKey,
        parse: User.fromMeJson,
      );
    });

    Glados2<User, _RequiredField>(
      _userGenerator(),
      any.choose<_RequiredField>(_RequiredField.values),
    ).test(
        'Property 2 (/login): missing required field throws ServerException',
        (User user, _RequiredField field) {
      _expectServerExceptionForMissingField(
        user: user,
        endpointString: 'POST /api/v1/auth/login',
        droppedKey: field.jsonKey,
        parse: User.fromLoginJson,
      );
    });

    Glados2<User, _RequiredField>(
      _userGenerator(),
      any.choose<_RequiredField>(_registerRequiredFields),
    ).test(
        'Property 2 (/register): missing required field throws ServerException '
        '(is_admin excluded)', (User user, _RequiredField field) {
      _expectServerExceptionForMissingField(
        user: user,
        endpointString: 'POST /api/v1/auth/register',
        droppedKey: field.jsonKey,
        parse: User.fromRegisterJson,
      );
    });

    test(
      'Property 2 (/register): is_admin is NOT required '
      '(defaults to false)',
      () {
        // One concrete sanity test backing the design's documented
        // asymmetry: the register handler omits `is_admin` and the
        // factory must default it to `false` rather than throwing.
        final Map<String, dynamic> json = User.fromMeJson(
          _randomMeJson(Random(7), 16),
        ).toJson()
          ..remove('is_admin');

        final User parsed = User.fromRegisterJson(json);
        expect(parsed.isAdmin, isFalse);
      },
    );

    // -- Property 3: copyWith preserves all non-overridden fields --------

    Glados2<User, _FieldName>(
      _userGenerator(),
      any.choose<_FieldName>(_FieldName.values),
    ).test('Property 3: copyWith preserves all non-overridden fields',
        (User original, _FieldName changed) {
      final User modified = _applyChange(original, changed);

      // Sanity: the change is observable. If this fails, the
      // _applyChange table is producing a no-op for some field.
      expect(modified, isNot(equals(original)),
          reason: 'expected $changed change to be observable');

      for (final _FieldName other in _FieldName.values) {
        if (other == changed) continue;
        expect(
          _readField(modified, other),
          equals(_readField(original, other)),
          reason:
              'changing $changed should not affect $other; original='
              '${_readField(original, other)}, modified='
              '${_readField(modified, other)}',
        );
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

void _expectServerExceptionForMissingField({
  required User user,
  required String endpointString,
  required String droppedKey,
  required User Function(Map<String, dynamic>) parse,
}) {
  final Map<String, dynamic> json = user.toJson()..remove(droppedKey);

  expect(
    () => parse(json),
    throwsA(
      isA<ServerException>().having(
        (ServerException e) => e.message,
        'message',
        allOf(
          contains(endpointString),
          contains('"$droppedKey"'),
        ),
      ),
    ),
  );
}
