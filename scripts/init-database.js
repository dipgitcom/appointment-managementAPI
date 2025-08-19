const { initializeDatabase } = require("../database/db")

console.log("🔄 Initializing database...")

initializeDatabase()
  .then(() => {
    console.log("✅ Database initialized successfully!")
    setTimeout(() => process.exit(0), 100)
  })
  .catch((error) => {
    console.error("❌ Failed to initialize database:", error)
    process.exit(1)
  })
