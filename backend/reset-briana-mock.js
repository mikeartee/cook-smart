const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'data/users.json');
const email = 'brianaolszewski1@gmail.com';
const newPassword = 'June172018!';

async function resetPassword() {
  try {
    // Read the database
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    
    // Find Briana's account
    const userIndex = data.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (userIndex === -1) {
      console.log('❌ User not found with email:', email);
      return;
    }
    
    console.log('✅ User found:', data.users[userIndex].email);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password
    data.users[userIndex].password_hash = hashedPassword;
    
    // Write back to file
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    
    console.log('✅ Password reset successful!');
    console.log('📧 Email:', email);
    console.log('🔑 New password:', newPassword);
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
}

resetPassword();
