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
import { relations } from "drizzle-orm";

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

// Attendance Method Enum
export const attendanceMethodEnum = pgEnum('attendance_method', [
  'qr_code',
  'biometric',
  'manual',
  'geo_location'
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
  qrCode: text("qr_code").unique(),
  joinDate: date("join_date"),
  address: text("address"),
  profileImageUrl: text("profile_image_url"),
  salary: text("salary"),
  fatherName: text("father_name"),
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
  checkInMethod: attendanceMethodEnum("check_in_method").default('manual'),
  checkOutMethod: attendanceMethodEnum("check_out_method").default('manual'),
  notes: text("notes"),
});

// Training Record Table
export const trainingRecords = pgTable("training_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  trainingTitle: text("training_title").notNull(),
  trainingType: text("training_type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  trainerId: integer("trainer_id").references(() => users.id),
  department: text("department"),
  feedbackScore: integer("feedback_score"),
  status: text("status").default('pending'),
  assessmentScore: integer("assessment_score"),
  effectiveness: text("effectiveness"),
  notes: text("notes"),
});

// Training Feedback Table
export const trainingFeedback = pgTable("training_feedback", {
  id: serial("id").primaryKey(),
  trainingId: integer("training_id").notNull().references(() => trainingRecords.id),
  userId: integer("user_id").notNull().references(() => users.id),
  isEffective: boolean("is_effective"),
  trainingAidsGood: boolean("training_aids_good"),
  durationSufficient: boolean("duration_sufficient"),
  contentExplained: boolean("content_explained"),
  conductedProperly: boolean("conducted_properly"),
  learningEnvironment: boolean("learning_environment"),
  helpfulForWork: boolean("helpful_for_work"),
  additionalTopics: text("additional_topics"),
  keyLearnings: text("key_learnings"),
  specialObservations: text("special_observations"),
});

// Training Assessment Table
export const trainingAssessments = pgTable("training_assessments", {
  id: serial("id").primaryKey(),
  trainingId: integer("training_id").notNull().references(() => trainingRecords.id),
  userId: integer("user_id").notNull().references(() => users.id),
  assessorId: integer("assessor_id").notNull().references(() => users.id),
  assessmentDate: date("assessment_date").notNull(),
  totalScore: integer("total_score"),
  status: text("status"),
  comments: text("comments"),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  attendances: many(attendance),
  leaveRequests: many(leaveRequests),
  approvals: many(leaveRequests, { relationName: "approver" }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, {
    fields: [attendance.userId],
    references: [users.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  user: one(users, {
    fields: [leaveRequests.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [leaveRequests.approvedById],
    references: [users.id],
    relationName: "approver",
  }),
}));

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

// Additional Types for Frontend
export type UserWithAttendance = User & { 
  attendances: Attendance[] 
};

export type UserWithLeaveRequests = User & { 
  leaveRequests: LeaveRequest[] 
};

export type AttendanceWithUser = Attendance & { 
  user: User 
};

export type LeaveRequestWithUser = LeaveRequest & { 
  user: User,
  approver?: User
};
