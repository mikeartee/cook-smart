# Legacy React Native Rollback Runbook (Template)

> **Status: TEMPLATE.** This document is a placeholder runbook written during the Foundation_Phase of the Flutter migration. The `legacy-rn/` folder it references **does not exist yet**. That folder is created by a later spec (the cutover spec) when the Flutter `mobile/` app passes the Cutover_Gate and replaces the React Native app on the Play Store. Until then, treat the procedures below as a template to be filled in and validated at cutover time.
>
> **Source of truth for the cutover steps:** [requirements.md Requirement 6](../.kiro/specs/flutter-migration-architecture/requirements.md) and [design.md Decision 6](../.kiro/specs/flutter-migration-architecture/design.md) in the `flutter-migration-architecture` spec.

## Purpose

This runbook explains how to revive the React Native (RN) app from the `legacy-rn/` archive if a critical regression ships in the first Flutter release on the Play Store. The archive is kept for one release cycle (at least 14 days, at least one stable release) after cutover, then deleted. The `rn-final-snapshot` git tag is kept permanently.

## When to Use This Runbook

Trigger a rollback only when all of the following are true:

- A critical regression has shipped in the Flutter `mobile/` build that is currently live on the Play Store.
- The regression cannot be patched in Flutter inside the user-impact window (rule of thumb: same business day).
- Reverting to the last known-good RN APK is faster than producing a hotfix Flutter APK.

If the regression can be hotfixed in Flutter within the user-impact window, hotfix Flutter instead. Rollback is the last resort, not the first.

## Preconditions

Confirm before starting:

- [ ] The `legacy-rn/` folder exists at the repo root (it is removed after one release cycle; if it is gone, use the `rn-final-snapshot` git tag instead — see "Rollback From Tag" below).
- [ ] The `rn-final-snapshot` git tag exists on the `origin` remote.
- [ ] You have the production Android keystore (`*.jks`) and `keystore.properties` available locally.
- [ ] You have access to the Play Console for the cook-smart app.
- [ ] The backend at `https://api.cooksmartapp.com` is reachable and on a contract version compatible with the RN app at the cutover commit (the RN app and Flutter app share the same `{ success, message, data }` envelope and the same JWT auth flow per Requirement 9, so this is normally true).

## Rollback Path A: From `legacy-rn/` (Within Release Cycle)

Use this path if `legacy-rn/` is still present in the repo.

### 1. Restore the RN Source Tree

```powershell
# From repo root.
git checkout -b rollback/rn-restore-<yyyy-mm-dd>

# Move files back to their pre-cutover locations using git mv to preserve history.
git mv legacy-rn/src src
git mv legacy-rn/android android
git mv legacy-rn/App.tsx App.tsx
git mv legacy-rn/package.json package.json
git mv legacy-rn/babel.config.js babel.config.js
git mv legacy-rn/app.json app.json
```

> Adjust the file list above to match the exact set of paths the cutover spec moves into `legacy-rn/`. The cutover spec is the source of truth for which paths are archived.

### 2. Reinstall Dependencies

```powershell
# From repo root.
npm install
```

### 3. Verify the RN Build Locally

```powershell
# Clean previous build outputs.
cd android
.\gradlew clean

# Build the release APK.
.\gradlew assembleRelease --no-daemon
cd ..
```

Verify the APK is at `android/app/build/outputs/apk/release/app-release.apk`.

### 4. Smoke-Test on a Physical Device

```powershell
adb install -r android\app\build\outputs\apk\release\app-release.apk
adb shell am start -n com.cooksmartfresh/.MainActivity
```

Run through the verification checklist below before promoting the APK.

## Rollback Path B: From the `rn-final-snapshot` Git Tag

Use this path if `legacy-rn/` has already been deleted (more than one release cycle after cutover) or if the `legacy-rn/` archive is missing or corrupted.

### 1. Check Out the Snapshot

```powershell
# Fetch tags first.
git fetch origin --tags

# Create a rollback branch from the snapshot.
git checkout -b rollback/rn-from-tag-<yyyy-mm-dd> rn-final-snapshot
```

The working tree is now exactly the state of the repo at the cutover commit, with `src/`, root-level `android/`, `App.tsx`, root `package.json`, root `babel.config.js`, and root `app.json` all in their pre-cutover locations.

### 2. Reinstall Dependencies and Build

Follow steps 2 through 4 from Rollback Path A.

> If the toolchain (Node, NDK, AGP, Gradle) on your current machine has drifted since the cutover commit, the build may need toolchain pinning. Check the cutover commit's `.nvmrc`, `android/gradle.properties`, and `android/build.gradle` for the required versions and install them locally before retrying the build.

## Verification Checklist Before Redeploying

Do not promote the rollback APK to the Play Store until every item passes:

- [ ] APK installs cleanly on a physical Android device running Android 14 or later.
- [ ] App opens to the home screen without crashing.
- [ ] Login succeeds against `https://api.cooksmartapp.com` and a JWT is stored.
- [ ] Recipe search returns results from the FatSecret-backed `/recipes` endpoint.
- [ ] Barcode scan opens the camera and returns a result for a known product.
- [ ] Push notification token registers with FCM (check backend logs).
- [ ] Audio playback works for the bundled assets in `assets/audio/`.
- [ ] Contact form posts to `/contact` and returns `{"success":true}` (see `docs/deployment/` for endpoint behaviour).
- [ ] No crashes recorded in `adb logcat` during a 5-minute walkthrough of the main user flows.
- [ ] APK is signed with the production keystore (verify with `keytool -printcert -jarfile app-release.apk`).

## Redeploy

Once verification passes:

1. Bump the Android `versionCode` in `android/app/build.gradle` to one greater than the live Flutter release's `versionCode`. The Play Store will reject any upload with an equal or lower `versionCode`.
2. Bump `versionName` to a clearly rollback-tagged value (suggested format: `1.x.y-rn-rollback`).
3. Upload the APK to the Play Console as a new release on the same track currently serving the regressed Flutter build.
4. Roll out at 100% (rollback is a corrective release, staged rollout is not appropriate).
5. Monitor Play Console crash rate and user feedback for 24 hours.

## Post-Rollback Tasks

- [ ] File a tracking issue describing the regression that triggered the rollback.
- [ ] Add a failing test or parity-checklist item that would have caught the regression to the appropriate per-feature spec.
- [ ] Decide whether to keep `legacy-rn/` past its one-release-cycle window. If the rollback was needed, extend the retention period; if not, keep the original deletion timeline.
- [ ] Plan the next Flutter release that fixes the regression and re-passes the Cutover_Gate.

## Notes

- The `rn-final-snapshot` git tag persists after `legacy-rn/` is deleted (Requirement 6.13). Tag-based rollback remains possible indefinitely, though it requires reproducing the cutover-era toolchain.
- This runbook does not cover backend rollback. The backend contract is frozen by Requirement 9 and does not change as part of the migration, so backend rollback is an independent decision driven by separate criteria.
- The Flutter add-to-app and hybrid composition paths are not used by this project (Requirement 6.14), so there is no partial-rollback path.

