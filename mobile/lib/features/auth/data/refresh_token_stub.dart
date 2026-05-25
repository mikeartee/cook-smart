import 'package:mobile/core/network/api_exception.dart';

/// Dead-code refresh seam for the cook-smart backend.
///
/// The cook-smart Backend_API exposes no refresh endpoint on
/// `/api/v1/auth/*`, so this function is the [RefreshTokenCall]
/// supplied to the foundation's `ErrorInterceptor` via the
/// `dioProvider` override. It throws [UnauthorisedException]
/// synchronously on its first executable line — before any `await` —
/// so the foundation's existing 401 clear-and-redirect path runs
/// unchanged: `ErrorInterceptor` catches the exception, invokes
/// `SecureStorage.clearAll`, and triggers the
/// `authRedirectCallbackProvider` callback.
///
/// The matching `RefreshTokenCall` typedef and refresh-and-retry
/// block in `core/network/error_interceptor.dart` remain intentionally
/// in place as foundation infrastructure; both are dead code in the
/// cook-smart context. Future refresh support requires a backend
/// change outside this migration's scope.
///
/// See Decision 2 of the `flutter-port-auth` design and Requirements
/// 8.1, 8.2, 8.5, 8.6 of the spec.
Future<String> cookSmartRefreshNotSupported(String _) {
  throw const UnauthorisedException(
    'Refresh tokens are not supported by the cook-smart backend; '
    'the user must re-authenticate.',
  );
}
