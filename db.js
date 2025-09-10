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

  // Visits table
  db.run(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      clinician_id INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'booked',
      FOREIGN KEY(patient_id) REFERENCES patients(id),
      FOREIGN KEY(clinician_id) REFERENCES clinicians(id)
    )
  `);
});

module.exports = db;
