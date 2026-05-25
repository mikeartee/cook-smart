import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Extensions on [AsyncValue] that surface the retained-previous-data pattern
/// committed by the architecture spec.
///
/// Riverpod's [AsyncValue] retains the last successful value across both
/// loading and error states (via its internal `copyWithPrevious` mechanism).
/// The standard `AsyncValue.when` surface, however, only forwards that
/// retained value to the `data` callback — `loading` and `error` get nothing.
/// That makes it awkward to satisfy Requirement 3.9, which says the UI must
/// preserve the previous successful data value so the user can retry without
/// losing prior context.
///
/// [whenWithRetainedData] is the helper every async-consuming
/// widget under `mobile/lib/features/` is expected to use. It enforces the
/// non-null callback rule from Requirement 3.5 (every state is rendered) and
/// the retain-prior-context rule from Requirement 3.9 (loading and error
/// callbacks receive the last successful value, or `null` if none has been
/// observed yet).
extension AsyncValueX<T> on AsyncValue<T> {
  /// Branches on the current [AsyncValue] state, exposing the previously
  /// successful value to the loading and error branches.
  ///
  /// All three callbacks are required, so every [AsyncValue] state is
  /// guaranteed to render some UI. This satisfies Requirement 3.5.
  ///
  /// Branch selection:
  ///
  /// - [error] is invoked whenever an error is present, even if a refresh is
  ///   simultaneously in flight. Rendering the error UI takes priority over
  ///   rendering a spinner so users see the failure within 100 ms of it being
  ///   emitted (Requirement 3.9). `previousData` is the last successful value
  ///   if one was retained (e.g. a cached recipe list), else `null`.
  /// - [loading] is invoked while the value is loading or refreshing without
  ///   an active error. `previousData` is the last successful value if one
  ///   was retained, else `null`. Consumers can keep prior content visible
  ///   alongside a progress indicator instead of blanking the screen.
  /// - [data] is invoked when the value is fully resolved with no in-flight
  ///   load or error. The current value is passed as a non-nullable `T`.
  ///
  /// The generic [Result] type is the widget or value produced by each
  /// branch. It is most commonly inferred as `Widget`.
  Result whenWithRetainedData<Result>({
    required Result Function(T data) data,
    required Result Function(T? previousData) loading,
    required Result Function(
      Object error,
      StackTrace stackTrace,
      T? previousData,
    ) error,
  }) {
    if (hasError) {
      return error(
        this.error!,
        stackTrace ?? StackTrace.empty,
        valueOrNull,
      );
    }
    if (isLoading) {
      return loading(valueOrNull);
    }
    return data(requireValue);
  }
}
