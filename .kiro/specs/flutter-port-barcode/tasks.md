# Implementation Plan: Flutter Port — Barcode Scan-to-Pantry

## Overview

This plan ports the cook-smart barcode-scan-to-add-ingredient flow into the Flutter `mobile/` project per the design's `data/domain/presentation` split, mirroring the layout the Auth_Feature confirmed. Every task touches exactly one file (or one source file's mirrored test) so independent tasks within a wave can run in parallel without write conflicts. The implementation language is Dart/Flutter, inherited from the foundation. No new pubspec dependencies are added — Requirement 13.2 — so wave 0 is just a manifest/Info.plist string drop and a colour-token amendment.

The eleven waves below let an orchestrator dispatch the leaf tasks across the spec with the same parallelism the foundation and the auth port proved out. Wave 0 lands the platform-permission strings and the new `app_colours.dart` tokens that every later wave depends on. Waves 1–3 build the domain and data layers bottom-up. Waves 4–6 build the notifier, the screens, and the route wiring. Waves 7–8 lay the integration tests on top. The final checkpoint runs the same gate the foundation and auth port used (`flutter test`, `flutter analyze`, all four `tool/check_*.dart` scripts).

## Tasks

- [x] 1. Land platform-permission strings and theme tokens
  - [x] 1.1 Declare `android.permission.CAMERA` in `mobile/android/app/src/main/AndroidManifest.xml`
    - Touch only `mobile/android/app/src/main/AndroidManifest.xml`
    - Add the literal `<uses-permission android:name="android.permission.CAMERA" />` element above the `<application>` tag
    - Do NOT declare `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, or any image-gallery permission (Requirement 2.1 forbids them — the feature does not read or write image files)
    - _Requirements: 2.1_

  - [x] 1.2 Declare `NSCameraUsageDescription` placeholder in `mobile/ios/Runner/Info.plist`
    - Touch only `mobile/ios/Runner/Info.plist`
    - Add `<key>NSCameraUsageDescription</key><string>Cook Smart uses the camera to scan product barcodes.</string>` so the iOS scaffold is ready when iOS lands; iOS builds remain disabled per Foundation Requirement 7.3
    - _Requirements: 2.2_

  - [x] 1.3 Add barcode-scanner colour tokens to `mobile/lib/core/theme/app_colours.dart`
    - Touch only `mobile/lib/core/theme/app_colours.dart`
    - Add four `static const Color` tokens (e.g. `scannerViewfinderCorner`, `scannerLoadingIndicator`, `scannerErrorBanner`, `scannerSuccessBanner`) for the four colour roles Requirement 1.7 enumerates (viewfinder corner, loading indicator, error banner, success banner). Reuse existing palette values where possible; introduce new constants only where the existing palette lacks a suitable value
    - This is the only allowed modification to `mobile/lib/core/` for this feature (Requirement 1.7 carves out a narrow exception to Requirement 13.1 for theme tokens)
    - _Requirements: 1.7_

- [x] 2. Implement the domain layer
  - [x] 2.1 Implement `Scanned_Product` in `mobile/lib/features/barcode/domain/scanned_product.dart`
    - Touch only `mobile/lib/features/barcode/domain/scanned_product.dart`
    - `final class ScannedProduct` with `const` constructor, value equality across all five fields (`barcode`, `name`, `brand`, `category`, `imageUrl`), and `copyWith` covering every field using the sentinel pattern Auth_Feature's `User` established (so `copyWith(brand: null)` clears a nullable field)
    - Field bounds per the Data Models table: `barcode` matches `^[0-9]{8,13}$`; `name` 1–200 chars; `brand`/`category` 1–200 chars or null; `imageUrl` 1–2048 chars or null
    - Expose `Map<String, dynamic> toOpenFoodFactsLikeJson()` that emits the OFF response shape `{'status': 1, 'product': {'product_name': name, 'brands': brand, 'categories': category, 'image_url': imageUrl}}` so Property 1 round-trip tests can encode and decode through `OffLookupResponse.fromJson`. Document this method as test-fixture support, not a production code path
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 2.2 Write property tests for `Scanned_Product` in `mobile/test/features/barcode/domain/scanned_product_test.dart`
    - Touch only `mobile/test/features/barcode/domain/scanned_product_test.dart`
    - Declare a `Generator<ScannedProduct>` per the design's "Property-test mechanics" section: `barcode` from an 8–13 ASCII digit generator, `name` 1–200 chars, `brand`/`category` `String?` 1–200 chars, `imageUrl` `String?` 1–2048 chars
    - **Property 12: `copyWith` preserves all non-overridden fields** — `Glados2<ScannedProduct, _FieldName>` over every field; verify `copyWith(F: newValue).F == newValue` and every other field equals the original; verify `product.copyWith() == product`
    - **Validates: Requirements 7.3**

  - [x] 2.3 Implement `Ingredient_To_Add` in `mobile/lib/features/barcode/domain/ingredient_to_add.dart`
    - Touch only `mobile/lib/features/barcode/domain/ingredient_to_add.dart`
    - `final class IngredientToAdd` with `const` constructor and value equality across `barcode`, `customName`, `category`, `quantity`, `unit`
    - Bounds per the Data Models table: `customName` 1–200 chars after trimming; `category` 1–100 chars; `quantity` `0 < quantity <= 9999`; `unit` 1–32 chars
    - `Map<String, dynamic> toBackendJson()` emits exactly the five keys `{customName, category, quantity, unit, notes}` per Requirement 5.2; synthesise `notes` as the literal pattern `"Added via barcode scan ($barcode)"`. Re-validate every bound on entry and raise `StateError` identifying the offending field per Requirement 7.6 — emit no JSON when any bound fails
    - `factory IngredientToAdd.fromScannedProduct(ScannedProduct, {num quantity = 1, String unit = 'piece'})` maps a `ScannedProduct` to the default-shaped value, mapping `null` `category` to the literal `'other'` per Requirement 7.7
    - _Requirements: 7.4, 7.5, 7.6, 7.7_

  - [ ]* 2.4 Write property tests for `Ingredient_To_Add` in `mobile/test/features/barcode/domain/ingredient_to_add_test.dart`
    - Touch only `mobile/test/features/barcode/domain/ingredient_to_add_test.dart`
    - Declare a `Generator<IngredientToAdd>` derived from the product generator with `quantity` drawn from `(0, 9999]` and `unit` from a 1–32-char vocabulary
    - **Property 5: Ingredient_To_Add construction and serialization** — `Glados3<ScannedProduct, num, String>(productGenerator, quantityGenerator, unitGenerator)` over the happy-path triple; assert `fromScannedProduct` maps category-null to `'other'`, copies other fields, and `toBackendJson()` returns exactly the five documented keys with the synthesised `notes` pattern; then `Glados<_PerturbedField>` over each out-of-bounds perturbation; assert `toBackendJson()` raises `StateError` identifying the offending field and emits no body
    - **Validates: Requirements 5.2, 7.4, 7.5, 7.6, 7.7**

  - [x] 2.5 Implement `Camera_Permission_State` in `mobile/lib/features/barcode/domain/camera_permission_state.dart`
    - Touch only `mobile/lib/features/barcode/domain/camera_permission_state.dart`
    - `enum CameraPermissionState { granted, denied, permanentlyDenied, unavailable }` matching the four-way distinction the React Native predecessor's `barcodeService` already makes
    - _Requirements: 2.5, 2.6, 7 (Glossary)_

  - [x] 2.6 Implement `Scan_State` sealed family in `mobile/lib/features/barcode/domain/scan_state.dart`
    - Touch only `mobile/lib/features/barcode/domain/scan_state.dart`
    - `sealed class ScanState` with exactly ten `final class` variants in the order Requirement 7.8 pins: `ScanIdle`, `ScanRequestingPermission`, `ScanPermissionDenied(reason)`, `ScanCameraActive`, `ScanLookingUp(barcode)`, `ScanProductFound(product)`, `ScanProductNotFound(barcode)`, `ScanAdding(ingredient)`, `ScanAdded(addedIngredientName)`, `ScanFailed(reason, description)`
    - Declare `enum CameraPermissionDenialReason { denied, permanentlyDenied, unavailable }` and `enum ScanFailureReason { network, server, validation, notAuthenticated, sessionExpired, cameraUnavailable }` in this same file
    - Every variant `final class` with `const` constructor and value equality across all fields (Requirement 7.9)
    - _Requirements: 7.8, 7.9_

  - [ ]* 2.7 Write unit tests for `Scan_State` in `mobile/test/features/barcode/domain/scan_state_test.dart`
    - Touch only `mobile/test/features/barcode/domain/scan_state_test.dart`
    - Verify the ten variants are exhaustively switchable (compile-time exhaustiveness check via `sealed`)
    - Verify equality and `hashCode` for every variant, including payload fields
    - Verify the variant names and order match Requirement 7.8 exactly (this is a SMOKE-test enumeration per the design's Testing Strategy)
    - _Requirements: 7.8, 7.9_

  - [x] 2.8 Define `CameraController` interface in `mobile/lib/features/barcode/domain/camera_controller.dart`
    - Touch only `mobile/lib/features/barcode/domain/camera_controller.dart`
    - `abstract class CameraController` with the four-method surface from Decision 1: `Future<CameraPermissionState> queryPermission()`, `Future<CameraPermissionState> requestPermission()`, `Future<void> start()`, `Future<void> stop()`, plus `Stream<String> get rawDetections` emitting the digit string of every detected candidate regardless of validity
    - File contains no implementation and no `import 'package:mobile_scanner/...'` — the abstraction is what allows iOS to land later as a one-file change per Requirement 2.12
    - _Requirements: 2.12_

- [ ] 3. Implement the data layer (HTTP, parsers, fixtures, camera adapter)
  - [x] 3.1 Implement `BarcodeApiClient` seam in `mobile/lib/core/network/barcode_api_client.dart`
    - Touch only `mobile/lib/core/network/barcode_api_client.dart`
    - Declare `class BarcodeApiResponse` (`statusCode`, `body`), `abstract class BarcodeApiClient` with two methods (`lookupOpenFoodFacts(barcode, {cancelToken})` and `addIngredient(body, {cancelToken})`), `class DioBarcodeApiClient implements BarcodeApiClient`, and `final Provider<BarcodeApiClient> barcodeApiClientProvider`
    - `lookupOpenFoodFacts` issues `GET https://world.openfoodfacts.org/api/v2/product/$barcode.json` with `Options(connectTimeout: const Duration(seconds: 5), receiveTimeout: const Duration(seconds: 10), extra: <String, dynamic>{AuthInterceptor.requiresAuthExtraKey: false})` per Requirement 4.1, 4.2; absolute URL bypasses the foundation base URL; before JSON-decode, assert body length `<= 512 * 1024` and raise `ServerException` otherwise per Requirement 4.3
    - `addIngredient` issues `POST /api/v1/ingredients` with `Options(extra: <String, dynamic>{AuthInterceptor.requiresAuthExtraKey: true})` per Requirement 5.1; foundation-default 10s/15s timeouts apply per Requirement 12.4; on 2xx with non-`Map` body, invoke the optional `void Function(String)? onMalformedAddBody` hook and resolve as success per Requirement 5.6
    - This is the second instance of the feature-shaped transport-seam pattern after `auth_api_client.dart` (Auth Decision 4 reused per Requirement 13.7); no public surface beyond the two methods and `BarcodeApiResponse` per Requirement 1.1
    - _Requirements: 1.1, 4.1, 4.2, 4.3, 5.1, 5.6, 8.1, 13.7_

  - [ ]* 3.2 Add backend response fixtures in `mobile/test/features/barcode/data/fixtures.dart`
    - Touch only `mobile/test/features/barcode/data/fixtures.dart`
    - Export four `Map<String, dynamic>` constants derived literally from real OFF and `backend/src/routes/ingredients.ts` traffic: `offProductFixture` (`status: 1` body with all four product fields), `offNotFoundFixture` (`status: 0` body with no `product`), `ingredientAddedFixture` (`201` body with `message` and `ingredient`), `ingredientValidationFailureFixture` (`400` body with the `{error, details}` shape from express-validator)
    - These fixtures are the single source of truth for "what the wire actually looks like" so a backend or OFF schema change shows up as one fixture diff
    - _Requirements: 4.4, 4.5, 5.2, 5.4, 5.7_

  - [x] 3.3 Implement `Off_Lookup_Response` in `mobile/lib/features/barcode/data/off_lookup_response.dart`
    - Touch only `mobile/lib/features/barcode/data/off_lookup_response.dart`
    - Declare `sealed class OffLookupOutcome` with two `final class` variants: `OffLookupProduct(ScannedProduct product)` and `OffLookupNotFound(String barcode)`
    - `OffLookupResponse.fromJson(Map<String, dynamic> body, String barcode)` implements Decision 4's strict-envelope/lenient-product rule: validate envelope eagerly (top-level non-object, `status` missing/non-int/outside `{0,1}`, `product` non-object) and raise `ServerException` identifying the offending barcode and field per Requirement 4.6; once past the envelope, build `ScannedProduct` from whatever fields exist with length caps per the Data Models table and the `"Unknown Product"` fallback per Requirements 4.4, 7.10
    - For `status == 0`, or `status == 1` with `product` null/missing, return `OffLookupNotFound(barcode)` per Requirement 4.5
    - _Requirements: 4.4, 4.5, 4.6, 7.10_

  - [ ]* 3.4 Write property tests for `Off_Lookup_Response` in `mobile/test/features/barcode/data/off_lookup_response_test.dart`
    - Touch only `mobile/test/features/barcode/data/off_lookup_response_test.dart`
    - Declare `Generator<MalformedOffBody>` emitting `Map<String, dynamic>` values that violate one or more envelope invariants (status missing, status non-int, status outside `{0,1}`, body non-object via tagged-union, product non-object)
    - **Property 1: OFF round-trip** — `Glados(productGenerator).test(...)` asserting `OffLookupResponse.fromJson(product.toOpenFoodFactsLikeJson(), product.barcode)` produces `OffLookupProduct(product)` value-equal to the original
    - **Property 2: OFF parser strictness** — `Glados2<MalformedOffBody, _Barcode>` asserting every malformed body raises `ServerException` whose message identifies both the barcode and the offending field; verify no `OffLookupProduct` or `OffLookupNotFound` is produced
    - Example test for Requirement 4.5 — both `status == 0` and `status == 1` with missing `product` map to `OffLookupNotFound(barcode)`
    - **Validates: Requirements 4.3, 4.4, 4.5, 4.6, 7.10, 13.6 (a), 13.6 (b)**

  - [x] 3.5 Implement `Ingredient_Add_Response` in `mobile/lib/features/barcode/data/ingredient_add_response.dart`
    - Touch only `mobile/lib/features/barcode/data/ingredient_add_response.dart`
    - `final class IngredientAddResponse` whose `fromJson(dynamic body)` factory reads optional top-level `message` (`String?`) and optional top-level `ingredient` (`Map<String, dynamic>?`) per Requirement 5.4
    - Lenient parsing per Requirement 5.6: when body is not a `Map`, when `message` is non-string, or when `ingredient` is non-object, return `IngredientAddResponse(message: null, ingredient: null)` and notify the optional logging hook installed via the `DioBarcodeApiClient` constructor — never throw
    - Expose a getter for `addedIngredientName` reading `ingredient?['custom_name'] as String?` so the notifier can populate `ScanAdded.addedIngredientName` per Requirement 9.7
    - _Requirements: 5.4, 5.6, 9.7_

  - [ ]* 3.6 Write unit tests for `Ingredient_Add_Response` in `mobile/test/features/barcode/data/ingredient_add_response_test.dart`
    - Touch only `mobile/test/features/barcode/data/ingredient_add_response_test.dart`
    - Parse `ingredientAddedFixture` and assert `message`, `ingredient`, and `addedIngredientName` capture
    - Verify lenient-parsing fallbacks: non-Map body, non-string `message`, non-object `ingredient` all resolve to `IngredientAddResponse(message: null, ingredient: null)` without throwing
    - _Requirements: 5.4, 5.6_

  - [x] 3.7 Implement `MobileScannerCameraController` in `mobile/lib/features/barcode/data/mobile_scanner_camera_controller.dart`
    - Touch only `mobile/lib/features/barcode/data/mobile_scanner_camera_controller.dart`
    - `class MobileScannerCameraController implements CameraController` wrapping `package:mobile_scanner ^5.1.1`'s controller and permission helper. This is the ONLY file under `features/barcode/` that imports `package:mobile_scanner` (Decision 1)
    - `start()` constructs the underlying `MobileScannerController` with the format set restricted to `{BarcodeFormat.ean8, BarcodeFormat.ean13, BarcodeFormat.upcA, BarcodeFormat.upcE}` per Requirement 3.2 — no QR detection
    - `stop()` calls `dispose()` on the underlying controller and completes within 500 ms per Requirement 2.7
    - `rawDetections` is a broadcast `Stream<String>` derived from the package's barcode-detection callback emitting each `Barcode.rawValue` without filtering; the notifier owns validation per Requirement 3.3
    - `queryPermission()` and `requestPermission()` translate the package's permission enum to `CameraPermissionState` per the four-way mapping in Requirements 2.5, 2.6
    - Expose `final Provider<CameraController> cameraControllerProvider = Provider.autoDispose<CameraController>((ref) { final c = MobileScannerCameraController(); ref.onDispose(c.stop); return c; });` so the controller's lifetime tracks the notifier's
    - _Requirements: 2.7, 3.2, 2.12_

  - [x] 3.8 Implement `BarcodeRepository` and `barcodeRepositoryProvider` in `mobile/lib/features/barcode/data/barcode_repository.dart`
    - Touch only `mobile/lib/features/barcode/data/barcode_repository.dart`
    - Constructor takes `BarcodeApiClient` (from `barcodeApiClientProvider`); does NOT import `package:dio` (architecture lint) and does NOT import `package:flutter_secure_storage` per Requirement 6.4; does NOT import any file under `features/auth/` per Requirement 6.5
    - `Future<OffLookupOutcome> lookupOpenFoodFacts(String barcode, {CancelToken? cancelToken})` validates the input against `^[0-9]{8,13}$` BEFORE calling the seam — invalid barcode raises synchronous `ArgumentError` (the notifier catches and translates to inline error per Requirement 3.5) and produces zero HTTP requests per Requirement 13.6 (c). On valid barcode, call the seam and feed the body to `OffLookupResponse.fromJson`
    - `Future<IngredientAddResponse> addIngredient(IngredientToAdd ingredient, {CancelToken? cancelToken})` calls `ingredient.toBackendJson()` (defensive re-validation per Requirement 7.6) and passes the body to the seam; on success parse with `IngredientAddResponse.fromJson`. For non-401 4xx that is not 400 with the `{error, details}` shape, build a `ValidationException` locally per Requirement 5.7; for 5xx, raise `ServerException` whose message includes status and barcode per Requirement 5.9
    - All other transport failures pass through as the typed `ApiException` already produced by the foundation's `ErrorInterceptor` — the repository never wraps them
    - Expose `final Provider<BarcodeRepository> barcodeRepositoryProvider = Provider((ref) => BarcodeRepository(ref.read(barcodeApiClientProvider)));`
    - _Requirements: 4.1, 4.2, 4.7, 4.8, 5.1, 5.3, 5.7, 5.9, 5.12, 6.4, 6.5, 6.6, 7.6, 8.2, 13.6 (c)_

  - [ ]* 3.9 Write property tests for `BarcodeRepository` in `mobile/test/features/barcode/data/barcode_repository_test.dart`
    - Touch only `mobile/test/features/barcode/data/barcode_repository_test.dart`
    - Use a hand-rolled `_FakeBarcodeApiClient` and a `_RecordingCancelToken` per the design's "Mock surface" section; no mocking framework added to `pubspec.yaml`
    - **Property 3: OFF outcome dispatch** — `Glados2<_HttpStatus, _OffBody>` over the (status, body) pairs the design enumerates; assert each tuple maps to exactly one of `OffLookupProduct`, `OffLookupNotFound`, `ServerException`, or `NetworkException`, with no automatic retry issued
    - **Property 4: Barcode validation rejection** — `Glados<String>` over the union the design lists (empty, whitespace-only, < 8 digits, > 13 digits, contains non-digit, leading/trailing/internal whitespace, punctuation); assert the validator rejects and zero HTTP requests are issued; complementary acceptance test for valid 8–13 ASCII digit strings
    - **Property 6: Backend HTTP-status taxonomy** — `Glados2<_HttpStatus, _Body>` over the codes `{200, 201, 202, 400, 401, 403, 404, 409, 422, 429, 500, 502, 503, 504}`; assert each dispatches to the documented outcome (success / `ValidationException` / `UnauthorisedException` / `ServerException`) and no `SecureStorage` write occurs on success
    - **Property 7: Request URL allow-list** — exercise an arbitrary action sequence against the seam; assert the observed URL set is a subset of `{"https://world.openfoodfacts.org/api/v2/product/<barcode>.json", "<base>/api/v1/ingredients"}`
    - Example test for Requirement 4.2 — `lookupOpenFoodFacts` request carries `connectTimeout: 5s, receiveTimeout: 10s, requiresAuth: false`
    - Example test for Requirement 5.6 — 2xx with malformed body resolves as success and invokes the logging hook
    - **Validates: Requirements 3.1, 3.3, 3.4, 4.1, 4.2, 4.5, 4.7, 4.8, 4.10, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9, 5.10, 5.12, 12.6, 13.6 (b), 13.6 (c)**

- [x] 4. Implement the `BarcodeNotifier`
  - [x] 4.1 Implement `BarcodeNotifier` and `barcodeNotifierProvider` in `mobile/lib/features/barcode/presentation/barcode_notifier.dart`
    - Touch only `mobile/lib/features/barcode/presentation/barcode_notifier.dart`
    - `final AsyncNotifierProvider<BarcodeNotifier, ScanState> barcodeNotifierProvider = AsyncNotifierProvider.autoDispose<BarcodeNotifier, ScanState>(BarcodeNotifier.new);` — Decision 2: autoDispose, no `keepAlive` per Requirement 8.7
    - `class BarcodeNotifier extends AutoDisposeAsyncNotifier<ScanState>` whose `build()` returns `ScanIdle()` synchronously per Requirement 8.6, wires `ref.listen(authNotifierProvider, _onAuthStateChanged)` per Requirement 6.5, and registers `ref.onDispose(_handleDispose)`
    - Methods: `startSession`, `submitBarcode(String)` (shared between camera detection and manual entry per Requirement 10.5), `confirmAdd(IngredientToAdd)`, `retryLookup`, `retryAdd`, `resetToCameraActive`, `reset`
    - Defence-in-depth auth check on `startSession` per Requirements 6.3, 6.4: read `authNotifierProvider`; if not `AuthAuthenticated`, transition to `ScanFailed(reason: notAuthenticated, ...)` and issue zero camera calls
    - Permission cascade per Requirements 2.3, 2.4, 2.5, 2.6: `queryPermission` → `granted` activates camera; `denied` and never-requested → `requestPermission` → outcome; `permanentlyDenied`/`unavailable` → `ScanPermissionDenied(reason)`
    - Detection debounce per Decision 3 / Requirements 9.3, 12.5: `bool _consumingDetections` flag set true only while `Scan_State == ScanCameraActive`; the `rawDetections` listener checks the flag and the `_lastLookupAt` 1000ms gate per Requirement 12.6 before consuming
    - Camera lifecycle per Requirements 2.7, 2.8, 2.9, 2.10: register as `WidgetsBindingObserver` from the screen and forward `paused`/`inactive`/`resumed` to the notifier; release within 500ms on exit; re-query permission on `resumed`
    - Retry counters per Decision 5 / Requirements 11.4, 11.5, 11.8: `int _lookupRetryCount = 0`, `int _addRetryCount = 0`; expose `int get retriesRemainingForLookup` and `int get retriesRemainingForAdd`; reset `_lookupRetryCount` on every fresh `submitBarcode`; reset `_addRetryCount` on `confirmAdd` invoked with a different `IngredientToAdd`
    - Outcome mapping per the design's "Notifier-level handling" table: `OffLookupProduct` → `ScanProductFound`; `OffLookupNotFound` → `ScanProductNotFound`; per-exception → `ScanFailed(reason)`
    - `_handleDispose` cancels `_cancelToken`, calls `_camera.stop()`, sets `_disposed = true` so any post-dispose `state =` is a no-op per Requirement 8.10
    - Never imports any file under `features/auth/` directly per Requirement 1.5; reads `authNotifierProvider` only via the foundation-visible re-export
    - _Requirements: 1.5, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 3.3, 3.4, 3.5, 6.3, 6.4, 6.5, 7.8, 8.3, 8.5, 8.6, 8.7, 8.10, 9.2, 9.3, 10.3, 10.5, 11.4, 11.5, 11.8, 12.2, 12.5, 12.6, 12.7_

  - [ ]* 4.2 Write property tests for `BarcodeNotifier` in `mobile/test/features/barcode/presentation/barcode_notifier_test.dart`
    - Touch only `mobile/test/features/barcode/presentation/barcode_notifier_test.dart`
    - Use a `_FakeBarcodeApiClient`, `_FakeCameraController`, `_FakeAuthNotifier`, `_RecordingCancelToken`, and `_FakeClock` per the design's "Mock surface" section
    - **Property 8: startSession permission/auth gate** — `Glados2<CameraPermissionState, AuthState>` over the four × three matrix; assert final `Scan_State` and the camera-call sequence match the table exactly
    - **Property 9: Camera lifecycle invariants** — `Glados<_LifecycleSequence>` over `{startSession, screen pop, paused, inactive, resumed, dispose}` traces; assert at every observation point `start()`-minus-`stop()` is in `{0, 1}`, every exit from `ScanCameraActive` is followed by `stop()` within 500 ms, every `resumed` re-queries permission before any `start()`
    - **Property 10: Failure-event response from in-flight states** — `Glados2<_InFlightState, _FailureEvent>`; assert `AuthUnauthenticated` → `ScanFailed(sessionExpired)` + `camera.stop()`; `addIngredient` exception → `ScanFailed` whose `reason` matches the subtype (`ValidationException → validation`, `UnauthorisedException → sessionExpired`, `ServerException → server`, `NetworkException → network`); typed `quantity`/`unit` not mutated; dispose cancels in-flight token within 500 ms with no further `state =` writes
    - **Property 11: Retry counter monotonicity** — `Glados<int>(numFailures)`; assert `retriesRemainingForLookup` is monotonically non-increasing, starts at `3` after the first failure, never drops below `0`, the modal's Retry button is disabled iff the counter is `0`, and the same invariants hold for the add path; a fresh `submitBarcode` resets to `3`; a fresh `confirmAdd` with a different ingredient resets the add counter to `3`
    - Example test for Requirement 9.2 — `Scan_State` transitions to `ScanLookingUp` within 100 ms of a valid camera detection
    - Example test for Requirement 12.6 — second valid detection within 1000 ms is deferred (most-recent-wins)
    - **Validates: Requirements 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 6.3, 6.4, 6.5, 8.10, 9.2, 9.3, 11.4, 11.5, 11.8, 12.5, 12.6, 12.7**

- [x] 5. Mid-build checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement the barcode screens
  - [x] 6.1 Implement `BarcodeScannerScreen` in `mobile/lib/features/barcode/presentation/barcode_scanner_screen.dart`
    - Touch only `mobile/lib/features/barcode/presentation/barcode_scanner_screen.dart`
    - `ConsumerStatefulWidget` registering itself as `WidgetsBindingObserver` to forward `AppLifecycleState` to the notifier per Requirements 2.7, 2.8, 2.9, 2.10
    - Watches `barcodeNotifierProvider` and renders per the design's per-state branch table: `ScanIdle` → tap-to-start CTA + post-frame `notifier.startSession()`; `ScanRequestingPermission` → spinner; `ScanPermissionDenied(reason)` → inline error region per Requirements 11.1, 11.2, 11.3 with the appropriate button (`"Grant Permission"`/`"Open Settings"` via `url_launcher ^6.3.0`/`"Use Manual Entry"`); `ScanCameraActive` → camera preview + 250-logical-pixel viewfinder overlay with four corner markers + the literal instruction text `"Point camera at barcode"` below per Requirement 9.1; `ScanLookingUp` → preview + non-blocking centred loading card with the literal text `"Looking up product..."` per Requirement 9.2; `ScanProductNotFound` → modal alert with title `"Product Not Found"`, body `"This product is not in our database. You can add it manually."`, two buttons `"Manual Entry"` / `"Try Again"` per Requirement 9.4; `ScanFailed(reason: network|server)` → "Lookup Failed" modal per Requirements 11.4, 11.5 gated on `notifier.retriesRemainingForLookup`; `ScanFailed(reason: cameraUnavailable)` → inline error region per Requirement 12.3
    - Bottom controls: exactly two buttons `"Cancel"` and `"Manual Entry"` per Requirement 9.10, interactive in every state except `ScanAdding` (which is observed on the confirmation screen, not here)
    - Trigger a single haptic-feedback impulse of "medium" intensity on transition to `ScanLookingUp` per Requirement 9.2
    - On screen pop (`PopScope`/`WillPopScope`) call `notifier.reset()` per Requirement 9.11
    - On `ScanProductFound` push the `ScannedProductConfirmationScreen`; on the user dismissing confirmation via back gesture transition to `ScanCameraActive` per the state diagram
    - Architecture lint compliant: no `Color(` literal — every colour resolves to a token in `app_colours.dart` per Requirement 1.7; no `FutureBuilder` — every async branch reads `Scan_State` via `AsyncValue.when` per Requirement 9.12; no `Dio(` or `GoRouter(` construction; no import from `features/auth/` directly
    - _Requirements: 1.5, 1.7, 2.7, 2.8, 2.9, 2.10, 9.1, 9.2, 9.4, 9.10, 9.11, 9.12, 11.1, 11.2, 11.3, 11.4, 11.5, 12.3_

  - [ ]* 6.2 Write widget tests for `BarcodeScannerScreen` in `mobile/test/features/barcode/presentation/barcode_scanner_screen_test.dart`
    - Touch only `mobile/test/features/barcode/presentation/barcode_scanner_screen_test.dart`
    - Render the screen under each `Scan_State` variant via a `ProviderScope.overrides` swapping `barcodeNotifierProvider` for a fake notifier
    - Example test for Requirement 9.1 — viewfinder is 250 logical pixels and the literal `"Point camera at barcode"` instruction is rendered
    - Example test for Requirement 9.2 — `ScanLookingUp` renders the literal `"Looking up product..."` loading card
    - Example test for Requirement 9.4 — `ScanProductNotFound` renders the modal with the literal title/body and the two action buttons
    - Example test for Requirement 11.1 — `ScanPermissionDenied(denied)` renders the literal `"Camera access is needed to scan barcodes."` and the `"Grant Permission"` button
    - Example test for Requirement 11.2 — `ScanPermissionDenied(permanentlyDenied)` renders the literal `"Camera access is blocked. Please enable it in Settings."` and the `"Open Settings"` button
    - Example test for Requirement 11.3 — `ScanPermissionDenied(unavailable)` renders the literal `"Camera is not available on this device."` and does NOT render the camera preview or the `"Grant Permission"` button
    - Example test for Requirement 11.4 / 11.5 — modal `"Retry"` button is disabled iff `retriesRemainingForLookup == 0` and renders the tooltip `"Retry limit reached. Try Manual Entry."`
    - Example test for Requirement 9.9 — every error string rendered comes from the static catalogue, never from a raw `DioException` or HTTP status
    - **Validates: Requirements 9.1, 9.2, 9.4, 9.9, 9.10, 11.1, 11.2, 11.3, 11.4, 11.5**

  - [x] 6.3 Implement `ManualBarcodeEntryScreen` in `mobile/lib/features/barcode/presentation/manual_barcode_entry_screen.dart`
    - Touch only `mobile/lib/features/barcode/presentation/manual_barcode_entry_screen.dart`
    - `ConsumerStatefulWidget` owning a `TextEditingController` for the input field and local error-message state
    - Single digit-only `TextField` with `keyboardType: TextInputType.number`, `maxLength: 13`, label `"Enter Barcode"`, and a `FilteringTextInputFormatter.digitsOnly` so non-digit characters are silently dropped at insertion per Requirement 10.1
    - `"Lookup Product"` submit button disabled when input is empty or while `Scan_State == ScanLookingUp` per Requirement 10.2; small `CircularProgressIndicator` next to the button while in `ScanLookingUp`
    - Informational note above the input rendering the literal `"Camera is unavailable; enter the barcode by hand."` when the screen was reached because of `Camera_Permission_State == unavailable` per Requirement 10.7 (read from a route argument)
    - Inline error region(s): regex failure renders the literal `"Barcode must be 8 to 13 digits"` per Requirements 3.4, 10.3; `ScanProductNotFound` after manual entry renders the literal `"Product not found in the Open Food Facts database. Try a different barcode or add the ingredient by hand from the pantry screen."` per Requirement 10.5 (NOT the modal alert from Requirement 9.4); `ScanFailed(network|server)` renders the inline message per Requirement 10.6 — the error clears on input change or new submit
    - On submit calls `notifier.submitBarcode(controller.text)` per Requirement 10.5 (shared code path with camera detection); the screen does NOT push the confirmation screen — the scanner screen does, in response to `ScanProductFound`
    - Architecture lint compliant: no `Color(` literals, no `FutureBuilder`, no `Dio(`/`GoRouter(` construction, no import from `features/auth/`
    - _Requirements: 1.5, 1.7, 3.4, 3.6, 9.12, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ]* 6.4 Write widget tests for `ManualBarcodeEntryScreen` in `mobile/test/features/barcode/presentation/manual_barcode_entry_screen_test.dart`
    - Touch only `mobile/test/features/barcode/presentation/manual_barcode_entry_screen_test.dart`
    - Example test for Requirement 10.1 — typing non-digit characters (letters, punctuation, whitespace) results in the field staying digits-only via `FilteringTextInputFormatter.digitsOnly`
    - Example test for Requirement 10.2 — `"Lookup Product"` button is disabled when the field is empty and while `Scan_State == ScanLookingUp`
    - Example test for Requirement 10.3 — submitting `"abc"` (after a hypothetical non-digit slip) or a 7-digit string renders the literal `"Barcode must be 8 to 13 digits"` and `notifier.submitBarcode` is invoked, but no HTTP request is issued (the repository's regex gate produces the inline error)
    - Example test for Requirement 10.5 — `ScanProductNotFound` after manual submit renders the inline message, NOT the modal alert; the input field stays populated so the user can correct a typo
    - Example test for Requirement 10.7 — informational note renders only when the route argument indicates `Camera_Permission_State == unavailable`
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.7**

  - [x] 6.5 Implement `ScannedProductConfirmationScreen` in `mobile/lib/features/barcode/presentation/scanned_product_confirmation_screen.dart`
    - Touch only `mobile/lib/features/barcode/presentation/scanned_product_confirmation_screen.dart`
    - `ConsumerStatefulWidget` (because `quantity` and `unit` are user-editable) reading `Scan_State`; renders only when state is `ScanProductFound(product)`, `ScanAdding(ingredient)`, `ScanAdded(_)`, or `ScanFailed` with a confirmation-relevant reason
    - Hero region: `name`, `brand` (when non-null), `category` (when non-null), `imageUrl` rendered through `cached_network_image ^3.3.1` (Foundation Requirement 10.7) when non-null, per Requirement 9.5
    - Editable form: `quantity` `TextFormField` (default `1`, validated for `> 0 && <= 9999`) and `unit` `TextFormField` (default `"piece"`, max 32 chars) per Requirement 9.5
    - Primary `"Add to Pantry"` button disabled while `Scan_State == ScanAdding` per Requirement 9.6; tap calls `notifier.confirmAdd(IngredientToAdd.fromScannedProduct(product, quantity: q, unit: u))`
    - On `ScanAdded`, render a non-blocking success banner with the literal `"<addedIngredientName> has been added to your inventory"` text per Requirement 9.7 — using `addedIngredientName` from the `ScanAdded` payload when available, falling back to `Scanned_Product.name` otherwise; the screen and its parents pop within 1 second per Requirement 9.7
    - On `ScanFailed(reason: validation, ...)` render the validation message inline above the form per Requirement 11.6, re-enable the form, and preserve the user's typed `quantity`/`unit` values
    - On `ScanFailed(reason: server | network, ...)` from the add path render the "Add Failed" modal with the `"Retry"` button gated on `notifier.retriesRemainingForAdd` per Requirement 11.8
    - Architecture lint compliant: no `Color(` literal, no `FutureBuilder`, no `Dio(`/`GoRouter(` construction, no import from `features/auth/`
    - _Requirements: 1.5, 1.7, 9.5, 9.6, 9.7, 9.8, 11.6, 11.7, 11.8, 11.9_

  - [ ]* 6.6 Write widget tests for `ScannedProductConfirmationScreen` in `mobile/test/features/barcode/presentation/scanned_product_confirmation_screen_test.dart`
    - Touch only `mobile/test/features/barcode/presentation/scanned_product_confirmation_screen_test.dart`
    - Example test for Requirement 9.5 — hero region renders product `name`, omits `brand`/`category`/`imageUrl` when null, renders them via `cached_network_image` when non-null
    - Example test for Requirement 9.6 — `"Add to Pantry"` button is disabled while `Scan_State == ScanAdding`
    - Example test for Requirement 9.7 — `ScanAdded(addedIngredientName)` renders the success banner with the literal `"<name> has been added to your inventory"`; falls back to the product's `name` when `addedIngredientName` is null
    - Example test for Requirement 11.6 — `ScanFailed(validation)` renders the message inline and the user's typed `quantity`/`unit` are preserved
    - Example test for Requirement 11.8 — `ScanFailed(server)` from the add path renders the "Add Failed" modal; Retry button gated on `retriesRemainingForAdd`
    - Example test for Requirement 9.8 — quantity validator rejects `0`, negative values, and `> 9999`
    - **Validates: Requirements 9.5, 9.6, 9.7, 9.8, 11.6, 11.8**

- [x] 7. Wire the barcode routes into the foundation router
  - [x] 7.1 Declare barcode route constants in `mobile/lib/core/router/routes.dart`
    - Touch only `mobile/lib/core/router/routes.dart`
    - Add three `static const String` route paths and names for the scanner, manual-entry, and confirmation screens (e.g. `barcodeScannerPath = '/barcode/scan'`, `barcodeManualEntryPath = '/barcode/manual'`, `barcodeConfirmPath = '/barcode/confirm'`)
    - This is the only allowed touch of `core/router/` for this feature; the foundation's existing redirect rule (Foundation Requirement 5.7) plus the Auth_Feature's `authStateProvider` override (Auth Requirement 7.2) drive the unauthenticated-user redirect per Requirement 6.1 — NO new redirect rule is added
    - _Requirements: 6.1, 6.2_

  - [x] 7.2 Add barcode routes to the GoRouter configuration in `mobile/lib/core/router/app_router.dart`
    - Touch only `mobile/lib/core/router/app_router.dart`
    - Add three `GoRoute` entries inside the authenticated portion of the router (the `StatefulShellRoute.indexedStack` per Foundation Requirement 5.5) using the constants from `routes.dart`; each builder constructs the corresponding screen widget
    - Do NOT add a new redirect rule; the existing rule applies the `authStateProvider` override automatically per Requirement 6.1
    - This is the only allowed touch of `core/router/app_router.dart` for this feature
    - _Requirements: 6.1_

- [x] 8. Mid-build checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Integration tests
  - [ ]* 9.1 Write `mobile/integration_test/barcode_router_redirect_test.dart`
    - Touch only `mobile/integration_test/barcode_router_redirect_test.dart`
    - Boot the app under a `ProviderScope.overrides` swapping `dioProvider` for a fake transport and `secureStorageProvider` for empty in-memory storage
    - Navigate the router to the barcode-scanner route; assert the router lands on `/auth/login` within 500 ms of the navigation per Requirement 6.1, exercising the Auth_Feature's existing redirect wiring
    - Verify the `BarcodeScannerScreen` widget is never constructed in the unauthenticated case
    - **Validates: Requirements 6.1**

  - [ ]* 9.2 Write `mobile/integration_test/barcode_session_expired_test.dart`
    - Touch only `mobile/integration_test/barcode_session_expired_test.dart`
    - Boot the app with a valid JWT pre-loaded in the in-memory storage; navigate to the scanner; drive a successful camera detection (via a fake `CameraController` injecting a barcode into `rawDetections`) through to the confirmation screen
    - Configure the fake transport to return `401` for `POST /api/v1/ingredients`; tap `"Add to Pantry"`
    - Assert the router redirects to `/auth/login` and `Auth_State` becomes `AuthUnauthenticated('Your session has expired')` per Auth Requirement 8.4 and Barcode Requirements 5.8, 11.7
    - Verify `SecureStorage.clearAll` was invoked exactly once and the Barcode_Feature did not render its own session-expired modal per Requirement 11.7
    - **Validates: Requirements 5.8, 11.7**

- [x] 10. Final checkpoint — full verification suite
  - From `mobile/`, run `flutter test`, `flutter analyze`, `dart run tool/check_architecture.dart`, `dart run tool/check_structure.dart`, `dart run tool/check_packages.dart`, `dart run tool/check_secrets.dart`
  - All six commands MUST report green; report the result and ask the user if any questions arise
  - This is the gate that "the spec is done" — the same gate the foundation_phase and auth port used per Requirement 13.1, 13.3, 13.4
  - _Requirements: 13.1, 13.3, 13.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery; core implementation tasks (source files, manifest strings, theme tokens, route wiring) are never marked optional
- Each task touches exactly one file so independent tasks within a wave can run in parallel under Run-All-Tasks without write conflicts
- Property tests reference the design document's twelve correctness properties; each property's test sub-task explicitly cites its property number and the requirements clauses it validates per Requirement 13.6
- No new package is added to `mobile/pubspec.yaml` per Requirement 13.2 — `mobile_scanner ^5.1.1`, `cached_network_image ^3.3.1`, `url_launcher ^6.3.0`, and `glados ^1.1.6` are all already pinned by Foundation_Phase or Auth_Feature
- Only three files under `mobile/lib/core/` are touched by this spec: `core/theme/app_colours.dart` (theme tokens per Requirement 1.7), `core/router/routes.dart` (route constants), and `core/router/app_router.dart` (route wiring) — the seam file `core/network/barcode_api_client.dart` is created fresh per Requirement 1.1 and is not a modification of an existing file. No `ProviderScope` override is added in `main.dart` per Requirement 8.4
- The architectural-enforcement scripts (`tool/check_*.dart`) and the `very_good_analysis` lint set stay unchanged; the final-checkpoint task is the gate that proves it per Requirement 13.1

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "7.1"] },
    { "id": 1, "tasks": ["2.1", "2.5", "3.1", "3.2"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.8", "3.5"] },
    { "id": 3, "tasks": ["2.4", "2.6", "3.3", "3.6", "3.7"] },
    { "id": 4, "tasks": ["2.7", "3.4", "3.8"] },
    { "id": 5, "tasks": ["3.9", "4.1"] },
    { "id": 6, "tasks": ["4.2", "6.1", "6.3", "6.5"] },
    { "id": 7, "tasks": ["6.2", "6.4", "6.6", "7.2"] },
    { "id": 8, "tasks": ["9.1", "9.2"] }
  ]
}
```
