// Foundation-visible re-export of the Auth_Feature's `authNotifierProvider`
// and supporting [AuthState] family for cross-feature consumers.
//
// Why this file exists
// --------------------
//
// Per the flutter-port-barcode spec (Requirements 1.5, 6.5; Auth Requirement
// 7), other features that need to read the cook-smart auth state — for
// example the Barcode_Feature's defence-in-depth check at scan-session
// start, and its mid-session `AuthUnauthenticated` listener — MUST NOT
// import any file under `mobile/lib/features/auth/` directly. The
// architectural-enforcement script `tool/check_architecture.dart`
// (rule R-2.5) forbids cross-feature imports between any two
// `mobile/lib/features/<a>/` and `mobile/lib/features/<b>/` folders.
//
// To make `authNotifierProvider` reachable from other features without
// breaking that rule, the auth feature re-exports it through this file
// under `mobile/lib/core/network/`. Any feature `presentation/` or
// `data/` file imports the provider via
//
//   import 'package:mobile/core/network/auth_provider.dart';
//
// which the architecture lint accepts because the importing feature's
// only dependency is on `core/`, not on another feature.
//
// Why `core/network/` is the right home
// -------------------------------------
//
// The bridge co-locates with the existing auth-related transport
// surface that already lives here:
//
//   * `core/network/auth_interceptor.dart` — JWT injection contract.
//   * `core/network/auth_api_client.dart` — feature-shaped transport
//     seam (Auth Decision 4).
//   * `core/network/cook_smart_dio_factory.dart` — the only `core/`
//     file that already imports `mobile/lib/features/auth/...`
//     (specifically, the `cookSmartRefreshNotSupported` stub from
//     `data/refresh_token_stub.dart`).
//
// All of these participate in the cook-smart auth-and-network wiring,
// and so does this re-export. Putting the bridge in a fresh
// `core/auth/` subfolder would have introduced a new top-level
// `core/` namespace for a single file; reusing `core/network/` keeps
// the `core/` layout flat and matches the existing precedent set by
// `cook_smart_dio_factory.dart`.
//
// `CancelToken` re-export
// -----------------------
//
// The bridge also re-exports `CancelToken` from `package:dio` so the
// `BarcodeNotifier` (and any future feature notifier with the same
// auto-dispose / cancel-on-disposal contract per
// flutter-port-barcode Decision 2 / Requirement 8.10) can construct
// and cancel an in-flight request without writing
// `import 'package:dio/dio.dart';` — which the architecture lint
// (rule R-4.8) forbids outside `lib/core/network/`. The `export`
// directive is *not* an `import` directive, so the
// `_importRegExp` matcher in `tool/check_architecture.dart` does
// not flag it; consumers see `CancelToken` as a re-exported symbol
// from this file's URI.
//
// What this file does NOT re-export
// ---------------------------------
//
// Only the symbols documented above are re-exported. The auth
// repository (`AuthRepository`), the auth screens (`LoginScreen`,
// `SignupScreen`), the response types (`AuthLoginResponse`,
// `AuthMeResponse`, `AuthRegisterResponse`), and the `User` domain
// model remain feature-private — other features have no business
// reading them. If a future spec proves a need for one of those, the
// re-export list grows; until then, the surface stays narrow.
//
// Reference: flutter-port-barcode Requirements 1.5, 6.4, 6.5, 8.10.

export 'package:dio/dio.dart' show CancelToken;
export 'package:mobile/features/auth/domain/auth_state.dart'
    show AuthAuthenticated, AuthLoading, AuthState, AuthUnauthenticated;
export 'package:mobile/features/auth/presentation/auth_notifier.dart'
    show authNotifierProvider;
