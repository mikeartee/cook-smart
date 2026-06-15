# Mobile Framework Evaluation for Cook Smart

This document compares four ways to ship cook-smart on Android and iOS. It exists because the current React Native 0.82 + NDK 27 toolchain has cost the project two days of build diagnosis (see [issue #74](https://github.com/mikeartee/cook-smart/issues/74), upstream [reanimated #9444](https://github.com/software-mansion/react-native-reanimated/issues/9444), repro at [repro-ndk27-worklets](https://github.com/mikeartee/repro-ndk27-worklets)) and is still broken on `main`. The goal is to decide whether to keep going, port to a different cross-platform stack, or split into two native codebases.

Constraints: single developer, both platforms day one (non-negotiable), camera + barcode scanning, Firebase push, vector icons, audio, secure storage, Node/Express + RDS backend that does not change. About 20–30 screens currently built for Android.

The four options are evaluated on identical axes. Honest recommendation is at the end. Date of evaluation: May 2026.

## Option 1: React Native 0.82 (status quo, with Gradle init script self-fix)

The user has explicitly ruled this out. It is included as the baseline so the alternatives have something to be judged against.

### Build story

React Native 0.82 was released on [October 8, 2025](https://reactnative.dev/blog/2025/10/08/react-native-0.82) and is notable for one thing: it removed the Legacy Architecture entirely. Every app on 0.82 runs Fabric + TurboModules + Codegen, no opt-out. According to the [release schedule](https://reactnative.dev/releases), 0.82 hits end of cycle in December 2025 and full EOL in April 2026, so this version is already on a timer.

The build pipeline runs JS bundling (Metro) → autolink discovery (`@react-native-community/cli`) → Gradle on Android (which calls CMake via the AGP for any C++ TurboModule) → Xcode + CocoaPods on iOS. The autolink contract requires every native module to publish a Codegen spec the framework can ingest at build time. Update RN, AGP, NDK, or Kotlin and the contract has to hold across every transitive dependency.

The cook-smart break is the textbook failure mode. NDK 27.1 changed page-size assumptions for Android 15 (16 KB pages), the worklets package's CMake config wasn't aligned, autolinking tries to compile it anyway, and the build dies. Documented in [facebook/react-native#54073](https://github.com/facebook/react-native/issues/54073) and the user's repro. The Gradle init script self-fix works but is a patch — it doesn't fix the upstream contract, it tells the build system to skip or override the broken bits.

How often do build-system bugs ship to public RN releases? Routinely. The RN issue tracker has open compile/CMake/autolink issues at every minor version since at least 0.71. Each minor brings a new round of "your favourite native module doesn't compile yet, wait two weeks for an update." The community has normalised this.

### Native features for cook-smart

- **Camera + barcode**: currently `react-native-camera-kit`. The more capable option is `react-native-vision-camera` v4 with the worklets-based `vision-camera-code-scanner` plugin — actively maintained by mrousavy, but it has a long history of CMake/NDK issues ([#388](https://github.com/mrousavy/react-native-vision-camera/issues/388), [#1814](https://github.com/mrousavy/react-native-vision-camera/issues/1814)). It is the package most likely to break first when the toolchain moves.
- **Firebase push**: `@react-native-firebase/messaging`. Maintained by Invertase, official-by-proxy, generally reliable.
- **Vector icons**: `react-native-vector-icons` (legacy) or `@react-native-vector-icons/material-design-icons` (newer scoped fork). Font copying is done by a Gradle/Xcode build phase the package installs.
- **Secure storage**: `react-native-keychain` for iOS Keychain + Android Keystore.
- **Audio**: `react-native-track-player` for background-capable, `react-native-sound` for simple playback. Both are community-maintained.

Every one of those packages has its own native code, its own Codegen spec, and its own potential to be the next thing that breaks on an NDK or AGP update.

### Dev experience reality

Hot reload via Metro Fast Refresh is good when it works, intermittently broken when component trees grow. JS-side debugging through Chrome DevTools or React DevTools is fine for component state; native crashes still require Logcat or Xcode Instruments. TypeScript gives you compile-time type safety on the JS side; the JS↔native boundary is typed via Codegen but the codegen output is regenerated on every build, and a stale spec is its own class of bug.

Error messages are inconsistent. JS errors are clear. Native build errors are giant Gradle stack traces where the actual cause is six frames deep. Autolinking failures often surface as "Could not determine the dependencies of task `:app:mergeReleaseNativeLibs`" with no indication which module caused it.

IDE support: VS Code + TypeScript + ESLint + Prettier work well. Refactoring is solid for JS/TS, nonexistent across the JS↔native boundary.

### Migration cost

Zero — this is the current state. The cost is paying for the next breakage: every NDK/AGP/Xcode/RN minor upgrade is a 1–3 day fire drill, plus periodic forced upgrades when an OS-mandated SDK target changes (Google Play required Android 15 / SDK 35 in 2025, will require SDK 36 in 2026). For a solo dev, four or five of these per year is meaningful capacity loss.

### Long-term viability

Funded by Meta. Meta's recent [10% layoff in May 2026](https://www.cnbc.com/2026/05/20/meta-layoffs-zuckerberg-says-success-isnt-a-given-in-memo.html) targeted non-AI work; whether that affected the RN core team specifically is uncertain, but the framework is shipping bi-monthly minors on schedule. Hiring pool is large, Stack Overflow coverage is excellent, ecosystem direction is Expo-first (which the user has ruled out). Five-year bet: probably still alive, probably still fragile in the same ways.

## Option 2: Flutter

Single Dart codebase, Skia/Impeller-rendered widgets, both platforms from one source.

### Build story

Flutter's build pipeline is more vertically integrated than RN's. `flutter build` drives a Dart AOT compile, then hands off to Gradle (Android) or Xcode (iOS) through `flutter_tools`. Plugins are linked through Flutter's own plugin registry — autolinking exists, but the contract is owned by one organisation, not split between Meta, the CLI team, and every native-module author.

NDK is not in the cook-smart-style critical path. Flutter's engine is precompiled for each ABI by the Flutter team and shipped as `libflutter.so`. You only touch NDK if a third-party plugin pulls in C++ (uncommon). CMake is similarly contained.

Build fragility still exists, in a different shape. Recent examples: [3.27.1 broke APK builds for many users](https://stackoverflow.com/questions/79293062/building-flutter-apk-failed-after-upgrading-to-flutter-3-27-1) due to AGP version conflicts; [3.41 "Year of the Fire Horse"](https://flutter.dev/docs/whats-new) shipped Feb 2026 with breaking changes around namespace requirements that hit any plugin not yet migrated. Impeller (the new renderer) has been a recurring source of regressions — there are reports of [Impeller-related slowdowns and crashes](https://openillumi.com/en/en-flutter-impeller-permanent-disable-for-fast-dev/) where users disable it during development. As of Flutter 3.44 (May 2026, [I/O announcement](https://medium.com/flutter/whats-new-in-flutter-3-44-b0cc1ad3c527)), Impeller is the only iOS renderer, Vulkan-backed Impeller is default on Android, and Swift Package Manager is the default iOS dependency manager replacing CocoaPods.

The honest comparison: Flutter ships more breaking changes per release than RN, but breakages are contained to Flutter's own toolchain. You don't get the "two unrelated parties' contracts disagree" failure mode that NDK 27 + worklets is currently producing in cook-smart. When a Flutter build breaks, it's almost always one team's code to fix.

### Native features for cook-smart

- **Camera + barcode**: `mobile_scanner` is the best-maintained option. CameraX/MLKit on Android, AVFoundation/Apple Vision on iOS, ZXing on web. Active maintenance through 2026, [latest release April 2026](https://github.com/juliansteenbakker/mobile_scanner). Single library covers both ML Kit and Apple Vision behind a uniform API. Significantly less stack to debug than RN's vision-camera + frame-processor + worklets chain.
- **Firebase push**: `firebase_messaging` from the official [FlutterFire](https://github.com/firebase/flutterfire) project, maintained by the Firebase team at Google. Firebase BoM 4.14.0 shipped May 14, 2026. Direct upstream support, not a community wrapper.
- **Vector icons**: built-in. `Icons.shopping_cart` etc. is a first-class API. Custom icon fonts via `pubspec.yaml` declaration. No build-phase scripts.
- **Secure storage**: `flutter_secure_storage` (juliansteenbakker fork is the maintained one). Keystore on Android, Keychain on iOS.
- **Audio**: `just_audio` + `audio_service` for background-capable playback. Mature, widely used. ryanheise maintains both.

None of these are best-in-class for every edge case, but the average plugin quality is higher than RN's and the failure modes are more boring (a parameter changed, an API was renamed) rather than build-system fights.

### Dev experience reality

Hot reload is the feature Flutter is most known for and it earns the reputation: stateful widget reloads in <1 second are routine. It works through tooling injection at the Dart VM level, not Metro-style bundle replacement, so it's less flaky.

Debugger is real. Breakpoints, step-through, watch expressions in DevTools or your IDE. This is a step up from RN where native breakpoints require switching to Xcode/Android Studio.

Dart 3 has sound null safety, generics, sealed classes, pattern matching. Type system is closer to Kotlin than to TypeScript — nominal rather than structural, no union types in the TS sense, no `unknown`. The migration cost from a TypeScript mental model is real but the learning curve is short for an experienced TS developer.

Error messages on the build side are noticeably better than RN. Dart compiler errors have file/line, expected/actual, and usually a quick-fix. Runtime errors include widget tree context. The flip side: when Impeller or the engine crashes, the message is "engine vsync" or similar, and you're back to platform-specific logs.

IDE support: Android Studio and VS Code both have first-class plugins. Refactoring is much better than RN — rename, extract widget, wrap with parent are reliable.

The single biggest ergonomic loss vs React Native: composition. Flutter's "everything is a widget" philosophy means deeply nested constructor trees. `Padding(child: Container(child: Column(children: [...])))` is normal. There are linting tools and the Flutter Inspector to manage it, but it never reads as cleanly as JSX.

### Migration cost

Realistic for cook-smart's 20–30 screens, single developer:

- React component → StatelessWidget/StatefulWidget. Mechanical. ~1 day per simple screen, 1–3 days for screens with complex state (recipe results, barcode scanner).
- Navigation: React Navigation → `go_router`. Translates cleanly.
- API client: existing fetch/axios → `dio` or `http`. Trivial.
- State: whatever the app uses (Context, Redux, Zustand) → Riverpod, Provider, or BLoC. This is the rethink — Flutter's idiomatic state management is more opinionated than React's.
- Styling: StyleSheet → ThemeData + per-widget styling. Biggest culture shift; there is no "CSS-like" layer.
- Forms: React Hook Form → Flutter `Form` + `TextFormField`. Less ergonomic, more boilerplate.

Estimate for solo dev to reach feature parity with current Android-only state and ship to iOS day one: **10–14 weeks of focused work**, assuming standard-quality but not pixel-perfect UI. Add 2–4 weeks if iOS-specific polish is required (Cupertino widgets, iOS gestures). Backend is unchanged.

### Long-term viability

Funded by Google. Google [laid off ~200 from the Flutter, Dart, and Python teams in May 2024](https://techcrunch.com/2024/05/01/google-lays-off-staff-from-flutter-dart-python-weeks-before-its-developer-conference/). Despite that, Flutter has continued shipping monthly stable releases — 3.27 in Dec 2024, 3.41 in Feb 2026, 3.44 in May 2026. Google demonstrated continued investment at I/O 2026 with the Hybrid Composition++ work and SwiftPM as the new iOS default. Statista's 2023 cross-platform survey put Flutter at [46% adoption vs RN's 35%](https://tech-insider.org/flutter-vs-react-native-2026/) — uncertain how much that reflects 2026 reality, but it's the best public datapoint available.

Hiring pool is smaller than RN/JS in absolute numbers but growing. Plugin ecosystem on pub.dev is mature for everything cook-smart needs. Five-year bet: viable. The risk is Google de-prioritising it further, but 2024–2026 has shown continued shipment despite the layoff.

## Option 3: Kotlin Multiplatform Mobile (KMM) + Compose Multiplatform

Share business logic in Kotlin. Share UI via Compose Multiplatform (CMP). Two language runtimes — JVM/Android Runtime on Android, Kotlin/Native on iOS — with a shared Compose UI tree.

### Build story

Two builds, more or less independent. Android: standard Gradle + AGP + Kotlin compiler + KSP. iOS: Gradle produces a Kotlin/Native framework, then Xcode (or `xcodebuild` driven by Gradle) consumes it. CocoaPods integration is supported but optional; SPM is also supported.

NDK is not in the path. Kotlin/Native compiles directly to LLVM IR, then to ARM64/x86 binaries. CMake is not used unless you opt in to a C++ dependency. Toolchain failure modes are entirely different from RN's:

- Kotlin version drift across modules (the framework, libraries, KSP plugins) is the most common failure.
- Kotlin/Native compilation is slow and memory-hungry. Compose Multiplatform compiles in particular have hit [JVM heap exhaustion](https://github.com/JetBrains/compose-multiplatform/issues/4330) on smaller machines.
- The iOS framework export step is sensitive to Xcode version, Swift compiler version, and bitcode/architecture settings.

Update story: KMP itself has been [stable since November 2023](https://volpis.com/blog/is-kotlin-multiplatform-production-ready/), [Google officially supports it](https://developer.android.com/kotlin/multiplatform). Compose Multiplatform iOS reached stable in May 2025, with [CMP 1.10.0 in Jan 2026](https://blog.jetbrains.com/kotlin/2026/01/compose-multiplatform-1-10-0/) and [CMP 1.11.0 in May 2026](https://blog.jetbrains.com/kotlin/2026/05/compose-multiplatform-1-11-0/) bringing experimental native iOS text input, default concurrent rendering on iOS, and unified `@Preview`. Platform is moving fast — good for capability, mixed for stability.

### Native features for cook-smart

- **Camera + barcode**: messier than the other options. There is no single canonical library. Choices include [KScan](https://github.com/ismai117/KScan) (early stage), [QRKit](https://medium.com/mobile-innovation-network/qrkit-barcode-scanning-in-compose-multiplatform-for-android-and-ios-77cf5d84f719), or commercial SDKs like [Scanbot's CMP wrapper](https://scanbot.io/techblog/compose-multiplatform-barcode-scanner-for-ios-with-cocoa-pods/). Many KMP teams write the camera/scanner per platform (CameraX + ML Kit on Android, AVFoundation + Vision on iOS) and expose a common `expect/actual` interface. Documented crashes ([iOS camera + ML Kit in KMP](https://stackoverflow.com/questions/79103337/ios-camera-freezes-and-crashes-with-mlkit-barcode-scanning-in-kotlin-multiplatfo)) at the Kotlin/Native ↔ Objective-C boundary. This is where KMP is weakest for cook-smart.
- **Firebase push**: no first-party Google solution. The community option is [KMPNotifier](https://github.com/mirzemehdi/KMPNotifier) by mirzemehdi, which is a single-maintainer project. For Firebase as a whole, [GitLive's Firebase KMP](https://github.com/GitLiveApp/firebase-kotlin-sdk) wraps the official SDKs but is also a third party. This is the single biggest ecosystem risk.
- **Vector icons**: Compose Material Icons are available cross-platform. Custom fonts via `compose.resources`. Comparable to Flutter, better than RN.
- **Secure storage**: `multiplatform-settings` covers SharedPreferences/UserDefaults. For Keychain/Keystore-backed encrypted storage, [KVault](https://github.com/Liftric/KVault) is the typical choice. Smaller community.
- **Audio**: no canonical CMP audio library. You write `expect`/`actual` over MediaPlayer/AVAudioPlayer or use a per-platform plugin and bridge it.

Pattern: where Flutter has a single dominant plugin per category, KMP often has 2–3 immature options or expects you to write platform-specific bindings. For cook-smart's standard feature set this means more glue code.

### Dev experience reality

Best-in-class IDE support. IntelliJ/Android Studio with the Kotlin Multiplatform plugin is the strongest IDE experience of the four options — refactoring works across the entire shared tree, including across iOS-only and Android-only `actual` implementations. Compose has live preview in Android Studio.

Hot reload: [Compose Hot Reload became stable in CMP 1.10.0](https://blog.jetbrains.com/kotlin/2026/01/compose-multiplatform-1-10-0/) (Jan 2026). It's good — comparable to Flutter's, slightly slower in cold-start. iOS hot reload is more limited than Android.

Debugger: real, full Kotlin debugging on Android. iOS debugging works but is the rough edge — [debugger support was patchy](https://github.com/JetBrains/compose-multiplatform/issues/3761) for Compose iOS until recently. As of 2026 it works but is the area you should expect to lose half a day to.

Type safety: Kotlin's type system is the strongest of the four options here. Sealed classes + smart casts + null safety + result types. If you like TypeScript's type system, you will like Kotlin's.

Error messages: good Kotlin compile errors. Compose @Composable misuse errors are wordy but accurate. Kotlin/Native iOS link errors can be cryptic (mostly when `expect` declarations don't match `actual`s).

### Migration cost

Hardest of the four migrations. Reasons:

- TypeScript → Kotlin is a real language change. More concepts (coroutines, Flow, sealed hierarchies, scope functions) than Dart introduces.
- React → Compose conceptually maps better than React → Flutter (declarative, state-based, recomposition is roughly equivalent to re-rendering), but Compose is column-and-row layout where React is flexbox. Layout idioms differ.
- Plugin gaps mean you'll write `expect`/`actual` bridges for at least the camera and probably audio. That's per-platform native work — Kotlin/Android for one side, Swift/Obj-C interop for the other. This negates some of the "single codebase" benefit for cook-smart specifically.

Estimate for solo dev: **14–20 weeks** to reach feature parity. The wider range reflects how much native bridging cook-smart's barcode + audio + Firebase needs require.

### Long-term viability

Funded by JetBrains, with explicit Google support for KMM (business logic, not UI). JetBrains is a profitable independent company; their commitment to KMP is core to their product strategy and not subject to the same layoff pressure as Meta or Google. CMP iOS is the new bet — a 12-month-old stable product as of May 2026.

Hiring pool: small for full-stack KMP, large for Kotlin/Android. Stack Overflow coverage is thin compared to RN/Flutter; the [#1 KMP newsletter](https://kmpweekly.com/) and the JetBrains blog are the practical resources.

Five-year bet: viable, gaining momentum. JetBrains is unlikely to abandon it. The risk is that "shared UI on iOS" never reaches the polish bar of native or Flutter, and KMP-the-business-logic-layer ends up being the long-term success while CMP-on-iOS stays niche.

## Option 4: Native twin-build (Kotlin/Compose for Android + Swift/SwiftUI for iOS)

Two separate codebases. Maximum control. No cross-platform abstraction layer to misbehave.

### Build story

Each side uses the platform's first-party tooling. Android: Android Studio + Gradle + AGP + Kotlin + Jetpack Compose (~1.11.0 as of May 2026). iOS: Xcode 26.5 ([released May 11, 2026](https://xcodereleases.com/)) + Swift 6.3.2 + SwiftUI.

NDK is not on the path unless you choose to use C++. CMake similarly. Autolinking does not exist in the cross-platform sense. There is exactly one toolchain per platform and exactly one team responsible for it — Google for Android, Apple for iOS. When something breaks, the upstream is the platform vendor.

Failure modes that still exist:

- Apple deprecates or breaks things between Xcode majors. [Xcode 16 introduced SwiftUI ABI churn](https://developer.apple.com/forums/thread/770998); Xcode 27 (Sep 2026) is [expected to require Liquid Glass UI adoption and the new UIScene lifecycle](https://dev.classmethod.jp/en/articles/ios27-xcode27-migration-preparation-guide/).
- Android: AGP majors break things. Compose Compiler version pinning is real.
- Swift 6 strict concurrency requires explicit Sendable annotations and breaks pre-Swift-6 code patterns.

The difference is that breakages are platform-mandated, predictable, well-documented, and you fix them once per platform per year — not once per RN/AGP/NDK/Plugin combination.

### Native features for cook-smart

All best-in-class, all official.

- **Camera + barcode**: CameraX + ML Kit on Android. AVFoundation + Vision on iOS. Both are first-party, both have decade-plus track records, both work.
- **Firebase push**: official Firebase Android SDK + Firebase iOS SDK. Direct upstream.
- **Vector icons**: Material Icons in Compose, SF Symbols in SwiftUI. Both are first-class.
- **Secure storage**: EncryptedSharedPreferences/Keystore on Android, Keychain Services on iOS. Both are platform APIs.
- **Audio**: ExoPlayer/Media3 on Android, AVAudioPlayer/AVPlayer on iOS. Both are platform-supported.

There is no plugin-shaped failure mode. If something doesn't work, it's your code or it's a real platform bug.

### Dev experience reality

Best-in-class on both sides. Android Studio 2026.x with K2 compiler, full Compose preview, layout inspector, Macrobenchmark. Xcode 26.5 with SwiftUI Previews (genuinely working in 2026), Instruments, full LLDB.

Hot reload-ish: Compose Preview + LiveEdit on Android. SwiftUI Previews + interactive previews on iOS.

Type safety: Kotlin and Swift are both stronger than TypeScript or Dart. Swift 6's strict concurrency catches data races at compile time.

Error messages: best of all four options. The only DX downside: you write everything twice. Two screens, two view models, two API clients, two test suites.

### Migration cost

Highest. **20–32 weeks** for a solo dev to reach feature parity on both platforms simultaneously, depending on iOS familiarity. Worse: forever after, every feature is two implementations. Backend is unchanged.

### Long-term viability

Funded by Apple and Google directly. The strongest possible bet — these companies will support their own platforms or there is no platform.

Hiring pool: largest in absolute numbers split across two skill sets (Android devs, iOS devs). Finding someone who does both well is rare.

Five-year bet: trivially yes. Native is the safest 5- and 10-year bet of any option.

## Honest recommendation for cook-smart specifically

**Go with Flutter.** Plan for a 10–14 week port.

Reasoning, against the cook-smart constraints:

- **Both platforms day one is non-negotiable.** This eliminates native twin-build for a single developer. 20–32 weeks to reach the *current* (Android-only) state isn't a port, it's a rewrite plus a brand new app. The user does not have that time.
- **Fed up with build fragility is the dominant emotional driver.** The user is correct to weight this heavily — it's the failure mode that has cost them two days this week and will cost them more days every quarter. RN-with-self-fix doesn't solve this; it patches the current incident and waits for the next one. The next NDK/AGP/Codegen contract break is a matter of weeks, not years.
- **Flutter has its own build fragility, but contained.** Flutter ships breaking changes per release (3.27.1 APK breakage, 3.41 namespace migration, Impeller regressions), but every breakage is owned by one team. There is no equivalent of "NDK 27 disagrees with worklets disagrees with autolink." When Flutter breaks, you read the Flutter migration guide and fix the issue. It's annoying. It's not the open-ended, multi-party diagnosis cook-smart is currently stuck in.
- **Plugin maturity for cook-smart's exact feature set is highest in Flutter.** `mobile_scanner`, `firebase_messaging` (official FlutterFire), `flutter_secure_storage`, `just_audio` — all mature, single-dominant, actively maintained. KMP has gaps in three of those five. Native has all of them but at 2x cost.
- **Solo dev with ~30 screens favours Flutter's widget model.** CMP's idioms are excellent but the iOS UI polish bar requires Cupertino widgets that are still maturing in CMP. Flutter's Material + Cupertino is mature today.
- **TypeScript → Dart is a smaller step than TypeScript → Kotlin.** Dart 3 with sound null safety is closer to TS in mental model than Kotlin (more concepts to learn, especially coroutines and `expect`/`actual`).
- **Backend stays Node/Express. Doesn't matter.** All four options call REST identically.### What the user gives up by picking Flutter

The single biggest trade-off is **abandoning the React/TypeScript ecosystem** in exchange for build-system sanity. Specifically:

- Dart, not TypeScript. Closer than Kotlin, but not the same. The 30+ npm packages in your `package.json` become 30+ pub.dev packages with different APIs. Existing TypeScript expertise transfers to typed-language *concepts*, not to specific libraries.
- React patterns (hooks, context, JSX composition) are gone. Flutter's widget tree composition is more verbose and the state management story (Riverpod/BLoC) is more opinionated than React's.
- Flutter is funded by Google, which laid off Flutter team members in May 2024. The framework has continued shipping through 2026, but the long-term commitment is less ironclad than Apple/Google native or Meta's RN. This is a real risk, weighted lower because (a) the open-source community would carry it if Google walked away, (b) every alternative has an equivalent or worse risk — Meta laid off 8,000 in May 2026, Compose Multiplatform iOS only stabilised 12 months ago.
- Roughly 10–14 weeks of solo developer time before the app is shipping again. During that window, no new features ship. This is the largest cost. It is paid once. The RN-self-fix path pays a smaller cost forever.

### Surprises from research that changed the picture

1. **React Native 0.82 removed the Legacy Architecture entirely.** Before 0.82 (Oct 8, 2025), apps could fall back to the old bridge if Codegen broke. They cannot now. This means the failure mode cook-smart is hitting — autolinked Codegen modules conflicting with NDK 27 — is now the *only* path. There is no escape hatch in a future RN minor; the decision is to live with this class of bug or leave RN. That makes the RN-status-quo option strictly worse than it was a year ago.
2. **Compose Multiplatform iOS only became stable in May 2025.** That makes CMP-on-iOS a one-year-old stable product. For a solo developer needing to ship to iOS now, it's too new to be the prudent bet.
3. **Flutter's plugin ecosystem is actually better than RN's for cook-smart's exact features.** Going in, the assumption was "RN ecosystem is biggest." Numerically true, but for the specific list (camera+barcode, push, audio, secure storage, vector icons), Flutter has a single dominant, well-maintained plugin per category. RN has 2–3 competing options of varying quality. The "biggest ecosystem" advantage doesn't help when it produces fragmented choices.
4. **Native twin-build is genuinely off the table for a solo dev with a deadline.** It's worth saying out loud: native is the right answer for a team of three or more, or a solo dev with two years. With a single developer needing both platforms day one and a hard ceiling on how many weeks they can spend not shipping features, it's a non-starter — even though every other axis (build stability, performance, type safety, viability) favours it.

If the user disagrees with the Flutter recommendation, the only defensible alternative is RN-with-self-fix and accepting the recurring cost. KMP+CMP and native twin-build are real options for different teams, not for this one.
