import 'package:flutter/material.dart';
import 'package:mobile/core/theme/app_colours.dart';
import 'package:shimmer/shimmer.dart';

/// Shimmering placeholder block rendered while an asynchronous provider is
/// loading.
///
/// Uses `package:shimmer` to animate a gradient sweep over a rectangular
/// block sized by [width] and [height] and rounded by [borderRadius]. Both
/// the base and highlight colours come from [AppColours] so the skeleton
/// stays on-brand and the architectural lint banning ad-hoc `Color(...)`
/// literals (Requirement 8.4) is satisfied.
///
/// References:
/// - Requirement 2.3: cross-feature widgets live under `mobile/lib/shared/`.
/// - Requirement 3.9: a loading UI is rendered when an async provider is in
///   the loading state; this widget is the canonical surface for that UI.
/// - Requirement 8.2: shimmer base and highlight tones are sourced from
///   `AppColours` tokens rather than ad-hoc `Color(...)` literals.
/// - Requirement 10.7: relies on the pinned `shimmer ^3.0.0` dependency.
class LoadingSkeleton extends StatelessWidget {
  /// Creates a [LoadingSkeleton].
  ///
  /// All parameters have sensible defaults so callers can render a
  /// full-width single-line skeleton without supplying any arguments:
  ///
  /// ```dart
  /// const LoadingSkeleton()
  /// ```
  const LoadingSkeleton({
    this.width = double.infinity,
    this.height = 16,
    this.borderRadius = const BorderRadius.all(Radius.circular(8)),
    super.key,
  });

  /// Width of the skeleton block. Defaults to [double.infinity] so the
  /// skeleton fills its parent's cross-axis extent.
  final double width;

  /// Height of the skeleton block. Defaults to a single line of body text.
  final double height;

  /// Corner rounding applied to the skeleton block.
  final BorderRadius borderRadius;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColours.background,
      highlightColor: AppColours.surface,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColours.surface,
          borderRadius: borderRadius,
        ),
      ),
    );
  }
}
