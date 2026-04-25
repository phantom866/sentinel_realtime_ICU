import { eq, desc, and, gt } from "drizzle-orm";
import {
  db,
  patientsTable,
  vitalsTable,
  alertsTable,
  type Patient,
  type VitalsRow,
} from "@workspace/db";
import { logger } from "./logger";

export type Severity = "normal" | "warning" | "critical";

export function classifyVitals(v: {
  heartRate: number;
  spo2: number;
  temperature: number;
}): { severity: Severity; reasons: string[] } {
  const reasons: string[] = [];
  let severity: Severity = "normal";

  if (v.heartRate < 50 || v.heartRate > 120) {
    reasons.push(
      v.heartRate < 50
        ? `Bradycardia (HR ${v.heartRate.toFixed(0)})`
        : `Tachycardia (HR ${v.heartRate.toFixed(0)})`,
    );
    severity = "critical";
  } else if (v.heartRate < 60 || v.heartRate > 100) {
    reasons.push(`HR borderline ${v.heartRate.toFixed(0)}`);
    if (severity === "normal") severity = "warning";
  }

  if (v.spo2 < 92) {
    reasons.push(`Hypoxemia (SpO2 ${v.spo2.toFixed(1)}%)`);
    severity = "critical";
  } else if (v.spo2 < 95) {
    reasons.push(`SpO2 low ${v.spo2.toFixed(1)}%`);
    if (severity === "normal") severity = "warning";
  }

  if (v.temperature > 39) {
    reasons.push(`High fever (${v.temperature.toFixed(1)}°C)`);
    severity = "critical";
  } else if (v.temperature > 38 || v.temperature < 35.5) {
    reasons.push(`Temp abnormal ${v.temperature.toFixed(1)}°C`);
    if (severity === "normal") severity = "warning";
  }

  return { severity, reasons };
}

export function computeRiskScore(v: {
  heartRate: number;
  spo2: number;
  temperature: number;
  bpSystolic: number;
}): { score: number; level: "low" | "moderate" | "high" | "severe"; factors: string[]; recommendation: string } {
  let score = 0;
  const factors: string[] = [];

  if (v.heartRate < 50 || v.heartRate > 120) {
    score += 35;
    factors.push("Severe heart rate deviation");
  } else if (v.heartRate < 60 || v.heartRate > 100) {
    score += 12;
    factors.push("Mild heart rate deviation");
  }

  if (v.spo2 < 92) {
    score += 35;
    factors.push("Critical oxygen saturation");
  } else if (v.spo2 < 95) {
    score += 14;
    factors.push("Reduced oxygen saturation");
  }

  if (v.temperature > 39) {
    score += 25;
    factors.push("High fever");
  } else if (v.temperature > 38 || v.temperature < 35.5) {
    score += 10;
    factors.push("Temperature variation");
  }

  if (v.bpSystolic < 90) {
    score += 20;
    factors.push("Hypotension");
  } else if (v.bpSystolic > 160) {
    score += 15;
    factors.push("Hypertension");
  }

  score = Math.min(100, score);

  let level: "low" | "moderate" | "high" | "severe";
  let recommendation: string;
  if (score >= 70) {
    level = "severe";
    recommendation = "Immediate intervention required. Notify ICU attending.";
  } else if (score >= 45) {
    level = "high";
    recommendation = "Close monitoring. Consider escalation.";
  } else if (score >= 20) {
    level = "moderate";
    recommendation = "Continue monitoring. Re-evaluate in 1 hour.";
  } else {
    level = "low";
    recommendation = "Stable. Routine monitoring.";
  }

  if (factors.length === 0) {
    factors.push("All vitals within normal range");
  }

  return { score, level, factors, recommendation };
}

export async function patientLatestVitals(
  patientId: number,
): Promise<VitalsRow | null> {
  const [latest] = await db
    .select()
    .from(vitalsTable)
    .where(eq(vitalsTable.patientId, patientId))
    .orderBy(desc(vitalsTable.timestamp))
    .limit(1);
  return latest ?? null;
}

export function serializeVitals(v: VitalsRow) {
  return {
    id: v.id,
    patientId: v.patientId,
    heartRate: v.heartRate,
    spo2: v.spo2,
    bpSystolic: v.bpSystolic,
    bpDiastolic: v.bpDiastolic,
    temperature: v.temperature,
    respiratoryRate: v.respiratoryRate,
    timestamp: v.timestamp.toISOString(),
  };
}

export async function serializePatient(p: Patient) {
  const latest = await patientLatestVitals(p.id);
  let status: Severity = "normal";
  let riskScore = 0;
  if (latest) {
    status = classifyVitals(latest).severity;
    riskScore = computeRiskScore(latest).score;
  }
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    mrn: p.mrn,
    gender: p.gender,
    ward: p.ward,
    bedNumber: p.bedNumber,
    diagnosis: p.diagnosis,
    status,
    riskScore,
    admittedAt: p.admittedAt.toISOString(),
    latestVitals: latest ? serializeVitals(latest) : null,
  };
}

export async function maybeCreateAlerts(
  patient: Patient,
  vitals: VitalsRow,
): Promise<void> {
  const { severity, reasons } = classifyVitals(vitals);
  if (severity === "normal") return;

  const sinceWindow = new Date(Date.now() - 5 * 60 * 1000);
  for (const reason of reasons) {
    const type = reason.split(" ")[0] ?? "vitals";
    const recent = await db
      .select()
      .from(alertsTable)
      .where(
        and(
          eq(alertsTable.patientId, patient.id),
          eq(alertsTable.type, type),
          gt(alertsTable.timestamp, sinceWindow),
        ),
      )
      .limit(1);
    if (recent.length > 0) continue;

    await db.insert(alertsTable).values({
      patientId: patient.id,
      type,
      severity: severity === "critical" ? "critical" : "warning",
      message: `${patient.name}: ${reason}`,
      value: null,
    });
  }
}

// ---- Vitals simulator: keeps the dashboard "live" ----
type Trend = { hr: number; spo2: number; temp: number; bps: number; bpd: number };
const trends = new Map<number, Trend>();

function nudge(current: number, target: number, vol: number): number {
  const drift = (target - current) * 0.05;
  const noise = (Math.random() - 0.5) * vol;
  return current + drift + noise;
}

export async function simulateTick(): Promise<void> {
  try {
    const patients = await db
      .select()
      .from(patientsTable)
      .where(eq(patientsTable.active, true));

    for (const p of patients) {
      let trend = trends.get(p.id);
      if (!trend) {
        const latest = await patientLatestVitals(p.id);
        trend = latest
          ? {
              hr: latest.heartRate,
              spo2: latest.spo2,
              temp: latest.temperature,
              bps: latest.bpSystolic,
              bpd: latest.bpDiastolic,
            }
          : {
              hr: 78 + Math.random() * 10,
              spo2: 97 + Math.random() * 2,
              temp: 37 + Math.random() * 0.5,
              bps: 120 + Math.random() * 10,
              bpd: 78 + Math.random() * 6,
            };
        trends.set(p.id, trend);
      }

      // Patient-specific baselines based on diagnosis severity
      const diag = (p.diagnosis ?? "").toLowerCase();
      let hrTarget = 80;
      let spo2Target = 97;
      let tempTarget = 37;
      let bpsTarget = 120;
      let volatility = 1;

      if (diag.includes("septic") || diag.includes("ards")) {
        hrTarget = 125;
        spo2Target = 89;
        tempTarget = 39.4;
        bpsTarget = 95;
        volatility = 4;
      } else if (diag.includes("post-op") || diag.includes("cardiac")) {
        hrTarget = 105;
        spo2Target = 94;
        tempTarget = 38.2;
        bpsTarget = 135;
        volatility = 2.5;
      } else if (diag.includes("pneumonia") || diag.includes("copd")) {
        hrTarget = 95;
        spo2Target = 93;
        tempTarget = 38.0;
        bpsTarget = 125;
        volatility = 2;
      } else if (diag.includes("stroke")) {
        hrTarget = 72;
        spo2Target = 96;
        tempTarget = 37.4;
        bpsTarget = 155;
        volatility = 1.5;
      }

      // Occasional spike for drama
      if (Math.random() < 0.04) {
        hrTarget += (Math.random() - 0.5) * 30;
        spo2Target -= Math.random() * 5;
      }

      trend.hr = Math.max(30, Math.min(180, nudge(trend.hr, hrTarget, volatility * 1.5)));
      trend.spo2 = Math.max(75, Math.min(100, nudge(trend.spo2, spo2Target, volatility * 0.5)));
      trend.temp = Math.max(34, Math.min(41, nudge(trend.temp, tempTarget, volatility * 0.1)));
      trend.bps = Math.max(70, Math.min(200, nudge(trend.bps, bpsTarget, volatility * 1.2)));
      trend.bpd = Math.max(40, Math.min(120, nudge(trend.bpd, bpsTarget * 0.65, volatility * 0.8)));

      const [vitals] = await db
        .insert(vitalsTable)
        .values({
          patientId: p.id,
          heartRate: Math.round(trend.hr * 10) / 10,
          spo2: Math.round(trend.spo2 * 10) / 10,
          temperature: Math.round(trend.temp * 10) / 10,
          bpSystolic: Math.round(trend.bps),
          bpDiastolic: Math.round(trend.bpd),
          respiratoryRate: Math.round(12 + Math.random() * 8),
        })
        .returning();

      if (vitals) {
        await maybeCreateAlerts(p, vitals);
      }
    }
  } catch (err) {
    logger.error({ err }, "Simulator tick failed");
  }
}

let simulatorStarted = false;
export function startSimulator(intervalMs = 2000): void {
  if (simulatorStarted) return;
  simulatorStarted = true;
  logger.info({ intervalMs }, "Starting vitals simulator");
  setInterval(() => {
    void simulateTick();
  }, intervalMs);
}
