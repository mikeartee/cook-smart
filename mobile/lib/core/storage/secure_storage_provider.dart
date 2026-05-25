// Riverpod provider that exposes the application's [SecureStorage] singleton.
//
// Feature code never imports `package:flutter_secure_storage` directly
// (Requirement 11.3) and never instantiates the adapter on its own
// (Requirement 11.6). Instead, every consumer reaches the storage layer
// through this provider:
//
// ```dart
// final storage = ref.read(secureStorageProvider);
// await storage.writeToken('jwt', token);
// ```
//
// Because [FlutterSecureStorageAdapter] is stateless apart from its
// underlying [FlutterSecureStorage] handle, a single instance is created
// for the lifetime of the app's `ProviderScope`. Swapping the storage
// backend (for example, to an in-memory fake in tests) is a one-file
// change: override this provider with `secureStorageProvider.overrideWith`
// in the test's `ProviderScope`.
//
// The hand-written `Provider<SecureStorage>` form is used here rather
// than the `@riverpod`-annotated generated form because the value is
// fully synchronous and stateless; the generated form would add a
// `.g.dart` part file without any behavioural difference. Requirement
// 3.8 permits the hand-written form when generated code adds no value.
//
// Reference: Requirements 3.1, 3.2, 3.8, 11.6 of the
// flutter-migration-architecture spec.

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:mobile/core/storage/flutter_secure_storage_adapter.dart';
import 'package:mobile/core/storage/secure_storage.dart';

/// Application-wide [SecureStorage] singleton, backed by
/// [FlutterSecureStorageAdapter].
///
/// Consume this provider from any widget, controller, or other provider
/// that needs to read or write JWTs, refresh tokens, or other sensitive
/// values:
///
/// ```dart
/// final storage = ref.read(secureStorageProvider);
/// await storage.writeToken('jwt', jwt);
/// ```
///
/// In tests, replace the adapter with a fake or mock by overriding the
/// provider at the `ProviderScope`:
///
/// ```dart
/// ProviderScope(
///   overrides: [
///     secureStorageProvider.overrideWithValue(InMemorySecureStorage()),
///   ],
///   child: const App(),
/// );
/// ```
final Provider<SecureStorage> secureStorageProvider =
    Provider<SecureStorage>((ref) => FlutterSecureStorageAdapter());
