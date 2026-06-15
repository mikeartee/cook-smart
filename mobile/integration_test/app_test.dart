// Integration test driver entry point for the Cook Smart Flutter app.
//
// This file exists to satisfy the Foundation_Phase testing harness defined in
// the `flutter-migration-architecture` spec:
//   - Requirement 14.1: pin `integration_test` as a dev dependency.
//   - Requirement 14.3: include an `integration_test/` directory at the
//     project root containing a driver entry point file that initializes the
//     `integration_test` package binding.
//   - Requirement 14.6: Foundation_Phase deliverables MUST NOT contain
//     integration test bodies. Test bodies are deferred to per-feature specs
//     (e.g. `flutter-port-auth`, `flutter-port-barcode-scanner`,
//     `flutter-port-home-shell`), which add their own files under
//     `integration_test/` and provide the actual `testWidgets(...)` flows.
//
// Per-feature specs will add additional driver files alongside this one and
// populate them with real flows once the underlying screens stabilise. Until
// then, this file intentionally contains no test bodies — it only ensures the
// binding is wired up so `flutter test integration_test` resolves.

import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  // Intentionally no `testWidgets(...)` calls here. See Requirement 14.6:
  // integration test bodies are deferred to per-feature specs.
}
