const sqlite3 = require("sqlite3").verbose()
const path = require("path")
const fs = require("fs")

const dataDir = path.join(__dirname, "../data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
  console.log("📁 Created data directory")
}

const DB_PATH = path.join(__dirname, "../data/appointments.db")

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Error opening database:", err.message)
  } else {
    console.log("✅ Connected to SQLite database")
  }
})

// Initialize database tables
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create Patients table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS patients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
        (err) => {
          if (err) {
            console.error("Error creating patients table:", err)
            reject(err)
            return
          }
          console.log("✅ Patients table ready")
        },
      )

      // Create Appointments table
      db.run(
        `
        CREATE TABLE IF NOT EXISTS appointments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          patient_id INTEGER NOT NULL,
          appointment_date DATE NOT NULL,
          appointment_time TIME NOT NULL,
          reason TEXT NOT NULL,
          status TEXT DEFAULT 'scheduled',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES patients (id)
        )
      `,
        (err) => {
          if (err) {
            console.error("Error creating appointments table:", err)
            reject(err)
            return
          }
          console.log("✅ Appointments table ready")
          resolve()
        },
      )

      // Insert sample patients if table is empty
      db.get("SELECT COUNT(*) as count FROM patients", (err, row) => {
        if (!err && row.count === 0) {
          const samplePatients = [
            { name: "John Doe", email: "john@example.com", phone: "555-0101" },
            { name: "Jane Smith", email: "jane@example.com", phone: "555-0102" },
            { name: "Bob Johnson", email: "bob@example.com", phone: "555-0103" },
          ]

          samplePatients.forEach((patient) => {
            db.run("INSERT INTO patients (name, email, phone) VALUES (?, ?, ?)", [
              patient.name,
              patient.email,
              patient.phone,
            ])
          })
          console.log("✅ Sample patients added")
        }
      })
    })
  })
}

module.exports = { db, initializeDatabase }
