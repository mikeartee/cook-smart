// Unit tests for `lib/features/auth/data/refresh_token_stub.dart`.
//
// Validates [cookSmartRefreshNotSupported] — the dead-code refresh seam
// passed to the foundation's `ErrorInterceptor` via the `dioProvider`
// override (see Decision 2 of the `flutter-port-auth` design). The
// function's contract is:
//
//   1. Throws [UnauthorisedException] synchronously, on its first
//      executable line, before any `await`. Because the function is
//      declared `Future<String>` without the `async` modifier, the
//      `throw` is a synchronous throw, not a future error.
//   2. Never contacts the network. The function body imports only
//      [UnauthorisedException] from `core/network/api_exception.dart`;
//      there is no Dio import or HTTP machinery to set up.
//
// Validates: Requirement 8.1.

// External libraries
import 'package:flutter_test/flutter_test.dart';

// Internal modules
import 'package:mobile/core/network/api_exception.dart';
import 'package:mobile/features/auth/data/refresh_token_stub.dart';

void main() {
  group('cookSmartRefreshNotSupported', () {
    test('throws UnauthorisedException', () {
      expect(
        () => cookSmartRefreshNotSupported('refresh-token'),
        throwsA(isA<UnauthorisedException>()),
      );
    });

    test('throws synchronously, not asynchronously (no Future error)', () {
      // The function is declared `Future<String>` without `async`, so the
      // `throw` on its first executable line is a synchronous throw. A
      // try/catch around the call expression — without `await` — must
      // catch the exception. If it were an async function, the throw
      // would become a future error and this catch would not fire.
      Object? caught;
      try {
        cookSmartRefreshNotSupported('refresh-token');
      } on Object catch (error) {
        caught = error;
      }
      expect(caught, isA<UnauthorisedException>());
    });

    test('error message matches the design specification verbatim', () {
      Object? caught;
      try {
        cookSmartRefreshNotSupported('any');
      } on Object catch (error) {
        caught = error;
      }
      expect(caught, isA<UnauthorisedException>());
      expect(
        (caught! as UnauthorisedException).message,
        'Refresh tokens are not supported by the cook-smart backend; '
        'the user must re-authenticate.',
      );
    });

    test('throws regardless of input — no input is special-cased', () {
      // The function body has no Dio import, no network call, and does
      // not branch on its argument. Calling it for a variety of inputs
      // must throw `UnauthorisedException` every time, with no test
      // setup of HTTP machinery required.
      final inputs = <String>[
        '',
        'a',
        'real-jwt',
        String.fromCharCode(0),
      ];
      for (final input in inputs) {
        expect(
          () => cookSmartRefreshNotSupported(input),
          throwsA(isA<UnauthorisedException>()),
          reason: 'Must throw for input "$input"',
        );
      }
    });
  });
}
