import { pgTable, serial, integer, timestamp, text, date, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  department: text("department").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const trainingRecords = pgTable("training_records", {
  id: serial("id").primaryKey(),
  trainingTitle: text("training_title").notNull(),
  trainingType: text("training_type").notNull(),
  date: timestamp("date").notNull(),
  department: text("department").notNull(),
  status: text("status").notNull(),
  trainerId: integer("trainer_id").references(() => users.id),
  venue: text("venue"),
  objectives: text("objectives"),
  materials: text("materials"),
  evaluation: text("evaluation"),
  effectiveness: text("effectiveness"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const trainingAssessments = pgTable("training_assessments", {
  id: serial("id").primaryKey(),
  trainingId: integer("training_id").notNull().references(() => trainingRecords.id),
  userId: integer("user_id").notNull().references(() => users.id),
  assessorId: integer("assessor_id").notNull().references(() => users.id),
  assessmentDate: date("assessment_date").notNull(),
  frequency: text("frequency").notNull().default('monthly'),
  totalScore: integer("total_score").notNull(),
  status: text("status").notNull(),
  comments: text("comments"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const trainingAssessmentParameters = pgTable("training_assessment_parameters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  maxScore: integer("max_score").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const trainingAssessmentScores = pgTable("training_assessment_scores", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => trainingAssessments.id),
  parameterId: integer("parameter_id").notNull().references(() => trainingAssessmentParameters.id),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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

export const trainingAttendees = pgTable("training_attendees", {
  id: serial("id").primaryKey(),
  trainingId: integer("training_id").notNull().references(() => trainingRecords.id),
  userId: integer("user_id").notNull().references(() => users.id),
  attendanceStatus: text("attendance_status").notNull().default('registered'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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

export const trainingAttendeesRelations = relations(trainingAttendees, ({ one }) => ({
  user: one(users, {
    fields: [trainingAttendees.userId],
    references: [users.id],
  }),
  training: one(trainingRecords, {
    fields: [trainingAttendees.trainingId],
    references: [trainingRecords.id],
  }),
})); 