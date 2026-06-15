// ScannedProductConfirmationScreen — the user-facing confirmation form for
// committing a [ScannedProduct] to the pantry via
// `POST /api/v1/ingredients`.
//
// The screen is pushed by `BarcodeScannerScreen` when it observes the
// [ScanProductFound] state (Requirement 9.5). It reads the same
// [barcodeNotifierProvider] the scanner screen reads, so both screens
// share one [BarcodeNotifier] instance for the duration of the
// Scan_Session per Decision 2 / Requirement 8.7.
//
// State machine the screen consumes
// ---------------------------------
//
// The screen renders one of four [ScanState] variants its presence is
// meaningful for, and a small "transitional" placeholder for any other
// state (which only occurs briefly while the parent scanner screen is
// popping the confirmation route):
//
//   * [ScanProductFound]            → hero region + editable form
//                                      + enabled "Add to Pantry" button
//                                      (Requirement 9.5)
//   * [ScanAdding]                  → same content but the
//                                      "Add to Pantry" button is
//                                      disabled and shows a spinner
//                                      (Requirement 9.6)
//   * [ScanAdded]                   → non-blocking success banner with
//                                      the literal pattern
//                                      `"<name> has been added to your
//                                      inventory"` (Requirement 9.7);
//                                      the screen and its parent
//                                      `BarcodeScannerScreen` pop
//                                      automatically within 1 second
//   * [ScanFailed]\(`validation`\)  → inline error region above the
//                                      form, form re-enabled, the
//                                      user's typed `quantity` and
//                                      `unit` values are preserved
//                                      so they can be corrected
//                                      (Requirement 11.6)
//   * [ScanFailed]\(`network|server`\)
//                                   → modal alert with title
//                                      `"Add Failed"` and a "Retry"
//                                      button gated on
//                                      `retriesRemainingForAdd`
//                                      (Requirement 11.8)
//
// Other reasons (`sessionExpired`, `notAuthenticated`,
// `cameraUnavailable`) cannot reach this screen in production: the
// router's redirect rule replaces the screen with `LoginScreen` on
// session expiry, and the camera-unavailable / not-authenticated paths
// only fire on the scanner screen before this confirmation screen is
// pushed.
//
// Cached product reference
// ------------------------
//
// `ScanAdding(ingredient)` and `ScanAdded(addedIngredientName)` carry
// neither the source [ScannedProduct]'s `brand`, nor `category`, nor
// `imageUrl` — only the `IngredientToAdd` body that was sent to the
// backend. The screen captures the [ScannedProduct] when it first
// observes [ScanProductFound] in `initState` (or in the [ref.listen]
// callback if a transition arrives later) and renders the hero region
// off this cached value, so the layout does not collapse when the
// notifier moves through `ScanAdding` and `ScanAdded`.
//
// Architecture lint compliance
// ----------------------------
//
// * No `Color(` literal — every colour resolves to a token from
//   `app_colours.dart` per Requirement 1.7. Specifically, the success
//   banner uses [AppColours.scannerSuccessBanner], the inline error
//   region uses [AppColours.scannerErrorBanner], and the in-button
//   spinner uses [AppColours.scannerLoadingIndicator].
// * No `FutureBuilder` — every async piece of state is read off
//   `AsyncValue<ScanState>` via `.when` per Requirement 9.12.
// * No `Dio(` or `GoRouter(` construction — the screen never
//   instantiates infrastructure singletons.
// * No import from `mobile/lib/features/auth/...` — auth state is
//   observed indirectly by the notifier, not by this screen.
//
// Reference: flutter-port-barcode Requirements 1.5, 1.7, 9.5, 9.6,
// 9.7, 9.8, 11.6, 11.7, 11.8, 11.9.

// External libraries
import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Internal modules
import 'package:mobile/core/theme/app_colours.dart';
import 'package:mobile/features/barcode/domain/ingredient_to_add.dart';
import 'package:mobile/features/barcode/domain/scan_state.dart';
import 'package:mobile/features/barcode/domain/scanned_product.dart';
import 'package:mobile/features/barcode/presentation/barcode_notifier.dart';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/// Delay between the [ScanAdded] transition and the auto-pop.
///
/// Requirement 9.7 caps this at 1 second; 800 ms leaves a 200 ms safety
/// margin so a heavily-loaded device that schedules the timer late
/// still pops the screen before the cap.
const Duration _kSuccessAutoPopDelay = Duration(milliseconds: 800);

/// Default quantity for a fresh confirmation entry. Mirrors
/// `IngredientToAdd.fromScannedProduct`'s `quantity` default per
/// Requirement 9.5 ("editable fields for `quantity` (default `1`)").
const String _kDefaultQuantityText = '1';

/// Default unit for a fresh confirmation entry. Mirrors
/// `IngredientToAdd.fromScannedProduct`'s `unit` default per
/// Requirement 9.5 ("editable fields for [...] `unit` (default
/// `\"piece\"`)").
const String _kDefaultUnitText = 'piece';

/// Inclusive upper bound on `quantity` per Requirement 9.8 / the
/// Data Models table.
const num _kMaxQuantity = 9999;

/// Inclusive upper bound on `unit` length per the Data Models table.
const int _kMaxUnitLength = 32;

/// Body string rendered inside the "Add Failed" modal when the failure
/// reason is `network` (Requirement 11.8). The wording deliberately
/// avoids exposing the raw `DioException`, an HTTP status code, or any
/// stack trace per Requirement 11.9.
const String _kAddFailedNetworkBody =
    'Could not reach the server. Check your connection and try again.';

/// Body string rendered inside the "Add Failed" modal when the failure
/// reason is `server` (Requirement 11.8). Same compliance notes as
/// [_kAddFailedNetworkBody].
const String _kAddFailedServerBody =
    'The server is having trouble. Please try again shortly.';

/// Title rendered in the "Add Failed" modal per Requirement 11.8.
const String _kAddFailedTitle = 'Add Failed';

// ---------------------------------------------------------------------------
// Screen widget
// ---------------------------------------------------------------------------

/// Confirmation screen for a freshly scanned (or manually entered)
/// product, pushed by `BarcodeScannerScreen` on the
/// [ScanProductFound] transition per Requirement 9.5.
///
/// Stateful so the [TextEditingController]s for the editable
/// `quantity` / `unit` fields and the auto-pop [Timer] survive
/// rebuilds.
class ScannedProductConfirmationScreen extends ConsumerStatefulWidget {
  /// Creates a confirmation screen.
  const ScannedProductConfirmationScreen({super.key});

  @override
  ConsumerState<ScannedProductConfirmationScreen> createState() =>
      _ScannedProductConfirmationScreenState();
}

class _ScannedProductConfirmationScreenState
    extends ConsumerState<ScannedProductConfirmationScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();

  final TextEditingController _quantityController =
      TextEditingController(text: _kDefaultQuantityText);

  final TextEditingController _unitController =
      TextEditingController(text: _kDefaultUnitText);

  /// The [ScannedProduct] this confirmation represents. Captured in
  /// [initState] from the notifier's current value (the parent
  /// scanner screen pushes the confirmation route only after
  /// observing [ScanProductFound], so the read in [initState] sees a
  /// well-formed [ScanProductFound] in production), and refreshed in
  /// [_onStateTransition] when a later [ScanProductFound] arrives.
  ScannedProduct? _product;

  /// Active auto-pop timer. Cancelled on [dispose] so a screen that
  /// is popped manually before the timer fires does not call into a
  /// stale [BuildContext].
  Timer? _autoPopTimer;

  /// Set to `true` while an "Add Failed" modal is on screen so the
  /// listener does not stack a second modal on top of the first if a
  /// retry produces another failure while the dialog is open.
  bool _addFailureModalActive = false;

  @override
  void initState() {
    super.initState();
    final initial = ref.read(barcodeNotifierProvider).valueOrNull;
    if (initial is ScanProductFound) {
      _product = initial.product;
    }
  }

  @override
  void dispose() {
    _autoPopTimer?.cancel();
    _quantityController.dispose();
    _unitController.dispose();
    super.dispose();
  }

  // -- Validators ---------------------------------------------------------

  /// Validates the `quantity` field per Requirement 9.8.
  ///
  /// Rejects empty / whitespace-only input, non-numeric input, values
  /// `<= 0`, and values `> 9999`. Returns `null` on success. Decimal
  /// values are accepted because `IngredientToAdd.quantity` is typed
  /// `num` and the Data Models table only constrains the open
  /// interval `(0, 9999]`.
  String? _validateQuantity(String? value) {
    final trimmed = (value ?? '').trim();
    if (trimmed.isEmpty) {
      return 'Please enter a quantity.';
    }
    final parsed = num.tryParse(trimmed);
    if (parsed == null || parsed.isNaN) {
      return 'Quantity must be a number.';
    }
    if (parsed <= 0) {
      return 'Quantity must be greater than 0.';
    }
    if (parsed > _kMaxQuantity) {
      return 'Quantity must not exceed $_kMaxQuantity.';
    }
    return null;
  }

  /// Validates the `unit` field. Rejects empty / whitespace-only
  /// input and inputs longer than 32 characters per the Data Models
  /// table.
  String? _validateUnit(String? value) {
    final trimmed = (value ?? '').trim();
    if (trimmed.isEmpty) {
      return 'Please enter a unit.';
    }
    if (trimmed.length > _kMaxUnitLength) {
      return 'Unit must be at most $_kMaxUnitLength characters.';
    }
    return null;
  }

  // -- Submission ---------------------------------------------------------

  /// Validates the form and dispatches `confirmAdd` through the
  /// notifier. No-op when the cached [_product] is `null` (which
  /// only occurs if the screen is somehow built without a
  /// [ScanProductFound] observation, e.g. a hot-reload edge case).
  void _submit() {
    final product = _product;
    if (product == null) return;

    final form = _formKey.currentState;
    if (form == null || !form.validate()) {
      return;
    }

    final quantity = num.parse(_quantityController.text.trim());
    final unit = _unitController.text.trim();
    final ingredient = IngredientToAdd.fromScannedProduct(
      product,
      quantity: quantity,
      unit: unit,
    );
    ref.read(barcodeNotifierProvider.notifier).confirmAdd(ingredient);
  }

  // -- State-transition listener -----------------------------------------

  /// Listener registered against [barcodeNotifierProvider] in
  /// [build].
  ///
  /// Three transitions are observed:
  ///
  ///   * `ScanProductFound` arriving after the initial frame
  ///     refreshes the cached [_product] (e.g. after the user goes
  ///     back to the scanner from the modal and re-scans).
  ///   * Any state → `ScanAdded` schedules the auto-pop per
  ///     Requirement 9.7.
  ///   * Any state → `ScanFailed(network|server)` opens the "Add
  ///     Failed" modal per Requirement 11.8 if no modal is already
  ///     active.
  void _onStateTransition(
    AsyncValue<ScanState>? previous,
    AsyncValue<ScanState> next,
  ) {
    final n = next.valueOrNull;

    if (n is ScanProductFound && _product != n.product) {
      setState(() {
        _product = n.product;
      });
    }

    final p = previous?.valueOrNull;
    if (n is ScanAdded && p is! ScanAdded) {
      _scheduleAutoPop();
    }

    if (n is ScanFailed &&
        (n.reason == ScanFailureReason.network ||
            n.reason == ScanFailureReason.server) &&
        !_addFailureModalActive) {
      _addFailureModalActive = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        unawaited(_showAddFailureDialog(n));
      });
    }
  }

  // -- Auto-pop -----------------------------------------------------------

  /// Schedules a one-shot timer that pops the confirmation screen and
  /// (when possible) the parent scanner screen as well, satisfying
  /// the "within 1 second" wording in Requirement 9.7.
  ///
  /// Both pops are dispatched against a [Navigator] handle captured
  /// at scheduling time so the second pop does not depend on a
  /// [BuildContext] that may have been deactivated by the first pop.
  void _scheduleAutoPop() {
    _autoPopTimer?.cancel();
    final navigator = Navigator.of(context);
    _autoPopTimer = Timer(_kSuccessAutoPopDelay, () {
      if (!mounted) return;
      // Pop the confirmation screen.
      if (navigator.canPop()) {
        navigator.pop();
      }
      // Pop the parent scanner screen too, so the user lands back on
      // whatever route pushed the scanner. `canPop` is re-checked
      // because the first pop may have left the navigator at the
      // root (in tests, for example).
      if (navigator.canPop()) {
        navigator.pop();
      }
    });
  }

  // -- "Add Failed" modal -------------------------------------------------

  /// Renders the "Add Failed" modal per Requirement 11.8.
  ///
  /// The "Retry" button is enabled iff
  /// `notifier.retriesRemainingForAdd > 0`. Tapping Retry closes the
  /// modal and dispatches `retryAdd` through the notifier; tapping
  /// "Cancel" simply dismisses the modal (the user can manually
  /// re-tap "Add to Pantry" or back out to the scanner).
  Future<void> _showAddFailureDialog(ScanFailed failure) async {
    final notifier = ref.read(barcodeNotifierProvider.notifier);
    final remaining = notifier.retriesRemainingForAdd;
    final body = failure.reason == ScanFailureReason.network
        ? _kAddFailedNetworkBody
        : _kAddFailedServerBody;

    await showDialog<void>(
      context: context,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          title: const Text(_kAddFailedTitle),
          content: Text(body),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: remaining == 0
                  ? null
                  : () {
                      Navigator.of(dialogContext).pop();
                      unawaited(notifier.retryAdd());
                    },
              child: const Text('Retry'),
            ),
          ],
        );
      },
    );
    _addFailureModalActive = false;
  }

  // -- Build helpers ------------------------------------------------------

  /// Builds the hero region for the cached [_product].
  ///
  /// Renders the product image (when [ScannedProduct.imageUrl] is
  /// non-null) via `cached_network_image` per Requirement 9.5,
  /// followed by the product name, brand (when non-null), and
  /// category (when non-null). The non-null gating makes the layout
  /// degrade gracefully when OFF returned a sparse `product` object
  /// per Requirement 7.10.
  Widget _buildHero(ThemeData theme, ScannedProduct product) {
    final textTheme = theme.textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        if (product.imageUrl != null) ...<Widget>[
          ClipRRect(
            borderRadius: const BorderRadius.all(Radius.circular(12)),
            child: AspectRatio(
              aspectRatio: 1,
              child: CachedNetworkImage(
                imageUrl: product.imageUrl!,
                fit: BoxFit.cover,
                placeholder: (context, url) => const Center(
                  child: SizedBox(
                    height: 32,
                    width: 32,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
                errorWidget: (context, url, error) => Center(
                  child: Icon(
                    Icons.image_not_supported_outlined,
                    size: 48,
                    color: theme.colorScheme.outline,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
        Text(
          product.name,
          style: textTheme.headlineSmall,
        ),
        if (product.brand != null) ...<Widget>[
          const SizedBox(height: 4),
          Text(
            product.brand!,
            style: textTheme.titleMedium
                ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
        if (product.category != null) ...<Widget>[
          const SizedBox(height: 4),
          Text(
            product.category!,
            style: textTheme.bodyMedium
                ?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ],
    );
  }

  /// Builds the editable form region (quantity + unit + submit).
  ///
  /// The submit button shows an in-button spinner while
  /// [ScanState] is [ScanAdding] per Requirement 9.6.
  Widget _buildForm({
    required ThemeData theme,
    required bool adding,
    required bool enabled,
  }) {
    return Form(
      key: _formKey,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Expanded(
                flex: 2,
                child: TextFormField(
                  controller: _quantityController,
                  enabled: enabled,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  inputFormatters: <TextInputFormatter>[
                    FilteringTextInputFormatter.allow(RegExp('[0-9.]')),
                  ],
                  textInputAction: TextInputAction.next,
                  validator: _validateQuantity,
                  decoration: const InputDecoration(
                    labelText: 'Quantity',
                    border: OutlineInputBorder(),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 3,
                child: TextFormField(
                  controller: _unitController,
                  enabled: enabled,
                  textInputAction: TextInputAction.done,
                  maxLength: _kMaxUnitLength,
                  validator: _validateUnit,
                  decoration: const InputDecoration(
                    labelText: 'Unit',
                    border: OutlineInputBorder(),
                    counterText: '',
                  ),
                  onFieldSubmitted: (_) {
                    if (enabled) _submit();
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: adding || !enabled ? null : _submit,
            child: adding
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColours.scannerLoadingIndicator,
                    ),
                  )
                : const Text('Add to Pantry'),
          ),
        ],
      ),
    );
  }

  /// Builds the inline validation error region rendered above the
  /// form when [ScanState] is [ScanFailed]\(`validation`\) per
  /// Requirement 11.6.
  Widget _buildValidationError(String message) {
    return _InlineErrorBanner(message: message);
  }

  /// Builds the non-blocking success banner rendered when
  /// [ScanState] is [ScanAdded] per Requirement 9.7. The banner
  /// substitutes [ScannedProduct.name] when
  /// [ScanAdded.addedIngredientName] is null (the backend returned a
  /// malformed body per Requirement 5.6, or the field was simply
  /// absent).
  Widget _buildSuccessBanner(ScanAdded scan) {
    final fallbackName = _product?.name ?? 'Item';
    final displayName = scan.addedIngredientName ?? fallbackName;
    return _SuccessBanner(
      message: '$displayName has been added to your inventory',
    );
  }

  // -- Build --------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    ref.listen<AsyncValue<ScanState>>(
      barcodeNotifierProvider,
      _onStateTransition,
    );

    final asyncState = ref.watch(barcodeNotifierProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Confirm Product'),
      ),
      body: SafeArea(
        child: asyncState.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (Object error, StackTrace stackTrace) =>
              _buildBodyForState(theme, const ScanIdle()),
          data: (ScanState scan) => _buildBodyForState(theme, scan),
        ),
      ),
    );
  }

  /// Renders the screen body for the given [scan] state.
  ///
  /// Switched off the sealed [ScanState] family per Requirement
  /// 9.12. States that are not meaningful on this screen
  /// (`ScanIdle`, `ScanRequestingPermission`, `ScanCameraActive`,
  /// `ScanLookingUp`, `ScanProductNotFound`, and the
  /// not-meaningful-on-this-screen `ScanFailed` reasons) render the
  /// last-known cached product non-interactively, so the layout
  /// does not flicker while the parent scanner screen pops the
  /// confirmation route.
  Widget _buildBodyForState(ThemeData theme, ScanState scan) {
    final product = _product;
    final adding = scan is ScanAdding;
    final added = scan is ScanAdded;

    final validationError = scan is ScanFailed &&
            scan.reason == ScanFailureReason.validation
        ? scan.description
        : null;

    final formEnabled = product != null && !adding && !added;

    if (product == null) {
      // Defensive: the parent scanner screen pushes us only after
      // observing `ScanProductFound`, so `_product` is non-null in
      // production. A null here means the screen was reached from a
      // hot-reload edge case or a future caller that did not seed
      // the notifier. Render a placeholder rather than a blank
      // screen.
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text('Loading product details…'),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          if (scan is ScanAdded) ...<Widget>[
            _buildSuccessBanner(scan),
            const SizedBox(height: 16),
          ],
          if (validationError != null) ...<Widget>[
            _buildValidationError(validationError),
            const SizedBox(height: 16),
          ],
          _buildHero(theme, product),
          const SizedBox(height: 24),
          _buildForm(
            theme: theme,
            adding: adding,
            enabled: formEnabled,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Inline banners
// ---------------------------------------------------------------------------

/// Compact tinted error banner used for the
/// `ScanFailed(validation)` inline error region.
///
/// Stateless and themed off [AppColours.scannerErrorBanner], which
/// the architecture lint requires every barcode-feature colour to
/// resolve to (Requirement 1.7).
class _InlineErrorBanner extends StatelessWidget {
  const _InlineErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColours.scannerErrorBanner,
        borderRadius: BorderRadius.all(Radius.circular(8)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Icon(
            Icons.error_outline,
            color: AppColours.onPrimary,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: textTheme.bodyMedium?.copyWith(
                color: AppColours.onPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Non-blocking success banner rendered when [ScanState] is
/// [ScanAdded] per Requirement 9.7.
///
/// Themed off [AppColours.scannerSuccessBanner] so the banner
/// reads as a Cook Smart success surface.
class _SuccessBanner extends StatelessWidget {
  const _SuccessBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColours.scannerSuccessBanner,
        borderRadius: BorderRadius.all(Radius.circular(8)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Icon(
            Icons.check_circle_outline,
            color: AppColours.onPrimary,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: textTheme.bodyMedium?.copyWith(
                color: AppColours.onPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
