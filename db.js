// db.js
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./woundtech_solution.db");

db.serialize(() => {
  // Patients table
  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT
    )
  `);

  // Clinicians table
  db.run(`
    CREATE TABLE IF NOT EXISTS clinicians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clinician_id TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT
    )
  `);

  // Visits table with status column
  db.run(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      clinician_id INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'booked', -- new column
      FOREIGN KEY(patient_id) REFERENCES patients(id),
      FOREIGN KEY(clinician_id) REFERENCES clinicians(id)
    )
  `);

  // Optional: Insert sample data
  db.run(`
    INSERT OR IGNORE INTO patients (email, password, name) VALUES 
      ('patient1@example.com', 'password123', 'John Doe')
  `);

  db.run(`
    INSERT OR IGNORE INTO clinicians (clinician_id, password, name) VALUES 
      ('clinician1', 'password123', 'Dr. Smith')
  `);

  db.run(`
    INSERT OR IGNORE INTO visits (patient_id, clinician_id, timestamp, notes, status) VALUES
      (1, 1, '2025-09-10 09:00', 'Initial consultation', 'booked')
  `);
});

module.exports = db;
