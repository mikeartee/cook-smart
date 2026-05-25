/// Typed exception hierarchy raised by the network layer.
///
/// Every error surfaced from `core/network` is one of these subtypes, so
/// feature code never depends on transport-library types (e.g. `DioException`).
///
/// See Requirement 4.3 (typed exception subtypes) and Requirement 11.5
/// (transport types must not leak to callers) of the
/// flutter-migration-architecture spec.
sealed class ApiException implements Exception {
  const ApiException(this.message);

  /// Human-readable description of the failure, suitable for logging.
  /// User-facing copy is the responsibility of the presentation layer.
  final String message;
}

/// Raised when a request fails before a response is received: connection
/// refused, DNS failure, no internet, or a connect/receive timeout.
///
/// See Requirement 4.11 (timeouts surface as `NetworkException`).
final class NetworkException extends ApiException {
  const NetworkException(super.message);

  @override
  String toString() => 'NetworkException: $message';
}

/// Raised when the backend rejects the request for an authentication reason
/// (HTTP 401), or when the network layer refuses to send a request that
/// requires auth because no JWT is available.
///
/// See Requirements 4.9, 4.10 (401 handling) and 4.13 (missing-JWT path).
final class UnauthorisedException extends ApiException {
  const UnauthorisedException(super.message);

  @override
  String toString() => 'UnauthorisedException: $message';
}

/// Raised when the backend rejects the request for client-side validation
/// reasons (typically HTTP 400 / 422).
///
/// `fieldErrors` maps a request field name to the first validation error
/// reported for that field, in the order returned by the backend.
final class ValidationException extends ApiException {
  const ValidationException(super.message, this.fieldErrors);

  /// Per-field validation errors, keyed by request field name.
  final Map<String, String> fieldErrors;

  @override
  String toString() =>
      'ValidationException: $message (fieldErrors: $fieldErrors)';
}

/// Raised when the backend returns a server-side failure (HTTP 5xx) or when
/// a successful HTTP response cannot be parsed as the
/// `{ success, message, data }` envelope.
///
/// See Requirement 4.12 (envelope parse failures surface as
/// `ServerException`).
final class ServerException extends ApiException {
  const ServerException(super.message, this.statusCode);

  /// HTTP status code returned by the backend, or `0` when the failure is
  /// not associated with a specific status (e.g. envelope parse failure).
  final int statusCode;

  @override
  String toString() => 'ServerException($statusCode): $message';
}
