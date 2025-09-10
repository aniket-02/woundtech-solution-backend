// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// -------------------- Patient Login --------------------
app.post("/api/patient-login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  db.get(
    "SELECT * FROM patients WHERE email = ? AND password = ?",
    [email, password],
    (err, row) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!row) return res.status(401).json({ message: "Invalid email or password" });

      res.json({ message: "Login successful", patient: { id: row.id, name: row.name, email: row.email } });
    }
  );
});

// -------------------- Clinician Login --------------------
app.post("/api/clinician-login", (req, res) => {
  const { clinician_id, password } = req.body;
  if (!clinician_id || !password)
    return res.status(400).json({ message: "Clinician ID and password required" });

  db.get(
    "SELECT * FROM clinicians WHERE clinician_id = ? AND password = ?",
    [clinician_id, password],
    (err, row) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!row) return res.status(401).json({ message: "Invalid clinician ID or password" });

      res.json({
        message: "Login successful",
        clinician: { id: row.id, name: row.name, clinician_id: row.clinician_id },
      });
    }
  );
});

// -------------------- Create a new patient --------------------
app.post("/api/patients", (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ message: "All fields required" });

  const query = `INSERT INTO patients (email, password, name) VALUES (?, ?, ?)`; 
  db.run(query, [email, password, name], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "Patient created", patient_id: this.lastID });
  });
});

// -------------------- Create a new clinician --------------------
app.post("/api/clinicians", (req, res) => {
  const { clinician_id, password, name } = req.body;
  if (!clinician_id || !password || !name) return res.status(400).json({ message: "All fields required" });

  const query = `INSERT INTO clinicians (clinician_id, password, name) VALUES (?, ?, ?)`; 
  db.run(query, [clinician_id, password, name], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "Clinician created", clinician_id: this.lastID });
  });
});

// -------------------- Get all patients --------------------
app.get("/api/patients", (req, res) => {
  db.all("SELECT id, email, name FROM patients", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ patients: rows });
  });
});

// -------------------- Get all clinicians --------------------
app.get("/api/clinicians", (req, res) => {
  db.all("SELECT id, clinician_id, name FROM clinicians", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ clinicians: rows });
  });
});

// -------------------- Record a new visit --------------------
app.post("/api/visits", (req, res) => {
  const { patient_id, clinician_id, timestamp, notes } = req.body;
  if (!patient_id || !clinician_id || !timestamp)
    return res.status(400).json({ message: "patient_id, clinician_id, and timestamp are required" });

  const query = `
    INSERT INTO visits (patient_id, clinician_id, timestamp, notes, status) 
    VALUES (?, ?, ?, ?, 'booked')
  `;
  db.run(query, [patient_id, clinician_id, timestamp, notes || null], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "Visit recorded successfully", visit_id: this.lastID, status: "booked" });
  });
});

// -------------------- Get visits by clinician (reverse chronological) --------------------
app.get("/api/visits/clinician/:clinician_id", (req, res) => {
  const clinician_id = req.params.clinician_id;
  const query = `
    SELECT v.id, v.timestamp, v.notes, v.status, 
           p.id AS patient_id, p.name AS patient_name
    FROM visits v
    JOIN patients p ON v.patient_id = p.id
    WHERE v.clinician_id = ?
    ORDER BY v.timestamp DESC
  `;
  db.all(query, [clinician_id], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ visits: rows });
  });
});

// -------------------- Get visits by patient (reverse chronological) --------------------
app.get("/api/visits/patient/:patient_id", (req, res) => {
  const patient_id = req.params.patient_id;
  const query = `
    SELECT v.id, v.timestamp, v.notes, v.status,
           c.id AS clinician_id, c.name AS clinician_name
    FROM visits v
    JOIN clinicians c ON v.clinician_id = c.id
    WHERE v.patient_id = ?
    ORDER BY v.timestamp DESC
  `;
  db.all(query, [patient_id], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ visits: rows });
  });
});

// -------------------- Get available clinicians for a slot --------------------
app.get("/api/clinicians/available", (req, res) => {
  const { timestamp } = req.query;
  if (!timestamp) return res.status(400).json({ message: "timestamp query parameter is required" });

  const query = `
    SELECT * FROM clinicians
    WHERE id NOT IN (
      SELECT clinician_id FROM visits WHERE timestamp = ? AND status = 'booked'
    )
  `;
  db.all(query, [timestamp], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ available_clinicians: rows });
  });
});

// -------------------- Update visit status --------------------
app.patch("/api/visits/:id/status", (req, res) => {
  const visitId = req.params.id;
  const { status } = req.body;

  if (!status || !["booked", "in_progress", "completed"].includes(status)) {
    return res.status(400).json({ message: "Invalid or missing status" });
  }

  const query = `UPDATE visits SET status = ? WHERE id = ?`;
  db.run(query, [status, visitId], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    if (this.changes === 0) return res.status(404).json({ message: "Visit not found" });

    res.json({ message: "Visit status updated successfully", visit_id: visitId, new_status: status });
  });
});

// -------------------- Start Server --------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
