import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  patientsTable,
  bedsTable,
  alertsTable,
} from "@workspace/db";
import { patientLatestVitals, classifyVitals } from "../lib/sentinel";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const patients = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.active, true));

  let critical = 0;
  let warning = 0;
  let normal = 0;
  for (const p of patients) {
    const latest = await patientLatestVitals(p.id);
    const sev = latest ? classifyVitals(latest).severity : "normal";
    if (sev === "critical") critical++;
    else if (sev === "warning") warning++;
    else normal++;
  }

  const beds = await db.select().from(bedsTable);
  const occupied = beds.filter((b) => b.occupied).length;

  const recent = await db
    .select({
      id: alertsTable.id,
      patientId: alertsTable.patientId,
      type: alertsTable.type,
      severity: alertsTable.severity,
      message: alertsTable.message,
      value: alertsTable.value,
      timestamp: alertsTable.timestamp,
      acknowledged: alertsTable.acknowledged,
      patientName: patientsTable.name,
    })
    .from(alertsTable)
    .leftJoin(patientsTable, eq(patientsTable.id, alertsTable.patientId))
    .orderBy(desc(alertsTable.timestamp))
    .limit(10);

  const activeAlerts = await db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.acknowledged, false));

  res.json({
    totalPatients: patients.length,
    criticalCount: critical,
    warningCount: warning,
    normalCount: normal,
    totalBeds: beds.length,
    occupiedBeds: occupied,
    activeAlerts: activeAlerts.length,
    recentAlerts: recent.map((r) => ({
      id: r.id,
      patientId: r.patientId,
      patientName: r.patientName ?? "Unknown",
      type: r.type,
      severity: r.severity,
      message: r.message,
      value: r.value,
      timestamp: r.timestamp.toISOString(),
      acknowledged: r.acknowledged,
    })),
  });
});

export default router;
