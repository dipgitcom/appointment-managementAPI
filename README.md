# Appointment Management API

A RESTful API for managing patient appointments built with Node.js, Express, and SQLite.

## Features

- ✅ Create new appointments
- ✅ View all appointments with filtering
- ✅ Get appointment by ID
- ✅ Input validation and error handling
- ✅ Swagger/OpenAPI documentation
- ✅ SQLite database with sample data
- ✅ RESTful API design principles

## Quick Start

### 1. Install Dependencies

npm install


### 2. Initialize Database

npm run init-db


### 3. Start the Server

# Development mode with auto-reload
npm run dev

# Production mode
npm start


The API will be running at `http://localhost:3000`

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## API Endpoints

### Create Appointment
\`\`\`http
POST /api/appointments
Content-Type: application/json

{
  "PatientId": 1,
  "AppointmentDate": "2024-12-25",
  "AppointmentTime": "10:30",
  "Reason": "Regular checkup"
}
\`\`\`

**Response:**
\`\`\`json
{
  "AppointmentId": 101,
  "PatientId": 1,
  "AppointmentDate": "2024-12-25",
  "AppointmentTime": "10:30",
  "Reason": "Regular checkup",
  "Message": "Appointment created successfully"
}
\`\`\`

### Get All Appointments
\`\`\`http
GET /api/appointments
GET /api/appointments?patientId=1
GET /api/appointments?date=2024-12-25
\`\`\`

### Get Appointment by ID
\`\`\`http
GET /api/appointments/101
\`\`\`

## Database Schema

### Patients Table
- `id` (INTEGER, PRIMARY KEY)
- `name` (TEXT, NOT NULL)
- `email` (TEXT, UNIQUE)
- `phone` (TEXT)
- `created_at` (DATETIME)

### Appointments Table
- `id` (INTEGER, PRIMARY KEY)
- `patient_id` (INTEGER, FOREIGN KEY)
- `appointment_date` (DATE, NOT NULL)
- `appointment_time` (TIME, NOT NULL)
- `reason` (TEXT, NOT NULL)
- `status` (TEXT, DEFAULT 'scheduled')
- `created_at` (DATETIME)

## Sample Patients

The database comes pre-loaded with sample patients:
1. John Doe (ID: 1)
2. Jane Smith (ID: 2)
3. Bob Johnson (ID: 3)

## Testing the API

### Using curl:
\`\`\`bash
# Create an appointment
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "PatientId": 1,
    "AppointmentDate": "2024-12-25",
    "AppointmentTime": "10:30",
    "Reason": "Regular checkup"
  }'

# Get all appointments
curl http://localhost:3000/api/appointments

# Get appointments for a specific patient
curl http://localhost:3000/api/appointments?patientId=1
\`\`\`

### Using the Swagger UI:
1. Open http://localhost:3000/api-docs
2. Try out the endpoints directly in the browser
3. View request/response examples

## Error Handling

The API includes comprehensive error handling:
- **400**: Validation errors
- **404**: Resource not found
- **409**: Appointment conflicts
- **500**: Server errors

## Project Structure

\`\`\`
appointment-api/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── database/
│   └── db.js             # Database connection and initialization
├── routes/
│   └── appointments.js   # Appointment routes and controllers
├── scripts/
│   ├── init-database.js  # Database initialization script
│   └── create-tables.sql # SQL schema
├── data/                 # SQLite database files (auto-created)
└── README.md            # This file
