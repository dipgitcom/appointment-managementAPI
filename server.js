const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const swaggerUi = require("swagger-ui-express")
const swaggerJsdoc = require("swagger-jsdoc")
const appointmentRoutes = require("./routes/appointments")
const { initializeDatabase } = require("./database/db")

const app = express()
const PORT = process.env.PORT || 3000

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Appointment Management API",
      version: "1.0.0",
      description: "API for managing patient appointments",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
  },
  apis: ["./routes/*.js"], // Path to the API docs
}

const specs = swaggerJsdoc(swaggerOptions)

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs))

// Routes
app.use("/api/appointments", appointmentRoutes)

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Appointment Management API is running" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`)
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`)
    })
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error)
    process.exit(1)
  })

module.exports = app
