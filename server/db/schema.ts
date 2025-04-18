import { pgTable, serial, text, timestamp, boolean, integer, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  type: text("type").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  approvedById: integer("approved_by_id").references(() => users.id),
  requestDate: timestamp("request_date").notNull().defaultNow(),
  responseDate: timestamp("response_date"),
  responseNotes: text("response_notes"),
});

export const trainingRecords = pgTable("training_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  trainingTitle: text("training_title").notNull(),
  trainingType: text("training_type").notNull(),
  date: date("date").notNull(),
  trainerId: integer("trainer_id").references(() => users.id),
  department: text("department"),
  feedbackScore: integer("feedback_score"),
  status: text("status").default('pending'),
  assessmentScore: integer("assessment_score"),
  effectiveness: text("effectiveness"),
  notes: text("notes"),
  venue: text("venue"),
  objectives: text("objectives"),
  materials: text("materials"),
  evaluation: text("evaluation"),
});

// Training Assessment Parameters Table
export const trainingAssessmentParameters = pgTable("training_assessment_parameters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  maxScore: integer("max_score").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
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
  frequency: text("frequency").default('monthly'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Training Assessment Parameter Scores Table
export const trainingAssessmentScores = pgTable("training_assessment_scores", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => trainingAssessments.id),
  parameterId: integer("parameter_id").notNull().references(() => trainingAssessmentParameters.id),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Add relations
export const trainingFeedbackRelations = relations(trainingFeedback, ({ one }) => ({
  user: one(users, {
    fields: [trainingFeedback.userId],
    references: [users.id],
  }),
  training: one(trainingRecords, {
    fields: [trainingFeedback.trainingId],
    references: [trainingRecords.id],
  }),
}));

// Training Attendees Table
export const trainingAttendees = pgTable("training_attendees", {
  id: serial("id").primaryKey(),
  trainingId: integer("training_id").notNull().references(() => trainingRecords.id),
  userId: integer("user_id").notNull().references(() => users.id),
  attendanceStatus: text("attendance_status").notNull().default('registered'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}); 