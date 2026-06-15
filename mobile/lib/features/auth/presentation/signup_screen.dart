// SignupScreen — the user-facing entry point for `POST /api/v1/auth/register`.
//
// The screen's only job is to drive [authNotifierProvider]: collect the
// first-name / last-name / email / password / confirm-password / age-
// verification inputs, run client-side validation, dispatch the request
// through `ref.read(authNotifierProvider.notifier).signup(...)`, and render
// the inline error region for any [AuthUnauthenticated] state the notifier
// surfaces. The screen never throws to the user, never navigates manually
// on success (the foundation router's redirect rule moves the user from
// `/auth/signup` to `/` once `authStateProvider` flips to `true`), and
// never reads from the foundation's `authStateProvider` — feature-internal
// consumption goes through [authNotifierProvider] per Requirement 7.7.
//
// Implementation notes:
//
//   * The widget is a `ConsumerStatefulWidget` so the
//     [TextEditingController]s, the [GlobalKey<FormState>], and the
//     age-verification boolean survive rebuilds. A `ConsumerWidget`
//     would leak controllers on every rebuild because they would be
//     re-created in `build()`.
//   * Validation rules per Requirement 10:
//       - Email: regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` after trim (10.6).
//       - Password: at least 8 characters (10.4).
//       - Confirm-password: must match password exactly (10.5).
//       - Age verification: checkbox must be checked (10.7).
//     First and last names are optional (Requirement 2.2 — they are
//     forwarded to the backend only when their trimmed value is
//     non-empty, a rule the [AuthRepository] already enforces).
//   * Both password fields use `obscureText: true` so the password is
//     hidden by default.
//   * Inline error rendering reads from `AuthUnauthenticated.errorMessage`.
//     The notifier already maps each [ApiException] subtype to a
//     user-facing message. The retry affordance (Requirement 10.9) is
//     shown when the message matches the network or server failure
//     category strings. Password fields are cleared only when the
//     failure is a backend-driven rejection ([ValidationException] or
//     the rare [UnauthorisedException]) — Requirement 10.8 — so a
//     transient network failure does not force the user to retype
//     their password just to retry the submission.
//   * On success with a non-null `special_message` (Requirement 10.10),
//     the screen surfaces the message in a non-blocking `SnackBar` via
//     the root `ScaffoldMessenger` (which `MaterialApp.router` mounts
//     above the router so messages persist across the synchronous
//     `/auth/signup` → `/` redirect that the foundation router runs
//     immediately after `authStateProvider` flips to `true`). The
//     value is read once via `notifier.lastSpecialMessage` and then
//     consumed via `notifier.consumeLastSpecialMessage()` so a later
//     signup without a `special_message` does not re-render a stale
//     banner.
//   * Every colour is sourced from `Theme.of(context).colorScheme`. No
//     `Color(` literal appears in this file (architecture lint
//     R-8.4 / Requirement 1.7).
//   * No `package:dio` import (architecture lint R-4.8 / Requirement 1.6).
//   * No `FutureBuilder` (architecture lint R-3.6 / Requirement 1.6).
//
// See `flutter-port-auth` Requirements 1.4, 1.7, 10.1, 10.2, 10.3,
// 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10.

// External libraries
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

// Internal modules
import 'package:mobile/core/router/routes.dart';
import 'package:mobile/features/auth/domain/auth_state.dart';
import 'package:mobile/features/auth/presentation/auth_notifier.dart';

/// Email validation regex from `flutter-port-auth` Requirement 10.6
/// (identical wording to Requirement 9.7's login-side rule).
///
/// Declared at file scope so both the validator and the property tests
/// (Property 11) reference the same expression. Compiled once.
final RegExp _signupEmailRegExp = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

/// Minimum password length for new accounts (Requirement 10.4).
const int _minimumPasswordLength = 8;

/// Sign-up screen at `/auth/signup`.
///
/// Stateful so the [TextEditingController]s, the [GlobalKey<FormState>],
/// and the age-verification boolean persist across rebuilds (a stateless
/// `ConsumerWidget` would re-create them every frame).
class SignupScreen extends ConsumerStatefulWidget {
  /// Creates a sign-up screen.
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  /// Current value of the age-verification checkbox. Stored on the
  /// state object rather than inferred from a `FormFieldState<bool>`
  /// so the rest of the form can read it synchronously without
  /// asking the form-field for its current value.
  bool _ageVerified = false;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  /// Validates the email field per Requirement 10.6.
  ///
  /// Trims the input first; rejects empty or whitespace-only strings;
  /// rejects anything that does not match [_signupEmailRegExp].
  /// Returns `null` on success.
  String? _validateEmail(String? value) {
    final trimmed = (value ?? '').trim();
    if (trimmed.isEmpty) {
      return 'Please enter your email address.';
    }
    if (!_signupEmailRegExp.hasMatch(trimmed)) {
      return 'Please enter a valid email address.';
    }
    return null;
  }

  /// Validates the password field per Requirement 10.4.
  ///
  /// Rejects empty inputs and inputs shorter than
  /// [_minimumPasswordLength] characters. The check is on the raw
  /// length — leading or trailing whitespace counts toward the
  /// length, since the password is forwarded to the backend
  /// verbatim (not trimmed).
  String? _validatePassword(String? value) {
    final raw = value ?? '';
    if (raw.isEmpty) {
      return 'Please enter a password.';
    }
    if (raw.length < _minimumPasswordLength) {
      return 'Password must be at least $_minimumPasswordLength characters.';
    }
    return null;
  }

  /// Validates the confirm-password field per Requirement 10.5.
  ///
  /// Rejects empty inputs and inputs that do not match the password
  /// field's current value exactly.
  String? _validateConfirmPassword(String? value) {
    final raw = value ?? '';
    if (raw.isEmpty) {
      return 'Please re-enter your password.';
    }
    if (raw != _passwordController.text) {
      return 'Passwords do not match.';
    }
    return null;
  }

  /// Validates the age-verification checkbox per Requirement 10.7.
  ///
  /// The [FormField] surface lets us reuse the same
  /// `Form.validate()` call site that drives the text fields, so
  /// the checkbox participates in the same submission gate.
  String? _validateAgeVerification(bool? value) {
    if (value != true) {
      return 'You must confirm you are at least 13 years old.';
    }
    return null;
  }

  /// Validates the form and dispatches the signup through
  /// [AuthNotifier.signup]. Never throws.
  ///
  /// Per Requirement 10.1, the email is trimmed and lower-cased
  /// before being handed to the notifier; the first and last names
  /// are trimmed and forwarded as `null` when empty after trimming
  /// (the `AuthRepository` additionally enforces this rule, but
  /// applying it here keeps the wire shape identical regardless of
  /// any future repository refactor); the password is forwarded
  /// as-is so any leading or trailing whitespace the user actually
  /// intended to include is preserved.
  Future<void> _submit() async {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) {
      return;
    }
    final email = _emailController.text.trim().toLowerCase();
    final password = _passwordController.text;
    final firstName = _trimToNull(_firstNameController.text);
    final lastName = _trimToNull(_lastNameController.text);
    await ref.read(authNotifierProvider.notifier).signup(
          email: email,
          password: password,
          ageVerified: _ageVerified,
          firstName: firstName,
          lastName: lastName,
        );
  }

  /// Returns `null` when [value] is empty after trimming, otherwise
  /// returns the trimmed value. Mirrors the same rule the
  /// `AuthRepository` applies to the optional `first_name` and
  /// `last_name` request fields (Requirement 2.2).
  String? _trimToNull(String value) {
    final trimmed = value.trim();
    if (trimmed.isEmpty) return null;
    return trimmed;
  }

  /// Extracts the user-facing error message from the current auth
  /// state.
  ///
  /// Returns `null` while the notifier is loading, while it is in
  /// [AuthAuthenticated], or when [AuthUnauthenticated.errorMessage] is
  /// itself `null` (the clean-logout / no-persisted-JWT path).
  String? _extractErrorMessage(AsyncValue<AuthState> state) {
    final value = state.valueOrNull;
    if (value is AuthUnauthenticated) {
      return value.errorMessage;
    }
    return null;
  }

  /// True when the current error message indicates a transient
  /// transport / server failure, as opposed to a backend-driven
  /// rejection. Used to (a) decide whether to render the retry
  /// affordance (Requirement 10.9) and (b) decide whether to clear
  /// the password fields (Requirement 10.8) — passwords are cleared
  /// only when the backend explicitly rejected the request.
  bool _isTransientFailureMessage(String message) {
    return message == kAuthNetworkFailureMessage ||
        message == kAuthServerFailureMessage;
  }

  /// True when the notifier is mid-flight (initial session restore
  /// or a signup currently in progress).
  ///
  /// Both `AsyncValue.isLoading` (the moment between provider
  /// creation and the first `state =` assignment in `build()`) and
  /// the explicit [AuthLoading] sentinel (every transition the
  /// notifier makes via `state = AsyncData(AuthLoading())`) count as
  /// loading so the UI renders the same indicator regardless of
  /// which mechanism is currently in effect.
  bool _isLoading(AsyncValue<AuthState> state) {
    if (state.isLoading) return true;
    return state.valueOrNull is AuthLoading;
  }

  /// Reacts to auth-state transitions emitted by the notifier.
  ///
  /// Two side-effects are owned by this listener:
  ///
  ///   1. Welcome banner (Requirement 10.10). On the
  ///      `AuthLoading → AuthAuthenticated` transition (i.e. signup
  ///      succeeded), if the notifier has captured a non-null
  ///      `special_message`, surface it as a non-blocking
  ///      [SnackBar]. The root [ScaffoldMessenger] mounted by
  ///      [MaterialApp.router] is shared across routes so the
  ///      banner persists past the synchronous `/auth/signup` → `/`
  ///      redirect the foundation router triggers when
  ///      `authStateProvider` flips. The captured value is consumed
  ///      after queueing the snack-bar so a subsequent signup
  ///      without a `special_message` does not re-render a stale
  ///      banner.
  ///
  ///   2. Password clearing (Requirement 10.8). On the
  ///      `AuthLoading → AuthUnauthenticated(errorMessage: <non-null,
  ///      non-transient>)` transition, clear both password fields so
  ///      the user is forced to retype them. Transient failures
  ///      (`NetworkException`, `ServerException`) leave the password
  ///      fields intact so the retry affordance can re-submit the
  ///      form without forcing the user to retype anything.
  void _handleAuthStateTransition(
    AsyncValue<AuthState>? previous,
    AsyncValue<AuthState> next,
  ) {
    final previousValue = previous?.valueOrNull;
    final nextValue = next.valueOrNull;

    if (previousValue is AuthLoading && nextValue is AuthAuthenticated) {
      final notifier = ref.read(authNotifierProvider.notifier);
      final specialMessage = notifier.lastSpecialMessage;
      if (specialMessage != null && specialMessage.isNotEmpty) {
        final messenger = ScaffoldMessenger.maybeOf(context);
        if (messenger != null) {
          final colorScheme = Theme.of(context).colorScheme;
          messenger
            ..clearSnackBars()
            ..showSnackBar(
              SnackBar(
                content: Text(specialMessage),
                duration: const Duration(seconds: 6),
                backgroundColor: colorScheme.primaryContainer,
                behavior: SnackBarBehavior.floating,
              ),
            );
        }
        notifier.consumeLastSpecialMessage();
      }
      return;
    }

    if (previousValue is AuthLoading && nextValue is AuthUnauthenticated) {
      final message = nextValue.errorMessage;
      if (message != null && !_isTransientFailureMessage(message)) {
        _passwordController.clear();
        _confirmPasswordController.clear();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Register the auth-state listener on every build. Riverpod's
    // `ConsumerStatefulWidget` closes and clears all `ref.listen`
    // subscriptions at the start of each build, so a guarded
    // "register once" pattern silently disables the listener after
    // the first state change. The listener itself is idempotent
    // (it operates on the previous → next transition delivered by
    // Riverpod, not on accumulated state), so re-registering on
    // every build is the correct cadence.
    ref.listen<AsyncValue<AuthState>>(
      authNotifierProvider,
      _handleAuthStateTransition,
    );

    final authState = ref.watch(authNotifierProvider);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final loading = _isLoading(authState);
    final errorMessage = _extractErrorMessage(authState);
    final showRetry =
        errorMessage != null && _isTransientFailureMessage(errorMessage);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create account'),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Form(
                key: _formKey,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    Text(
                      'Welcome to Cook Smart',
                      style: theme.textTheme.headlineMedium,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    TextFormField(
                      controller: _firstNameController,
                      enabled: !loading,
                      keyboardType: TextInputType.name,
                      textInputAction: TextInputAction.next,
                      autofillHints: const <String>[AutofillHints.givenName],
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(
                        labelText: 'First name (optional)',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _lastNameController,
                      enabled: !loading,
                      keyboardType: TextInputType.name,
                      textInputAction: TextInputAction.next,
                      autofillHints: const <String>[AutofillHints.familyName],
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(
                        labelText: 'Last name (optional)',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _emailController,
                      enabled: !loading,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      autofillHints: const <String>[
                        AutofillHints.username,
                        AutofillHints.email,
                      ],
                      autocorrect: false,
                      validator: _validateEmail,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _passwordController,
                      enabled: !loading,
                      obscureText: true,
                      textInputAction: TextInputAction.next,
                      autofillHints: const <String>[
                        AutofillHints.newPassword,
                      ],
                      autocorrect: false,
                      enableSuggestions: false,
                      validator: _validatePassword,
                      decoration: const InputDecoration(
                        labelText: 'Password',
                        helperText:
                            'At least $_minimumPasswordLength characters.',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _confirmPasswordController,
                      enabled: !loading,
                      obscureText: true,
                      textInputAction: TextInputAction.done,
                      autofillHints: const <String>[
                        AutofillHints.newPassword,
                      ],
                      autocorrect: false,
                      enableSuggestions: false,
                      validator: _validateConfirmPassword,
                      onFieldSubmitted: (_) {
                        if (!loading) _submit();
                      },
                      decoration: const InputDecoration(
                        labelText: 'Confirm password',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    FormField<bool>(
                      initialValue: _ageVerified,
                      validator: _validateAgeVerification,
                      builder: (FormFieldState<bool> field) {
                        final hasError = field.hasError;
                        final errorColor = colorScheme.error;
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            InkWell(
                              onTap: loading
                                  ? null
                                  : () {
                                      final next = !_ageVerified;
                                      setState(() {
                                        _ageVerified = next;
                                      });
                                      field.didChange(next);
                                    },
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 4,
                                ),
                                child: Row(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: <Widget>[
                                    Checkbox(
                                      value: _ageVerified,
                                      onChanged: loading
                                          ? null
                                          : (bool? next) {
                                              final value = next ?? false;
                                              setState(() {
                                                _ageVerified = value;
                                              });
                                              field.didChange(value);
                                            },
                                    ),
                                    Expanded(
                                      child: Padding(
                                        padding: const EdgeInsets.only(
                                          top: 12,
                                        ),
                                        child: Text(
                                          'I confirm I am at least 13 '
                                          'years old.',
                                          style: theme.textTheme.bodyMedium,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            if (hasError)
                              Padding(
                                padding: const EdgeInsets.only(
                                  left: 12,
                                  top: 4,
                                ),
                                child: Text(
                                  field.errorText ?? '',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: errorColor,
                                  ),
                                ),
                              ),
                          ],
                        );
                      },
                    ),
                    if (errorMessage != null) ...<Widget>[
                      const SizedBox(height: 16),
                      _SignupInlineError(
                        message: errorMessage,
                        showRetry: showRetry && !loading,
                        onRetry: _submit,
                        backgroundColor: colorScheme.errorContainer,
                        foregroundColor: colorScheme.onErrorContainer,
                      ),
                    ],
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: loading ? null : _submit,
                      child: loading
                          ? SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: colorScheme.onPrimary,
                              ),
                            )
                          : const Text('Create account'),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: loading
                          ? null
                          : () => context.go(Routes.loginPath),
                      child: const Text('I already have an account'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Inline error region rendered beneath the form fields.
///
/// Renders the [message] in a tinted container sourced from the active
/// [ColorScheme]; appends a retry button when [showRetry] is `true`.
/// Stateless — rebuilds whenever the parent rebuilds.
class _SignupInlineError extends StatelessWidget {
  const _SignupInlineError({
    required this.message,
    required this.showRetry,
    required this.onRetry,
    required this.backgroundColor,
    required this.foregroundColor,
  });

  final String message;
  final bool showRetry;
  final VoidCallback onRetry;
  final Color backgroundColor;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: const BorderRadius.all(Radius.circular(8)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Text(
            message,
            style: textTheme.bodyMedium?.copyWith(color: foregroundColor),
          ),
          if (showRetry) ...<Widget>[
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: onRetry,
                style: TextButton.styleFrom(
                  foregroundColor: foregroundColor,
                ),
                child: const Text('Retry'),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
