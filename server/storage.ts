import { eq, and, desc, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { users, attendance, leaveRequests, trainingRecords, trainingAssessments, trainingAssessmentParameters, trainingAssessmentScores, trainingFeedback, trainingAttendees } from "./db/schema";
import { 
  type User,
  type InsertUser,
  type LeaveRequest,
  type InsertLeaveRequest,
  type Attendance,
  type InsertAttendance,
  attendanceStatusEnum,
  leaveStatusEnum
} from "@shared/schema";
import { between, gte, lte, like, or, isNull, asc } from "drizzle-orm";
import { db } from "./db";
import { PgDatabase } from "drizzle-orm/pg-core";

// Storage interface
export interface IStorage {
  // Users/Employees
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  searchUsers(query: string, department?: string): Promise<User[]>;

  // Attendance
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendance(id: number): Promise<Attendance | undefined>;
  getUserAttendance(userId: number): Promise<Attendance[]>;
  getUserAttendanceByDate(
    userId: number,
    date: Date,
  ): Promise<Attendance | undefined>;
  getUserAttendanceByDateRange(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Attendance[]>;
  updateAttendance(
    id: number,
    attendance: Partial<InsertAttendance>,
  ): Promise<Attendance | undefined>;
  getTodayAttendance(): Promise<(Attendance & { user: User })[]>;
  getAttendanceStatistics(): Promise<{
    totalAttendanceToday: number;
    onTime: number;
    late: number;
    departmentalBreakdown: { department: string; count: number }[];
    attendanceByHour: { hour: number; count: number }[];
    recentActivity: {
      id: number;
      userId: number;
      userName: string;
      time: string;
      type: string;
      status: string;
    }[];
  }>;

  // Leave Requests
  createLeaveRequest(leaveRequest: InsertLeaveRequest): Promise<LeaveRequest>;
  getLeaveRequest(id: number): Promise<LeaveRequest | undefined>;
  getUserLeaveRequests(userId: number): Promise<LeaveRequest[]>;
  updateLeaveRequest(
    id: number,
    leaveRequest: Partial<LeaveRequest>,
  ): Promise<LeaveRequest | undefined>;
  getPendingLeaveRequests(): Promise<(LeaveRequest & { user: User })[]>;
  respondToLeaveRequest(
    id: number,
    status: "approved" | "rejected",
    approvedById: number,
    notes?: string,
  ): Promise<LeaveRequest | undefined>;

  //Training Records
  createTrainingRecord(data: any): Promise<any>;
  getAllTrainingRecords(): Promise<any[]>;
  getTrainingRecord(id: number): Promise<any>;
  deleteTrainingRecord(id: number): Promise<void>;

  // Training Assessment Methods
  getTrainingAssessmentParameters(): Promise<{ id: number; name: string; maxScore: number; }[]>;
  createTrainingAssessment(data: {
    trainingId: number;
    userId: number;
    assessorId: number;
    assessmentDate: string;
    frequency: string;
    comments?: string;
    totalScore: number;
    status: string;
    scores: { parameterId: number; score: number; }[];
  }): Promise<any>;
  getTrainingAssessments(trainingId: number): Promise<any[]>;
  
  // Training Feedback Methods
  getTrainingFeedback(trainingId: number): Promise<any[]>;
  submitTrainingFeedback(data: {
    trainingId: number;
    userId: number;
    isEffective: boolean;
    trainingAidsGood: boolean;
    durationSufficient: boolean;
    contentExplained: boolean;
    conductedProperly: boolean;
    learningEnvironment: boolean;
    helpfulForWork: boolean;
    additionalTopics?: string;
    keyLearnings?: string;
    specialObservations?: string;
  }): Promise<any>;
  markTrainingAttendance(trainingId: number, userId: number): Promise<any>;
}

// In-Memory Storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private attendance: Map<number, Attendance>;
  private leaveRequests: Map<number, LeaveRequest>;
  private trainingRecords: Map<number, any>;
  private trainingAssessmentParameters: Map<number, { id: number; name: string; maxScore: number; }>;
  private trainingAssessments: Map<number, any>;
  private trainingAssessmentScores: Map<number, any>;
  private trainingFeedback: Map<number, any>;
  private trainingAttendees: Map<number, any>;
  private currentUserId: number;
  private currentAttendanceId: number;
  private currentLeaveRequestId: number;
  private currentTrainingRecordId: number;
  private currentAssessmentId: number;
  private currentScoreId: number;
  private currentFeedbackId: number;
  private currentTrainingAttendanceId: number;

  constructor() {
    this.users = new Map();
    this.attendance = new Map();
    this.leaveRequests = new Map();
    this.trainingRecords = new Map();
    this.trainingAssessmentParameters = new Map();
    this.trainingAssessments = new Map();
    this.trainingAssessmentScores = new Map();
    this.trainingFeedback = new Map();
    this.trainingAttendees = new Map();
    this.currentUserId = 1;
    this.currentAttendanceId = 1;
    this.currentLeaveRequestId = 1;
    this.currentTrainingRecordId = 1;
    this.currentAssessmentId = 1;
    this.currentScoreId = 1;
    this.currentFeedbackId = 1;
    this.currentTrainingAttendanceId = 1;

    // Add some initial admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      email: "admin@devgiri.com",
      role: "admin",
      firstName: "Rajiv",
      lastName: "Kumar",
      phone: "9876543210",
      department: "hr",
      position: "HR Administrator",
      employeeId: "EMP001",
      joinDate: new Date("2022-01-01"),
      address: "123 Main St, Mumbai",
      profileImageUrl: "",
    });
  }

  // User/Employee Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...userData,
      id,
      isActive: true,
      joinDate: userData.joinDate ? new Date(userData.joinDate) : new Date(),
      role: userData.role || "employee",
      department: userData.department || null,
      position: userData.position || null,
      phone: userData.phone || null,
      address: userData.address || null,
      employeeId: userData.employeeId || null,
      qrCode: userData.qrCode || null,
      profileImageUrl: userData.profileImageUrl || null,
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter((user) => user.isActive);
  }

  async updateUser(
    id: number,
    userData: Partial<InsertUser>,
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    // Soft delete by setting isActive to false
    this.users.set(id, { ...user, isActive: false });
    return true;
  }

  async searchUsers(query: string, department?: string): Promise<User[]> {
    return Array.from(this.users.values()).filter((user) => {
      const matchesQuery =
        user.firstName.toLowerCase().includes(query.toLowerCase()) ||
        user.lastName.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        (user.employeeId &&
          user.employeeId.toLowerCase().includes(query.toLowerCase()));

      const matchesDepartment = !department || user.department === department;

      // Only filter by isActive when a specific department is selected
      // This allows inactive users to be visible in "All Departments"
      if (department) {
        return user.isActive && matchesQuery && matchesDepartment;
      }

      return matchesQuery && matchesDepartment;
    });
  }

  // Attendance Methods
  async createAttendance(
    attendanceData: InsertAttendance,
  ): Promise<Attendance> {
    const formattedData = {
      ...attendanceData,
      date: new Date(attendanceData.date),
      checkInTime: attendanceData.checkInTime
        ? new Date(attendanceData.checkInTime)
        : null,
      checkOutTime: attendanceData.checkOutTime
        ? new Date(attendanceData.checkOutTime)
        : null,
    };

    const result = await this.db
      .insert(attendance)
      .values(formattedData)
      .returning();
    return result[0];
  }

  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendance.get(id);
  }

  async getUserAttendance(userId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values())
      .filter((att) => att.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getUserAttendanceByDate(
    userId: number,
    date: Date,
  ): Promise<Attendance | undefined> {
    // Ensure date is a valid Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    const dateStr = dateObj.toISOString().split("T")[0];

    const result = await this.db
      .select()
      .from(attendance)
      .where(eq(attendance.userId, userId));

    return result.find((att) => {
      // Handle both Date objects and string dates
      const attDate = att.date instanceof Date ? att.date : new Date(att.date);
      const attDateStr = attDate.toISOString().split("T")[0];
      return attDateStr === dateStr;
    });
  }

  async getUserAttendanceByDateRange(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Attendance[]> {
    const start = startDate.getTime();
    const end = endDate.getTime();

    return Array.from(this.attendance.values())
      .filter((att) => {
        const attDate = new Date(att.date).getTime();
        return att.userId === userId && attDate >= start && attDate <= end;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async updateAttendance(
    id: number,
    attendanceData: Partial<InsertAttendance>,
  ): Promise<Attendance | undefined> {
    const formattedData = {
      ...attendanceData,
      date: attendanceData.date
        ? attendanceData.date instanceof Date
          ? attendanceData.date
          : new Date(attendanceData.date)
        : undefined,
      checkInTime: attendanceData.checkInTime
        ? attendanceData.checkInTime instanceof Date
          ? attendanceData.checkInTime
          : new Date(attendanceData.checkInTime)
        : undefined,
      checkOutTime: attendanceData.checkOutTime
        ? attendanceData.checkOutTime instanceof Date
          ? attendanceData.checkOutTime
          : new Date(attendanceData.checkOutTime)
        : undefined,
    };

    const result = await this.db
      .update(attendance)
      .set(formattedData)
      .where(eq(attendance.id, id))
      .returning();
    return result[0];
  }

  async getTodayAttendance(): Promise<(Attendance & { user: User })[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAttendance = Array.from(this.attendance.values())
      .filter((att: Attendance) => {
        const attDate = new Date(att.date);
        attDate.setHours(0, 0, 0, 0);
        return attDate.getTime() === today.getTime();
      });
    
    return todayAttendance.map((att: Attendance) => {
      const user = this.users.get(att.userId);
      return {
        ...att,
        user: user || { id: 0, name: 'Unknown', username: 'unknown', email: '', role: 'employee', department: 'unknown' }
      };
    });
  }

  // Leave Request Methods
  async createLeaveRequest(data: { userId: number; startDate: string; endDate: string; type: string; reason?: string }) {
    // Create a new leave request with the provided data
    const newRequest = {
      ...data,
      status: "pending" as const,
      requestDate: new Date(),
    };

    // Insert the leave request into the database
    const result = await this.db.insert(leaveRequests).values(newRequest).returning();
    return result[0];
  }

  async getLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    return this.leaveRequests.get(id);
  }

  async getUserLeaveRequests(userId: number): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values())
      .filter((req) => req.userId === userId)
      .sort((a, b) => {
        const dateA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
        const dateB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
        return dateB - dateA;
      });
  }

  async updateLeaveRequest(
    id: number,
    leaveRequestData: Partial<LeaveRequest>,
  ): Promise<LeaveRequest | undefined> {
    const leaveRequest = this.leaveRequests.get(id);
    if (!leaveRequest) return undefined;

    const updatedLeaveRequest = { ...leaveRequest, ...leaveRequestData };
    this.leaveRequests.set(id, updatedLeaveRequest);
    return updatedLeaveRequest;
  }

  async getPendingLeaveRequests(): Promise<(LeaveRequest & { user: User })[]> {
    return Array.from(this.leaveRequests.values())
      .filter((req) => req.status === "pending")
      .map((req) => {
        const user = this.users.get(req.userId);
        if (!user)
          throw new Error(`User not found for leave request: ${req.id}`);
        return { ...req, user };
      })
      .sort((a, b) => {
        const dateA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
        const dateB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
        return dateB - dateA;
      });
  }

  async respondToLeaveRequest(
    id: number,
    status: "approved" | "rejected",
    approvedById: number,
    notes?: string,
  ): Promise<LeaveRequest | undefined> {
    const leaveRequest = this.leaveRequests.get(id);
    if (!leaveRequest) return undefined;

    const responseDate = new Date();
    const updatedLeaveRequest: LeaveRequest = {
      ...leaveRequest,
      status,
      approvedById,
      responseDate,
      responseNotes: notes || null,
    };

    this.leaveRequests.set(id, updatedLeaveRequest);
    return updatedLeaveRequest;
  }

  async getAttendanceStatistics(): Promise<{
    totalAttendanceToday: number;
    onTime: number;
    late: number;
    departmentalBreakdown: { department: string; count: number }[];
    attendanceByHour: { hour: number; count: number }[];
    recentActivity: {
      id: number;
      userId: number;
      userName: string;
      time: string;
      type: string;
      status: string;
    }[];
  }> {
    const today = new Date().toISOString().split("T")[0];
    const allUsers = Array.from(this.users.values());

    // Get today's attendance
    const todayAttendance = Array.from(this.attendance.values()).filter(
      (att) => new Date(att.date).toISOString().split("T")[0] === today,
    );

    // Count on-time vs late
    const onTime = todayAttendance.filter(
      (att) => att.status === "present",
    ).length;
    const late = todayAttendance.filter((att) => att.status === "late").length;

    // Departmental breakdown
    const departmentMap = new Map<string, number>();
    for (const att of todayAttendance) {
      const user = this.users.get(att.userId);
      if (user && user.department) {
        const dept = user.department;
        departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1);
      }
    }

    const departmentalBreakdown = Array.from(departmentMap.entries()).map(
      ([department, count]) => ({
        department,
        count,
      }),
    );

    // Attendance by hour
    const hourMap = new Map<number, number>();
    for (const att of todayAttendance) {
      if (att.checkInTime) {
        const checkInDate = new Date(att.checkInTime);
        const hour = checkInDate.getHours();
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      }
    }

    const attendanceByHour = Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour);

    // Recent activity - get the 5 most recent check-ins/outs
    const recentActivity = todayAttendance
      .filter((att) => att.checkInTime || att.checkOutTime)
      .flatMap((att) => {
        const user = this.users.get(att.userId);
        if (!user) return [];

        const activities = [];

        if (att.checkInTime) {
          activities.push({
            id: att.id,
            userId: att.userId,
            userName: `${user.firstName} ${user.lastName}`,
            time: new Date(att.checkInTime).toLocaleTimeString(),
            type: "Check In",
            status: att.status || "unknown",
          });
        }

        if (att.checkOutTime) {
          activities.push({
            id: att.id,
            userId: att.userId,
            userName: `${user.firstName} ${user.lastName}`,
            time: new Date(att.checkOutTime).toLocaleTimeString(),
            type: "Check Out",
            status: att.status || "unknown",
          });
        }

        return activities;
      })
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);

    return {
      totalAttendanceToday: todayAttendance.length,
      onTime,
      late,
      departmentalBreakdown,
      attendanceByHour,
      recentActivity,
    };
  }

  // Training Records Methods
  async createTrainingRecord(data: any): Promise<any> {
    const id = this.currentTrainingRecordId++;
    const trainingRecord = {
      id,
      ...data,
      date: data.date,
    };
    this.trainingRecords.set(id, trainingRecord);
    return trainingRecord;
  }

  async getAllTrainingRecords(): Promise<any[]> {
    return Array.from(this.trainingRecords.values());
  }

  async getTrainingRecord(id: number): Promise<any> {
    return this.trainingRecords.get(id);
  }

  async deleteTrainingRecord(id: number): Promise<void> {
    this.trainingRecords.delete(id);
  }

  // Training Assessment Methods
  async getTrainingAssessmentParameters(): Promise<{ id: number; name: string; maxScore: number; }[]> {
    return Array.from(this.trainingAssessmentParameters.values());
  }

  async createTrainingAssessment(data: {
    trainingId: number;
    userId: number;
    assessorId: number;
    assessmentDate: string;
    frequency: string;
    comments?: string;
    totalScore: number;
    status: string;
    scores: { parameterId: number; score: number; }[];
  }): Promise<any> {
    const id = this.currentAssessmentId++;
    const assessment = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.trainingAssessments.set(id, assessment);

    // Create assessment scores
    data.scores.forEach(score => {
      const scoreId = this.currentScoreId++;
      this.trainingAssessmentScores.set(scoreId, {
        id: scoreId,
        assessmentId: id,
        ...score,
        createdAt: new Date().toISOString(),
      });
    });

    // Update training record
    const trainingRecord = this.trainingRecords.get(data.trainingId);
    if (trainingRecord) {
      trainingRecord.assessmentScore = data.totalScore;
      trainingRecord.status = data.status === "satisfactory" ? "completed" : "needs_improvement";
      this.trainingRecords.set(data.trainingId, trainingRecord);
    }

    return assessment;
  }

  async getTrainingAssessments(trainingId: number): Promise<any[]> {
    try {
      // First get all assessments for the training
      const assessments = await this.db.select()
        .from(trainingAssessments)
        .where(eq(trainingAssessments.trainingId, trainingId));
      
      // Then fetch user and assessor details for each assessment
      const assessmentsWithDetails = await Promise.all(
        assessments.map(async (assessment) => {
          // Get user details
          const userResult = await this.db.select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(eq(users.id, assessment.userId))
          .limit(1);
          
          // Get assessor details
          const assessorResult = await this.db.select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(eq(users.id, assessment.assessorId))
          .limit(1);
          
          // Get scores for this assessment
          const scores = await this.db.select()
            .from(trainingAssessmentScores)
            .where(eq(trainingAssessmentScores.assessmentId, assessment.id));
          
          return {
            assessment,
            user: userResult[0] || null,
            assessor: assessorResult[0] || null,
            scores,
          };
        })
      );
      
      return assessmentsWithDetails;
    } catch (error) {
      console.error("Error in getTrainingAssessments:", error);
      throw error;
    }
  }

  // Training Feedback Methods
  async getTrainingFeedback(trainingId: number): Promise<any[]> {
    try {
      const feedback = await this.db.query.trainingFeedback.findMany({
        where: eq(trainingFeedback.trainingId, trainingId),
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          training: true,
        },
      });
      return feedback;
    } catch (error) {
      console.error("Error fetching training feedback:", error);
      throw error;
    }
  }
  
  async submitTrainingFeedback(data: {
    trainingId: number;
    userId: number;
    isEffective: boolean;
    trainingAidsGood: boolean;
    durationSufficient: boolean;
    contentExplained: boolean;
    conductedProperly: boolean;
    learningEnvironment: boolean;
    helpfulForWork: boolean;
    additionalTopics?: string;
    keyLearnings?: string;
    specialObservations?: string;
  }): Promise<any> {
    const feedbackId = ++this.currentFeedbackId;
    const feedback = {
      id: feedbackId,
      ...data,
    };
    
    this.trainingFeedback.set(feedbackId, feedback);
    
    // Mark attendance as present
    const attendanceId = ++this.currentTrainingAttendanceId;
    this.trainingAttendees.set(attendanceId, {
      id: attendanceId,
      trainingId: data.trainingId,
      userId: data.userId,
      attendanceStatus: 'present',
    });
    
    return feedback;
  }
  
  async markTrainingAttendance(trainingId: number, userId: number): Promise<any> {
    const attendanceId = ++this.currentTrainingAttendanceId;
    const attendance = {
      id: attendanceId,
      trainingId,
      userId,
      attendanceStatus: 'present',
    };
    
    this.trainingAttendees.set(attendanceId, attendance);
    return attendance;
  }
}

// Database Storage implementation
export class DatabaseStorage implements IStorage {
  private db: PostgresJsDatabase;

  constructor(db: PostgresJsDatabase) {
    this.db = db;
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return result[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      // Ensure joinDate is a proper Date object
      const userDataWithDate = {
        ...userData,
        joinDate: userData.joinDate ? new Date(userData.joinDate) : new Date(),
        // Include all nullable fields
        department: userData.department || null,
        role: userData.role || "employee",
        qrCode: userData.qrCode || null,
        phone: userData.phone || null,
        position: userData.position || null,
        address: userData.address || null,
        profileImageUrl: userData.profileImageUrl || null,
        employeeId: userData.employeeId || null,
      };

      const result = await this.db
        .insert(users)
        .values(userDataWithDate)
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users).where(eq(users.isActive, true));
  }

  async updateUser(
    id: number,
    userData: Partial<InsertUser>,
  ): Promise<User | undefined> {
    const result = await this.db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // First check if the user exists
      const user = await this.getUser(id);
      if (!user) return false;

      // Soft delete by setting isActive to false
      await this.db
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, id));

      return true;
    } catch (error) {
      console.error("Error in deleteUser:", error);
      throw error;
    }
  }

  async searchUsers(query: string, department?: string): Promise<User[]> {
    let queryBuilder = this.db
      .select()
      .from(users);

    // Only filter by isActive when a specific department is selected
    // This allows inactive users to be visible in "All Departments"
    if (department) {
      queryBuilder = queryBuilder.where(eq(users.isActive, true));
    }

    if (query) {
      queryBuilder = queryBuilder.where(
        or(
          like(users.firstName, `%${query}%`),
          like(users.lastName, `%${query}%`),
          like(users.email, `%${query}%`),
          like(users.employeeId, `%${query}%`),
        ),
      );
    }

    if (department) {
      queryBuilder = queryBuilder.where(eq(users.department, department));
    }

    return await queryBuilder;
  }

  async createAttendance(
    attendanceData: InsertAttendance,
  ): Promise<Attendance> {
    const formattedData = {
      ...attendanceData,
      date: new Date(attendanceData.date),
      checkInTime: attendanceData.checkInTime
        ? new Date(attendanceData.checkInTime)
        : null,
      checkOutTime: attendanceData.checkOutTime
        ? new Date(attendanceData.checkOutTime)
        : null,
    };

    const result = await this.db
      .insert(attendance)
      .values(formattedData)
      .returning();
    return result[0];
  }

  async getAttendance(id: number): Promise<Attendance | undefined> {
    const result = await this.db
      .select()
      .from(attendance)
      .where(eq(attendance.id, id));
    return result[0];
  }

  async getUserAttendance(userId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values())
      .filter((att) => att.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getUserAttendanceByDate(
    userId: number,
    date: Date,
  ): Promise<Attendance | undefined> {
    // Ensure date is a valid Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    const dateStr = dateObj.toISOString().split("T")[0];

    const result = await this.db
      .select()
      .from(attendance)
      .where(eq(attendance.userId, userId));

    return result.find((att) => {
      // Handle both Date objects and string dates
      const attDate = att.date instanceof Date ? att.date : new Date(att.date);
      const attDateStr = attDate.toISOString().split("T")[0];
      return attDateStr === dateStr;
    });
  }

  async getUserAttendanceByDateRange(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Attendance[]> {
    const start = startDate.getTime();
    const end = endDate.getTime();

    return Array.from(this.attendance.values())
      .filter((att) => {
        const attDate = new Date(att.date).getTime();
        return att.userId === userId && attDate >= start && attDate <= end;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async updateAttendance(
    id: number,
    attendanceData: Partial<InsertAttendance>,
  ): Promise<Attendance | undefined> {
    // Ensure date is properly formatted if it exists
    const formattedData = {
      ...attendanceData,
      date: attendanceData.date
        ? attendanceData.date instanceof Date
          ? attendanceData.date
          : new Date(attendanceData.date)
        : undefined,
      checkInTime: attendanceData.checkInTime
        ? attendanceData.checkInTime instanceof Date
          ? attendanceData.checkInTime
          : new Date(attendanceData.checkInTime)
        : undefined,
      checkOutTime: attendanceData.checkOutTime
        ? attendanceData.checkOutTime instanceof Date
          ? attendanceData.checkOutTime
          : new Date(attendanceData.checkOutTime)
        : undefined,
    };

    const result = await this.db
      .update(attendance)
      .set(formattedData)
      .where(eq(attendance.id, id))
      .returning();
    return result[0];
  }

  async getTodayAttendance(): Promise<(Attendance & { user: User })[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await this.db
      .select({
        ...attendance,
        user: users,
      })
      .from(attendance)
      .leftJoin(users, eq(attendance.userId, users.id))
      .where(between(attendance.date, today, tomorrow));
  }

  async createLeaveRequest(data: { userId: number; startDate: string; endDate: string; type: string; reason?: string }) {
    // Create a new leave request with the provided data
    const newRequest = {
      ...data,
      status: "pending" as const,
      requestDate: new Date(),
    };

    // Insert the leave request into the database
    const result = await this.db.insert(leaveRequests).values(newRequest).returning();
    return result[0];
  }

  async getLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    const result = await this.db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id));
    return result[0];
  }

  async getUserLeaveRequests(userId: number): Promise<LeaveRequest[]> {
    return await this.db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.userId, userId));
  }

  async updateLeaveRequest(
    id: number,
    leaveRequestData: Partial<LeaveRequest>,
  ): Promise<LeaveRequest | undefined> {
    const result = await this.db
      .update(leaveRequests)
      .set(leaveRequestData)
      .where(eq(leaveRequests.id, id))
      .returning();
    return result[0];
  }

  async getPendingLeaveRequests(): Promise<(LeaveRequest & { user: User })[]> {
    return await this.db
      .select({
        ...leaveRequests,
        user: users,
      })
      .from(leaveRequests)
      .leftJoin(users, eq(leaveRequests.userId, users.id))
      .where(eq(leaveRequests.status, "pending"))
      .orderBy(desc(leaveRequests.requestDate));
  }

  async respondToLeaveRequest(
    id: number,
    status: "approved" | "rejected",
    approvedById: number,
    notes?: string,
  ): Promise<LeaveRequest | undefined> {
    const result = await this.db
      .update(leaveRequests)
      .set({
        status,
        approvedById,
        responseDate: new Date(),
        responseNotes: notes,
      })
      .where(eq(leaveRequests.id, id))
      .returning();
    return result[0];
  }

  async getAttendanceStatistics(): Promise<{
    totalAttendanceToday: number;
    onTime: number;
    late: number;
    departmentalBreakdown: { department: string; count: number }[];
    attendanceByHour: { hour: number; count: number }[];
    recentActivity: {
      id: number;
      userId: number;
      userName: string;
      time: string;
      type: string;
      status: string;
    }[];
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's attendance
    const todayAttendance = await this.db
      .select()
      .from(attendance)
      .where(between(attendance.date, today, tomorrow));

    // Get all users for reference
    const allUsers = await this.db.select().from(users);

    // Calculate statistics
    const totalAttendanceToday = todayAttendance.length;
    const onTime = todayAttendance.filter((a) => a.status === "present").length;
    const late = todayAttendance.filter((a) => a.status === "late").length;

    // Calculate departmental breakdown
    const departmentalBreakdown = allUsers.reduce(
      (acc, user) => {
        if (user.department) {
          acc[user.department] = (acc[user.department] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    // Format departmental breakdown
    const formattedDepartmentalBreakdown = Object.entries(
      departmentalBreakdown,
    ).map(([department, count]) => ({ department, count }));

    // Calculate attendance by hour
    const attendanceByHour = todayAttendance.reduce(
      (acc, att) => {
        const hour = new Date(att.checkInTime).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    // Format attendance by hour
    const formattedAttendanceByHour = Object.entries(attendanceByHour).map(
      ([hour, count]) => ({ hour: parseInt(hour), count }),
    );

    // Get recent activity
    const recentActivity = todayAttendance
      .map((att) => {
        const user = allUsers.find((u) => u.id === att.userId);
        return {
          id: att.id,
          userId: att.userId,
          userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
          time: att.checkInTime.toISOString(),
          type: "check-in",
          status: att.status,
        };
      })
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);

    return {
      totalAttendanceToday,
      onTime,
      late,
      departmentalBreakdown: formattedDepartmentalBreakdown,
      attendanceByHour: formattedAttendanceByHour,
      recentActivity,
    };
  }

  async permanentlyDeleteInactiveUsers(): Promise<number> {
    try {
      // Delete all inactive users from the database
      const result = await this.db
        .delete(users)
        .where(eq(users.isActive, false));

      return result.rowCount || 0;
    } catch (error) {
      console.error("Error in permanentlyDeleteInactiveUsers:", error);
      throw error;
    }
  }

  async permanentlyDeleteUser(userId: number): Promise<boolean> {
    try {
      // First delete all attendance records for this user
      await this.db.delete(attendance).where(eq(attendance.userId, userId));

      // Then delete the user
      const result = await this.db
        .delete(users)
        .where(eq(users.id, userId))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error in permanentlyDeleteUser:", error);
      throw error;
    }
  }

  async createTrainingRecord(data: any): Promise<any> {
    try {
      console.log('Creating training record with data:', data);
      
      // First check if the user exists
      const user = await this.db.select().from(users).where(eq(users.id, data.userId)).limit(1);
      console.log('Found user:', user);
      
      if (!user || user.length === 0) {
        throw new Error(`User with ID ${data.userId} not found`);
      }

      // If trainerId is provided, check if trainer exists
      if (data.trainerId) {
        const trainer = await this.db.select().from(users).where(eq(users.id, data.trainerId)).limit(1);
        console.log('Found trainer:', trainer);
        
        if (!trainer || trainer.length === 0) {
          throw new Error(`Trainer with ID ${data.trainerId} not found`);
        }
      }

      const result = await this.db.insert(trainingRecords).values({
        userId: data.userId,
        trainingTitle: data.trainingTitle,
        trainingType: data.trainingType || 'internal',
        date: data.date,
        trainerId: data.trainerId ? parseInt(data.trainerId) : null,
        department: data.department,
        status: 'pending',
        notes: data.notes || null,
        feedbackScore: null,
        assessmentScore: null,
        effectiveness: data.effectiveness || null,
        venue: data.venue || null,
        objectives: data.objectives || null,
        materials: data.materials || null,
        evaluation: data.evaluation || null
      }).returning();

      console.log('Created training record:', result[0]);
      return result[0];
    } catch (error) {
      console.error('Error in createTrainingRecord:', error);
      throw error;
    }
  }

  async getAllTrainingRecords(): Promise<any[]> {
    try {
      const records = await this.db.select().from(trainingRecords);
      return records;
    } catch (error) {
      console.error('Error in getAllTrainingRecords:', error);
      throw error;
    }
  }

  async getTrainingRecord(id: number): Promise<any> {
    try {
      const records = await this.db
        .select()
        .from(trainingRecords)
        .where(eq(trainingRecords.id, id))
        .limit(1);
      return records[0];
    } catch (error) {
      console.error('Error in getTrainingRecord:', error);
      throw error;
    }
  }

  async deleteTrainingRecord(id: number): Promise<void> {
    try {
      // Start a transaction to ensure all operations succeed or fail together
      await this.db.transaction(async (tx) => {
        // First get all assessments for this training
        const assessments = await tx.select()
          .from(trainingAssessments)
          .where(eq(trainingAssessments.trainingId, id));

        // For each assessment, delete its scores
        for (const assessment of assessments) {
          await tx.delete(trainingAssessmentScores)
            .where(eq(trainingAssessmentScores.assessmentId, assessment.id));
        }

        // Delete all assessments for this training
        await tx.delete(trainingAssessments)
          .where(eq(trainingAssessments.trainingId, id));

        // Delete all feedback for this training
        await tx.delete(trainingFeedback)
          .where(eq(trainingFeedback.trainingId, id));

        // Finally delete the training record
        await tx.delete(trainingRecords)
          .where(eq(trainingRecords.id, id));
      });
    } catch (error) {
      console.error('Error in deleteTrainingRecord:', error);
      throw error;
    }
  }

  // Training Assessment Methods
  async getTrainingAssessmentParameters(): Promise<{ id: number; name: string; maxScore: number; }[]> {
    try {
      const parameters = await this.db.select().from(trainingAssessmentParameters);
      return parameters;
    } catch (error) {
      console.error("Error in getTrainingAssessmentParameters:", error);
      throw error;
    }
  }

  async createTrainingAssessment(data: {
    trainingId: number;
    userId: number;
    assessorId: number;
    assessmentDate: string;
    frequency: string;
    comments?: string;
    totalScore: number;
    status: string;
    scores: { parameterId: number; score: number; }[];
  }): Promise<any> {
    try {
      // First check if the training record exists
      const training = await this.db.select()
        .from(trainingRecords)
        .where(eq(trainingRecords.id, data.trainingId))
        .limit(1);

      if (!training || training.length === 0) {
        throw new Error(`Training record with ID ${data.trainingId} not found`);
      }

      // Create the assessment record
      const [assessment] = await this.db.insert(trainingAssessments).values({
        trainingId: data.trainingId,
        userId: data.userId,
        assessorId: data.assessorId,
        assessmentDate: data.assessmentDate,
        frequency: data.frequency,
        comments: data.comments || null,
        totalScore: data.totalScore,
        status: data.status,
      }).returning();

      // Create the assessment scores
      const scorePromises = data.scores.map(score =>
        this.db.insert(trainingAssessmentScores).values({
          assessmentId: assessment.id,
          parameterId: score.parameterId,
          score: score.score,
        })
      );

      await Promise.all(scorePromises);

      // Update the training record with the assessment score
      await this.db.update(trainingRecords)
        .set({
          assessmentScore: data.totalScore,
          status: data.status === "satisfactory" ? "completed" : "needs_improvement"
        })
        .where(eq(trainingRecords.id, data.trainingId));

      return assessment;
    } catch (error) {
      console.error("Error in createTrainingAssessment:", error);
      throw error;
    }
  }

  async getTrainingAssessments(trainingId: number): Promise<any[]> {
    try {
      // First get all assessments for the training
      const assessments = await this.db.select()
        .from(trainingAssessments)
        .where(eq(trainingAssessments.trainingId, trainingId));
      
      // Then fetch user and assessor details for each assessment
      const assessmentsWithDetails = await Promise.all(
        assessments.map(async (assessment) => {
          // Get user details
          const userResult = await this.db.select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(eq(users.id, assessment.userId))
          .limit(1);
          
          // Get assessor details
          const assessorResult = await this.db.select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(eq(users.id, assessment.assessorId))
          .limit(1);
          
          // Get scores for this assessment
          const scores = await this.db.select()
            .from(trainingAssessmentScores)
            .where(eq(trainingAssessmentScores.assessmentId, assessment.id));
          
          return {
            assessment,
            user: userResult[0] || null,
            assessor: assessorResult[0] || null,
            scores,
          };
        })
      );
      
      return assessmentsWithDetails;
    } catch (error) {
      console.error("Error in getTrainingAssessments:", error);
      throw error;
    }
  }

  // Training Feedback Methods
  async getTrainingFeedback(trainingId: number): Promise<any[]> {
    try {
      const feedback = await this.db.query.trainingFeedback.findMany({
        where: eq(trainingFeedback.trainingId, trainingId),
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          training: true,
        },
      });
      return feedback;
    } catch (error) {
      console.error("Error fetching training feedback:", error);
      throw error;
    }
  }
  
  async submitTrainingFeedback(data: {
    trainingId: number;
    userId: number;
    isEffective: boolean;
    trainingAidsGood: boolean;
    durationSufficient: boolean;
    contentExplained: boolean;
    conductedProperly: boolean;
    learningEnvironment: boolean;
    helpfulForWork: boolean;
    additionalTopics?: string;
    keyLearnings?: string;
    specialObservations?: string;
  }): Promise<any> {
    try {
      // Start a transaction
      const result = await this.db.transaction(async (tx) => {
        // Create the feedback
        const [feedback] = await tx
          .insert(trainingFeedback)
          .values({
            trainingId: data.trainingId,
            userId: data.userId,
            isEffective: data.isEffective,
            trainingAidsGood: data.trainingAidsGood,
            durationSufficient: data.durationSufficient,
            contentExplained: data.contentExplained,
            conductedProperly: data.conductedProperly,
            learningEnvironment: data.learningEnvironment,
            helpfulForWork: data.helpfulForWork,
            additionalTopics: data.additionalTopics,
            keyLearnings: data.keyLearnings,
            specialObservations: data.specialObservations,
          })
          .returning();
        
        // Mark attendance as present
        await tx
          .insert(trainingAttendees)
          .values({
            trainingId: data.trainingId,
            userId: data.userId,
            attendanceStatus: 'present',
          })
          .onConflictDoUpdate({
            target: [trainingAttendees.trainingId, trainingAttendees.userId],
            set: { attendanceStatus: 'present' },
          });
        
        return feedback;
      });

      return result;
    } catch (error) {
      console.error("Error submitting training feedback:", error);
      throw error;
    }
  }
  
  async markTrainingAttendance(trainingId: number, userId: number): Promise<any> {
    try {
      const result = await this.db
        .insert(trainingAttendees)
        .values({
          trainingId,
          userId,
          attendanceStatus: 'present',
        })
        .onConflictDoUpdate({
          target: [trainingAttendees.trainingId, trainingAttendees.userId],
          set: { attendanceStatus: 'present' },
        })
        .returning();
      
      return result[0];
    } catch (error) {
      console.error("Error marking attendance:", error);
      throw error;
    }
  }
}

// Create a database storage instance
export const storage = new DatabaseStorage(db);