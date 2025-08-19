const express = require("express")
const { body, validationResult } = require("express-validator")
const { db } = require("../database/db")

const router = express.Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required:
 *         - PatientId
 *         - AppointmentDate
 *         - AppointmentTime
 *         - Reason
 *       properties:
 *         PatientId:
 *           type: integer
 *           description: The patient's unique identifier
 *         AppointmentDate:
 *           type: string
 *           format: date
 *           description: Date of appointment (YYYY-MM-DD)
 *         AppointmentTime:
 *           type: string
 *           format: time
 *           description: Time of appointment (HH:MM)
 *         Reason:
 *           type: string
 *           description: Brief description of appointment
 *     AppointmentResponse:
 *       type: object
 *       properties:
 *         AppointmentId:
 *           type: integer
 *         PatientId:
 *           type: integer
 *         AppointmentDate:
 *           type: string
 *           format: date
 *         AppointmentTime:
 *           type: string
 *           format: time
 *         Reason:
 *           type: string
 *         Message:
 *           type: string
 */

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appointment'
 *           example:
 *             PatientId: 1
 *             AppointmentDate: "2024-12-25"
 *             AppointmentTime: "10:30"
 *             Reason: "Regular checkup"
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AppointmentResponse'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  [
    body("PatientId").isInt({ min: 1 }).withMessage("PatientId must be a positive integer"),
    body("AppointmentDate").isDate().withMessage("AppointmentDate must be a valid date (YYYY-MM-DD)"),
    body("AppointmentTime")
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("AppointmentTime must be in HH:MM format"),
    body("Reason").trim().isLength({ min: 1, max: 500 }).withMessage("Reason must be between 1 and 500 characters"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        })
      }

      const { PatientId, AppointmentDate, AppointmentTime, Reason } = req.body

      // Check if patient exists
      const patient = await new Promise((resolve, reject) => {
        db.get("SELECT id FROM patients WHERE id = ?", [PatientId], (err, row) => {
          if (err) reject(err)
          else resolve(row)
        })
      })

      if (!patient) {
        return res.status(404).json({
          error: "Patient not found",
          message: `Patient with ID ${PatientId} does not exist`,
        })
      }

      // Check for appointment conflicts (same patient, same date and time)
      const existingAppointment = await new Promise((resolve, reject) => {
        db.get(
          "SELECT id FROM appointments WHERE patient_id = ? AND appointment_date = ? AND appointment_time = ?",
          [PatientId, AppointmentDate, AppointmentTime],
          (err, row) => {
            if (err) reject(err)
            else resolve(row)
          },
        )
      })

      if (existingAppointment) {
        return res.status(409).json({
          error: "Appointment conflict",
          message: "Patient already has an appointment at this date and time",
        })
      }

      // Create the appointment
      const appointmentId = await new Promise((resolve, reject) => {
        db.run(
          "INSERT INTO appointments (patient_id, appointment_date, appointment_time, reason) VALUES (?, ?, ?, ?)",
          [PatientId, AppointmentDate, AppointmentTime, Reason],
          function (err) {
            if (err) reject(err)
            else resolve(this.lastID)
          },
        )
      })

      // Return success response
      res.status(201).json({
        AppointmentId: appointmentId,
        PatientId: PatientId,
        AppointmentDate: AppointmentDate,
        AppointmentTime: AppointmentTime,
        Reason: Reason,
        Message: "Appointment created successfully",
      })
    } catch (error) {
      console.error("Error creating appointment:", error)
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to create appointment",
      })
    }
  },
)

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Get all appointments
 *     tags: [Appointments]
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: integer
 *         description: Filter by patient ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by appointment date
 *     responses:
 *       200:
 *         description: List of appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AppointmentResponse'
 */
router.get("/", async (req, res) => {
  try {
    const { patientId, date } = req.query
    let query = `
      SELECT 
        a.id as AppointmentId,
        a.patient_id as PatientId,
        a.appointment_date as AppointmentDate,
        a.appointment_time as AppointmentTime,
        a.reason as Reason,
        a.status,
        p.name as PatientName
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
    `
    const params = []

    if (patientId || date) {
      query += " WHERE "
      const conditions = []

      if (patientId) {
        conditions.push("a.patient_id = ?")
        params.push(patientId)
      }

      if (date) {
        conditions.push("a.appointment_date = ?")
        params.push(date)
      }

      query += conditions.join(" AND ")
    }

    query += " ORDER BY a.appointment_date, a.appointment_time"

    const appointments = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })

    res.json(appointments)
  } catch (error) {
    console.error("Error fetching appointments:", error)
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch appointments",
    })
  }
})

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment details
 *       404:
 *         description: Appointment not found
 */
router.get("/:id", async (req, res) => {
  try {
    const appointmentId = req.params.id

    const appointment = await new Promise((resolve, reject) => {
      db.get(
        `
        SELECT 
          a.id as AppointmentId,
          a.patient_id as PatientId,
          a.appointment_date as AppointmentDate,
          a.appointment_time as AppointmentTime,
          a.reason as Reason,
          a.status,
          p.name as PatientName,
          p.email as PatientEmail,
          p.phone as PatientPhone
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        WHERE a.id = ?
      `,
        [appointmentId],
        (err, row) => {
          if (err) reject(err)
          else resolve(row)
        },
      )
    })

    if (!appointment) {
      return res.status(404).json({
        error: "Appointment not found",
        message: `Appointment with ID ${appointmentId} does not exist`,
      })
    }

    res.json(appointment)
  } catch (error) {
    console.error("Error fetching appointment:", error)
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch appointment",
    })
  }
})

module.exports = router
