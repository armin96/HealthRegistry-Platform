

const mysql = require("mysql2/promise");
const { MYSQL_CFG } = require("./config");


async function conn() {
  return mysql.createConnection(MYSQL_CFG);
}


async function createPatient({ fullName, dob, gender, bloodType, email, phone, address }) {
  const db = await conn();
  const [result] = await db.execute(
    `INSERT INTO patients (full_name, date_of_birth, gender, blood_type, email, phone, address)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [fullName, dob, gender, bloodType, email, phone, address]
  );
  await db.end();
  return result.insertId;
}

async function getPatient(patientId) {
  const db = await conn();
  const [rows] = await db.execute("SELECT * FROM patients WHERE patient_id = ?", [patientId]);
  await db.end();
  return rows[0] || null;
}

async function updatePatientPhone(patientId, phone) {
  const db = await conn();
  await db.execute("UPDATE patients SET phone = ? WHERE patient_id = ?", [phone, patientId]);
  await db.end();
}

async function deletePatient(patientId) {
  const db = await conn();
  const [result] = await db.execute("DELETE FROM patients WHERE patient_id = ?", [patientId]);
  await db.end();
  return result.affectedRows;
}



async function createAppointment({ patientId, doctorId, scheduledAt, notes = null }) {
  const db = await conn();
  const [result] = await db.execute(
    `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, notes)
     VALUES (?, ?, ?, 'scheduled', ?)`,
    [patientId, doctorId, scheduledAt, notes]
  );
  await db.end();
  return result.insertId;
}

async function completeAppointment(appointmentId) {
  const db = await conn();
  await db.execute(
    "UPDATE appointments SET status = 'completed' WHERE appointment_id = ?",
    [appointmentId]
  );
  await db.end();
}

async function getPatientAppointments(patientId) {
  const db = await conn();
  const [rows] = await db.execute(
    `SELECT a.appointment_id, a.scheduled_at, a.status,
            d.full_name AS doctor_name, d.specialization, dep.name AS department
     FROM   appointments a
     JOIN   doctors      d   ON a.doctor_id = d.doctor_id
     JOIN   departments  dep ON d.dept_id   = dep.dept_id
     WHERE  a.patient_id = ?
     ORDER  BY a.scheduled_at DESC`,
    [patientId]
  );
  await db.end();
  return rows;
}

async function createPrescription({ appointmentId, medicationName, dosage, frequency, durationDays, notes = null }) {
  const db = await conn();
  const [result] = await db.execute(
    `INSERT INTO prescriptions
       (appointment_id, medication_name, dosage, frequency, duration_days, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [appointmentId, medicationName, dosage, frequency, durationDays, notes]
  );
  await db.end();
  return result.insertId;
}

async function getAppointmentPrescriptions(appointmentId) {
  const db = await conn();
  const [rows] = await db.execute(
    "SELECT * FROM prescriptions WHERE appointment_id = ?",
    [appointmentId]
  );
  await db.end();
  return rows;
}

async function topPrescribedMedications(limit = 10) {
  const db = await conn();
  const safeLimit = parseInt(limit, 10) || 10;
  const [rows] = await db.query(
    `SELECT medication_name, COUNT(*) AS times_prescribed
     FROM   prescriptions
     GROUP  BY medication_name
     ORDER  BY times_prescribed DESC
     LIMIT  ${safeLimit}`
  );
  await db.end();
  return rows;
}

async function appointmentsPerDoctor() {
  const db = await conn();
  const [rows] = await db.execute(
    `SELECT d.doctor_id, d.full_name, d.specialization,
            COUNT(a.appointment_id) AS total_appointments
     FROM   doctors d
     LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
     GROUP  BY d.doctor_id, d.full_name, d.specialization
     ORDER  BY total_appointments DESC`
  );
  await db.end();
  return rows;
}


async function getTotalPatients() {
  const db = await conn();
  const [rows] = await db.execute("SELECT COUNT(*) AS total FROM patients");
  await db.end();
  return rows[0].total;
}

async function getTotalDoctors() {
  const db = await conn();
  const [rows] = await db.execute("SELECT COUNT(*) AS total FROM doctors");
  await db.end();
  return rows[0].total;
}

async function getAllPatients() {
  const db = await conn();
  const [rows] = await db.execute("SELECT * FROM patients ORDER BY full_name ASC");
  await db.end();
  return rows;
}

async function getPatientById(id) {
  return getPatient(id);
}

async function getRecentAppointments(limit = 5) {
  const db = await conn();
  const safeLimit = parseInt(limit, 10) || 5;
  const [rows] = await db.query(
    `SELECT a.appointment_id, a.scheduled_at, a.status,
            p.full_name AS patient_name, d.full_name AS doctor_name
     FROM   appointments a
     JOIN   patients p ON a.patient_id = p.patient_id
     JOIN   doctors  d ON a.doctor_id  = d.doctor_id
     ORDER  BY a.scheduled_at DESC
     LIMIT  ${safeLimit}`
  );
  await db.end();
  return rows;
}




async function getSqlAuditLogs(limit = 10) {
  const db = await conn();
  const safeLimit = parseInt(limit, 10) || 10;
  const [rows] = await db.query(
    `SELECT * FROM sql_audit_logs ORDER BY changed_at DESC LIMIT ${safeLimit}`
  );
  await db.end();
  return rows;
}

async function getDoctorPerformance(docId) {
  const db = await conn();
  const [rows] = await db.execute("CALL GetDoctorStats(?)", [docId]);
  await db.end();
  return rows[0][0];
}

async function getTopDoctors(limit = 5) {
  const db = await conn();
  const safeLimit = parseInt(limit, 10) || 5;
  const [rows] = await db.query(
    `SELECT d.doctor_id, d.full_name, d.specialization, 
                COUNT(a.appointment_id) AS total_appts
         FROM doctors d
         LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
         GROUP BY d.doctor_id
         ORDER BY total_appts DESC
         LIMIT ${safeLimit}`
  );
  await db.end();
  return rows;
}

module.exports = {
  createPatient, getPatient, updatePatientPhone, deletePatient,
  createAppointment, completeAppointment, getPatientAppointments,
  createPrescription, getAppointmentPrescriptions,
  topPrescribedMedications, appointmentsPerDoctor,
  getTotalPatients, getTotalDoctors, getAllPatients, getPatientById, getRecentAppointments,
  getSqlAuditLogs, getDoctorPerformance, getTopDoctors
};
