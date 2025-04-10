import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  department: text("department"),
  role: text("role").notNull().default('employee'),
  employeeId: text("employee_id").unique(),
  qrCode: text("qr_code").unique(),
  joinDate: timestamp("join_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  checkInTime: timestamp("check_in_time").notNull(),
  checkOutTime: timestamp("check_out_time"),
  status: text("status").notNull(),
  checkInMethod: text("check_in_method").notNull(),
  checkOutMethod: text("check_out_method"),
  notes: text("notes"),
});

export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  type: text("type").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  approvedById: integer("approved_by_id").references(() => users.id),
  requestDate: timestamp("request_date").notNull().defaultNow(),
  responseDate: timestamp("response_date"),
  responseNotes: text("response_notes"),
}); 