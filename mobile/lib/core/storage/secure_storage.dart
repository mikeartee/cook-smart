// Abstract interface for sensitive value storage (e.g. JWT, refresh tokens).
//
// The concrete adapter (`FlutterSecureStorageAdapter`) is the only file in the
// project allowed to import `package:flutter_secure_storage`. Feature code
// depends on this interface via the `secureStorageProvider` Riverpod provider,
// so the storage backend can be swapped without touching feature code.
//
// See: Requirements 11.1 (interface signatures), 11.2 (typed failure surface),
// 11.3 (no `flutter_secure_storage` imports outside the storage layer).

/// The [SecureStorage] operation that failed.
///
/// Carried by [StorageException] so callers can react to a failure without
/// having to inspect a free-text message.
enum SecureStorageOperation {
  /// A `writeToken` call failed.
  write,

  /// A `readToken` call failed.
  read,

  /// A `deleteToken` call failed.
  delete,

  /// A `clearAll` call failed.
  clearAll,
}

/// Thrown when a [SecureStorage] operation fails because the underlying
/// platform keystore is unavailable, denied, or otherwise rejects the
/// operation.
///
/// Per Requirement 11.2, when this exception is raised any previously stored
/// values must remain unchanged. The [operation] field identifies which
/// [SecureStorage] method failed; [message] is a human-readable summary; and
/// [cause] preserves the original platform error for diagnostics without
/// leaking the underlying transport library type to callers.
class StorageException implements Exception {
  /// Creates a [StorageException] describing a failed [SecureStorage] call.
  const StorageException(
    this.operation,
    this.message, {
    this.cause,
  });

  /// The [SecureStorage] operation that failed.
  final SecureStorageOperation operation;

  /// A human-readable description of the failure.
  final String message;

  /// The underlying platform error, if available. Kept as [Object] so the
  /// transport library type (e.g. `PlatformException`) does not leak past
  /// the storage layer boundary.
  final Object? cause;

  @override
  String toString() => 'StorageException(${operation.name}): $message';
}

/// Sensitive value storage abstraction backed by the platform keystore.
///
/// Keys are non-empty strings of 1 to 128 characters. Values are strings of
/// 0 to 4096 characters. Implementations are expected to validate these
/// bounds and translate platform-keystore failures into [StorageException]
/// instances tagged with the matching [SecureStorageOperation], preserving
/// any previously stored values when a call fails.
abstract class SecureStorage {
  /// Writes [value] under [key] to the platform keystore.
  ///
  /// [key] must be non-empty and at most 128 characters.
  /// [value] must be at most 4096 characters.
  ///
  /// Throws [StorageException] with [SecureStorageOperation.write] if the
  /// platform keystore is unavailable or rejects the write.
  Future<void> writeToken(String key, String value);

  /// Reads the value previously stored under [key], or `null` if no value
  /// is stored for that [key].
  ///
  /// [key] must be non-empty and at most 128 characters.
  ///
  /// Throws [StorageException] with [SecureStorageOperation.read] if the
  /// platform keystore is unavailable or rejects the read.
  Future<String?> readToken(String key);

  /// Deletes the value stored under [key], if any.
  ///
  /// [key] must be non-empty and at most 128 characters.
  ///
  /// Throws [StorageException] with [SecureStorageOperation.delete] if the
  /// platform keystore is unavailable or rejects the delete.
  Future<void> deleteToken(String key);

  /// Removes every value owned by this [SecureStorage] instance.
  ///
  /// Throws [StorageException] with [SecureStorageOperation.clearAll] if the
  /// platform keystore is unavailable or rejects the clear.
  Future<void> clearAll();
}
