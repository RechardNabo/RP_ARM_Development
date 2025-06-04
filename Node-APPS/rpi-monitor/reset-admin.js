const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/deviceMonitor")
  .then(() => {
    console.log("Connected to MongoDB")
    resetAdmin()
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err)
    process.exit(1)
  })

// Define a simple User schema if it doesn't exist yet
const userSchema = new mongoose.Schema({
  username: String,
  passwordHash: String,
  isAdmin: Boolean,
})

// Create the model
const User = mongoose.model("User", userSchema)

async function resetAdmin() {
  try {
    // Generate hash for 'admin123'
    const saltRounds = 10
    const plainPassword = "admin123"
    const passwordHash = await bcrypt.hash(plainPassword, saltRounds)

    // Find and update admin user, or create if doesn't exist
    const result = await User.findOneAndUpdate(
      { username: "admin" },
      {
        username: "admin",
        passwordHash: passwordHash,
        isAdmin: true,
      },
      { upsert: true, new: true },
    )

    console.log("Admin user reset successfully:")
    console.log("Username:", result.username)
    console.log("Password: admin123")

    // Disconnect from MongoDB
    await mongoose.disconnect()
    console.log("Disconnected from MongoDB")
  } catch (error) {
    console.error("Error resetting admin user:", error)
    process.exit(1)
  }
}

