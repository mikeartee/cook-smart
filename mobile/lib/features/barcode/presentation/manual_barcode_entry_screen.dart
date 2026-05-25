// ManualBarcodeEntryScreen — the keyboard-driven fallback path for the
// barcode-scan-to-pantry flow.
//
// The screen lets the user type an 8-to-13 digit barcode by hand and
// dispatch it through the same [BarcodeNotifier] entry point the
// camera path uses (`submitBarcode`), so a single Scan_Session
// surface backs both ports and only `ScannedProductConfirmationScreen`
// has to know how to render the resolved [ScannedProduct].
//
// Per task 6.3 of `flutter-port-barcode/tasks.md` the screen is
// reached from three places:
//
//   * The `BarcodeScannerScreen`'s "Manual Entry" button
//     (Requirement 9.10).
//   * The `BarcodeScannerScreen`'s permission-denied affordance when
//     `Camera_Permission_State == permanentlyDenied` (Requirement 2.5).
//   * The "Use Manual Entry" primary CTA when
//     `Camera_Permission_State == unavailable` (Requirement 11.3 /
//     10.7); in this entry path the route extra carries
//     `cameraUnavailable: true` so the screen renders the
//     informational note above the input field.
//
// Responsibilities
// ----------------
//
//   * Render a single digit-only [TextField] with `keyboardType:
//     TextInputType.number`, `maxLength: 13`, and the
//     `FilteringTextInputFormatter.digitsOnly` formatter so non-digit
//     characters are silently dropped at insertion (Requirement
//     10.1).
//   * Render a `"Lookup Product"` submit button that is disabled
//     while the input is empty or while
//     `Scan_State == ScanLookingUp`, with a small adjacent
//     [CircularProgressIndicator] while the lookup is in flight
//     (Requirement 10.2).
//   * Render an informational note above the input when the screen
//     was reached because the camera is unavailable (Requirement
//     10.7).
//   * Render an inline error region above the input field for:
//     - regex failures (Requirements 3.4, 10.3) with the literal
//       `"Barcode must be 8 to 13 digits"`,
//     - `ScanProductNotFound` after a manual submit (Requirement
//       10.5) with the literal `"Product not found in the Open
//       Food Facts database. Try a different barcode or add the
//       ingredient by hand from the pantry screen."`, and
//     - `ScanFailed(reason: network | server)` from the lookup
//       path (Requirement 10.6) with the notifier's description
//       string. The error region clears on every input change and
//       on every fresh submit attempt.
//   * On submit, call
//     `ref.read(barcodeNotifierProvider.notifier).submitBarcode(...)`
//     so the camera and manual-entry paths share a single code
//     path (Requirement 10.5). The screen does **not** push the
//     `ScannedProductConfirmationScreen` itself — the scanner
//     screen does, in response to `ScanProductFound`.
//
// Architecture lints (Requirement 1.5, 1.6, 1.7)
// ----------------------------------------------
//
//   * No `Color(` literal — every colour resolves to a token in
//     `lib/core/theme/app_colours.dart` or to the active
//     [ThemeData].
//   * No `FutureBuilder` — every async branch reads `Scan_State`
//     via `ref.watch(barcodeNotifierProvider)` and pattern-matches
//     on the resolved [ScanState] inside a synchronous `build`.
//   * No `Dio(` or `GoRouter(` construction.
//   * No import from `mobile/lib/features/auth/...`.
//
// See `flutter-port-barcode` Requirements 1.5, 1.7, 3.4, 3.6, 9.12,
// 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7.

// External libraries
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Internal modules
import 'package:mobile/core/theme/app_colours.dart';
import 'package:mobile/features/barcode/domain/scan_state.dart';
import 'package:mobile/features/barcode/presentation/barcode_notifier.dart';

// ---------------------------------------------------------------------------
// Static user-facing strings.
//
// Centralising the literals here keeps the widget tree concise and lets the
// screen-level widget tests assert against single named constants rather
// than re-typing the strings each time. The exact wording is pinned by
// Requirements 10.1, 10.2, 10.3, 10.5, 10.6, 10.7.
// ---------------------------------------------------------------------------

/// Maximum digits allowed in a barcode (EAN-13). Pinned by Requirement 3.1
/// (`^[0-9]{8,13}$`).
const int _kMaxBarcodeDigits = 13;

/// Minimum digits allowed in a barcode (EAN-8). Pinned by Requirement 3.1.
const int _kMinBarcodeDigits = 8;

/// Label rendered inside the [TextField] decoration per Requirement 10.1.
const String _kInputLabel = 'Enter Barcode';

/// Submit-button label per Requirement 10.2.
const String _kSubmitButtonLabel = 'Lookup Product';

/// Inline error message rendered when the user submits a string outside
/// the `^[0-9]{8,13}$` range per Requirements 3.4, 10.3.
const String _kBarcodeFormatError = 'Barcode must be 8 to 13 digits';

/// Inline message rendered when a manual-entry submission resolves to
/// `ScanProductNotFound` per Requirement 10.5. Note: this is NOT the
/// modal alert from Requirement 9.4; the manual-entry path renders an
/// inline message so the input field stays populated for typo
/// correction.
const String _kProductNotFoundMessage =
    'Product not found in the Open Food Facts database. Try a different '
    'barcode or add the ingredient by hand from the pantry screen.';

/// Informational note rendered above the input when the screen was
/// reached because `Camera_Permission_State == unavailable` per
/// Requirement 10.7.
const String _kCameraUnavailableNote =
    'Camera is unavailable; enter the barcode by hand.';

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

/// Manual-entry fallback screen at `Routes.barcodeManualEntryPath`.
///
/// Stateful so the [TextEditingController] and the local
/// `_localErrorMessage` survive rebuilds (a stateless `ConsumerWidget`
/// would re-create the controller every frame).
///
/// The optional [cameraUnavailable] flag is `true` when the screen was
/// pushed from the `BarcodeScannerScreen`'s "Use Manual Entry" CTA
/// because the camera is unavailable (Requirement 10.7). The router
/// builder for `Routes.barcodeManualEntryPath` passes the flag via
/// `GoRoute.builder` (typically via `state.extra` or a query
/// parameter); the default of `false` is the correct value for every
/// other entry path (the "Manual Entry" button on the scanner screen,
/// the "Manual Entry" action on the lookup-failed modal, etc.).
class ManualBarcodeEntryScreen extends ConsumerStatefulWidget {
  /// Creates a manual-entry screen.
  ///
  /// [cameraUnavailable] toggles the informational note rendered
  /// above the input field per Requirement 10.7. Default `false`.
  const ManualBarcodeEntryScreen({
    super.key,
    this.cameraUnavailable = false,
  });

  /// True when the screen was reached because the device camera is
  /// unavailable (Requirement 10.7). The screen renders the
  /// informational note `"Camera is unavailable; enter the barcode by
  /// hand."` above the input field when this is `true`.
  final bool cameraUnavailable;

  @override
  ConsumerState<ManualBarcodeEntryScreen> createState() =>
      _ManualBarcodeEntryScreenState();
}

class _ManualBarcodeEntryScreenState
    extends ConsumerState<ManualBarcodeEntryScreen> {
  /// Backs the digit-only input field. Owned by the screen so the
  /// user's typed value survives rebuilds — including the rebuild
  /// triggered by `ScanProductNotFound` per Requirement 10.5
  /// ("SHALL leave the input field populated so the user can correct
  /// a typo").
  final TextEditingController _controller = TextEditingController();

  /// Local error message rendered above the input when the user
  /// submits a string that does not match the `^[0-9]{8,13}$`
  /// regex from Requirement 3.1. Cleared on every input edit and
  /// every fresh submit attempt per Requirement 10.3.
  String? _localErrorMessage;

  @override
  void initState() {
    super.initState();
    // The local validation error must clear the moment the user
    // edits the input field per Requirement 10.3 ("the error
    // clears on input change or new submit"). The same listener
    // would be a natural place to clear the notifier-driven error
    // ([ScanProductNotFound], `ScanFailed`), but those states are
    // owned by the notifier and clear on the next `submitBarcode`
    // transition; a local clear would be racy with the next
    // dispatch. So this listener handles only the local field.
    _controller.addListener(_onInputChanged);
  }

  @override
  void dispose() {
    _controller
      ..removeListener(_onInputChanged)
      ..dispose();
    super.dispose();
  }

  /// Clears the local validation error whenever the user edits the
  /// input. Notifier-driven errors are not touched here — they are
  /// owned by [BarcodeNotifier] and transition out of view on the
  /// next `submitBarcode` dispatch.
  void _onInputChanged() {
    if (_localErrorMessage != null) {
      setState(() {
        _localErrorMessage = null;
      });
    }
  }

  /// Validates the current input against `^[0-9]{8,13}$` and, on
  /// success, dispatches it through `BarcodeNotifier.submitBarcode`
  /// per Requirement 10.5. The notifier does its own regex check
  /// (Requirement 13.6 c) — the duplication here is so the inline
  /// error renders synchronously from the screen's own state
  /// (Requirement 10.3) rather than waiting for a notifier
  /// transition.
  ///
  /// Because the input field uses
  /// `FilteringTextInputFormatter.digitsOnly` every character in
  /// `_controller.text` is already a digit; the only way to fail
  /// the regex is a length mismatch. The message wording stays
  /// generic per Requirement 10.3.
  void _submit() {
    final input = _controller.text;
    final isValidLength = input.length >= _kMinBarcodeDigits &&
        input.length <= _kMaxBarcodeDigits;

    if (!isValidLength) {
      setState(() {
        _localErrorMessage = _kBarcodeFormatError;
      });
      return;
    }

    setState(() {
      _localErrorMessage = null;
    });

    // ignore: discarded_futures
    ref.read(barcodeNotifierProvider.notifier).submitBarcode(input);
  }

  /// Builds the user-facing error message displayed above the input
  /// field, derived from the current `Scan_State` plus the local
  /// validation flag.
  ///
  /// Precedence (highest first):
  ///
  ///   1. The local validation error (`_localErrorMessage`) — set
  ///      when the user submitted a non-conforming length.
  ///   2. The notifier's [ScanProductNotFound] message after a
  ///      manual submit per Requirement 10.5.
  ///   3. The notifier's [ScanFailed] description for the
  ///      `network`/`server` lookup categories per Requirement
  ///      10.6.
  ///
  /// Returns `null` when there is nothing to render.
  String? _resolveErrorMessage(ScanState? state) {
    final localError = _localErrorMessage;
    if (localError != null) return localError;

    if (state is ScanProductNotFound) {
      return _kProductNotFoundMessage;
    }
    if (state is ScanFailed) {
      switch (state.reason) {
        case ScanFailureReason.network:
        case ScanFailureReason.server:
          return state.description;
        case ScanFailureReason.validation:
        case ScanFailureReason.notAuthenticated:
        case ScanFailureReason.sessionExpired:
        case ScanFailureReason.cameraUnavailable:
          // These categories are not surfaced from the manual-entry
          // path: validation comes from the add-flow (handled on
          // the confirmation screen), the auth categories are
          // handled by the foundation router redirect, and
          // cameraUnavailable is the *reason* the user landed here
          // — it would be confusing to render it as an error after
          // a successful manual submit. Falling through to `null`
          // is the safe default.
          return null;
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final asyncState = ref.watch(barcodeNotifierProvider);

    // Decision 4 of `flutter-port-barcode/design.md`: every async
    // branch resolves through `AsyncValue.when` rather than a
    // `FutureBuilder`. The `data` callback is the steady-state
    // render path; `loading` and `error` are defensive — Riverpod's
    // `AsyncNotifier` resolves the build future synchronously per
    // `BarcodeNotifier.build` (Requirement 8.6), so the loading
    // branch is observed only on the first frame after a hot
    // restart, and the error branch should never fire in
    // production.
    return asyncState.when(
      data: (state) => _buildContent(
        context,
        theme: theme,
        colorScheme: colorScheme,
        state: state,
      ),
      loading: () => _buildContent(
        context,
        theme: theme,
        colorScheme: colorScheme,
        state: const ScanIdle(),
      ),
      error: (_, __) => _buildContent(
        context,
        theme: theme,
        colorScheme: colorScheme,
        state: const ScanIdle(),
      ),
    );
  }

  /// Renders the screen for the resolved `Scan_State`.
  ///
  /// Extracted so [build] can route every `AsyncValue` branch
  /// through the same render path with no `FutureBuilder` and no
  /// duplicated layout code.
  Widget _buildContent(
    BuildContext context, {
    required ThemeData theme,
    required ColorScheme colorScheme,
    required ScanState state,
  }) {
    final isLookingUp = state is ScanLookingUp;
    final isInputEmpty = _controller.text.isEmpty;
    final submitDisabled = isLookingUp || isInputEmpty;
    final errorMessage = _resolveErrorMessage(state);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Manual barcode entry'),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  // Camera-unavailable note (Requirement 10.7) — only
                  // rendered when the screen was reached because the
                  // device has no camera or the camera service is
                  // suspended.
                  if (widget.cameraUnavailable) ...<Widget>[
                    _CameraUnavailableNote(
                      colorScheme: colorScheme,
                      textTheme: theme.textTheme,
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Inline error region (Requirements 3.4, 10.3,
                  // 10.5, 10.6). Rendered above the input so the
                  // user sees the message before the field they need
                  // to correct. Uses the scanner error token so the
                  // wording stays visually consistent with the
                  // scanner screen's permission-denied / failure
                  // banners (Requirement 1.7).
                  if (errorMessage != null) ...<Widget>[
                    _InlineErrorBanner(
                      message: errorMessage,
                      colorScheme: colorScheme,
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Digit-only input. The `digitsOnly` formatter
                  // drops every non-digit character at insertion
                  // (Requirement 10.1), so the only way the user
                  // can fail the regex is by submitting an
                  // out-of-range length (Requirement 10.3).
                  TextField(
                    controller: _controller,
                    enabled: !isLookingUp,
                    keyboardType: TextInputType.number,
                    maxLength: _kMaxBarcodeDigits,
                    inputFormatters: <TextInputFormatter>[
                      FilteringTextInputFormatter.digitsOnly,
                    ],
                    autofocus: true,
                    autocorrect: false,
                    enableSuggestions: false,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) {
                      if (!submitDisabled) _submit();
                    },
                    decoration: const InputDecoration(
                      labelText: _kInputLabel,
                      border: OutlineInputBorder(),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Submit row. The progress indicator sits next to
                  // the button while `Scan_State == ScanLookingUp`
                  // so the in-flight state is visible without
                  // covering the input (Requirement 10.2).
                  Row(
                    children: <Widget>[
                      Expanded(
                        child: FilledButton(
                          onPressed: submitDisabled ? null : _submit,
                          child: const Text(_kSubmitButtonLabel),
                        ),
                      ),
                      if (isLookingUp) ...<Widget>[
                        const SizedBox(width: 12),
                        const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColours.scannerLoadingIndicator,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Internal widgets
//
// Both helpers are private to this file. They exist to keep [build] readable
// and to give the screen-level widget tests a stable seam for `find.byType`
// queries.
// ---------------------------------------------------------------------------

/// Informational note rendered above the input field when the screen
/// was reached because `Camera_Permission_State == unavailable`
/// (Requirement 10.7).
class _CameraUnavailableNote extends StatelessWidget {
  const _CameraUnavailableNote({
    required this.colorScheme,
    required this.textTheme,
  });

  final ColorScheme colorScheme;
  final TextTheme textTheme;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Icon(
            Icons.info_outline,
            size: 20,
            color: colorScheme.onSurfaceVariant,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _kCameraUnavailableNote,
              style: textTheme.bodyMedium
                  ?.copyWith(color: colorScheme.onSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }
}

/// Inline error banner rendered above the input field for regex
/// failures (Requirements 3.4, 10.3), `ScanProductNotFound` after a
/// manual submit (Requirement 10.5), and
/// `ScanFailed(reason: network | server)` from the lookup path
/// (Requirement 10.6).
///
/// Uses [AppColours.scannerErrorBanner] (the destructive `error`
/// token aliased for the barcode feature per Requirement 1.7) so the
/// wording is visually consistent with the scanner screen's
/// permission-denied and failure banners.
class _InlineErrorBanner extends StatelessWidget {
  const _InlineErrorBanner({
    required this.message,
    required this.colorScheme,
  });

  final String message;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: colorScheme.errorContainer,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColours.scannerErrorBanner),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Icon(
            Icons.error_outline,
            size: 20,
            color: AppColours.scannerErrorBanner,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: colorScheme.onErrorContainer),
            ),
          ),
        ],
      ),
    );
  }
}
