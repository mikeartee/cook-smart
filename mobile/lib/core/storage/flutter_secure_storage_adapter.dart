// Concrete [SecureStorage] adapter backed by `package:flutter_secure_storage`.
//
// This file is the single import site for `package:flutter_secure_storage`
// in the entire `mobile/` project. The architectural enforcement script
// `tool/check_architecture.dart` fails the build if any other source file
// imports the package, so that swapping the storage backend is a one-file
// change rather than a sweep across every feature (Requirement 11.3).
//
// Responsibilities of this adapter:
//
//   * Implement every method declared on [SecureStorage] (Requirement 11.1).
//   * Validate keys (1 to 128 characters, non-empty) and values (0 to 4096
//     characters) before delegating to the platform plugin (Requirement
//     11.1).
//   * Translate platform-keystore failures (Android Keystore, iOS Keychain,
//     etc.) into typed [StorageException] instances tagged with the
//     [SecureStorageOperation] that failed, capturing the underlying error
//     in `cause` without leaking transport types past this layer
//     (Requirement 11.2).
//   * Preserve previously stored values on failure (Requirement 11.2). The
//     `flutter_secure_storage` 9.x API exposes only single-key
//     `read`/`write`/`delete`/`deleteAll` operations and never performs
//     partial writes that mutate other keys, so this guarantee is
//     satisfied implicitly: a thrown `PlatformException` from the plugin
//     means the targeted entry was either fully written or fully not
//     written, and every other key in the keystore is untouched.
//
// Reference: Requirements 10.1, 11.1, 11.2, 11.3 of the
// flutter-migration-architecture spec.

import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:mobile/core/storage/secure_storage.dart';

/// Maximum permitted length of a [SecureStorage] key, in characters.
const int _maxKeyLength = 128;

/// Maximum permitted length of a [SecureStorage] value, in characters.
const int _maxValueLength = 4096;

/// Adapter that implements [SecureStorage] on top of
/// `package:flutter_secure_storage`.
///
/// Construct one instance per app and expose it via
/// `secureStorageProvider`. The adapter is stateless apart from the
/// underlying [FlutterSecureStorage] handle, so it is safe to share across
/// the entire widget tree.
///
/// On Android, the canonical configuration uses
/// `EncryptedSharedPreferences` for the storage container, matching the
/// security posture of the legacy React Native app's secure storage and
/// the recommendation in `flutter_secure_storage` 9.x for Android API 23+.
class FlutterSecureStorageAdapter implements SecureStorage {
  /// Creates an adapter that delegates to [storage] (defaults to a
  /// fresh [FlutterSecureStorage] configured with [_defaultAndroidOptions]).
  FlutterSecureStorageAdapter({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: _defaultAndroidOptions,
            );

  /// Canonical Android configuration for the cook-smart app. Backing the
  /// keystore with `EncryptedSharedPreferences` keeps secrets encrypted at
  /// rest and is the option recommended by the plugin maintainers for
  /// Android API 23 and newer.
  static const AndroidOptions _defaultAndroidOptions = AndroidOptions(
    encryptedSharedPreferences: true,
  );

  final FlutterSecureStorage _storage;

  @override
  Future<void> writeToken(String key, String value) async {
    _validateKey(key, SecureStorageOperation.write);
    _validateValue(value, SecureStorageOperation.write);
    try {
      await _storage.write(key: key, value: value);
    } on PlatformException catch (error, stackTrace) {
      Error.throwWithStackTrace(
        _toStorageException(SecureStorageOperation.write, error),
        stackTrace,
      );
    } on Object catch (error, stackTrace) {
      Error.throwWithStackTrace(
        _toStorageException(SecureStorageOperation.write, error),
        stackTrace,
      );
    }
  }

  @override
  Future<String?> readToken(String key) async {
    _validateKey(key, SecureStorageOperation.read);
    try {
      return await _storage.read(key: key);
    } on PlatformException catch (error, stackTrace) {
      Error.throwWithStackTrace(
        _toStorageException(SecureStorageOperation.read, error),
        stackTrace,
      );
    } on Object catch (error, stackTrace) {
      Error.throwWithStackTrace(
        _toStorageException(SecureStorageOperation.read, error),
        stackTrace,
      );
    }
  }

  @override
  Future<void> deleteToken(String key) async {
    _validateKey(key, SecureStorageOperation.delete);
    try {
      await _storage.delete(key: key);
    } on PlatformException catch (error, stackTrace) {
      Error.throwWithStackTrace(
        _toStorageException(SecureStorageOperation.delete, error),
        stackTrace,
      );
    } on Object catch (error, stackTrace) {
      Error.throwWithStackTrace(
        _toStorageException(SecureStorageOperation.delete, error),
        stackTrace,
      );
    }
  }

  @override
  Future<void> clearAll() async {
    try {
      await _storage.deleteAll();
    } on PlatformException catch (error, stackTrace) {
      Error.throwWithStackTrace(
        _toStorageException(SecureStorageOperation.clearAll, error),
        stackTrace,
      );
    } on Object catch (error, stackTrace) {
      Error.throwWithStackTrace(
        _toStorageException(SecureStorageOperation.clearAll, error),
        stackTrace,
      );
    }
  }

  /// Validates that [key] is non-empty and at most [_maxKeyLength]
  /// characters. Throws a [StorageException] tagged with [operation] when
  /// the key is out of bounds, so the caller sees a consistent error type
  /// regardless of whether validation or the platform keystore rejected
  /// the request.
  void _validateKey(String key, SecureStorageOperation operation) {
    if (key.isEmpty) {
      throw StorageException(
        operation,
        'Key must be a non-empty string of 1 to $_maxKeyLength characters.',
      );
    }
    if (key.length > _maxKeyLength) {
      throw StorageException(
        operation,
        'Key length ${key.length} exceeds the maximum of '
        '$_maxKeyLength characters.',
      );
    }
  }

  /// Validates that [value] is at most [_maxValueLength] characters.
  /// Throws a [StorageException] tagged with [operation] when the value
  /// is too long.
  void _validateValue(String value, SecureStorageOperation operation) {
    if (value.length > _maxValueLength) {
      throw StorageException(
        operation,
        'Value length ${value.length} exceeds the maximum of '
        '$_maxValueLength characters.',
      );
    }
  }

  /// Wraps a platform or unexpected error in a [StorageException] tagged
  /// with the [operation] that failed. The original error is preserved
  /// in `cause` so diagnostics (logs, Crashlytics) can still see the full
  /// context, but the transport library type does not leak past this
  /// adapter.
  StorageException _toStorageException(
    SecureStorageOperation operation,
    Object error,
  ) {
    if (error is PlatformException) {
      final code = error.code;
      final message = error.message ?? 'unknown platform error';
      return StorageException(
        operation,
        'Platform keystore rejected ${operation.name}: '
        '$code — $message',
        cause: error,
      );
    }
    return StorageException(
      operation,
      'Unexpected error during ${operation.name}: $error',
      cause: error,
    );
  }
}
