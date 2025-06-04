const bcrypt = require("bcrypt")

// The hash from your DEFAULT_USERS array
const storedHash = "$2b$10$XJrS7/6QGC.XzYCtFnJRg.4Xt8XqGBYYIQH0X.oTVUVT8s9EiVxIK"

// The password to check
const password = "admin123"

// Verify the password against the hash
bcrypt.compare(password, storedHash, (err, result) => {
  if (err) {
    console.error("Error comparing password:", err)
    return
  }

  if (result) {
    console.log('Password matches! The hash is valid for "admin123"')
  } else {
    console.log("Password does not match. Let's create a new hash:")

    // Generate a new hash for the password
    bcrypt.hash(password, 10, (err, newHash) => {
      if (err) {
        console.error("Error generating hash:", err)
        return
      }

      console.log('New hash for "admin123":', newHash)
      console.log("\nUpdate your DEFAULT_USERS array with this hash:")
      console.log(`
const DEFAULT_USERS = [
  {
    username: "admin",
    passwordHash: "${newHash}",
  },
];`)
    })
  }
})

