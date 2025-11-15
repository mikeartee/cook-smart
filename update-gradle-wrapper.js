const fs = require('fs');
const path = require('path');

const wrapperPath = 'C:\\Users\\toota\\Documents\\Projects\\CookSmartFresh\\android\\gradle\\wrapper\\gradle-wrapper.properties';

const content = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.13-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;

fs.writeFileSync(wrapperPath, content);
console.log('✅ Updated Gradle to 8.13 (required minimum version)');
console.log('\nNow run: npm run android');
