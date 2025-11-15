const fs = require('fs');

// Read the new project's package.json
const newPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Custom dependencies from old project
const customDeps = {
  '@react-native-async-storage/async-storage': '^2.2.0',
  '@react-navigation/bottom-tabs': '^7.8.4',
  '@react-navigation/native': '^7.1.19',
  '@react-navigation/stack': '^7.6.3',
  'react-native-sound': '^0.13.0',
  'react-native-vector-icons': '^10.3.0'
};

const customDevDeps = {
  '@testing-library/jest-native': '^5.4.3',
  '@testing-library/react-native': '^12.4.2',
  '@types/jest': '^30.0.0',
  '@types/react-native-vector-icons': '^6.4.18',
  '@typescript-eslint/eslint-plugin': '^8.46.4',
  '@typescript-eslint/parser': '^8.46.4',
  'babel-plugin-module-resolver': '^5.0.2',
  'husky': '^9.1.6',
  'lint-staged': '^15.2.0',
  'prettier': '^3.3.3'
};

// Merge dependencies
newPkg.dependencies = { ...newPkg.dependencies, ...customDeps };
newPkg.devDependencies = { ...newPkg.devDependencies, ...customDevDeps };

// Add custom scripts
newPkg.scripts = {
  ...newPkg.scripts,
  typecheck: 'tsc --noEmit',
  prepare: 'husky install',
  build: 'tsc --noEmit && echo Build check passed'
};

// Add lint-staged config
newPkg['lint-staged'] = {
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write'
  ]
};

// Add engines
newPkg.engines = {
  node: '>=18'
};

// Write merged package.json
fs.writeFileSync('package.json', JSON.stringify(newPkg, null, 2) + '\n');

console.log('✅ package.json merged successfully!');
console.log('\nAdded dependencies:');
Object.keys(customDeps).forEach(dep => console.log(`  - ${dep}`));
console.log('\nAdded devDependencies:');
Object.keys(customDevDeps).forEach(dep => console.log(`  - ${dep}`));
