import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  doublePrecision,
  boolean,
} from "drizzle-orm/pg-core";

export const patientsTable = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  mrn: text("mrn").notNull().unique(),
  gender: text("gender"),
  ward: text("ward").notNull(),
  bedNumber: text("bed_number"),
  diagnosis: text("diagnosis"),
  attendingPhysician: text("attending_physician"),
  notes: text("notes"),
  admittedAt: timestamp("admitted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  active: boolean("active").notNull().default(true),
});

export const vitalsTable = pgTable("vitals", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  heartRate: doublePrecision("heart_rate").notNull(),
  spo2: doublePrecision("spo2").notNull(),
  bpSystolic: doublePrecision("bp_systolic").notNull(),
  bpDiastolic: doublePrecision("bp_diastolic").notNull(),
  temperature: doublePrecision("temperature").notNull(),
  respiratoryRate: doublePrecision("respiratory_rate"),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const bedsTable = pgTable("beds", {
  id: serial("id").primaryKey(),
  ward: text("ward").notNull(),
  bedNumber: text("bed_number").notNull(),
  occupied: boolean("occupied").notNull().default(false),
  patientId: integer("patient_id").references(() => patientsTable.id, {
    onDelete: "set null",
  }),
});

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
  value: doublePrecision("value"),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .defaultNow(),
  acknowledged: boolean("acknowledged").notNull().default(false),
});

export type Patient = typeof patientsTable.$inferSelect;
export type InsertPatient = typeof patientsTable.$inferInsert;
export type VitalsRow = typeof vitalsTable.$inferSelect;
export type InsertVitals = typeof vitalsTable.$inferInsert;
export type BedRow = typeof bedsTable.$inferSelect;
export type InsertBed = typeof bedsTable.$inferInsert;
export type AlertRow = typeof alertsTable.$inferSelect;
export type InsertAlert = typeof alertsTable.$inferInsert;
