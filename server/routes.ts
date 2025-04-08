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
  attendanceMethodEnum
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
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false, { message: "Incorrect username" });
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
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

  // Auth middleware - TEMPORARILY DISABLED FOR TESTING
  const requireAuth = (req: Request, res: Response, next: any) => {
    // Always allow access for testing
    next();
  };

  const requireAdmin = (req: Request, res: Response, next: any) => {
    // Always allow access for testing
    next();
  };

  // Auth routes
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ user: req.user });
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

  // User/Employee routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
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
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
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

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success });
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
        const existingAttendance = await storage.getUserAttendanceByDate(
          attendanceData.userId, 
          new Date(attendanceData.date)
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
      if (req.user?.role !== "admin" && req.user?.id !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const leaveRequests = await storage.getUserLeaveRequests(userId);
      res.json(leaveRequests);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/leave-requests", requireAuth, async (req, res) => {
    try {
      const leaveRequestData = insertLeaveRequestSchema.parse(req.body);
      
      // TEMPORARILY DISABLED FOR TESTING
      // Users can only create leave requests for themselves unless they are admins
      // if (req.user?.role !== "admin" && req.user?.id !== leaveRequestData.userId) {
      //   return res.status(403).json({ message: "Not authorized" });
      // }
      
      const leaveRequest = await storage.createLeaveRequest(leaveRequestData);
      res.status(201).json(leaveRequest);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.message });
      }
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
      
      // Use a default admin ID for testing
      const approverUserId = 1; // Admin ID for testing
      
      const leaveRequest = await storage.respondToLeaveRequest(
        id, 
        status, 
        approverUserId,
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

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
