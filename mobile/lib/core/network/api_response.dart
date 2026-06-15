// Typed wrapper for the Backend_API response envelope `{ success, message,
// data }`.
//
// Every successful HTTP response is decoded into one of these via
// [ApiResponse.fromJson], so feature code consumes a typed `data` payload
// rather than touching the raw envelope.
//
// Validates: Requirement 4.4 (typed envelope parsing into `ApiResponse<T>`),
// Requirement 4.12 (envelope parse failures surface as `ServerException`),
// Requirement 9.6 (envelope shape is fixed at `{ success, message, data }`).

import 'api_exception.dart';

/// Decoded form of the Backend_API response envelope.
///
/// The envelope is shaped `{ success, message, data }` (Requirement 9.6).
/// `data` is generic so each call site can declare the payload type it
/// expects, e.g. `ApiResponse<User>` or `ApiResponse<List<Recipe>>`.
class ApiResponse<DataType> {
  /// Creates an envelope already split into its typed parts.
  ///
  /// Callers usually go through [ApiResponse.fromJson] instead of this
  /// constructor; it is exposed for tests and for hand-built fixtures.
  const ApiResponse({
    required this.success,
    required this.message,
    this.data,
  });

  /// Parses the `{ success, message, data }` envelope from a decoded JSON
  /// map.
  ///
  /// [dataParser] converts the raw `data` value into [DataType]. It is only
  /// invoked when the envelope's `data` field is non-null.
  ///
  /// Throws a [ServerException] with status code `0` when the envelope
  /// itself cannot be parsed:
  ///
  /// - `success` is missing, null, or not a `bool`.
  /// - `message` is present but is not a `String`.
  ///
  /// Status code `0` is the documented signal in `ApiException` for a
  /// failure that is not associated with an HTTP status (the response was
  /// received but its envelope was malformed).
  ///
  /// A null or absent `data` is accepted: not every endpoint returns a
  /// payload (e.g. `{ success: true, message: '...' }`). When `data` is
  /// non-null, [dataParser] is called and any exception it raises
  /// propagates unchanged — the envelope itself parsed correctly, so the
  /// failure is the responsibility of the caller-supplied parser, not of
  /// this layer.
  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    DataType Function(dynamic) dataParser,
  ) {
    final Object? rawSuccess = json['success'];
    if (rawSuccess is! bool) {
      throw const ServerException(
        'Invalid response format: envelope is missing required boolean '
        '"success" field.',
        0,
      );
    }

    final Object? rawMessage = json['message'];
    if (rawMessage != null && rawMessage is! String) {
      throw const ServerException(
        'Invalid response format: envelope "message" field is not a string.',
        0,
      );
    }
    final String message = (rawMessage as String?) ?? '';

    final Object? rawData = json['data'];
    final DataType? data = rawData != null ? dataParser(rawData) : null;

    return ApiResponse<DataType>(
      success: rawSuccess,
      message: message,
      data: data,
    );
  }

  /// Whether the backend reports the request as logically successful.
  ///
  /// Independent of the transport HTTP status code; a `200 OK` response can
  /// still carry `success: false` when the backend rejects the request.
  final bool success;

  /// Human-readable message describing the outcome.
  ///
  /// Empty string when the envelope omits the field. User-facing copy is
  /// the responsibility of the presentation layer.
  final String message;

  /// Decoded payload, or `null` when the envelope's `data` field is absent
  /// or explicitly `null`.
  final DataType? data;
}
