// Unit tests for `lib/core/network/auth_interceptor.dart`.
//
// Covers Requirements 4.2 (auth header injection) and 4.13 (missing-JWT
// failure path). Each test exercises the interceptor with a mocked
// `SecureStorage` and a recording `RequestInterceptorHandler` so we can
// assert which terminal handler call (`next` / `reject` / `resolve`)
// was invoked and inspect the carried payload.

// External libraries
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

// Internal modules
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/network/auth_interceptor.dart';
import 'package:mobile/core/storage/secure_storage.dart';

class _MockSecureStorage extends Mock implements SecureStorage {}

/// Records the terminal handler call made by the interceptor without
/// completing the underlying base-handler future, so unawaited futures
/// do not leak between tests.
class _RecordingRequestHandler extends RequestInterceptorHandler {
  String? action;
  RequestOptions? nextedOptions;
  DioException? rejectedError;
  bool? rejectedCallFollowingErrorInterceptor;

  @override
  void next(RequestOptions requestOptions) {
    action = 'next';
    nextedOptions = requestOptions;
  }

  @override
  void reject(
    DioException error, [
    bool callFollowingErrorInterceptor = false,
  ]) {
    action = 'reject';
    rejectedError = error;
    rejectedCallFollowingErrorInterceptor = callFollowingErrorInterceptor;
  }

  @override
  void resolve(
    Response<dynamic> response, [
    bool callFollowingResponseInterceptor = false,
  ]) {
    action = 'resolve';
  }
}

RequestOptions _options({
  String path = '/recipes',
  Map<String, dynamic>? extra,
  Map<String, dynamic>? headers,
}) {
  return RequestOptions(
    path: path,
    extra: extra ?? <String, dynamic>{},
    headers: headers ?? <String, dynamic>{},
  );
}

void main() {
  late _MockSecureStorage storage;
  late AuthInterceptor interceptor;

  setUp(() {
    storage = _MockSecureStorage();
    interceptor = AuthInterceptor(storage);
  });

  group('AuthInterceptor.onRequest auth header injection', () {
    test(
      'request without requiresAuth flag and a stored JWT '
      'forwards via handler.next with Authorization: Bearer <jwt>',
      () async {
        when(() => storage.readToken(AuthInterceptor.jwtTokenKey))
            .thenAnswer((_) async => 'STORED_JWT');

        final handler = _RecordingRequestHandler();
        final options = _options();

        await interceptor.onRequest(options, handler);

        expect(handler.action, 'next');
        expect(handler.nextedOptions, isNotNull);
        expect(
          handler.nextedOptions!.headers['Authorization'],
          'Bearer STORED_JWT',
        );
        verify(() => storage.readToken(AuthInterceptor.jwtTokenKey)).called(1);
      },
    );

    test(
      'request with extra {requiresAuth: false} forwards via handler.next '
      'and never reads storage and never sets an Authorization header',
      () async {
        final handler = _RecordingRequestHandler();
        final options = _options(
          extra: <String, dynamic>{
            AuthInterceptor.requiresAuthExtraKey: false,
          },
        );

        await interceptor.onRequest(options, handler);

        expect(handler.action, 'next');
        expect(
          handler.nextedOptions!.headers.containsKey('Authorization'),
          isFalse,
        );
        verifyNever(() => storage.readToken(any()));
      },
    );

    test(
      'request with a non-bool requiresAuth value (e.g. the string "true") '
      'is treated as authenticated (least-surprise default)',
      () async {
        when(() => storage.readToken(AuthInterceptor.jwtTokenKey))
            .thenAnswer((_) async => 'STORED_JWT');

        final handler = _RecordingRequestHandler();
        final options = _options(
          extra: <String, dynamic>{
            AuthInterceptor.requiresAuthExtraKey: 'true',
          },
        );

        await interceptor.onRequest(options, handler);

        expect(handler.action, 'next');
        expect(
          handler.nextedOptions!.headers['Authorization'],
          'Bearer STORED_JWT',
        );
        verify(() => storage.readToken(AuthInterceptor.jwtTokenKey)).called(1);
      },
    );
  });

  group('AuthInterceptor.onRequest missing-JWT failure path', () {
    test(
      'authenticated request with null JWT in storage rejects with '
      'UnauthorisedException and never sets an Authorization header',
      () async {
        when(() => storage.readToken(AuthInterceptor.jwtTokenKey))
            .thenAnswer((_) async => null);

        final handler = _RecordingRequestHandler();
        final options = _options(path: '/recipes/search');

        await interceptor.onRequest(options, handler);

        expect(handler.action, 'reject');
        expect(handler.rejectedError, isNotNull);
        expect(handler.rejectedError!.error, isA<UnauthorisedException>());
        final unauth = handler.rejectedError!.error! as UnauthorisedException;
        expect(unauth.message, contains('No JWT'));
        expect(unauth.message, contains('/recipes/search'));
        expect(
          options.headers.containsKey('Authorization'),
          isFalse,
        );
      },
    );

    test(
      'authenticated request with empty-string JWT in storage rejects with '
      'UnauthorisedException',
      () async {
        when(() => storage.readToken(AuthInterceptor.jwtTokenKey))
            .thenAnswer((_) async => '');

        final handler = _RecordingRequestHandler();
        final options = _options();

        await interceptor.onRequest(options, handler);

        expect(handler.action, 'reject');
        expect(handler.rejectedError, isNotNull);
        expect(handler.rejectedError!.error, isA<UnauthorisedException>());
      },
    );

    test(
      'authenticated request rejects with UnauthorisedException when '
      'SecureStorage throws a StorageException, and the error message '
      'references the storage failure',
      () async {
        when(() => storage.readToken(AuthInterceptor.jwtTokenKey)).thenThrow(
          const StorageException(
            SecureStorageOperation.read,
            'keystore unavailable',
          ),
        );

        final handler = _RecordingRequestHandler();
        final options = _options();

        await interceptor.onRequest(options, handler);

        expect(handler.action, 'reject');
        expect(handler.rejectedError, isNotNull);
        expect(handler.rejectedError!.error, isA<UnauthorisedException>());
        final unauth = handler.rejectedError!.error! as UnauthorisedException;
        expect(unauth.message, contains('keystore unavailable'));
      },
    );
  });
}
