// LoginScreen — the user-facing entry point for `POST /api/v1/auth/login`.
//
// The screen's only job is to drive [authNotifierProvider]: collect the
// email/password pair, run client-side validation, dispatch the request
// through `ref.read(authNotifierProvider.notifier).login(...)`, and render
// the inline error region for any [AuthUnauthenticated] state the notifier
// surfaces. The screen never throws to the user, never navigates manually
// on success (the foundation router's redirect rule moves the user from
// `/auth/login` to `/` once `authStateProvider` flips to `true`), and
// never reads from the foundation's `authStateProvider` — feature-internal
// consumption goes through [authNotifierProvider] per Requirement 7.7.
//
// Implementation notes:
//
//   * The widget is a `ConsumerStatefulWidget` so the
//     [TextEditingController]s and [GlobalKey<FormState>] survive
//     rebuilds. A `ConsumerWidget` would leak controllers on every
//     rebuild because they would be re-created in `build()`.
//   * The password field uses `obscureText: true` so the password is
//     hidden by default (Requirement 9.9).
//   * Email validation uses the regular expression mandated by the
//     spec: `^[^\s@]+@[^\s@]+\.[^\s@]+$` after trimming
//     (Requirement 9.7). Password validation rejects empty/whitespace-
//     only inputs (Requirement 9.8).
//   * Inline error rendering reads from `AuthUnauthenticated.errorMessage`.
//     The notifier already maps `UnauthorisedException` to the literal
//     `'Invalid email or password.'` string mandated by Requirement
//     9.5, so the screen does not have to special-case the 401 path —
//     it just renders the message it is given. The retry affordance
//     (Requirement 9.6) is shown when the message matches one of the
//     two failure-category descriptions the notifier emits for
//     `NetworkException` or `ServerException`.
//   * Every colour is sourced from `Theme.of(context).colorScheme`. No
//     `Color(` literal appears in this file (architecture lint
//     R-8.4 / Requirement 1.7).
//   * No `package:dio` import (architecture lint R-4.8 / Requirement 1.6).
//   * No `FutureBuilder` (architecture lint R-3.6 / Requirement 1.6).
//
// See `flutter-port-auth` Requirements 1.4, 1.7, 9.1, 9.2, 9.3, 9.4,
// 9.5, 9.6, 9.7, 9.8, 9.9.

// External libraries
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

// Internal modules
import 'package:mobile/core/router/routes.dart';
import 'package:mobile/features/auth/domain/auth_state.dart';
import 'package:mobile/features/auth/presentation/auth_notifier.dart';

// ---------------------------------------------------------------------------
// Failure-category sentinels.
//
// These mirror the user-facing strings emitted by [AuthNotifier] for the
// `NetworkException` and `ServerException` paths. They are duplicated here
// (rather than imported) because [AuthNotifier]'s constants are private to
// that file by design — the notifier owns the wording, and the screen owns
// the rendering decision. If the notifier's wording changes, this file's
// string-equality checks fall back to "no retry button", which is a safe
// degradation: the user can still resubmit by editing a field.
// ---------------------------------------------------------------------------

const String _networkFailureMessage =
    'Could not reach the server. Check your connection and try again.';

const String _serverFailureMessage =
    'The server is having trouble. Please try again shortly.';

/// Email validation regex from `flutter-port-auth` Requirement 9.7.
///
/// Declared at file scope so both the validator and the property tests
/// (Property 11) reference the same expression. Compiled once.
final RegExp _emailRegExp = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

/// Sign-in screen at `/auth/login`.
///
/// Stateful so the [TextEditingController]s and [GlobalKey<FormState>]
/// persist across rebuilds (a stateless `ConsumerWidget` would re-create
/// them every frame).
class LoginScreen extends ConsumerStatefulWidget {
  /// Creates a sign-in screen.
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  /// Validates the email field per Requirement 9.7.
  ///
  /// Trims the input first; rejects empty or whitespace-only strings;
  /// rejects anything that does not match [_emailRegExp]. Returns
  /// `null` on success.
  String? _validateEmail(String? value) {
    final trimmed = (value ?? '').trim();
    if (trimmed.isEmpty) {
      return 'Please enter your email address.';
    }
    if (!_emailRegExp.hasMatch(trimmed)) {
      return 'Please enter a valid email address.';
    }
    return null;
  }

  /// Validates the password field per Requirement 9.8.
  ///
  /// Rejects empty or whitespace-only inputs. Does not enforce a
  /// minimum length on login — that rule applies only to signup
  /// (Requirement 10.4) so a user with a legacy short password from
  /// before the rule existed can still sign in.
  String? _validatePassword(String? value) {
    final trimmed = (value ?? '').trim();
    if (trimmed.isEmpty) {
      return 'Please enter your password.';
    }
    return null;
  }

  /// Validates the form and dispatches the login through
  /// [AuthNotifier.login]. Never throws.
  ///
  /// Per Requirement 9.1, the email is trimmed and lower-cased before
  /// being handed to the notifier; the password is forwarded as-is so
  /// any leading or trailing whitespace the user actually intended to
  /// include is preserved.
  Future<void> _submit() async {
    final form = _formKey.currentState;
    if (form == null || !form.validate()) {
      return;
    }
    final email = _emailController.text.trim().toLowerCase();
    final password = _passwordController.text;
    await ref.read(authNotifierProvider.notifier).login(email, password);
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

  /// True when the notifier is mid-flight (initial session restore or a
  /// login currently in progress).
  ///
  /// Both `AsyncValue.isLoading` (the moment between provider creation
  /// and the first `state =` assignment in `build()`) and the explicit
  /// [AuthLoading] sentinel (every transition the notifier makes via
  /// `state = AsyncData(AuthLoading())`) count as loading so the UI
  /// renders the same indicator regardless of which mechanism is
  /// currently in effect.
  bool _isLoading(AsyncValue<AuthState> state) {
    if (state.isLoading) return true;
    return state.valueOrNull is AuthLoading;
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final loading = _isLoading(authState);
    final errorMessage = _extractErrorMessage(authState);
    final showRetry = errorMessage != null &&
        (errorMessage == _networkFailureMessage ||
            errorMessage == _serverFailureMessage);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sign in'),
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
                      'Welcome back',
                      style: theme.textTheme.headlineMedium,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
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
                      textInputAction: TextInputAction.done,
                      autofillHints: const <String>[
                        AutofillHints.password,
                      ],
                      autocorrect: false,
                      enableSuggestions: false,
                      validator: _validatePassword,
                      onFieldSubmitted: (_) {
                        if (!loading) _submit();
                      },
                      decoration: const InputDecoration(
                        labelText: 'Password',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    if (errorMessage != null) ...<Widget>[
                      const SizedBox(height: 16),
                      _InlineError(
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
                          : const Text('Sign in'),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: loading
                          ? null
                          : () => context.go(Routes.signupPath),
                      child: const Text('Create an account'),
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
/// Renders the [message] in a tinted container sourced from the
/// active [ColorScheme]; appends a retry button when [showRetry] is
/// true. Stateless — rebuilds whenever the parent rebuilds.
class _InlineError extends StatelessWidget {
  const _InlineError({
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
