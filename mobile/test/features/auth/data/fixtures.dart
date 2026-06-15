// Backend response fixtures for `flutter-port-auth` data-layer tests.
//
// These four constants mirror the JSON shapes returned by the cook-smart
// backend's auth handlers in `backend/src/routes/auth.ts`. They are the
// single source of truth for "what the wire actually looks like" so a
// backend change shows up as one fixture diff rather than rippling
// through every response-parser test.
//
// Each fixture is shaped exactly like the corresponding handler's
// `res.json(...)` call site, including the asymmetries the design
// already calls out (Decision 1 of `flutter-port-auth/design.md`):
//
//   * `/login` returns `{ success, message, token, user }` — top-level
//     JWT, no `data` envelope.
//   * `/register` returns `{ message, token, user, special_message?,
//     lifetime_access? }` — note the absence of `success`, and the
//     handler does not echo `is_admin` because brand-new accounts are
//     never admins.
//   * `/me` returns `{ user }` — no envelope at all, and the only
//     endpoint that populates `dietary_restrictions`, `allergies`,
//     `show_nutrition`, and `preferred_units`.
//   * `/logout` returns `{ success, message }` — no `data` payload.
//
// Updating any field below should be paired with a corresponding
// change in `backend/src/routes/auth.ts`; otherwise the auth response
// parsers will fail their unit tests on the next run.
//
// Validates: flutter-port-auth Requirements 3.2, 3.3, 3.4, 3.5.

/// Top-level body returned by `POST /api/v1/auth/login`.
///
/// Mirrors the `res.json({...})` call inside the login handler in
/// `backend/src/routes/auth.ts`. The `success` and `message` fields
/// are present here because they are present on the wire, but the
/// `AuthLoginResponse` parser ignores them on purpose.
const Map<String, dynamic> loginFixture = <String, dynamic>{
  'success': true,
  'message': 'Login successful',
  'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.login-fixture-token',
  'user': <String, dynamic>{
    'id': 'usr_01H8V0LOGIN0000000000ALICE',
    'email': 'alice@example.com',
    'first_name': 'Alice',
    'last_name': 'Anderson',
    'is_admin': false,
    'is_co_founder': false,
    'is_special_user': false,
    'is_creator': false,
    'has_lifetime_subscription': false,
    'subscription_status': 'free',
    'points': 0,
  },
};

/// Top-level body returned by `POST /api/v1/auth/register`.
///
/// Mirrors the `res.status(201).json({...})` call inside the register
/// handler. Note the absence of a `success` field and the absence of
/// `is_admin` from the embedded `user` object — `User.fromRegisterJson`
/// defaults that field to `false` when omitted.
///
/// Both `special_message` and `lifetime_access` are present in this
/// fixture because the handler emits them whenever a new account is a
/// creator, co-founder, or special user (the case exercised by
/// `auth_register_response_test.dart` Requirement 3.3). For a regular
/// account the backend would simply omit the two optional keys; the
/// parser handles both shapes uniformly.
const Map<String, dynamic> registerFixture = <String, dynamic>{
  'message': 'Welcome! 💐',
  'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.register-fixture-token',
  'user': <String, dynamic>{
    'id': 'usr_01H8V0REGSTR0000000000BOB',
    'email': 'bob@example.com',
    'first_name': 'Bob',
    'last_name': 'Brown',
    'is_co_founder': false,
    'is_special_user': true,
    'is_creator': false,
    'has_lifetime_subscription': true,
    'subscription_status': 'lifetime',
    'points': 0,
  },
  'special_message':
      'You have lifetime access to all features. Enjoy Cook Smart!',
  'lifetime_access': true,
};

/// Top-level body returned by `GET /api/v1/auth/me`.
///
/// Mirrors the `res.json({ user: { ... } })` call inside the `/me`
/// handler. This is the only endpoint that populates the four
/// preference fields (`dietary_restrictions`, `allergies`,
/// `show_nutrition`, `preferred_units`) — the other three response
/// shapes leave them as `null`.
const Map<String, dynamic> meFixture = <String, dynamic>{
  'user': <String, dynamic>{
    'id': 'usr_01H8V000ME0000000000CAROL',
    'email': 'carol@example.com',
    'first_name': 'Carol',
    'last_name': 'Carter',
    'is_admin': false,
    'is_co_founder': false,
    'is_special_user': false,
    'is_creator': false,
    'has_lifetime_subscription': false,
    'subscription_status': 'free',
    'points': 42,
    'dietary_restrictions': <String>['vegetarian'],
    'allergies': <String>['peanuts', 'shellfish'],
    'show_nutrition': true,
    'preferred_units': 'metric',
  },
};

/// Top-level body returned by `POST /api/v1/auth/logout`.
///
/// Mirrors the `res.json({ success: true, message: '...' })` call
/// inside the logout handler. The `AuthLogoutResponse` parser
/// ignores the body entirely (existence equals success), so this
/// fixture exists primarily to document the wire shape for the
/// integration tests that need a realistic response body.
const Map<String, dynamic> logoutFixture = <String, dynamic>{
  'success': true,
  'message': 'Logged out successfully',
};
