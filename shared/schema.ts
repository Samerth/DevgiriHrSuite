import { 
  pgTable, 
  text, 
  serial, 
  integer,
  boolean,
  timestamp,
  date,
  time,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Roles
export const roleEnum = pgEnum('role', ['admin', 'employee', 'manager']);

// Department Enum
export const departmentEnum = pgEnum('department', [
  'engineering',
  'marketing',
  'sales',
  'hr',
  'finance',
  'operations',
  'design',
  'product',
  'customer_support'
]);

// Leave Status Enum
export const leaveStatusEnum = pgEnum('leave_status', ['pending', 'approved', 'rejected']);

// Leave Type Enum
export const leaveTypeEnum = pgEnum('leave_type', [
  'annual',
  'sick',
  'personal',
  'maternity',
  'paternity',
  'bereavement',
  'unpaid'
]);

// Attendance Status Enum
export const attendanceStatusEnum = pgEnum('attendance_status', [
  'present',
  'absent',
  'late',
  'half_day',
  'on_leave'
]);

// User/Employee Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: roleEnum("role").notNull().default('employee'),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  department: departmentEnum("department"),
  position: text("position"),
  employeeId: text("employee_id").unique(),
  joinDate: date("join_date"),
  address: text("address"),
  profileImageUrl: text("profile_image_url"),
  isActive: boolean("is_active").default(true),
});

// Attendance Table
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  checkInTime: time("check_in_time"),
  checkOutTime: time("check_out_time"),
  status: attendanceStatusEnum("status").default('present'),
  checkInMethod: text("check_in_method"), // QR, biometric, manual
  checkOutMethod: text("check_out_method"),
  notes: text("notes"),
});

// Leave Request Table
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  type: leaveTypeEnum("type").notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("status").default('pending'),
  approvedById: integer("approved_by_id").references(() => users.id),
  requestDate: timestamp("request_date").defaultNow(),
  responseDate: timestamp("response_date"),
  responseNotes: text("response_notes"),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isActive: true
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  requestDate: true,
  responseDate: true,
  approvedById: true,
  status: true
});

// Select Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
