const bcrypt = require('bcrypt');
const fs = require('fs');

// Generate a new hash for 'admin123'
async function createAdminUser() {
  try {
    // Generate hash for password
    const password = 'admin123';
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    
    // Create a simple users.json file
    const users = [
      {
        username: 'admin',
        passwordHash: hash,
        isAdmin: true
      }
    ];
    
    // Write to file
    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    
    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Hash:', hash);
    console.log('Users file created: users.json');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();
