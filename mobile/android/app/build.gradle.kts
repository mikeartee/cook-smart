import java.io.FileInputStream
import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// -----------------------------------------------------------------------------
// Release signing configuration
//
// The four required keys (`storeFile`, `storePassword`, `keyAlias`,
// `keyPassword`) are loaded from `mobile/android/keystore.properties`, which is
// untracked (`.gitignore`) and never committed. See
// `mobile/android/keystore.properties.template` for the expected layout.
//
// Validates: Requirements 17.2, 17.5, 17.6.
// -----------------------------------------------------------------------------

val keystorePropertiesFile: File = rootProject.file("keystore.properties")
val keystoreProperties = Properties()
val keystorePropertiesLoaded: Boolean = if (keystorePropertiesFile.exists()) {
    FileInputStream(keystorePropertiesFile).use { keystoreProperties.load(it) }
    true
} else {
    false
}

val requiredKeystoreKeys = listOf("storeFile", "storePassword", "keyAlias", "keyPassword")

/**
 * Returns the list of required keys that are missing from the loaded
 * `keystore.properties` file. Used by the release-build guard to fail with
 * an explicit error instead of silently falling back to debug signing.
 */
fun missingKeystoreKeys(): List<String> =
    requiredKeystoreKeys.filter { keystoreProperties.getProperty(it).isNullOrBlank() }

android {
    namespace = "com.example.mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.example.mobile"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        // Release signing config is only fully populated when
        // `keystore.properties` is present and complete. The release-build
        // guard task `checkReleaseSigningConfig` (below) aborts the build
        // before this signing config is consumed if any required key is
        // missing.
        create("release") {
            if (keystorePropertiesLoaded && missingKeystoreKeys().isEmpty()) {
                // `storeFile` paths in keystore.properties are resolved
                // relative to `mobile/android/` (the Gradle root project
                // directory), matching the layout shown in
                // `keystore.properties.template`.
                storeFile = rootProject.file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

// -----------------------------------------------------------------------------
// Release-build guards
//
// `checkReleaseApiBaseUrl` runs the Dart guard at
// `mobile/tool/check_release_url.dart` to fail the build if the production
// base URL literal in `lib/core/config/api_config.dart` has been changed to
// anything other than `https://api.cooksmartapp.com`.
//
// `checkReleaseSigningConfig` aborts the build with an explicit error if
// `keystore.properties` is missing or any of the four required keys are
// absent, or if the resolved `storeFile` does not exist on disk.
//
// Both tasks are wired as dependencies of every `assembleRelease` /
// `bundleRelease` task variant created by the Android plugin.
//
// Validates: Requirements 9.2, 12.4, 17.5, 17.6.
// -----------------------------------------------------------------------------

val flutterProjectDir: File = rootProject.projectDir.parentFile

tasks.register("checkReleaseApiBaseUrl") {
    group = "verification"
    description = "Aborts the release build if the resolved API base URL is not https://api.cooksmartapp.com."

    doLast {
        val dartExecutable = if (org.gradle.internal.os.OperatingSystem.current().isWindows) {
            "dart.bat"
        } else {
            "dart"
        }

        val process = ProcessBuilder(dartExecutable, "run", "tool/check_release_url.dart")
            .directory(flutterProjectDir)
            .redirectErrorStream(true)
            .start()
        val output = process.inputStream.bufferedReader().readText()
        val exitCode = process.waitFor()
        if (exitCode != 0) {
            throw GradleException(
                "Release base URL guard failed (exit $exitCode):\n$output\n" +
                    "Release builds must target https://api.cooksmartapp.com " +
                    "(Requirements 9.2, 12.4)."
            )
        }
        logger.lifecycle(output.trim())
    }
}

tasks.register("checkReleaseSigningConfig") {
    group = "verification"
    description = "Aborts the release build if mobile/android/keystore.properties or required credentials are missing."

    doLast {
        if (!keystorePropertiesLoaded) {
            throw GradleException(
                "mobile/android/keystore.properties is missing. Copy " +
                    "keystore.properties.template, fill in storeFile, storePassword, " +
                    "keyAlias, and keyPassword, and retry the release build " +
                    "(Requirements 17.5, 17.6)."
            )
        }

        val missing = missingKeystoreKeys()
        if (missing.isNotEmpty()) {
            throw GradleException(
                "mobile/android/keystore.properties is missing required " +
                    "key(s): ${missing.joinToString(", ")}. All four of " +
                    "storeFile, storePassword, keyAlias, and keyPassword are " +
                    "required (Requirements 17.5, 17.6)."
            )
        }

        val storeFilePath = keystoreProperties.getProperty("storeFile")
        val resolvedStoreFile = rootProject.file(storeFilePath)
        if (!resolvedStoreFile.exists()) {
            throw GradleException(
                "Release keystore file not found at " +
                    "${resolvedStoreFile.absolutePath} (storeFile=$storeFilePath). " +
                    "Place the production keystore at this path or update " +
                    "keystore.properties (Requirements 17.5, 17.6)."
            )
        }

        logger.lifecycle("[checkReleaseSigningConfig] OK: keystore and credentials present.")
    }
}

// Hook the guards into every release assemble / bundle task variant.
afterEvaluate {
    listOf("assembleRelease", "bundleRelease").forEach { taskName ->
        tasks.findByName(taskName)?.dependsOn(
            "checkReleaseApiBaseUrl",
            "checkReleaseSigningConfig",
        )
    }
}
