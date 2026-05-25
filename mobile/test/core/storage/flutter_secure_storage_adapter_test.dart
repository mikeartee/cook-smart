// Mirrored unit tests for `lib/core/storage/flutter_secure_storage_adapter.dart`.
//
// Validates Requirements 11.1 (interface signatures and bounds) and 11.2
// (typed failure surface and value preservation on failure) of the
// flutter-migration-architecture spec.
//
// `mocktail` is used to inject a fake [FlutterSecureStorage] so these tests
// run on the Dart VM without a platform channel.

import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/storage/flutter_secure_storage_adapter.dart';
import 'package:mobile/core/storage/secure_storage.dart';
import 'package:mocktail/mocktail.dart';

class _MockFlutterSecureStorage extends Mock
    implements FlutterSecureStorage {}

void main() {
  late _MockFlutterSecureStorage storage;
  late FlutterSecureStorageAdapter adapter;

  const validKey = 'auth_token';
  const validValue = 'jwt-value';

  Matcher hasOperation(SecureStorageOperation operation) {
    return isA<StorageException>().having(
      (e) => e.operation,
      'operation',
      operation,
    );
  }

  setUp(() {
    storage = _MockFlutterSecureStorage();
    adapter = FlutterSecureStorageAdapter(storage: storage);
  });

  group('happy paths', () {
    test('writeToken calls underlying write(key, value) exactly once',
        () async {
      when(() => storage.write(key: validKey, value: validValue))
          .thenAnswer((_) async {});

      await adapter.writeToken(validKey, validValue);

      verify(() => storage.write(key: validKey, value: validValue))
          .called(1);
    });

    test('readToken returns the underlying read result', () async {
      when(() => storage.read(key: validKey))
          .thenAnswer((_) async => validValue);

      final result = await adapter.readToken(validKey);

      expect(result, equals(validValue));
      verify(() => storage.read(key: validKey)).called(1);
    });

    test('readToken propagates a null result from the underlying storage',
        () async {
      when(() => storage.read(key: validKey)).thenAnswer((_) async => null);

      final result = await adapter.readToken(validKey);

      expect(result, isNull);
      verify(() => storage.read(key: validKey)).called(1);
    });

    test('deleteToken calls underlying delete(key)', () async {
      when(() => storage.delete(key: validKey)).thenAnswer((_) async {});

      await adapter.deleteToken(validKey);

      verify(() => storage.delete(key: validKey)).called(1);
    });

    test('clearAll calls underlying deleteAll', () async {
      when(() => storage.deleteAll()).thenAnswer((_) async {});

      await adapter.clearAll();

      verify(() => storage.deleteAll()).called(1);
    });
  });

  group('PlatformException is mapped to StorageException', () {
    final platformError = PlatformException(
      code: 'KEYSTORE_UNAVAILABLE',
      message: 'Android keystore is locked',
    );

    test('write failure tags operation=write', () async {
      when(() => storage.write(key: validKey, value: validValue))
          .thenThrow(platformError);

      await expectLater(
        adapter.writeToken(validKey, validValue),
        throwsA(hasOperation(SecureStorageOperation.write)),
      );
    });

    test('read failure tags operation=read', () async {
      when(() => storage.read(key: validKey)).thenThrow(platformError);

      await expectLater(
        adapter.readToken(validKey),
        throwsA(hasOperation(SecureStorageOperation.read)),
      );
    });

    test('delete failure tags operation=delete', () async {
      when(() => storage.delete(key: validKey)).thenThrow(platformError);

      await expectLater(
        adapter.deleteToken(validKey),
        throwsA(hasOperation(SecureStorageOperation.delete)),
      );
    });

    test('clearAll failure tags operation=clearAll', () async {
      when(() => storage.deleteAll()).thenThrow(platformError);

      await expectLater(
        adapter.clearAll(),
        throwsA(hasOperation(SecureStorageOperation.clearAll)),
      );
    });

    test('the underlying PlatformException is preserved as cause', () async {
      when(() => storage.write(key: validKey, value: validValue))
          .thenThrow(platformError);

      try {
        await adapter.writeToken(validKey, validValue);
        fail('expected StorageException');
      } on StorageException catch (e) {
        expect(e.cause, same(platformError));
      }
    });
  });

  group('input validation rejects invalid arguments before delegating', () {
    test('empty key throws StorageException(operation: write)', () async {
      await expectLater(
        adapter.writeToken('', validValue),
        throwsA(hasOperation(SecureStorageOperation.write)),
      );
      verifyZeroInteractions(storage);
    });

    test('key longer than 128 chars throws StorageException(operation: write)',
        () async {
      final tooLongKey = 'k' * 129;

      await expectLater(
        adapter.writeToken(tooLongKey, validValue),
        throwsA(hasOperation(SecureStorageOperation.write)),
      );
      verifyZeroInteractions(storage);
    });

    test(
      'value longer than 4096 chars throws StorageException(operation: write)',
      () async {
        final tooLongValue = 'v' * 4097;

        await expectLater(
          adapter.writeToken(validKey, tooLongValue),
          throwsA(hasOperation(SecureStorageOperation.write)),
        );
        verifyZeroInteractions(storage);
      },
    );
  });

  group('value preservation on failure', () {
    test(
      'a failing write does not trigger any read on the underlying storage',
      () async {
        when(() => storage.write(key: validKey, value: validValue))
            .thenThrow(
          PlatformException(code: 'KEYSTORE_UNAVAILABLE'),
        );

        await expectLater(
          adapter.writeToken(validKey, validValue),
          throwsA(isA<StorageException>()),
        );

        verifyNever(() => storage.read(key: any(named: 'key')));
      },
    );
  });
}
