// Unit tests for `lib/core/network/error_interceptor.dart`.
//
// Covers Requirements 4.3 (typed exception subtypes), 4.9 (single-shot
// 401 refresh-and-retry), 4.10 (clear-and-redirect on refresh failure,
// refresh timeout, or missing refresh token), and 4.11 (timeout to
// `NetworkException` translation).
//
// Two test styles are used in this file:
//
//   * Error-translation cases (timeouts, 4xx, 5xx) drive
//     `interceptor.onError(...)` directly with a recording
//     `ErrorInterceptorHandler` so the assertions stay focused on what
//     terminal handler call (`reject` / `resolve` / `next`) the
//     interceptor made and what payload it carried.
//   * 401 refresh-and-retry cases use a real `Dio` instance with an
//     overridden `HttpClientAdapter`, with the interceptor wired in.
//     This is required because the retry runs through the same
//     interceptor chain (Requirement 4.9: single-shot guard), and a
//     recording handler alone cannot exercise that recursive path.

// External libraries
import 'dart:async';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

// Internal modules
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/network/error_interceptor.dart';
import 'package:mobile/core/storage/secure_storage.dart';

class _MockSecureStorage extends Mock implements SecureStorage {}

/// Records the terminal handler call made by the interceptor without
/// completing the underlying base-handler future, so unawaited futures
/// do not leak between tests.
class _RecordingErrorHandler extends ErrorInterceptorHandler {
  String? action;
  DioException? rejectedError;
  Response<dynamic>? resolvedResponse;

  @override
  void next(DioException err) {
    action = 'next';
    rejectedError = err;
  }

  @override
  void reject(DioException error) {
    action = 'reject';
    rejectedError = error;
  }

  @override
  void resolve(Response<dynamic> response) {
    action = 'resolve';
    resolvedResponse = response;
  }
}

/// Programmable [HttpClientAdapter] for tests. Each call to [fetch]
/// is recorded in [requests] and routed to the supplied [responder].
class _FakeAdapter implements HttpClientAdapter {
  _FakeAdapter(this.responder);

  final ResponseBody Function(RequestOptions options) responder;
  final List<RequestOptions> requests = <RequestOptions>[];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    return responder(options);
  }

  @override
  void close({bool force = false}) {}
}

/// Builds a [DioException] of the given [type] with a fresh
/// [RequestOptions]. Used for the timeout-translation tests that drive
/// `onError` directly.
DioException _timeoutException(
  DioExceptionType type, {
  String path = '/recipes',
}) {
  final options = RequestOptions(path: path);
  return DioException(
    requestOptions: options,
    type: type,
    message: 'timed out',
  );
}

/// Builds a `badResponse` [DioException] carrying the given
/// [statusCode] and decoded response [data]. Used for the 4xx and 5xx
/// translation tests.
DioException _badResponseException(
  int statusCode, {
  Object? data,
  String path = '/foo',
}) {
  final options = RequestOptions(path: path);
  return DioException(
    requestOptions: options,
    type: DioExceptionType.badResponse,
    response: Response<dynamic>(
      requestOptions: options,
      statusCode: statusCode,
      data: data,
    ),
  );
}

/// Returns a JSON [ResponseBody] suitable for the fake adapter.
ResponseBody _jsonResponse(String body, int statusCode) {
  return ResponseBody.fromString(
    body,
    statusCode,
    headers: <String, List<String>>{
      'content-type': <String>['application/json; charset=utf-8'],
    },
  );
}

void main() {
  late _MockSecureStorage storage;
  late Dio dio;
  late int redirectCount;
  late int refreshCallCount;

  setUp(() {
    storage = _MockSecureStorage();
    dio = Dio(BaseOptions(baseUrl: 'http://test.local'));
    redirectCount = 0;
    refreshCallCount = 0;

    // Default storage stubs for the writes the interceptor performs on
    // the success path. Tests that need to assert these calls happen
    // (or do not happen) override or verify on top of these.
    when(() => storage.clearAll()).thenAnswer((_) async {});
    when(
      () => storage.writeToken(ErrorInterceptor.jwtTokenKey, any()),
    ).thenAnswer((_) async {});
  });

  ErrorInterceptor buildInterceptor({
    required RefreshTokenCall refreshCall,
    Duration refreshTimeout = const Duration(seconds: 15),
  }) {
    return ErrorInterceptor(
      storage: storage,
      dio: dio,
      refreshCall: refreshCall,
      onRedirectToLogin: () => redirectCount++,
      refreshTimeout: refreshTimeout,
    );
  }

  group('ErrorInterceptor.onError timeout translation', () {
    test(
      'DioExceptionType.connectionTimeout is wrapped as NetworkException '
      'and carries the request path in its message',
      () async {
        final interceptor = buildInterceptor(
          refreshCall: (_) async => 'unused',
        );
        final handler = _RecordingErrorHandler();
        final err = _timeoutException(
          DioExceptionType.connectionTimeout,
          path: '/recipes',
        );

        await interceptor.onError(err, handler);

        expect(handler.action, 'reject');
        expect(handler.rejectedError, isNotNull);
        expect(handler.rejectedError!.error, isA<NetworkException>());
        final wrapped =
            handler.rejectedError!.error! as NetworkException;
        expect(wrapped.message, contains('timed out'));
        expect(wrapped.message, contains('/recipes'));
        verifyNever(() => storage.clearAll());
        expect(redirectCount, 0);
      },
    );

    test(
      'DioExceptionType.receiveTimeout is wrapped as NetworkException',
      () async {
        final interceptor = buildInterceptor(
          refreshCall: (_) async => 'unused',
        );
        final handler = _RecordingErrorHandler();
        final err = _timeoutException(
          DioExceptionType.receiveTimeout,
          path: '/recipes/search',
        );

        await interceptor.onError(err, handler);

        expect(handler.action, 'reject');
        expect(handler.rejectedError!.error, isA<NetworkException>());
        verifyNever(() => storage.clearAll());
      },
    );
  });

  group('ErrorInterceptor.onError non-401 status code translation', () {
    test(
      '4xx (non-401) bad response is wrapped as ValidationException '
      'with the backend message and field errors',
      () async {
        final interceptor = buildInterceptor(
          refreshCall: (_) async => 'unused',
        );
        final handler = _RecordingErrorHandler();
        final err = _badResponseException(
          400,
          data: <String, dynamic>{
            'success': false,
            'message': 'validation failed',
            'fieldErrors': <String, dynamic>{
              'email': 'must be valid',
              'password': 'too short',
            },
          },
        );

        await interceptor.onError(err, handler);

        expect(handler.action, 'reject');
        expect(handler.rejectedError!.error, isA<ValidationException>());
        final wrapped =
            handler.rejectedError!.error! as ValidationException;
        expect(wrapped.message, 'validation failed');
        expect(
          wrapped.fieldErrors,
          <String, String>{
            'email': 'must be valid',
            'password': 'too short',
          },
        );
        verifyNever(() => storage.clearAll());
      },
    );

    test(
      '5xx bad response is wrapped as ServerException carrying the '
      'status code',
      () async {
        final interceptor = buildInterceptor(
          refreshCall: (_) async => 'unused',
        );
        final handler = _RecordingErrorHandler();
        final err = _badResponseException(
          503,
          data: <String, dynamic>{
            'success': false,
            'message': 'database unavailable',
          },
        );

        await interceptor.onError(err, handler);

        expect(handler.action, 'reject');
        expect(handler.rejectedError!.error, isA<ServerException>());
        final wrapped =
            handler.rejectedError!.error! as ServerException;
        expect(wrapped.statusCode, 503);
        expect(wrapped.message, 'database unavailable');
        verifyNever(() => storage.clearAll());
      },
    );
  });

  group('ErrorInterceptor.onError 401 refresh-and-retry', () {
    test(
      '401 with a stored refresh token triggers exactly one '
      'refresh-token call and retries the original request once on '
      'success',
      () async {
        when(
          () => storage.readToken(ErrorInterceptor.refreshTokenKey),
        ).thenAnswer((_) async => 'STORED_REFRESH');

        var callCount = 0;
        final adapter = _FakeAdapter((options) {
          callCount++;
          if (callCount == 1) {
            return _jsonResponse(
              '{"message":"unauthorised"}',
              401,
            );
          }
          return _jsonResponse('{"ok":true}', 200);
        });
        dio.httpClientAdapter = adapter;

        final interceptor = buildInterceptor(
          refreshCall: (refreshToken) async {
            refreshCallCount++;
            expect(refreshToken, 'STORED_REFRESH');
            return 'NEW_JWT';
          },
        );
        dio.interceptors.add(interceptor);

        final response = await dio.get<dynamic>('/recipes');

        expect(response.statusCode, 200);
        expect(refreshCallCount, 1);
        expect(adapter.requests.length, 2);
        // The retry carries the freshly-issued JWT.
        expect(
          adapter.requests[1].headers['Authorization'],
          'Bearer NEW_JWT',
        );
        verify(
          () => storage.writeToken(
            ErrorInterceptor.jwtTokenKey,
            'NEW_JWT',
          ),
        ).called(1);
        verifyNever(() => storage.clearAll());
        expect(redirectCount, 0);
      },
    );

    test(
      '401 with no refresh token in storage clears all tokens, '
      'invokes the redirect callback, never calls refreshCall, and '
      'rejects with UnauthorisedException',
      () async {
        when(
          () => storage.readToken(ErrorInterceptor.refreshTokenKey),
        ).thenAnswer((_) async => null);

        final adapter = _FakeAdapter((_) {
          return _jsonResponse('{"message":"unauthorised"}', 401);
        });
        dio.httpClientAdapter = adapter;

        final interceptor = buildInterceptor(
          refreshCall: (_) async {
            refreshCallCount++;
            return 'UNUSED';
          },
        );
        dio.interceptors.add(interceptor);

        await expectLater(
          () => dio.get<dynamic>('/recipes'),
          throwsA(
            isA<DioException>().having(
              (e) => e.error,
              'error',
              isA<UnauthorisedException>().having(
                (e) => e.message,
                'message',
                contains('No refresh token'),
              ),
            ),
          ),
        );

        expect(refreshCallCount, 0);
        expect(adapter.requests.length, 1);
        verify(() => storage.clearAll()).called(1);
        expect(redirectCount, 1);
      },
    );

    test(
      '401 with refresh-token call failure clears all tokens, invokes '
      'the redirect callback, and rejects with UnauthorisedException',
      () async {
        when(
          () => storage.readToken(ErrorInterceptor.refreshTokenKey),
        ).thenAnswer((_) async => 'STORED_REFRESH');

        final adapter = _FakeAdapter((_) {
          return _jsonResponse('{"message":"unauthorised"}', 401);
        });
        dio.httpClientAdapter = adapter;

        final interceptor = buildInterceptor(
          refreshCall: (_) async {
            refreshCallCount++;
            throw Exception('refresh rejected by backend');
          },
        );
        dio.interceptors.add(interceptor);

        await expectLater(
          () => dio.get<dynamic>('/recipes'),
          throwsA(
            isA<DioException>().having(
              (e) => e.error,
              'error',
              isA<UnauthorisedException>().having(
                (e) => e.message,
                'message',
                contains('Refresh-token call failed'),
              ),
            ),
          ),
        );

        expect(refreshCallCount, 1);
        // The original request fired once; the retry never fires
        // because the refresh failed before a new JWT was issued.
        expect(adapter.requests.length, 1);
        verify(() => storage.clearAll()).called(1);
        expect(redirectCount, 1);
      },
    );

    test(
      '401 with refresh-token call exceeding refreshTimeout clears '
      'all tokens, invokes the redirect callback, and rejects with '
      'NetworkException',
      () async {
        when(
          () => storage.readToken(ErrorInterceptor.refreshTokenKey),
        ).thenAnswer((_) async => 'STORED_REFRESH');

        final adapter = _FakeAdapter((_) {
          return _jsonResponse('{"message":"unauthorised"}', 401);
        });
        dio.httpClientAdapter = adapter;

        final interceptor = buildInterceptor(
          refreshCall: (_) async {
            refreshCallCount++;
            // Take strictly longer than the configured refresh
            // timeout so `Future.timeout` raises TimeoutException.
            await Future<void>.delayed(
              const Duration(milliseconds: 200),
            );
            return 'IGNORED';
          },
          refreshTimeout: const Duration(milliseconds: 50),
        );
        dio.interceptors.add(interceptor);

        await expectLater(
          () => dio.get<dynamic>('/recipes'),
          throwsA(
            isA<DioException>().having(
              (e) => e.error,
              'error',
              isA<NetworkException>().having(
                (e) => e.message,
                'message',
                contains('Refresh-token call timed out'),
              ),
            ),
          ),
        );

        expect(refreshCallCount, 1);
        expect(adapter.requests.length, 1);
        verify(() => storage.clearAll()).called(1);
        expect(redirectCount, 1);
      },
    );

    test(
      'second 401 after a refresh retry does not loop: refreshCall '
      'fires exactly once and the original request surfaces '
      'UnauthorisedException',
      () async {
        when(
          () => storage.readToken(ErrorInterceptor.refreshTokenKey),
        ).thenAnswer((_) async => 'STORED_REFRESH');

        // Adapter always returns 401, including on the retry, to
        // exercise the single-shot guard.
        final adapter = _FakeAdapter((_) {
          return _jsonResponse('{"message":"unauthorised"}', 401);
        });
        dio.httpClientAdapter = adapter;

        final interceptor = buildInterceptor(
          refreshCall: (_) async {
            refreshCallCount++;
            return 'NEW_JWT';
          },
        );
        dio.interceptors.add(interceptor);

        await expectLater(
          () => dio.get<dynamic>('/recipes'),
          throwsA(
            isA<DioException>().having(
              (e) => e.error,
              'error',
              isA<UnauthorisedException>(),
            ),
          ),
        );

        // Refresh attempted exactly once — no loop.
        expect(refreshCallCount, 1);
        // Original request + exactly one retry.
        expect(adapter.requests.length, 2);
        // The second 401 went through the retried-flag branch which
        // also clears tokens and redirects.
        verify(() => storage.clearAll()).called(1);
        expect(redirectCount, 1);
      },
    );
  });
}
