// Widget tests for `lib/features/auth/presentation/login_screen.dart`.
//
// Validates: Requirements 9.5, 9.7, 9.8, 9.9 of the flutter-port-auth spec.
//
// Property 11 (email validator rejects every invalid shape) and Property 12
// (login-portion: password rejected when empty after trim) are formulated by
// the design as `Glados<String>` properties over curated invalid-shape sets.
// Glados's randomised property runner registers tests through `package:test`'s
// `test(...)` function and cannot drive a [WidgetTester] — `testWidgets` is the
// only way to pump and interact with a Flutter widget under test. Since the
// invalid-shape sets are curated (not randomly generated), exhaustive
// parameterised [testWidgets] over each shape produces identical coverage to
// what a Glados property would sample, so we drive the properties with `for`
// loops over the curated sets and rely on the binding's per-test isolation
// for the "fresh harness" guarantee.
//
// Test seams
// ----------
//
// Both properties and the Requirement 9.5 example test override
// `authNotifierProvider` with a hand-rolled fake that records `login(...)`
// invocations (Property 11/12) or pre-seeds the notifier's resolved
// [AuthState] so the screen renders the inline error region under test
// (Requirement 9.5). The fake extends [AuthNotifier] so it is assignable to
// `AsyncNotifierProvider<AuthNotifier, AuthState>` and so any code path the
// screen exercises that does not call `login(...)` falls back to the parent
// class's contract — but in practice the screen only ever reads the current
// state and (on submit) calls `login`, so the fakes do not need to override
// `signup`, `logout`, or `markSessionExpired`.
//
// The Requirement 9.9 example test does not need a fake at all: it renders
// the screen with a default-state fake and inspects the widget tree for
// the [EditableText] descendant of the password [TextFormField] whose
// `obscureText` flag is `true`.

// External libraries
//
// We deliberately do NOT import `package:glados/glados.dart` here.
// `testWidgets` lives in `package:flutter_test`, which already exports the
// `test`, `group`, and `expect` symbols we need. Adding glados would
// duplicate those exports and force a `hide` directive on the
// `flutter_test` import (matching `auth_notifier_test.dart`'s convention),
// while contributing no widget-test affordances of its own. Importing a
// package without using its symbols is also a `very_good_analysis` lint
// violation. The Property 11 / Property 12 coverage is therefore expressed
// as exhaustive parameterised [testWidgets] over the same curated input
// sets a Glados generator would sample.
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

// Internal modules
import 'package:mobile/features/auth/domain/auth_state.dart';
import 'package:mobile/features/auth/presentation/auth_notifier.dart';
import 'package:mobile/features/auth/presentation/login_screen.dart';

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

/// Fake [AuthNotifier] that records every call to [login] and never
/// performs network I/O or storage I/O.
///
/// `build` resolves to `AuthUnauthenticated(errorMessage: null)` so the
/// screen renders its idle form (no inline error, submit button enabled).
/// `login` is a no-op apart from incrementing [loginCallCount] so the
/// property-test assertions can verify the validator gate held: a rejected
/// form submission must NEVER reach the notifier.
class _RecordingFakeAuthNotifier extends AuthNotifier {
  /// One increment per call to [login]. The property tests assert this
  /// stays at zero when client-side validation rejects the form
  /// (Requirements 9.7, 9.8).
  int loginCallCount = 0;

  @override
  Future<AuthState> build() async => const AuthUnauthenticated();

  @override
  Future<void> login(String email, String password) async {
    loginCallCount++;
  }
}

/// Fake [AuthNotifier] whose `build` resolves to a caller-supplied
/// [AuthState]. Used by the Requirement 9.5 example test to seed the
/// screen with `AuthUnauthenticated(errorMessage:
/// kAuthInvalidCredentialsMessage)` so the inline error region renders
/// under assertion.
class _PreseededFakeAuthNotifier extends AuthNotifier {
  _PreseededFakeAuthNotifier(this._initialState);

  final AuthState _initialState;

  @override
  Future<AuthState> build() async => _initialState;

  @override
  Future<void> login(String email, String password) async {
    // No-op: the example test never submits the form. Keeping a stub
    // here means the fake remains a complete [AuthNotifier] subclass
    // even if a future test variant calls `login`.
  }
}

// ---------------------------------------------------------------------------
// Test harness helpers
// ---------------------------------------------------------------------------

/// Builds a [ProviderContainer] with [authNotifierProvider] overridden to
/// the supplied fake. Caller is responsible for `addTearDown(container
/// .dispose)` so providers do not leak between tests.
ProviderContainer _buildContainer(AuthNotifier notifier) {
  return ProviderContainer(
    overrides: <Override>[
      authNotifierProvider.overrideWith(() => notifier),
    ],
  );
}

/// Pumps the [LoginScreen] inside an [UncontrolledProviderScope] backed by
/// [container] and waits for the notifier's initial `build` future to
/// settle so the rendered state matches the fake's intended starting
/// state.
Future<void> _pumpLoginScreen(
  WidgetTester tester,
  ProviderContainer container,
) async {
  await tester.pumpWidget(
    UncontrolledProviderScope(
      container: container,
      child: const MaterialApp(home: LoginScreen()),
    ),
  );
  await tester.pumpAndSettle();
}

// ---------------------------------------------------------------------------
// Property 11 — invalid email shapes (curated set per the design)
// ---------------------------------------------------------------------------

/// The curated invalid-email shapes Property 11 enumerates.
///
/// Each shape exercises a distinct branch of the validator
/// (`_validateEmail` in `login_screen.dart`):
///
///   * empty / whitespace-only → trimmed-empty branch ("Please enter
///     your email address.")
///   * everything else → regex-mismatch branch ("Please enter a valid
///     email address.")
///
/// Both branches must surface a non-null validator return value, which
/// blocks `_submit` from reaching the notifier (Requirements 9.7, 9.8).
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

// ---------------------------------------------------------------------------
// Property 12 (login portion) — passwords empty after trim
// ---------------------------------------------------------------------------

/// Strings shorter than 1 character after trim. Per Requirement 9.8 the
/// login screen rejects empty / whitespace-only passwords; the notifier
/// is therefore never invoked.
///
/// (The signup-flow companion of Property 12 — passwords shorter than 8
/// characters — lives in `signup_screen_test.dart`. Requirement 9.8 only
/// rejects empty-after-trim passwords on login so legacy short passwords
/// from before the 8-char rule existed can still sign in.)
const List<String> _emptyAfterTrimPasswords = <String>[
  '', // empty
  '   ', // whitespace only (spaces)
  '\t\t', // whitespace only (tabs)
  ' \n ', // whitespace only (mixed)
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  group('Property 11 — email validator rejects every invalid shape', () {
    for (final invalidEmail in _invalidEmailShapes) {
      testWidgets(
        'rejects ${jsonEscape(invalidEmail)} and does not invoke '
        'AuthNotifier.login',
        (WidgetTester tester) async {
          final fake = _RecordingFakeAuthNotifier();
          final container = _buildContainer(fake);
          addTearDown(container.dispose);

          await _pumpLoginScreen(tester, container);

          // Type the invalid email and a known-valid password so the
          // password validator does not fire — we want the assertion
          // that follows to be unambiguous about *which* validator
          // gated the submission.
          await tester.enterText(
            find.byType(TextFormField).at(0),
            invalidEmail,
          );
          await tester.enterText(
            find.byType(TextFormField).at(1),
            'validPassword',
          );
          await tester.pumpAndSettle();

          // Submit. The screen's `_submit` calls `form.validate()`
          // synchronously; if validation fails the awaited
          // `notifier.login(...)` is never reached.
          await tester.tap(find.byType(FilledButton));
          await tester.pumpAndSettle();

          expect(
            fake.loginCallCount,
            0,
            reason:
                'AuthNotifier.login must NOT be invoked when the email '
                'validator rejects the input '
                '(Requirement 9.7). Email shape: '
                '${jsonEscape(invalidEmail)}.',
          );

          // Exactly one of the two validator branches must have
          // produced a visible inline error. The empty / whitespace-
          // only branch returns "Please enter your email address.";
          // every other invalid shape returns "Please enter a valid
          // email address.".
          final emptyMessageHit =
              find.text('Please enter your email address.');
          final invalidMessageHit =
              find.text('Please enter a valid email address.');
          final emptyShown = emptyMessageHit.evaluate().isNotEmpty;
          final invalidShown = invalidMessageHit.evaluate().isNotEmpty;
          expect(
            emptyShown || invalidShown,
            isTrue,
            reason:
                'Expected one of the email-validator error messages to '
                'be rendered for input ${jsonEscape(invalidEmail)} '
                '(Requirement 9.7).',
          );
        },
      );
    }
  });

  group(
    'Property 12 (login portion) — password empty after trim is rejected',
    () {
      for (final invalidPassword in _emptyAfterTrimPasswords) {
        testWidgets(
          'rejects password ${jsonEscape(invalidPassword)} and does not '
          'invoke AuthNotifier.login',
          (WidgetTester tester) async {
            final fake = _RecordingFakeAuthNotifier();
            final container = _buildContainer(fake);
            addTearDown(container.dispose);

            await _pumpLoginScreen(tester, container);

            // Type a known-valid email so the email validator does
            // not fire; the password validator is the only gate
            // under test.
            await tester.enterText(
              find.byType(TextFormField).at(0),
              'valid@example.com',
            );
            await tester.enterText(
              find.byType(TextFormField).at(1),
              invalidPassword,
            );
            await tester.pumpAndSettle();

            await tester.tap(find.byType(FilledButton));
            await tester.pumpAndSettle();

            expect(
              fake.loginCallCount,
              0,
              reason:
                  'AuthNotifier.login must NOT be invoked when the '
                  'password validator rejects the input '
                  '(Requirement 9.8). Password: '
                  '${jsonEscape(invalidPassword)}.',
            );
            expect(
              find.text('Please enter your password.'),
              findsOneWidget,
              reason:
                  'Expected the password-validator error message for '
                  'input ${jsonEscape(invalidPassword)} '
                  '(Requirement 9.8).',
            );
          },
        );
      }
    },
  );

  group(
    'Requirement 9.5 — UnauthorisedException renders the fixed message',
    () {
      testWidgets(
        'when AuthNotifier emits AuthUnauthenticated(errorMessage: '
        'kAuthInvalidCredentialsMessage), the inline error region '
        'renders the literal "Invalid email or password." and never the '
        "backend's raw 401 body",
        (WidgetTester tester) async {
          // The notifier's contract (see `auth_notifier.dart`) maps a
          // raw `UnauthorisedException` from `POST /api/v1/auth/login`
          // to `AuthUnauthenticated(errorMessage:
          // kAuthInvalidCredentialsMessage)` before publishing the
          // state, so by the time the screen reads the value the
          // backend's raw message is already gone. This test verifies
          // the screen's *rendering* contract: given the canonical
          // post-translation state, the literal string is what the
          // user sees.
          final fake = _PreseededFakeAuthNotifier(
            const AuthUnauthenticated(
              errorMessage: kAuthInvalidCredentialsMessage,
            ),
          );
          final container = _buildContainer(fake);
          addTearDown(container.dispose);

          await _pumpLoginScreen(tester, container);

          // Sanity: the literal exposed by the notifier matches the
          // message we expect to find rendered. If the const ever
          // drifts, this guard fails before the rendering assertion
          // and points to the cause.
          expect(
            kAuthInvalidCredentialsMessage,
            equals('Invalid email or password.'),
            reason:
                'The auth notifier exposes the user-facing message '
                'as a public const so the screen and tests reference '
                'the same literal. If this guard fails, audit '
                '`kAuthInvalidCredentialsMessage` in '
                '`auth_notifier.dart`.',
          );

          expect(
            find.text('Invalid email or password.'),
            findsOneWidget,
            reason:
                'The inline error region must render the literal '
                '"Invalid email or password." for the '
                'AuthUnauthenticated(kAuthInvalidCredentialsMessage) '
                'state (Requirement 9.5).',
          );
        },
      );
    },
  );

  group('Requirement 9.9 — password field obscureText is true', () {
    testWidgets(
      'the password TextFormField builds an EditableText whose '
      'obscureText flag is true',
      (WidgetTester tester) async {
        final fake = _RecordingFakeAuthNotifier();
        final container = _buildContainer(fake);
        addTearDown(container.dispose);

        await _pumpLoginScreen(tester, container);

        // [TextFormField] does not expose `obscureText` on its public
        // surface; the flag is forwarded into the inner [TextField]
        // which in turn builds an [EditableText] with the same
        // `obscureText` value. Asserting that exactly one
        // [EditableText] in the tree has `obscureText: true` is
        // therefore the most direct way to verify the contract — the
        // email field builds an [EditableText] with `obscureText:
        // false`, so a `findsOneWidget` cardinality also confirms
        // the email field is not accidentally obscured.
        expect(
          find.byWidgetPredicate(
            (Widget widget) => widget is EditableText && widget.obscureText,
          ),
          findsOneWidget,
          reason:
              'Exactly one EditableText in the LoginScreen tree must '
              'have obscureText: true — the password field '
              '(Requirement 9.9). The email field must not be '
              'obscured.',
        );
      },
    );
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Renders a string with escaped whitespace so the per-input test name
/// is legible in the test runner's output. Strings like `'   '` and
/// `'\t\t'` would otherwise blend with surrounding markup or display as
/// empty.
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
