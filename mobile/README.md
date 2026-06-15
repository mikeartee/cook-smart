# Cook Smart Mobile (Flutter)

The Flutter mobile app for Cook Smart, ported from React Native and living
alongside the legacy app under `mobile/` until the migration cutover.

## Prerequisites

- Flutter SDK `>=3.44.0` (Dart `>=3.9.0 <4.0.0`)
- Android SDK with a configured emulator or a connected Android device
- Backend reachable at the configured base URL (see `lib/core/config/api_config.dart`)

## Run

Install dependencies and run the app in debug mode against a connected
Android device or emulator:

```bash
flutter pub get
flutter run
```

Debug builds target the development backend at `http://192.168.12.196:3000`.

## Build

Build a release APK for distribution:

```bash
flutter build apk --release
```

Release builds target the production backend at `https://api.cooksmartapp.com`.
The output APK is written to `build/app/outputs/flutter-apk/app-release.apk`.

## Test

Run unit and widget tests:

```bash
flutter test
```

Run static analysis (lints from `very_good_analysis`):

```bash
flutter analyze
```

Run code generation for Riverpod and Retrofit when annotated sources change:

```bash
dart run build_runner build --delete-conflicting-outputs
```

## iOS Status

iOS is not built, not signed, and not shipped pending Mac access. The
`mobile/ios/` placeholder project is committed so the architecture stays
iOS-compatible, but no iOS artifact is produced and no iOS code-signing
runs in CI.

iOS builds will be enabled only when both of the following gating
conditions are met:

- **Mac access available** — a macOS host with current Xcode and a configured
  signing identity is available to the developer.
- **iOS work justified** — a concrete demand or business case warrants the
  engineering and ongoing-support cost of an iOS build.

Until both gates clear, CI runs Android-only and `flutter build ios` is not
executed.
