const fs = require('fs');

const fixFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/'Google Sign-In is not enabled\. Please enable it in your Firebase Console under Authentication -> Sign-in method\.'/g, "t('login.googleNotEnabled')");
  content = content.replace(/'An error occurred during Google Sign-In'/g, "t('login.googleError')");
  content = content.replace(/'Password reset email sent! Please check your inbox\.'/g, "t('login.resetSent')");
  content = content.replace(/'Please enter your email address first\.'/g, "t('login.enterEmail')");
  content = content.replace(/'An error occurred'/g, "t('common.error')");
  fs.writeFileSync(filePath, content);
};

fixFile('./src/pages/Login.tsx');

console.log('Fixed Login issues');
