// Mirrored unit tests for `lib/core/network/api_response.dart`.
//
// Covers every documented branch of `ApiResponse.fromJson`:
//
//   * Success / error envelopes with and without a payload.
//   * Optional `data` (absent vs. explicitly `null`).
//   * Malformed envelope paths (missing/non-bool `success`, non-string
//     `message`) which must surface as `ServerException` with status `0`.
//   * Missing `message` defaults to the empty string.
//   * `dataParser` exceptions propagate unchanged because the envelope itself
//     parsed correctly.
//
// Validates: Requirements 4.4, 4.12.
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/core/network/api_response.dart';

/// Simple value object used as the typed payload in tests so we can assert
/// that the caller-supplied `dataParser` runs exactly when expected.
class _Payload {
  const _Payload(this.value);

  final String value;
}

/// Test double for `dataParser` that records every invocation. Keeps the
/// tests free of mocking libraries (per design.md) while still letting us
/// verify call count and argument identity.
class _RecordingParser {
  final List<dynamic> calls = <dynamic>[];

  _Payload call(dynamic raw) {
    calls.add(raw);
    final Map<String, dynamic> map = raw as Map<String, dynamic>;
    return _Payload(map['value'] as String);
  }
}

void main() {
  group('ApiResponse.fromJson', () {
    test('parses a success envelope and invokes dataParser exactly once', () {
      final Map<String, dynamic> rawData = <String, dynamic>{'value': 'hi'};
      final Map<String, dynamic> json = <String, dynamic>{
        'success': true,
        'message': 'ok',
        'data': rawData,
      };
      final _RecordingParser parser = _RecordingParser();

      final ApiResponse<_Payload> response = ApiResponse<_Payload>.fromJson(
        json,
        parser.call,
      );

      expect(response.success, isTrue);
      expect(response.message, 'ok');
      expect(response.data, isNotNull);
      expect(response.data!.value, 'hi');
      expect(parser.calls, hasLength(1));
      expect(identical(parser.calls.single, rawData), isTrue);
    });

    test('parses an error envelope without invoking dataParser', () {
      final Map<String, dynamic> json = <String, dynamic>{
        'success': false,
        'message': 'bad request',
        'data': null,
      };
      final _RecordingParser parser = _RecordingParser();

      final ApiResponse<_Payload> response = ApiResponse<_Payload>.fromJson(
        json,
        parser.call,
      );

      expect(response.success, isFalse);
      expect(response.message, 'bad request');
      expect(response.data, isNull);
      expect(parser.calls, isEmpty);
    });

    test('treats a missing `data` key as null and does not invoke parser', () {
      final Map<String, dynamic> json = <String, dynamic>{
        'success': true,
        'message': 'ok',
      };
      final _RecordingParser parser = _RecordingParser();

      final ApiResponse<_Payload> response = ApiResponse<_Payload>.fromJson(
        json,
        parser.call,
      );

      expect(response.success, isTrue);
      expect(response.message, 'ok');
      expect(response.data, isNull);
      expect(parser.calls, isEmpty);
    });

    test('treats explicit `data: null` as null and does not invoke parser', () {
      final Map<String, dynamic> json = <String, dynamic>{
        'success': true,
        'message': 'ok',
        'data': null,
      };
      final _RecordingParser parser = _RecordingParser();

      final ApiResponse<_Payload> response = ApiResponse<_Payload>.fromJson(
        json,
        parser.call,
      );

      expect(response.success, isTrue);
      expect(response.message, 'ok');
      expect(response.data, isNull);
      expect(parser.calls, isEmpty);
    });

    test('throws ServerException(0) with invalid-format message when `success` '
        'is missing', () {
      final Map<String, dynamic> json = <String, dynamic>{
        'message': 'ok',
        'data': null,
      };

      Object? caught;
      try {
        ApiResponse<_Payload>.fromJson(json, (_) => const _Payload('x'));
      } on Object catch (e) {
        caught = e;
      }

      expect(caught, isA<ServerException>());
      final ServerException error = caught! as ServerException;
      expect(error.statusCode, 0);
      expect(error.message.toLowerCase(), contains('invalid response format'));
    });

    test('throws ServerException(0) when `success` is not a bool', () {
      final Map<String, dynamic> json = <String, dynamic>{
        'success': 'yes',
        'message': 'ok',
        'data': null,
      };

      Object? caught;
      try {
        ApiResponse<_Payload>.fromJson(json, (_) => const _Payload('x'));
      } on Object catch (e) {
        caught = e;
      }

      expect(caught, isA<ServerException>());
      final ServerException error = caught! as ServerException;
      expect(error.statusCode, 0);
      expect(error.message.toLowerCase(), contains('invalid response format'));
    });

    test('throws ServerException(0) when `message` is not a string', () {
      final Map<String, dynamic> json = <String, dynamic>{
        'success': true,
        'message': 42,
        'data': null,
      };

      Object? caught;
      try {
        ApiResponse<_Payload>.fromJson(json, (_) => const _Payload('x'));
      } on Object catch (e) {
        caught = e;
      }

      expect(caught, isA<ServerException>());
      final ServerException error = caught! as ServerException;
      expect(error.statusCode, 0);
      expect(error.message.toLowerCase(), contains('invalid response format'));
    });

    test('defaults `message` to the empty string when the field is absent', () {
      final Map<String, dynamic> rawData = <String, dynamic>{'value': 'hi'};
      final Map<String, dynamic> json = <String, dynamic>{
        'success': true,
        'data': rawData,
      };
      final _RecordingParser parser = _RecordingParser();

      final ApiResponse<_Payload> response = ApiResponse<_Payload>.fromJson(
        json,
        parser.call,
      );

      expect(response.success, isTrue);
      expect(response.message, '');
      expect(response.data, isNotNull);
      expect(response.data!.value, 'hi');
      expect(parser.calls, hasLength(1));
    });

    test('propagates exceptions thrown by `dataParser` unchanged', () {
      final Map<String, dynamic> json = <String, dynamic>{
        'success': true,
        'message': 'ok',
        'data': <String, dynamic>{'value': 'hi'},
      };
      final FormatException parserError = const FormatException(
        'payload could not be decoded',
      );

      expect(
        () => ApiResponse<_Payload>.fromJson(
          json,
          (_) => throw parserError,
        ),
        throwsA(same(parserError)),
      );
    });
  });
}
