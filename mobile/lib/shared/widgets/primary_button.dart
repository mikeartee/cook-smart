import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colours.dart';

/// Brand-styled primary call-to-action button.
///
/// Wraps Material 3's [ElevatedButton] and pins its background and
/// foreground to the brand tokens declared in [AppColours] so every primary
/// CTA across the app stays visually consistent without relitigating colour
/// choices in feature code.
///
/// References:
/// - Requirement 2.3: shared widgets used by two or more features live under
///   `mobile/lib/shared/`.
/// - Requirement 8.2: primary brand colour and on-primary text colour are
///   sourced from `AppColours` rather than ad-hoc `Color(...)` literals.
/// - Requirement 8.5: the brand identity primary colour value is reused
///   from the Legacy_RN_App via `AppColours.primary`.
class PrimaryButton extends StatelessWidget {
  /// Creates a [PrimaryButton].
  ///
  /// [onPressed] may be `null` to render the button in its disabled state.
  /// [child] is the foreground content of the button (typically a [Text]).
  const PrimaryButton({
    required this.onPressed,
    required this.child,
    super.key,
  });

  /// Callback invoked when the user taps the button. When `null`, the
  /// button is rendered in its disabled state.
  final VoidCallback? onPressed;

  /// Foreground content rendered inside the button.
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColours.primary,
        foregroundColor: AppColours.onPrimary,
        disabledBackgroundColor: AppColours.primary.withValues(alpha: 0.5),
        disabledForegroundColor: AppColours.onPrimary.withValues(alpha: 0.7),
        minimumSize: const Size.fromHeight(48),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(8)),
        ),
      ),
      child: child,
    );
  }
}
