import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertAttendanceSchema, 
  insertLeaveRequestSchema,
  leaveStatusEnum,
  roleEnum,
  departmentEnum,
  leaveTypeEnum,
  attendanceStatusEnum,
  attendanceMethodEnum,
  type InsertAttendance
} from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { z } from "zod";
import { ZodError } from "zod";

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up sessions and authentication
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "devgiri-hr-secret",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) return done(null, false, { message: "Incorrect email" });
          if (user.password !== password) {
            return done(null, false, { message: "Incorrect password" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = (req: Request, res: Response, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = req.user as any;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/login", (req: Request, res: Response, next: any) => {
    passport.authenticate("local", (err: Error | null, user: any, info: { message: string }) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info.message });
      }
      req.logIn(user, (err: Error | null) => {
        if (err) return next(err);
        return res.json({ user });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ authenticated: false });
    }
    res.json({ authenticated: true, user: req.user });
  });
  
  // Enums endpoint - provides all enum values for the client
  app.get("/api/enums", (_req, res) => {
    res.json({
      roles: ['admin', 'employee', 'manager'],
      departments: [
        'engineering',
        'marketing',
        'sales',
        'hr',
        'finance',
        'operations',
        'design',
        'product',
        'customer_support'
      ],
      leaveStatuses: ['pending', 'approved', 'rejected'],
      leaveTypes: [
        'annual',
        'sick',
        'personal',
        'maternity',
        'paternity',
        'bereavement',
        'unpaid'
      ],
      attendanceStatuses: [
        'present',
        'absent',
        'late',
        'half_day',
        'on_leave'
      ],
      attendanceMethods: [
        'qr_code',
        'biometric',
        'manual',
        'geo_location'
      ]
    });
  });

  // Users routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string || "";
      const department = req.query.department as string;
      const users = await storage.searchUsers(query, department);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Temporary route to create the first admin user
  app.post("/api/setup/admin", async (req, res) => {
    try {
      // Check if we already have users
      const users = await storage.getAllUsers();
      if (users.length > 0) {
        return res.status(400).json({ message: "Setup already completed" });
      }
      
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser({
        ...userData,
        role: "admin" // Ensure it's admin role
      });
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username is already taken
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Bulk employee import
  app.post("/api/users/bulk", requireAdmin, async (req, res) => {
    try {
      // Create a simplified user insert schema for bulk imports
      const simplifiedUserSchema = insertUserSchema.extend({
        role: z.enum(['admin', 'employee', 'manager']).default('employee')
      });
      
      // Array of user objects
      const bulkUserSchema = z.array(simplifiedUserSchema);
      
      const users = bulkUserSchema.parse(req.body);
      const results = [];
      const errors = [];
      
      for (const userData of users) {
        try {
          // Check if username is already taken
          const existingUser = await storage.getUserByUsername(userData.username);
          if (existingUser) {
            errors.push({ 
              username: userData.username, 
              error: "Username already exists" 
            });
            continue;
          }
          
          // Create user
          const user = await storage.createUser(userData);
          results.push(user);
        } catch (error) {
          errors.push({ 
            username: userData.username, 
            error: (error as Error).message 
          });
        }
      }
      
      res.json({
        success: true,
        processed: users.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Invalid data format", 
          details: error.message 
        });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Delete user
  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.deleteUser(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Permanently delete a specific user
  app.delete("/api/users/:id/permanent", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.permanentlyDeleteUser(userId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true, message: "User permanently deleted" });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Permanently delete inactive users
  app.delete("/api/users/inactive", requireAdmin, async (req, res) => {
    try {
      const deletedCount = await storage.permanentlyDeleteInactiveUsers();
      res.json({ 
        success: true, 
        message: `Successfully deleted ${deletedCount} inactive users` 
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Attendance routes
  app.get("/api/attendance/today", requireAuth, async (req, res) => {
    try {
      const todayAttendance = await storage.getTodayAttendance();
      res.json(todayAttendance);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  app.get("/api/attendance/statistics", requireAuth, async (req, res) => {
    try {
      const statistics = await storage.getAttendanceStatistics();
      
      // Set header explicitly to ensure JSON response
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(statistics));
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/attendance/user/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if dates are provided
      if (req.query.startDate && req.query.endDate) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(req.query.endDate as string);
        const attendance = await storage.getUserAttendanceByDateRange(userId, startDate, endDate);
        return res.json(attendance);
      }
      
      if (req.query.date) {
        const date = new Date(req.query.date as string);
        const attendance = await storage.getUserAttendanceByDate(userId, date);
        return res.json(attendance || null);
      }
      
      const attendance = await storage.getUserAttendance(userId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/attendance", requireAuth, async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      
      // If the user is checking in, make sure they haven't already checked in today
      if (attendanceData.checkInTime) {
        // Convert the date string to a Date object
        const dateObj = new Date(attendanceData.date);
        
        const existingAttendance = await storage.getUserAttendanceByDate(
          attendanceData.userId, 
          dateObj
        );
        
        if (existingAttendance) {
          // Update instead of creating new
          const updated = await storage.updateAttendance(existingAttendance.id, attendanceData);
          return res.json(updated);
        }
      }
      
      const attendance = await storage.createAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Error in attendance endpoint:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Bulk attendance marking
  app.post("/api/attendance/bulk", requireAdmin, async (req, res) => {
    try {
      // Define schema for bulk attendance
      const bulkAttendanceInputSchema = z.object({
        date: z.string(),
        employeeIds: z.array(z.number()),
        status: z.enum(['present', 'absent', 'late', 'half_day', 'on_leave']),
        checkInTime: z.string().optional(),
        checkOutTime: z.string().optional(),
        checkInMethod: z.enum(['qr_code', 'biometric', 'manual', 'geo_location']).optional(),
        checkOutMethod: z.enum(['qr_code', 'biometric', 'manual', 'geo_location']).optional(),
        notes: z.string().optional(),
      });
      
      const bulkData = bulkAttendanceInputSchema.parse(req.body);
      const results = [];
      const errors = [];
      
      for (const userId of bulkData.employeeIds) {
        try {
          // Check if user exists
          const user = await storage.getUser(userId);
          if (!user) {
            errors.push({ userId, error: "User not found" });
            continue;
          }
          
          // Create attendance object
          const attendanceData: InsertAttendance = {
            userId,
            date: bulkData.date,
            status: bulkData.status,
            checkInTime: bulkData.checkInTime || null,
            checkOutTime: bulkData.checkOutTime || null,
            checkInMethod: bulkData.checkInMethod || null,
            checkOutMethod: bulkData.checkOutMethod || null,
            notes: bulkData.notes || null
          };
          
          // Check if attendance already exists for this date
          const existingAttendance = await storage.getUserAttendanceByDate(
            userId, 
            new Date(bulkData.date)
          );
          
          let attendance;
          if (existingAttendance) {
            // Update instead of creating new
            attendance = await storage.updateAttendance(existingAttendance.id, attendanceData);
          } else {
            // Create new attendance
            attendance = await storage.createAttendance(attendanceData);
          }
          
          results.push(attendance);
        } catch (error) {
          errors.push({ userId, error: (error as Error).message });
        }
      }
      
      res.json({
        success: true,
        processed: bulkData.employeeIds.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/attendance/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const attendanceData = insertAttendanceSchema.partial().parse(req.body);
      const attendance = await storage.updateAttendance(id, attendanceData);
      if (!attendance) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      res.json(attendance);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Leave request routes
  app.get("/api/leave-requests", requireAuth, async (req, res) => {
    try {
      // For now, just return all leave requests from storage for testing
      const users = await storage.getAllUsers();
      const allLeaveRequests = [];
      
      for (const user of users) {
        const userRequests = await storage.getUserLeaveRequests(user.id);
        allLeaveRequests.push(...userRequests);
      }
      
      res.json(allLeaveRequests);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/leave-requests/pending", requireAdmin, async (req, res) => {
    try {
      const pendingRequests = await storage.getPendingLeaveRequests();
      res.json(pendingRequests);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/leave-requests/user/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Only admins or the user themselves can view their leave requests
      // TEMPORARILY DISABLED FOR TESTING
      // if (req.user?.role !== "admin" && req.user?.id !== userId) {
      //   return res.status(403).json({ message: "Not authorized" });
      // }
      
      const leaveRequests = await storage.getUserLeaveRequests(userId);
      res.json(leaveRequests);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/leave-requests", requireAuth, async (req, res) => {
    try {
      // Log the request body for debugging
      console.log("Received leave request data:", req.body);
      
      // Create a simple validation schema for the request
      const requestSchema = z.object({
        userId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
        type: z.string(),
        reason: z.string().optional(),
      });
      
      // Validate the request body
      const validatedData = requestSchema.parse(req.body);
      
      // Create the leave request
      const leaveRequest = await storage.createLeaveRequest(validatedData);
      res.status(201).json(leaveRequest);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      console.error("Error creating leave request:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.put("/api/leave-requests/:id/respond", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate request data
      const schema = z.object({
        status: z.enum(['approved', 'rejected']),
        notes: z.string().optional()
      });
      
      const { status, notes } = schema.parse(req.body);
      
      // For now, use a default admin ID since authentication is not set up
      const approverId = 1; // Default admin ID
      
      const leaveRequest = await storage.respondToLeaveRequest(
        id, 
        status, 
        approverId,
        notes
      );
      
      if (!leaveRequest) {
        return res.status(404).json({ message: "Leave request not found" });
      }
      
      res.json(leaveRequest);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Training Records routes
  app.get("/api/training-records", requireAuth, async (req, res) => {
    try {
      // Set header explicitly to ensure JSON response
      res.setHeader('Content-Type', 'application/json');
      
      const records = await storage.getAllTrainingRecords();
      res.json(records);
    } catch (error) {
      console.error('Error fetching training records:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/training-records/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const record = await storage.getTrainingRecord(id);
      
      if (!record) {
        return res.status(404).json({ error: "Training record not found" });
      }
      
      res.json(record);
    } catch (error) {
      console.error('Error fetching training record:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.delete("/api/training-records/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTrainingRecord(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/training-records", requireAuth, async (req, res) => {
    try {
      console.log('Received training record data:', req.body);
      
      // Set header explicitly to ensure JSON response
      res.setHeader('Content-Type', 'application/json');
      
      const schema = z.object({
        userId: z.number(),
        trainingTitle: z.string(),
        trainingType: z.string(),
        date: z.string(),
        department: z.string().optional(),
        trainerId: z.number().nullable(),
        notes: z.string().optional(),
        venue: z.string().optional(),
        objectives: z.string().optional(),
        materials: z.string().optional(),
        evaluation: z.string().optional(),
        effectiveness: z.string().optional()
      });

      const validatedData = schema.parse(req.body);
      console.log('Validated data:', validatedData);

      const trainingRecord = await storage.createTrainingRecord(validatedData);
      res.status(201).json(trainingRecord);
    } catch (error) {
      console.error('Error creating training record:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const pendingLeaveRequests = await storage.getPendingLeaveRequests();
      const todayAttendance = await storage.getTodayAttendance();
      
      const present = todayAttendance.filter(a => a.status === 'present').length;
      const onLeave = todayAttendance.filter(a => a.status === 'on_leave').length;
      
      res.json({
        totalEmployees: users.length,
        presentToday: present,
        onLeave: onLeave,
        pendingRequests: pendingLeaveRequests.length
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Training Assessment Parameters endpoints
  app.get("/api/training-assessment-parameters", requireAuth, async (req, res) => {
    try {
      const parameters = await storage.getTrainingAssessmentParameters();
      res.json(parameters);
    } catch (error) {
      console.error("Error fetching assessment parameters:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/training-assessments", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        trainingId: z.number(),
        userId: z.number(),
        assessorId: z.number(),
        assessmentDate: z.string(),
        frequency: z.string(),
        comments: z.string().optional(),
        totalScore: z.number(),
        status: z.string(),
        scores: z.array(z.object({
          parameterId: z.number(),
          score: z.number(),
        })),
      });

      const validatedData = schema.parse(req.body);
      const assessment = await storage.createTrainingAssessment(validatedData);
      res.status(201).json(assessment);
    } catch (error) {
      console.error("Error creating assessment:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/training-assessments/:trainingId", requireAuth, async (req, res) => {
    try {
      const trainingId = parseInt(req.params.trainingId);
      const assessments = await storage.getTrainingAssessments(trainingId);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Training Feedback routes
  app.get("/api/training-feedback/:trainingId", requireAuth, async (req, res) => {
    try {
      const trainingId = parseInt(req.params.trainingId);
      const feedback = await storage.getTrainingFeedback(trainingId);
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching training feedback:", error);
      res.status(500).json({ error: "Failed to fetch training feedback" });
    }
  });

  // Submit training feedback and mark attendance
  app.post("/api/training-feedback", requireAuth, async (req, res) => {
    try {
      console.log('Received feedback submission request:', req.body);
      const {
        trainingId,
        userId,
        isEffective,
        trainingAidsGood,
        durationSufficient,
        contentExplained,
        conductedProperly,
        learningEnvironment,
        helpfulForWork,
        additionalTopics,
        keyLearnings,
        specialObservations,
      } = req.body;

      // Start a transaction
      const result = await storage.submitTrainingFeedback({
        trainingId,
        userId,
        isEffective,
        trainingAidsGood,
        durationSufficient,
        contentExplained,
        conductedProperly,
        learningEnvironment,
        helpfulForWork,
        additionalTopics,
        keyLearnings,
        specialObservations,
      });

      console.log('Transaction completed successfully:', result);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error submitting training feedback:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to submit training feedback" });
    }
  });

  // Mark training attendance
  app.post("/api/training-attendance/mark-present", requireAuth, async (req, res) => {
    try {
      console.log('Received attendance marking request:', req.body);
      const { trainingId, userId } = req.body;

      const result = await storage.markTrainingAttendance(trainingId, userId);
      console.log('Attendance marked successfully:', result);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to mark attendance" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
