import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, bedsTable, patientsTable } from "@workspace/db";
import { AllocateBedParams, AllocateBedBody, ReleaseBedParams } from "@workspace/api-zod";
import { patientLatestVitals, classifyVitals } from "../lib/sentinel";

const router: IRouter = Router();

async function serializeBed(bed: typeof bedsTable.$inferSelect) {
  let patientName: string | null = null;
  let patientStatus: "normal" | "warning" | "critical" | null = null;
  if (bed.patientId) {
    const [patient] = await db
      .select()
      .from(patientsTable)
      .where(eq(patientsTable.id, bed.patientId));
    if (patient) {
      patientName = patient.name;
      const latest = await patientLatestVitals(patient.id);
      patientStatus = latest ? classifyVitals(latest).severity : "normal";
    }
  }
  return {
    id: bed.id,
    ward: bed.ward,
    bedNumber: bed.bedNumber,
    occupied: bed.occupied,
    patientId: bed.patientId,
    patientName,
    patientStatus,
  };
}

router.get("/beds", async (_req, res): Promise<void> => {
  const beds = await db
    .select()
    .from(bedsTable)
    .orderBy(asc(bedsTable.ward), asc(bedsTable.bedNumber));
  const serialized = await Promise.all(beds.map(serializeBed));
  res.json(serialized);
});

router.post("/beds/:id/allocate", async (req, res): Promise<void> => {
  const params = AllocateBedParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = AllocateBedBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [bed] = await db
    .update(bedsTable)
    .set({ occupied: true, patientId: body.data.patientId })
    .where(eq(bedsTable.id, params.data.id))
    .returning();
  if (!bed) {
    res.status(404).json({ error: "Bed not found" });
    return;
  }
  // Update patient's bedNumber/ward
  await db
    .update(patientsTable)
    .set({ bedNumber: bed.bedNumber, ward: bed.ward })
    .where(eq(patientsTable.id, body.data.patientId));
  res.json(await serializeBed(bed));
});

router.post("/beds/:id/release", async (req, res): Promise<void> => {
  const params = ReleaseBedParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [bed] = await db
    .update(bedsTable)
    .set({ occupied: false, patientId: null })
    .where(eq(bedsTable.id, params.data.id))
    .returning();
  if (!bed) {
    res.status(404).json({ error: "Bed not found" });
    return;
  }
  res.json(await serializeBed(bed));
});

export default router;
