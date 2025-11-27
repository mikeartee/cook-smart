#!/usr/bin/env node

/**
 * File Hygiene Checker
 * Warns about temporary, test, and cleanup-candidate files before commit
 */

const {execSync} = require('child_process');
const path = require('path');

// Get list of staged files
const stagedFiles = execSync('git diff --cached --name-only', {
  encoding: 'utf-8',
})
  .split('\n')
  .filter(Boolean);

const warnings = [];
const errors = [];

// Patterns to check
const patterns = {
  testFiles: /^test-.*\.js$/,
  tempFiles: /^temp-/,
  backupFiles: /\.(backup|old|tmp)$/,
  wipFiles: /^(WIP-|DRAFT-|DEBUG-)/i,
  apkFiles: /\.apk$/,
  oldReleaseNotes: /RELEASE_NOTES_v\d+\.\d+\.\d+\.md$/,
};

// Check each staged file
stagedFiles.forEach(file => {
  const filename = path.basename(file);
  const isRootFile = !file.includes('/') && !file.includes('\\');

  // Check for test files in root
  if (isRootFile && patterns.testFiles.test(filename)) {
    warnings.push(
      `⚠️  Test file in root: ${file} - Should be deleted after use`,
    );
  }

  // Check for temporary files
  if (patterns.tempFiles.test(filename)) {
    warnings.push(
      `⚠️  Temporary file: ${file} - Should be deleted before commit`,
    );
  }

  // Check for backup files
  if (patterns.backupFiles.test(filename)) {
    warnings.push(`⚠️  Backup file: ${file} - Should be deleted before commit`);
  }

  // Check for WIP/Draft files
  if (patterns.wipFiles.test(filename)) {
    warnings.push(
      `⚠️  Work-in-progress file: ${file} - Remove prefix or delete`,
    );
  }

  // Check for APK files
  if (patterns.apkFiles.test(filename)) {
    warnings.push(
      `⚠️  APK file: ${file} - Should be in .gitignore, not committed`,
    );
  }

  // Check for old release notes
  if (patterns.oldReleaseNotes.test(filename)) {
    warnings.push(
      `⚠️  Old release notes: ${file} - Consider keeping only latest versions`,
    );
  }
});

// Count APK files
const apkCount = stagedFiles.filter(f => patterns.apkFiles.test(f)).length;
if (apkCount > 1) {
  warnings.push(
    `⚠️  Multiple APK files (${apkCount}) - Keep only the latest release`,
  );
}

// Count release notes
const releaseNotesCount = stagedFiles.filter(f =>
  patterns.oldReleaseNotes.test(f),
).length;
if (releaseNotesCount > 3) {
  warnings.push(
    `⚠️  Multiple release notes (${releaseNotesCount}) - Archive older versions`,
  );
}

// Display results
if (warnings.length > 0 || errors.length > 0) {
  console.log('\n🧹 File Hygiene Check\n');

  if (errors.length > 0) {
    console.log('❌ ERRORS (must fix):');
    errors.forEach(err => console.log(`   ${err}`));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (review recommended):');
    warnings.forEach(warn => console.log(`   ${warn}`));
    console.log('');
  }

  console.log('💡 File Hygiene Tips:');
  console.log('   - Delete test files after use (test-*.js)');
  console.log('   - Remove temporary files (temp-*, *.backup, *.old)');
  console.log('   - Keep only latest APK and recent release notes');
  console.log('   - Update existing docs instead of creating new ones');
  console.log('');

  if (errors.length > 0) {
    console.log('❌ Commit blocked. Fix errors above.\n');
    process.exit(1);
  }

  console.log('⚠️  Warnings found. Review files above.');
  console.log('   Continue commit? (Files will be committed as-is)\n');
}

// Exit successfully (warnings don't block commit, just inform)
process.exit(0);
