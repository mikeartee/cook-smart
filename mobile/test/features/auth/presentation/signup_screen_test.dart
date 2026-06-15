// Widget tests for `lib/features/auth/presentation/signup_screen.dart`.
//
// Validates: Requirements 2.2, 10.1, 10.4, 10.5, 10.6, 10.7, 10.10 of the
// flutter-port-auth spec.
//
// Property 10 (signup includes optional names iff trimmed non-empty),
// Property 11 (email validator rejects every invalid shape — signup
// variant), and Property 12 (password validators reject short and
// mismatched inputs) are formulated by the design as Glados properties.
// Glados's randomised property runner registers tests through
// `package:test`'s `test(...)` function and cannot drive a
// [WidgetTester] — `testWidgets` is the only way to pump and interact
// with a Flutter widget under test. Since the offending input sets are
// curated (not randomly generated), exhaustive parameterised
// [testWidgets] over each shape produces identical coverage to what a
// Glados property would sample, so we drive the properties with `for`
// loops over the curated sets and rely on the binding's per-test
// isolation for the "fresh harness" guarantee. This mirrors the
// `login_screen_test.dart` approach.
//
// Test seams
// ----------
//
// Each property and example test overrides `authNotifierProvider` with
// a hand-rolled fake that either records `signup(...)` invocations
// (Properties 10/11/12 and the Requirement 10.7 example test) or
// pre-seeds the notifier so the screen's `ref.listen` callback
// observes a `AuthLoading → AuthAuthenticated` transition that carries
// a captured `special_message` (the Requirement 10.10 example test).
// Both fakes extend [AuthNotifier] so they are assignable to
// `AsyncNotifierProvider<AuthNotifier, AuthState>`.

// External libraries
//
// We deliberately do NOT import `package:glados/glados.dart` here.
// `testWidgets` lives in `package:flutter_test`, which already exports
// the `test`, `group`, and `expect` symbols we need. Adding glados
// would force a `hide` directive on the `flutter_test` import while
// contributing no widget-test affordances of its own; importing a
// package without using its symbols is also a `very_good_analysis`
// lint violation. The Property 10/11/12 coverage is therefore
// expressed as exhaustive parameterised [testWidgets] over the same
// curated input sets a Glados generator would sample.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

// Internal modules
import 'package:mobile/features/auth/domain/auth_state.dart';
import 'package:mobile/features/auth/domain/user.dart';
import 'package:mobile/features/auth/presentation/auth_notifier.dart';
import 'package:mobile/features/auth/presentation/signup_screen.dart';

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

/// Fake [AuthNotifier] that records every call to [signup] and never
/// performs network I/O or storage I/O.
///
/// `build` resolves to `AuthUnauthenticated(errorMessage: null)` so
/// the screen renders its idle form (no inline error, submit button
/// enabled). `signup` is a no-op apart from recording every argument
/// so the property tests can verify (a) the validator gate held when
/// it should — a rejected form submission must NEVER reach the
/// notifier — and (b) the trim-to-null and lower-case rules in
/// Requirements 2.2 and 10.1 actually fired before the notifier was
/// invoked.
class _RecordingFakeAuthNotifier extends AuthNotifier {
  /// One increment per call to [signup]. Property 11/12 and the
  /// Requirement 10.7 example test assert this stays at zero when
  /// client-side validation rejects the form (Requirements 10.4,
  /// 10.5, 10.6, 10.7).
  int signupCallCount = 0;

  /// The most recent [signup] call's `email` argument. Captured so
  /// future tests (and tests in this file) can verify the trim +
  /// lower-case rule (Requirement 10.1).
  String? capturedEmail;

  /// The most recent [signup] call's `password` argument. Captured
  /// verbatim — passwords are forwarded as-is by the screen so any
  /// leading or trailing whitespace the user actually intended is
  /// preserved.
  String? capturedPassword;

  /// The most recent [signup] call's `ageVerified` argument.
  bool? capturedAgeVerified;

  /// The most recent [signup] call's `firstName` argument.
  /// `null` after construction and after a [signup] call that
  /// passed `null` for first name (Requirement 2.2).
  String? capturedFirstName;

  /// The most recent [signup] call's `lastName` argument.
  /// `null` after construction and after a [signup] call that
  /// passed `null` for last name (Requirement 2.2).
  String? capturedLastName;

  @override
  Future<AuthState> build() async => const AuthUnauthenticated();

  @override
  Future<void> signup({
    required String email,
    required String password,
    required bool ageVerified,
    String? firstName,
    String? lastName,
  }) async {
    signupCallCount++;
    capturedEmail = email;
    capturedPassword = password;
    capturedAgeVerified = ageVerified;
    capturedFirstName = firstName;
    capturedLastName = lastName;
  }
}

/// Fake [AuthNotifier] used by the Requirement 10.10 example test.
///
/// Mimics a successful signup that returned a `special_message` body
/// field. On invocation, [signup]:
///
///   1. Increments [signupCallCount] so the test can confirm the call
///      reached the notifier.
///   2. Transitions `state` through `AsyncData(AuthLoading())` then
///      `AsyncData(AuthAuthenticated(...))` with a microtask yield in
///      between, so Riverpod's listener delivery sees them as distinct
///      transitions — without the yield they would collapse into a
///      single listener invocation whose `previous` is the build-time
///      state and the screen's `previous is AuthLoading` branch would
///      never match. The production notifier reaches the same cadence
///      naturally because it awaits the repository call between the
///      two state assignments.
///   3. Captures the `special_message` value into
///      [_capturedSpecialMessage] *before* publishing the success
///      transition so the screen's listener can synchronously read it
///      via [lastSpecialMessage].
class _SpecialMessageFakeAuthNotifier extends AuthNotifier {
  _SpecialMessageFakeAuthNotifier({
    required this.welcomeMessage,
    required this.user,
    required this.token,
  });

  final String welcomeMessage;
  final User user;
  final String token;

  /// One increment per call to [signup]. The Requirement 10.10
  /// example test asserts this hits 1 after the form submits.
  int signupCallCount = 0;

  /// Mirrors the production notifier's private
  /// `_lastSpecialMessage` slot. Populated inside [signup] before
  /// the success transition; cleared by [consumeLastSpecialMessage].
  String? _capturedSpecialMessage;

  @override
  Future<AuthState> build() async => const AuthUnauthenticated();

  @override
  Future<void> signup({
    required String email,
    required String password,
    required bool ageVerified,
    String? firstName,
    String? lastName,
  }) async {
    signupCallCount++;
    state = const AsyncData<AuthState>(AuthLoading());
    // Yield so Riverpod delivers the AuthLoading transition to
    // listeners *before* the AuthAuthenticated transition lands.
    // The production notifier reaches this same cadence by awaiting
    // the repository call between the two `state =` assignments.
    await Future<void>.delayed(Duration.zero);
    _capturedSpecialMessage = welcomeMessage;
    state = AsyncData<AuthState>(
      AuthAuthenticated(user: user, token: token),
    );
  }

  @override
  String? get lastSpecialMessage => _capturedSpecialMessage;

  @override
  void consumeLastSpecialMessage() {
    _capturedSpecialMessage = null;
  }
}

// ---------------------------------------------------------------------------
// Test harness helpers
// ---------------------------------------------------------------------------

/// Builds a [ProviderContainer] with [authNotifierProvider] overridden
/// to the supplied fake. Caller is responsible for
/// `addTearDown(container.dispose)` so providers do not leak between
/// tests.
ProviderContainer _buildContainer(AuthNotifier notifier) {
  return ProviderContainer(
    overrides: <Override>[
      authNotifierProvider.overrideWith(() => notifier),
    ],
  );
}

/// Pumps the [SignupScreen] inside an [UncontrolledProviderScope]
/// backed by [container] and waits for the notifier's initial `build`
/// future to settle so the rendered state matches the fake's intended
/// starting state.
///
/// The default Flutter test surface (800 × 600 logical pixels) is too
/// short to render the entire signup form (five [TextFormField]s, the
/// age-verification [Checkbox], the inline error region, and two
/// buttons) without scrolling — taps on the [Checkbox] and the
/// submit [FilledButton] would land off-screen and fail the
/// hit-test. We expand the surface to 1024 × 1400 so every widget
/// the tests interact with is laid out inside the viewport, then
/// reset it via `addTearDown` so the change does not leak across
/// tests.
Future<void> _pumpSignupScreen(
  WidgetTester tester,
  ProviderContainer container,
) async {
  await tester.binding.setSurfaceSize(const Size(1024, 1400));
  addTearDown(() => tester.binding.setSurfaceSize(null));
  await tester.pumpWidget(
    UncontrolledProviderScope(
      container: container,
      child: const MaterialApp(home: SignupScreen()),
    ),
  );
  await tester.pumpAndSettle();
}

/// TextFormField indices in the [SignupScreen] tree. The screen
/// builds the fields in this order; centralising the indices here
/// makes the per-field tap sites obvious and survives a re-order in
/// the screen as a single edit point.
const int _firstNameFieldIndex = 0;
const int _lastNameFieldIndex = 1;
const int _emailFieldIndex = 2;
const int _passwordFieldIndex = 3;
const int _confirmPasswordFieldIndex = 4;

/// A known-valid email used by every test that is not exercising the
/// email validator. Lower-cased and trimmed already so the
/// Requirement 10.1 transformation is a no-op for these inputs.
const String _validEmail = 'signup@example.com';

/// A known-valid password used by every test that is not exercising
/// the password validator. Long enough to satisfy the 8-character
/// minimum (Requirement 10.4) and free of leading or trailing
/// whitespace.
const String _validPassword = 'validpassword123';

/// Fills the email, password, confirm-password fields with valid
/// inputs and toggles the age-verification checkbox on. Used by
/// every test whose property is "the form would otherwise submit
/// successfully if not for the variable under test."
Future<void> _fillBaselineValidForm(WidgetTester tester) async {
  await tester.enterText(
    find.byType(TextFormField).at(_emailFieldIndex),
    _validEmail,
  );
  await tester.enterText(
    find.byType(TextFormField).at(_passwordFieldIndex),
    _validPassword,
  );
  await tester.enterText(
    find.byType(TextFormField).at(_confirmPasswordFieldIndex),
    _validPassword,
  );
  await tester.tap(find.byType(Checkbox));
  await tester.pumpAndSettle();
}

// ---------------------------------------------------------------------------
// Curated input sets
// ---------------------------------------------------------------------------

/// Property 10 input set for the `firstName` and `lastName` axes.
///
/// `null` and `''` are observationally identical from the screen's
/// perspective — both leave the [TextFormField] empty — but the
/// design's Glados generator includes both, so we enumerate both for
/// parity. The whitespace-only and the padded cases exercise the
/// `_trimToNull` rule (Requirement 2.2): both must collapse to `null`
/// or to the trimmed core respectively.
const List<String?> _nameCases = <String?>[
  null,
  '',
  '   ',
  '  Alice  ',
  'Alice',
];

/// Property 11 invalid-email shapes (signup variant). Identical
/// enumeration to `login_screen_test.dart` per the design — both
/// validators apply the same regex over the same trimmed input
/// (Requirement 10.6 vs Requirement 9.7).
const List<String> _invalidEmailShapes = <String>[
  '', // empty
  '   ', // whitespace only
  'plainnoatsign', // no @ at all
  '@', // @ only — no chars before/after
  ' nostructure', // leading whitespace + invalid (no @)
  'nostructure ', // trailing whitespace + invalid (no @)
  'has space@example.com', // embedded whitespace inside the local part
  'a@b', // no `.` after the @
  'a@@b.c', // multiple @ signs
];

/// Property 12 short-password set: every entry is non-empty and
/// strictly shorter than the screen's 8-character minimum
/// (Requirement 10.4). The empty string is intentionally excluded
/// because the screen's password validator returns the "Please
/// enter a password." message for empty input rather than the "at
/// least 8 characters" message — a distinction that belongs to a
/// separate empty-input test, not to the short-input property.
const List<String> _shortPasswords = <String>[
  '1',
  'a',
  'short',
  'seven77',
  'abc1234', // 7 chars
];

/// Property 12 mismatched-password pairs. Every pair has both
/// elements at length ≥ 8 so the password-length validator passes
/// and the confirm-password mismatch validator is the gate under
/// test (Requirement 10.5).
const List<List<String>> _mismatchedPasswordPairs = <List<String>>[
  <String>['password1', 'password2'],
  <String>['aaaaaaaa', 'bbbbbbbb'],
  <String>['foobarbaz', 'foobarBAZ'],
];

/// Returns the value the screen will pass to [AuthNotifier.signup]
/// for an optional name input under Requirement 2.2: `null` when the
/// input is `null` or empty after trim; otherwise the trimmed value.
String? _expectedAfterTrim(String? input) {
  if (input == null) return null;
  final trimmed = input.trim();
  if (trimmed.isEmpty) return null;
  return trimmed;
}

/// Builds a minimal [User] for the Requirement 10.10 example test.
/// Every field the `User.fromMeJson` factory requires is populated
/// with a representative value; the four `/me`-only optional fields
/// are absent so they round-trip as `null`.
User _buildTestUser() {
  return User.fromMeJson(const <String, dynamic>{
    'id': 'test-user-id',
    'email': 'cofounder@example.com',
    'is_co_founder': true,
    'is_special_user': false,
    'is_creator': false,
    'has_lifetime_subscription': false,
    'subscription_status': 'free',
    'points': 0,
    'is_admin': false,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  group(
    'Property 10 — signup includes optional names iff trimmed non-empty',
    () {
      for (final firstNameInput in _nameCases) {
        for (final lastNameInput in _nameCases) {
          final firstLabel =
              firstNameInput == null ? '<null>' : jsonEscape(firstNameInput);
          final lastLabel =
              lastNameInput == null ? '<null>' : jsonEscape(lastNameInput);
          final expectedFirst = _expectedAfterTrim(firstNameInput);
          final expectedLast = _expectedAfterTrim(lastNameInput);
          final expectedFirstLabel =
              expectedFirst == null ? '<null>' : jsonEscape(expectedFirst);
          final expectedLastLabel =
              expectedLast == null ? '<null>' : jsonEscape(expectedLast);

          testWidgets(
            'firstName=$firstLabel lastName=$lastLabel → '
            'signup receives firstName=$expectedFirstLabel '
            'lastName=$expectedLastLabel',
            (WidgetTester tester) async {
              final fake = _RecordingFakeAuthNotifier();
              final container = _buildContainer(fake);
              addTearDown(container.dispose);

              await _pumpSignupScreen(tester, container);

              // null / empty inputs simulate "user did not type
              // anything in this field" — leave the field empty.
              // Whitespace-only and padded inputs are entered
              // verbatim so the screen's `_trimToNull` rule is the
              // gate under test (Requirement 2.2).
              if (firstNameInput != null && firstNameInput.isNotEmpty) {
                await tester.enterText(
                  find.byType(TextFormField).at(_firstNameFieldIndex),
                  firstNameInput,
                );
              }
              if (lastNameInput != null && lastNameInput.isNotEmpty) {
                await tester.enterText(
                  find.byType(TextFormField).at(_lastNameFieldIndex),
                  lastNameInput,
                );
              }
              await _fillBaselineValidForm(tester);

              await tester.tap(find.byType(FilledButton));
              await tester.pumpAndSettle();

              expect(
                fake.signupCallCount,
                1,
                reason:
                    'A fully-valid form must invoke '
                    'AuthNotifier.signup exactly once. firstName='
                    '$firstLabel, lastName=$lastLabel.',
              );
              expect(
                fake.capturedFirstName,
                equals(expectedFirst),
                reason:
                    'The screen must trim the first-name field and '
                    'forward null when empty after trim '
                    '(Requirement 2.2). Input: $firstLabel.',
              );
              expect(
                fake.capturedLastName,
                equals(expectedLast),
                reason:
                    'The screen must trim the last-name field and '
                    'forward null when empty after trim '
                    '(Requirement 2.2). Input: $lastLabel.',
              );
              expect(
                fake.capturedEmail,
                equals(_validEmail),
                reason:
                    'The screen must forward the email lower-cased '
                    'and trimmed (Requirement 10.1). The baseline '
                    'fixture is already lower-cased and trimmed so '
                    'the captured value equals the input verbatim.',
              );
              expect(
                fake.capturedPassword,
                equals(_validPassword),
                reason:
                    'The screen must forward the password verbatim '
                    'so any leading or trailing whitespace the user '
                    'intended is preserved.',
              );
              expect(
                fake.capturedAgeVerified,
                isTrue,
                reason:
                    'Submission requires the age-verification '
                    'checkbox to be checked '
                    '(Requirement 10.7); the captured value must '
                    'reflect that.',
              );
            },
          );
        }
      }
    },
  );

  group(
    'Property 11 — email validator rejects every invalid shape '
    '(signup variant)',
    () {
      for (final invalidEmail in _invalidEmailShapes) {
        testWidgets(
          'rejects ${jsonEscape(invalidEmail)} and does not invoke '
          'AuthNotifier.signup',
          (WidgetTester tester) async {
            final fake = _RecordingFakeAuthNotifier();
            final container = _buildContainer(fake);
            addTearDown(container.dispose);

            await _pumpSignupScreen(tester, container);

            // Type the invalid email and known-valid values for
            // every other field so the assertion that follows is
            // unambiguous about *which* validator gated the
            // submission.
            await tester.enterText(
              find.byType(TextFormField).at(_emailFieldIndex),
              invalidEmail,
            );
            await tester.enterText(
              find.byType(TextFormField).at(_passwordFieldIndex),
              _validPassword,
            );
            await tester.enterText(
              find.byType(TextFormField).at(_confirmPasswordFieldIndex),
              _validPassword,
            );
            await tester.tap(find.byType(Checkbox));
            await tester.pumpAndSettle();

            await tester.tap(find.byType(FilledButton));
            await tester.pumpAndSettle();

            expect(
              fake.signupCallCount,
              0,
              reason:
                  'AuthNotifier.signup must NOT be invoked when the '
                  'email validator rejects the input '
                  '(Requirement 10.6). Email shape: '
                  '${jsonEscape(invalidEmail)}.',
            );

            // Exactly one of the two validator branches must have
            // produced a visible inline error. Empty / whitespace-
            // only → "Please enter your email address."; every
            // other invalid shape → "Please enter a valid email
            // address.".
            final emptyShown = find
                .text('Please enter your email address.')
                .evaluate()
                .isNotEmpty;
            final invalidShown = find
                .text('Please enter a valid email address.')
                .evaluate()
                .isNotEmpty;
            expect(
              emptyShown || invalidShown,
              isTrue,
              reason:
                  'Expected one of the email-validator error '
                  'messages to be rendered for input '
                  '${jsonEscape(invalidEmail)} '
                  '(Requirement 10.6).',
            );
          },
        );
      }
    },
  );

  group(
    'Property 12 (length axis) — passwords shorter than 8 are rejected',
    () {
      for (final shortPassword in _shortPasswords) {
        testWidgets(
          'rejects ${jsonEscape(shortPassword)} and does not invoke '
          'AuthNotifier.signup',
          (WidgetTester tester) async {
            final fake = _RecordingFakeAuthNotifier();
            final container = _buildContainer(fake);
            addTearDown(container.dispose);

            await _pumpSignupScreen(tester, container);

            // Set both password and confirm to the same short
            // value. The confirm-password validator's mismatch
            // branch is therefore not exercised — the password-
            // length validator is the only gate under test.
            await tester.enterText(
              find.byType(TextFormField).at(_emailFieldIndex),
              _validEmail,
            );
            await tester.enterText(
              find.byType(TextFormField).at(_passwordFieldIndex),
              shortPassword,
            );
            await tester.enterText(
              find.byType(TextFormField).at(_confirmPasswordFieldIndex),
              shortPassword,
            );
            await tester.tap(find.byType(Checkbox));
            await tester.pumpAndSettle();

            await tester.tap(find.byType(FilledButton));
            await tester.pumpAndSettle();

            expect(
              fake.signupCallCount,
              0,
              reason:
                  'AuthNotifier.signup must NOT be invoked when the '
                  'password-length validator rejects the input '
                  '(Requirement 10.4). Password: '
                  '${jsonEscape(shortPassword)}.',
            );
            expect(
              find.text('Password must be at least 8 characters.'),
              findsOneWidget,
              reason:
                  'Expected the password-length validator error '
                  'message for input ${jsonEscape(shortPassword)} '
                  '(Requirement 10.4).',
            );
          },
        );
      }
    },
  );

  group(
    'Property 12 (mismatch axis) — passwords that do not match are rejected',
    () {
      for (final pair in _mismatchedPasswordPairs) {
        final passwordValue = pair[0];
        final confirmValue = pair[1];
        testWidgets(
          'rejects password=${jsonEscape(passwordValue)} '
          'confirm=${jsonEscape(confirmValue)} and does not invoke '
          'AuthNotifier.signup',
          (WidgetTester tester) async {
            final fake = _RecordingFakeAuthNotifier();
            final container = _buildContainer(fake);
            addTearDown(container.dispose);

            await _pumpSignupScreen(tester, container);

            await tester.enterText(
              find.byType(TextFormField).at(_emailFieldIndex),
              _validEmail,
            );
            await tester.enterText(
              find.byType(TextFormField).at(_passwordFieldIndex),
              passwordValue,
            );
            await tester.enterText(
              find.byType(TextFormField).at(_confirmPasswordFieldIndex),
              confirmValue,
            );
            await tester.tap(find.byType(Checkbox));
            await tester.pumpAndSettle();

            await tester.tap(find.byType(FilledButton));
            await tester.pumpAndSettle();

            expect(
              fake.signupCallCount,
              0,
              reason:
                  'AuthNotifier.signup must NOT be invoked when the '
                  'confirm-password validator rejects the input '
                  '(Requirement 10.5). Password / confirm: '
                  '${jsonEscape(passwordValue)} / '
                  '${jsonEscape(confirmValue)}.',
            );
            expect(
              find.text('Passwords do not match.'),
              findsOneWidget,
              reason:
                  'Expected the confirm-password mismatch error '
                  'message for password / confirm '
                  '${jsonEscape(passwordValue)} / '
                  '${jsonEscape(confirmValue)} '
                  '(Requirement 10.5).',
            );
          },
        );
      }
    },
  );

  group(
    'Requirement 10.7 — unchecked age verification prevents submission',
    () {
      testWidgets(
        'a fully-valid form with the age-verification checkbox '
        'unchecked must not invoke AuthNotifier.signup and must '
        'render the age-verification error message',
        (WidgetTester tester) async {
          final fake = _RecordingFakeAuthNotifier();
          final container = _buildContainer(fake);
          addTearDown(container.dispose);

          await _pumpSignupScreen(tester, container);

          // Fill every field with valid input but deliberately do
          // NOT tap the checkbox.
          await tester.enterText(
            find.byType(TextFormField).at(_emailFieldIndex),
            _validEmail,
          );
          await tester.enterText(
            find.byType(TextFormField).at(_passwordFieldIndex),
            _validPassword,
          );
          await tester.enterText(
            find.byType(TextFormField).at(_confirmPasswordFieldIndex),
            _validPassword,
          );
          await tester.pumpAndSettle();

          await tester.tap(find.byType(FilledButton));
          await tester.pumpAndSettle();

          expect(
            fake.signupCallCount,
            0,
            reason:
                'AuthNotifier.signup must NOT be invoked when the '
                'age-verification checkbox is unchecked '
                '(Requirement 10.7).',
          );
          expect(
            find.text(
              'You must confirm you are at least 13 years old.',
            ),
            findsOneWidget,
            reason:
                'Expected the age-verification validator error '
                'message to render when the checkbox is unchecked '
                '(Requirement 10.7).',
          );
        },
      );
    },
  );

  group(
    'Requirement 10.10 — special_message renders in a SnackBar after '
    'successful signup',
    () {
      testWidgets(
        'when the notifier captures a non-null special_message and '
        'transitions AuthLoading → AuthAuthenticated, a SnackBar with '
        'the message body is mounted by the screen',
        (WidgetTester tester) async {
          const welcome = 'Welcome co-founder!';
          final fake = _SpecialMessageFakeAuthNotifier(
            welcomeMessage: welcome,
            user: _buildTestUser(),
            token: 'test-jwt-token',
          );
          final container = _buildContainer(fake);
          addTearDown(container.dispose);

          await _pumpSignupScreen(tester, container);

          // Fill the form with valid inputs and submit. The fake's
          // `signup` does the AuthUnauthenticated → AuthLoading →
          // AuthAuthenticated cadence the screen listens for; the
          // microtask yield between the two `state =` assignments
          // guarantees Riverpod delivers them as distinct
          // listener notifications.
          await tester.enterText(
            find.byType(TextFormField).at(_emailFieldIndex),
            _validEmail,
          );
          await tester.enterText(
            find.byType(TextFormField).at(_passwordFieldIndex),
            _validPassword,
          );
          await tester.enterText(
            find.byType(TextFormField).at(_confirmPasswordFieldIndex),
            _validPassword,
          );
          await tester.tap(find.byType(Checkbox));
          await tester.pumpAndSettle();

          await tester.tap(find.byType(FilledButton));
          // Pump several frames so the form's `_submit` future
          // settles, then advance long enough for the SnackBar's
          // slide-in animation (250 ms) to complete. Use bare
          // `pump` calls instead of `pumpAndSettle` because the
          // SnackBar's 6-second auto-dismiss timer keeps the
          // binding "unsettled" for the full dismiss duration; by
          // the time `pumpAndSettle` returned, the SnackBar would
          // already have been removed from the tree.
          await tester.pump();
          await tester.pump();
          await tester.pump();
          await tester.pump(const Duration(milliseconds: 500));

          expect(
            fake.signupCallCount,
            1,
            reason:
                'A fully-valid form must invoke '
                'AuthNotifier.signup exactly once before the '
                'welcome banner is rendered.',
          );
          expect(
            find.byType(SnackBar),
            findsOneWidget,
            reason:
                'The screen must mount a SnackBar when the '
                'AuthLoading → AuthAuthenticated transition '
                'carries a captured special_message '
                '(Requirement 10.10).',
          );
          expect(
            find.text(welcome),
            findsOneWidget,
            reason:
                'The SnackBar must render the captured '
                'special_message body verbatim '
                '(Requirement 10.10). Expected: '
                '${jsonEscape(welcome)}.',
          );

          expect(
            find.byType(SnackBar),
            findsOneWidget,
            reason:
                'The screen must mount a SnackBar when the '
                'AuthLoading → AuthAuthenticated transition '
                'carries a captured special_message '
                '(Requirement 10.10).',
          );
          expect(
            find.text(welcome),
            findsOneWidget,
            reason:
                'The SnackBar must render the captured '
                'special_message body verbatim '
                '(Requirement 10.10). Expected: '
                '${jsonEscape(welcome)}.',
          );
        },
      );
    },
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Renders a string with escaped whitespace so per-input test names
/// stay legible in the test runner's output. Strings like `'   '` and
/// `'\t\t'` would otherwise blend with surrounding markup or display
/// as empty. Matches the helper of the same name in
/// `login_screen_test.dart` so both files surface failures with the
/// same formatting convention.
String jsonEscape(String input) {
  final buffer = StringBuffer('"');
  for (final codeUnit in input.codeUnits) {
    switch (codeUnit) {
      case 0x09: // tab
        buffer.write(r'\t');
      case 0x0A: // line feed
        buffer.write(r'\n');
      case 0x0D: // carriage return
        buffer.write(r'\r');
      case 0x22: // "
        buffer.write(r'\"');
      case 0x5C: // \
        buffer.write(r'\\');
      default:
        if (codeUnit >= 0x20 && codeUnit < 0x7F) {
          buffer.writeCharCode(codeUnit);
        } else {
          buffer
            ..write(r'\u')
            ..write(codeUnit.toRadixString(16).padLeft(4, '0'));
        }
    }
  }
  buffer.write('"');
  return buffer.toString();
}
