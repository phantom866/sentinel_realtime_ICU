import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import {
  db,
  patientsTable,
  vitalsTable,
  alertsTable,
  bedsTable,
} from "@workspace/db";
import {
  CreatePatientBody,
  GetPatientParams,
  DeletePatientParams,
  GetPatientVitalsParams,
  GetPatientVitalsQueryParams,
  IngestVitalsParams,
  IngestVitalsBody,
  PredictRiskParams,
} from "@workspace/api-zod";
import {
  classifyVitals,
  computeRiskScore,
  maybeCreateAlerts,
  serializePatient,
  serializeVitals,
} from "../lib/sentinel";

const router: IRouter = Router();

router.get("/patients", async (_req, res): Promise<void> => {
  const patients = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.active, true))
    .orderBy(desc(patientsTable.admittedAt));
  const serialized = await Promise.all(patients.map(serializePatient));
  res.json(serialized);
});

router.post("/patients", async (req, res): Promise<void> => {
  const parsed = CreatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [patient] = await db
    .insert(patientsTable)
    .values({
      name: parsed.data.name,
      age: parsed.data.age,
      mrn: parsed.data.mrn,
      gender: parsed.data.gender,
      ward: parsed.data.ward,
      bedNumber: parsed.data.bedNumber,
      diagnosis: parsed.data.diagnosis,
      attendingPhysician: parsed.data.attendingPhysician,
    })
    .returning();
  if (!patient) {
    res.status(500).json({ error: "Failed to create patient" });
    return;
  }
  res.status(201).json(await serializePatient(patient));
});

router.get("/patients/:id", async (req, res): Promise<void> => {
  const params = GetPatientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, params.data.id));
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  const base = await serializePatient(patient);
  res.json({
    ...base,
    attendingPhysician: patient.attendingPhysician,
    notes: patient.notes,
  });
});

router.delete("/patients/:id", async (req, res): Promise<void> => {
  const params = DeletePatientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .update(patientsTable)
    .set({ active: false })
    .where(eq(patientsTable.id, params.data.id));
  await db
    .update(bedsTable)
    .set({ occupied: false, patientId: null })
    .where(eq(bedsTable.patientId, params.data.id));
  res.sendStatus(204);
});

router.get("/patients/:id/vitals", async (req, res): Promise<void> => {
  const params = GetPatientVitalsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const query = GetPatientVitalsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const limit = query.data.limit ?? 60;
  const rows = await db
    .select()
    .from(vitalsTable)
    .where(eq(vitalsTable.patientId, params.data.id))
    .orderBy(desc(vitalsTable.timestamp))
    .limit(limit);
  // Return ascending so charts can append
  res.json(rows.reverse().map(serializeVitals));
});

router.post("/patients/:id/vitals", async (req, res): Promise<void> => {
  const params = IngestVitalsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = IngestVitalsBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, params.data.id));
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  const [row] = await db
    .insert(vitalsTable)
    .values({
      patientId: params.data.id,
      heartRate: body.data.heartRate,
      spo2: body.data.spo2,
      bpSystolic: body.data.bpSystolic,
      bpDiastolic: body.data.bpDiastolic,
      temperature: body.data.temperature,
      respiratoryRate: body.data.respiratoryRate,
    })
    .returning();
  if (!row) {
    res.status(500).json({ error: "Failed to ingest vitals" });
    return;
  }
  await maybeCreateAlerts(patient, row);
  res.status(201).json(serializeVitals(row));
});

router.get("/patients/:id/predict-risk", async (req, res): Promise<void> => {
  const params = PredictRiskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [latest] = await db
    .select()
    .from(vitalsTable)
    .where(eq(vitalsTable.patientId, params.data.id))
    .orderBy(desc(vitalsTable.timestamp))
    .limit(1);
  if (!latest) {
    res.json({
      patientId: params.data.id,
      riskScore: 0,
      riskLevel: "low",
      factors: ["No vitals recorded yet"],
      recommendation: "Awaiting first vitals reading.",
    });
    return;
  }
  const result = computeRiskScore(latest);
  // Touch alerts table to avoid unused warning if needed
  void alertsTable;
  void and;
  void classifyVitals;
  res.json({
    patientId: params.data.id,
    riskScore: result.score,
    riskLevel: result.level,
    factors: result.factors,
    recommendation: result.recommendation,
  });
});

export default router;
