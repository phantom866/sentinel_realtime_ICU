import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, alertsTable, patientsTable } from "@workspace/db";
import { ListAlertsQueryParams, AcknowledgeAlertParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/alerts", async (req, res): Promise<void> => {
  const query = ListAlertsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const limit = query.data.limit ?? 20;
  const rows = await db
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
    .limit(limit);

  res.json(
    rows.map((r) => ({
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
  );
});

router.post("/alerts/:id/acknowledge", async (req, res): Promise<void> => {
  const params = AcknowledgeAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [alert] = await db
    .update(alertsTable)
    .set({ acknowledged: true })
    .where(eq(alertsTable.id, params.data.id))
    .returning();
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, alert.patientId));
  res.json({
    id: alert.id,
    patientId: alert.patientId,
    patientName: patient?.name ?? "Unknown",
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    value: alert.value,
    timestamp: alert.timestamp.toISOString(),
    acknowledged: alert.acknowledged,
  });
});

export default router;
