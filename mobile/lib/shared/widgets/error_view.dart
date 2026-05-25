import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colours.dart';
import 'package:mobile/shared/widgets/primary_button.dart';

/// Standard error state for screens consuming an asynchronous Riverpod
/// provider.
///
/// Renders an error icon tinted with [AppColours.error], the supplied
/// [message], and a retry [PrimaryButton] that invokes [onRetry]. Pairs with
/// `AsyncValueX.whenWithRetainedData` so feature widgets can present a
/// consistent error surface across the app while preserving any previously
/// successful data behind the error.
///
/// References:
/// - Requirement 2.3: cross-feature widgets live under `mobile/lib/shared/`.
/// - Requirement 3.9: an error UI is rendered when an async provider emits
///   an error; this widget is the canonical surface for that UI.
/// - Requirement 8.2: the error accent is sourced from `AppColours.error`
///   rather than an ad-hoc `Color(...)` literal.
class ErrorView extends StatelessWidget {
  /// Creates an [ErrorView].
  ///
  /// [message] is the human-readable description shown to the user.
  /// [onRetry] is invoked when the user taps the retry button.
  const ErrorView({
    required this.message,
    required this.onRetry,
    super.key,
  });

  /// Human-readable description of the error shown to the user.
  final String message;

  /// Callback invoked when the user taps the retry button.
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Icon(
              Icons.error_outline,
              color: AppColours.error,
              size: 48,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            PrimaryButton(
              onPressed: onRetry,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
