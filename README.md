<div align="center">

<img width="680" alt="Health Registry Dashboard" src="https://github.com/user-attachments/assets/6f7d9aff-6f20-4467-aeaf-3ee064bd3cfe" />

<h1>HealthRegistry Platform</h1>

<p><strong>A full-stack Polyglot Persistence platform combining MySQL 8 and MongoDB 7 — built to demonstrate enterprise-grade database architecture, real-time analytics, and RESTful API design.</strong></p>

<p>
  <a href="http://212.227.176.145"><img src="https://img.shields.io/badge/🚀_Live_Demo-Online-success?style=for-the-badge&logo=googlechrome&logoColor=white" /></a>
</p>

<p>
  <img src="https://img.shields.io/badge/Node.js-v20+-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker_Compose-Multi--Container-2496ED?style=flat-square&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Records-1%2C900%2B-2d7a3a?style=flat-square" />
  <img src="https://img.shields.io/badge/REST_API-JSON-orange?style=flat-square" />
</p>

<p>🌐 <strong>Live Demo URL:</strong> <a href="http://212.227.176.145">http://212.227.176.145</a> (Port 80 &amp; 3000)</p>

</div>

---

## What This Project Demonstrates

This is not a CRUD tutorial. It is a **Polyglot Persistence** implementation — an architectural pattern used in production systems where different storage engines are chosen based on the nature of the data they serve.

| Concern | Engine | Rationale |
|---|---|---|
| Patient demographics, doctor scheduling, prescriptions | **MySQL 8** | ACID transactions, referential integrity via foreign keys, strict schema enforcement |
| Clinical visit history, lab reports, system audit logs | **MongoDB 7** | Schema-less documents accommodate heterogeneous clinical data without migrations |
| Analytics & reporting | **Both** | SQL `GROUP BY` + MongoDB `$group` aggregation pipelines rendered side-by-side |
| REST API surface | **Node.js / Express** | Unified JSON API over both data sources, served from a single application layer |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Express.js Server                     │
│                    (Node.js v18+)                        │
│                                                          │
│  GET /            → Dashboard (SQL + NoSQL)              │
│  GET /patients    → Patient Explorer (SQL)               │
│  GET /patients/:id→ Hybrid Detail (SQL admin + Mongo clinical) │
│  GET /analytics   → Aggregated Insights (SQL + Mongo)   │
│  GET /audit       → Dual Audit Trail (Triggers + Events) │
│  GET /api/stats   → REST JSON API                        │
└────────────────┬───────────────────┬────────────────────┘
                 │                   │
    ┌────────────▼────────┐  ┌───────▼──────────────────┐
    │     MySQL 8          │  │       MongoDB 7           │
    │                      │  │                           │
    │  departments         │  │  clinical_history         │
    │  doctors             │  │  test_reports             │
    │  patients            │  │  system_audit             │
    │  appointments        │  │                           │
    │  prescriptions       │  │  Indexes: patient_id,     │
    │  sql_audit_logs      │  │  timestamp, action        │
    │                      │  │                           │
    │  FK constraints      │  │  Aggregation Pipelines:   │
    │  AFTER UPDATE trigger│  │  $unwind → $group →       │
    │  → auto-logs status  │  │  $sort → $limit           │
    │    transitions       │  │                           │
    └──────────────────────┘  └───────────────────────────┘
```

---

## Key Technical Features

### Relational Layer (MySQL)
- **Normalized schema** with 6 tables, foreign key constraints, and cascading deletes
- **AFTER UPDATE trigger** on `appointments` — automatically writes every status transition to `sql_audit_logs` at the database level, with zero application-layer code
- **JOIN queries** across 4 tables for dashboard aggregations
- **GROUP BY analytics** for top-prescribed medications and doctor workload ranking

### Document Layer (MongoDB)
- **Aggregation pipeline** for top diagnoses: `$unwind → $group → $sort → $limit`
- **Compound indexes** on `patient_id` and `timestamp` for performant patient lookups
- **Schema-less design** accommodates diverse lab result structures without DDL migrations
- **Event-sourced audit log** captures actor, role, target entity, and arbitrary metadata per action

### Application Layer (Node.js / Express)
- **Parallel query execution** via `Promise.all()` — all dashboard data sources fetched concurrently, not sequentially
- **REST API** at `/api/*` returns unified JSON over both databases
- **EJS server-side rendering** with reusable partials (header/footer)
- **Live client-side patient search** — filters 1,900+ rows without a round-trip to the server

### Dataset
- **1,900+ unique records** seeded across all tables and collections
- **Globally diverse** — names drawn from Persian, English, European, and Asian name pools
- **10 medical specializations**, 160 departments, 185 unique doctors

---

## Pages & Routes

| Route | Description |
|---|---|
| `GET /` | Dashboard — live stat counters, recent appointments, top doctors, audit feed |
| `GET /patients` | Full patient list with live search, blood-type badges, and avatar initials |
| `GET /patients/:id` | Hybrid patient profile — SQL demographics + MongoDB clinical timeline + lab results |
| `GET /analytics` | MongoDB aggregation charts + MySQL GROUP BY — rendered as visual bar charts |
| `GET /audit` | Dual-layer audit trail — SQL trigger transitions and MongoDB clinical event feed |
| `GET /api/stats` | JSON REST endpoint — stats, recent appointments, top diagnoses, top medications |
| `GET /api/patients` | JSON list of all patients from MySQL |
| `GET /api/patients/:id` | JSON hybrid record — SQL patient + MongoDB clinical history + labs |

---

## Setup & Installation

### Prerequisites
- Node.js v18+
- MySQL 8 running on port `3306` (no root password required by default)
- MongoDB 7 running on port `27017`

### 1. Clone
```bash
git clone https://github.com/armin96/HealthRegistry-Platform.git
cd HealthRegistry-Platform/app-node
```

### 2. Install dependencies
```bash
npm install
```

### 3. Seed both databases
Drops and recreates schemas, then inserts 1,900+ unique records across MySQL and MongoDB:
```bash
npm run setup
```

### 4. Start the server
```bash
npm start
```

Open **http://localhost:3000** — all pages are immediately live.

### Environment Variables (optional)
All defaults work out of the box. Override with environment variables if needed:
```bash
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=health_registry

MONGO_URI=mongodb://localhost:27017/
MONGO_DB=health_registry

PORT=3000
```

---

## SQL Schema (Key Tables)

```sql
-- Relational core
CREATE TABLE patients (
  patient_id   INT AUTO_INCREMENT PRIMARY KEY,
  full_name    VARCHAR(100),
  date_of_birth DATE,
  gender       VARCHAR(20),
  blood_type   VARCHAR(5),
  email        VARCHAR(100) UNIQUE,
  phone        VARCHAR(50)
);

-- Audit trigger — fires on every appointment status change
CREATE TRIGGER trg_appt_audit
AFTER UPDATE ON appointments
FOR EACH ROW
  INSERT INTO sql_audit_logs (appt_id, old_status, new_status)
  VALUES (OLD.appointment_id, OLD.status, NEW.status);
```

## MongoDB Document (Clinical History)

```json
{
  "record_id": "uuid-v4",
  "patient_id": 42,
  "doctor_id": 7,
  "visit_date": "2025-03-14T09:00:00Z",
  "chief_complaint": "Persistent headache",
  "diagnosis": ["Migraine", "Hypertension"],
  "vitals": {
    "blood_pressure": "145/92",
    "heart_rate": 88,
    "weight_kg": 74
  },
  "treatment_plan": "Prescribe beta-blockers, follow up in 2 weeks"
}
```

---

## REST API Example

```bash
curl http://localhost:3000/api/stats
```

```json
{
  "meta": {
    "source": "HealthRegistry Hybrid API",
    "timestamp": "2025-09-02T10:00:00.000Z"
  },
  "stats": {
    "total_patients": 500,
    "total_doctors": 185
  },
  "top_diagnoses": [
    { "_id": "Hypertension", "count": 47 },
    { "_id": "Migraine",     "count": 39 }
  ],
  "top_medications": [
    { "medication_name": "Amoxicillin", "times_prescribed": 31 }
  ]
}
```

---

## Directory Structure

```
HealthRegistry-Platform/
├── app-node/
│   ├── server.js            # Express routes + Promise.all parallel queries
│   ├── config.js            # DB connection config (env-driven)
│   ├── sqlOperations.js     # MySQL query layer (CRUD + analytics)
│   ├── nosqlOperations.js   # MongoDB aggregation pipelines + audit
│   ├── reset_db.js          # Full seed script — 1,900+ unique records
│   ├── public/css/
│   │   └── style.css        # Custom design system — no frameworks
│   └── views/
│       ├── index.ejs        # Dashboard
│       ├── patients.ejs     # Patient list + live search
│       ├── patient-detail.ejs # Hybrid SQL + MongoDB profile
│       ├── analytics.ejs    # Aggregation charts
│       ├── audit.ejs        # Dual audit trail
│       └── partials/        # Shared header / footer + JS
├── sql/
│   ├── 01_schema.sql        # DDL — tables, constraints, trigger
│   ├── 03_queries.sql       # Analytical SQL queries
│   └── 04_advanced.sql      # Advanced joins and subqueries
└── nosql/
    └── queries_mongodb.js   # MongoDB shell-style aggregation examples
```

---

<div align="center">

**Polyglot Persistence · RESTful API · Full-Stack Node.js**

</div>
