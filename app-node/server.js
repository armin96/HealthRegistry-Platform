const express = require('express');
const path    = require('path');
const morgan  = require('morgan');
const bodyParser = require('body-parser');

const sql   = require('./sqlOperations');
const nosql = require('./nosqlOperations');

const app  = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

/* ══════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════ */
app.get('/', async (req, res) => {
  try {
    const [totalPatients, totalDoctors, recentAppointments, recentAuditLogs, topDoctors] = await Promise.all([
      sql.getTotalPatients(),
      sql.getTotalDoctors(),
      sql.getRecentAppointments(6),
      nosql.getAuditLogs(8),
      sql.getTopDoctors(3),
    ]);

    res.render('index', {
      title: 'Dashboard — Health Registry',
      stats: { patients: totalPatients, doctors: totalDoctors, appointments: recentAppointments.length },
      appointments: recentAppointments,
      auditLogs: recentAuditLogs,
      topDoctors,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading dashboard.');
  }
});

/* ══════════════════════════════════════════
   PATIENTS LIST
══════════════════════════════════════════ */
app.get('/patients', async (req, res) => {
  try {
    const patients = await sql.getAllPatients();
    res.render('patients', { title: 'Patient Explorer — Health Registry', patients });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading patient list.');
  }
});

/* ══════════════════════════════════════════
   PATIENT DETAIL (Hybrid)
══════════════════════════════════════════ */
app.get('/patients/:id', async (req, res) => {
  try {
    const patientId = parseInt(req.params.id, 10);
    const [patient, records, labs] = await Promise.all([
      sql.getPatientById(patientId),
      nosql.getMedicalRecordsByPatient(patientId),
      nosql.getLabResultsByPatient(patientId),
    ]);

    if (!patient) return res.status(404).send('Patient not found.');

    res.render('patient-detail', {
      title: `Patient: ${patient.full_name}`,
      patient, records, labs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading patient details.');
  }
});

/* ══════════════════════════════════════════
   ANALYTICS PAGE  (NEW)
══════════════════════════════════════════ */
app.get('/analytics', async (req, res) => {
  try {
    const [topDiagnoses, topMeds, doctorRanks] = await Promise.all([
      nosql.topDiagnoses(8),
      sql.topPrescribedMedications(8),
      sql.appointmentsPerDoctor(),
    ]);

    res.render('analytics', {
      title: 'Analytics — Health Registry',
      topDiagnoses,
      topMeds,
      doctorRanks: doctorRanks.slice(0, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading analytics.');
  }
});

/* ══════════════════════════════════════════
   AUDIT TRAIL
══════════════════════════════════════════ */
app.get('/audit', async (req, res) => {
  try {
    const [nosqlLogs, sqlLogs] = await Promise.all([
      nosql.getAuditLogs(25),
      sql.getSqlAuditLogs(25),
    ]);
    res.render('audit', { title: 'Audit Trail — Health Registry', nosqlLogs, sqlLogs });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading audit logs.');
  }
});

/* ══════════════════════════════════════════
   REST API  (NEW)
══════════════════════════════════════════ */
app.get('/api/stats', async (req, res) => {
  try {
    const [patients, doctors, recentAppointments, topDiagnoses, topMeds] = await Promise.all([
      sql.getTotalPatients(),
      sql.getTotalDoctors(),
      sql.getRecentAppointments(5),
      nosql.topDiagnoses(5),
      sql.topPrescribedMedications(5),
    ]);
    res.json({
      meta: { source: 'HealthRegistry Hybrid API', timestamp: new Date().toISOString() },
      stats: { total_patients: patients, total_doctors: doctors },
      recent_appointments: recentAppointments,
      top_diagnoses: topDiagnoses,
      top_medications: topMeds,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/patients', async (req, res) => {
  try {
    const patients = await sql.getAllPatients();
    res.json({ count: patients.length, data: patients });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/patients/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [patient, records, labs] = await Promise.all([
      sql.getPatientById(id),
      nosql.getMedicalRecordsByPatient(id),
      nosql.getLabResultsByPatient(id),
    ]);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json({ patient, clinical_records: records, lab_results: labs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════
   START
══════════════════════════════════════════ */
app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`  ⚕  Health Registry Platform`);
  console.log(`  🌐  http://localhost:${PORT}`);
  console.log(`  📊  http://localhost:${PORT}/analytics`);
  console.log(`  🔌  http://localhost:${PORT}/api/stats`);
  console.log(`╚══════════════════════════════════════════╝\n`);
});
