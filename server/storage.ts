import { 
  users, type User, type InsertUser,
  attendance, type Attendance, type InsertAttendance,
  leaveRequests, type LeaveRequest, type InsertLeaveRequest,
  attendanceStatusEnum, leaveStatusEnum
} from "@shared/schema";
import { eq, and, between, gte, lte, like, or, isNull, desc, asc } from "drizzle-orm";

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
  getUserAttendanceByDate(userId: number, date: Date): Promise<Attendance | undefined>;
  getUserAttendanceByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Attendance[]>;
  updateAttendance(id: number, attendance: Partial<InsertAttendance>): Promise<Attendance | undefined>;
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
  updateLeaveRequest(id: number, leaveRequest: Partial<LeaveRequest>): Promise<LeaveRequest | undefined>;
  getPendingLeaveRequests(): Promise<(LeaveRequest & { user: User })[]>;
  respondToLeaveRequest(id: number, status: 'approved' | 'rejected', approvedById: number, notes?: string): Promise<LeaveRequest | undefined>;
}

// In-Memory Storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private attendance: Map<number, Attendance>;
  private leaveRequests: Map<number, LeaveRequest>;
  private currentUserId: number;
  private currentAttendanceId: number;
  private currentLeaveRequestId: number;

  constructor() {
    this.users = new Map();
    this.attendance = new Map();
    this.leaveRequests = new Map();
    this.currentUserId = 1;
    this.currentAttendanceId = 1;
    this.currentLeaveRequestId = 1;
    
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
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    // Make sure required fields are present
    const user: User = { 
      ...insertUser, 
      id, 
      isActive: true,
      role: insertUser.role || 'employee',
      department: insertUser.department || null,
      position: insertUser.position || null,
      phone: insertUser.phone || null,
      address: insertUser.address || null,
      employeeId: insertUser.employeeId || null,
      joinDate: insertUser.joinDate || null,
      profileImageUrl: insertUser.profileImageUrl || null
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isActive);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
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
    return Array.from(this.users.values()).filter(user => {
      const matchesQuery = 
        user.firstName.toLowerCase().includes(query.toLowerCase()) ||
        user.lastName.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        (user.employeeId && user.employeeId.toLowerCase().includes(query.toLowerCase()));
      
      const matchesDepartment = !department || user.department === department;
      
      return user.isActive && matchesQuery && matchesDepartment;
    });
  }

  // Attendance Methods
  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const id = this.currentAttendanceId++;
    const newAttendance: Attendance = { 
      ...attendanceData, 
      id,
      status: attendanceData.status || 'present',
      checkInTime: attendanceData.checkInTime || null,
      checkOutTime: attendanceData.checkOutTime || null,
      checkInMethod: attendanceData.checkInMethod || null,
      checkOutMethod: attendanceData.checkOutMethod || null,
      notes: attendanceData.notes || null
    };
    this.attendance.set(id, newAttendance);
    return newAttendance;
  }

  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendance.get(id);
  }

  async getUserAttendance(userId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values())
      .filter(att => att.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getUserAttendanceByDate(userId: number, date: Date): Promise<Attendance | undefined> {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    return Array.from(this.attendance.values()).find(att => 
      att.userId === userId && 
      new Date(att.date).toISOString().split('T')[0] === dateStr
    );
  }

  async getUserAttendanceByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Attendance[]> {
    const start = startDate.getTime();
    const end = endDate.getTime();
    
    return Array.from(this.attendance.values())
      .filter(att => {
        const attDate = new Date(att.date).getTime();
        return att.userId === userId && attDate >= start && attDate <= end;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async updateAttendance(id: number, attendanceData: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const attendance = this.attendance.get(id);
    if (!attendance) return undefined;
    
    const updatedAttendance = { ...attendance, ...attendanceData };
    this.attendance.set(id, updatedAttendance);
    return updatedAttendance;
  }

  async getTodayAttendance(): Promise<(Attendance & { user: User })[]> {
    const today = new Date().toISOString().split('T')[0];
    
    return Array.from(this.attendance.values())
      .filter(att => new Date(att.date).toISOString().split('T')[0] === today)
      .map(att => {
        const user = this.users.get(att.userId);
        if (!user) throw new Error(`User not found for attendance: ${att.id}`);
        return { ...att, user };
      });
  }

  // Leave Request Methods
  async createLeaveRequest(leaveRequestData: InsertLeaveRequest): Promise<LeaveRequest> {
    const id = this.currentLeaveRequestId++;
    // Format dates as strings for DB compatibility
    const requestDate = new Date();
    const requestDateStr = requestDate.toISOString();
    
    const newLeaveRequest: LeaveRequest = { 
      ...leaveRequestData, 
      id, 
      status: 'pending', 
      requestDate: requestDateStr,
      responseDate: null,
      responseNotes: null,
      approvedById: null,
      reason: leaveRequestData.reason || null
    };
    this.leaveRequests.set(id, newLeaveRequest);
    return newLeaveRequest;
  }

  async getLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    return this.leaveRequests.get(id);
  }

  async getUserLeaveRequests(userId: number): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values())
      .filter(req => req.userId === userId)
      .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  }

  async updateLeaveRequest(id: number, leaveRequestData: Partial<LeaveRequest>): Promise<LeaveRequest | undefined> {
    const leaveRequest = this.leaveRequests.get(id);
    if (!leaveRequest) return undefined;
    
    const updatedLeaveRequest = { ...leaveRequest, ...leaveRequestData };
    this.leaveRequests.set(id, updatedLeaveRequest);
    return updatedLeaveRequest;
  }

  async getPendingLeaveRequests(): Promise<(LeaveRequest & { user: User })[]> {
    return Array.from(this.leaveRequests.values())
      .filter(req => req.status === 'pending')
      .map(req => {
        const user = this.users.get(req.userId);
        if (!user) throw new Error(`User not found for leave request: ${req.id}`);
        return { ...req, user };
      })
      .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  }

  async respondToLeaveRequest(id: number, status: 'approved' | 'rejected', approvedById: number, notes?: string): Promise<LeaveRequest | undefined> {
    const leaveRequest = this.leaveRequests.get(id);
    if (!leaveRequest) return undefined;
    
    // Format date as string for DB compatibility
    const responseDate = new Date();
    const responseDateStr = responseDate.toISOString();
    
    const updatedLeaveRequest: LeaveRequest = { 
      ...leaveRequest, 
      status: status,
      approvedById,
      responseDate: responseDateStr,
      responseNotes: notes || null
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
    const today = new Date().toISOString().split('T')[0];
    const allUsers = Array.from(this.users.values());
    
    // Get today's attendance
    const todayAttendance = Array.from(this.attendance.values())
      .filter(att => new Date(att.date).toISOString().split('T')[0] === today);
    
    // Count on-time vs late
    const onTime = todayAttendance.filter(att => att.status === 'present').length;
    const late = todayAttendance.filter(att => att.status === 'late').length;
    
    // Departmental breakdown
    const departmentMap = new Map<string, number>();
    for (const att of todayAttendance) {
      const user = this.users.get(att.userId);
      if (user && user.department) {
        const dept = user.department;
        departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1);
      }
    }
    
    const departmentalBreakdown = Array.from(departmentMap.entries()).map(([department, count]) => ({
      department,
      count
    }));
    
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
      .filter(att => att.checkInTime || att.checkOutTime)
      .flatMap(att => {
        const user = this.users.get(att.userId);
        if (!user) return [];
        
        const activities = [];
        
        if (att.checkInTime) {
          activities.push({
            id: att.id,
            userId: att.userId,
            userName: `${user.firstName} ${user.lastName}`,
            time: new Date(att.checkInTime).toLocaleTimeString(),
            type: 'Check In',
            status: att.status
          });
        }
        
        if (att.checkOutTime) {
          activities.push({
            id: att.id,
            userId: att.userId,
            userName: `${user.firstName} ${user.lastName}`,
            time: new Date(att.checkOutTime).toLocaleTimeString(),
            type: 'Check Out',
            status: att.status
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
      recentActivity
    };
  }
}

// Database Storage implementation
export class DatabaseStorage implements IStorage {
  // User/Employee Methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Convert join date if needed
    let userData = insertUser;
    if (insertUser.joinDate && insertUser.joinDate instanceof Date) {
      userData = {
        ...insertUser,
        joinDate: insertUser.joinDate.toISOString().split('T')[0]
      };
    }
    
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true));
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const [user] = await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, id))
      .returning();
    return !!user;
  }

  async searchUsers(query: string, department?: string): Promise<User[]> {
    let conditions = and(
      eq(users.isActive, true),
      or(
        like(users.firstName, `%${query}%`),
        like(users.lastName, `%${query}%`),
        like(users.email, `%${query}%`),
        like(users.employeeId, `%${query}%`)
      )
    );
    
    if (department) {
      conditions = and(conditions, eq(users.department, department));
    }
    
    return await db.select().from(users).where(conditions);
  }

  // Attendance Methods
  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(attendanceData).returning();
    return newAttendance;
  }

  async getAttendance(id: number): Promise<Attendance | undefined> {
    const [att] = await db.select().from(attendance).where(eq(attendance.id, id));
    return att;
  }

  async getUserAttendance(userId: number): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.userId, userId))
      .orderBy(desc(attendance.date));
  }

  async getUserAttendanceByDate(userId: number, date: Date): Promise<Attendance | undefined> {
    const dateString = date.toISOString().split('T')[0];
    const [att] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          eq(attendance.date, dateString)
        )
      );
    
    return att;
  }

  async getUserAttendanceByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Attendance[]> {
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];
    
    return await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          gte(attendance.date, startDateString),
          lte(attendance.date, endDateString)
        )
      )
      .orderBy(desc(attendance.date));
  }

  async updateAttendance(id: number, attendanceData: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const [updatedAttendance] = await db
      .update(attendance)
      .set(attendanceData)
      .where(eq(attendance.id, id))
      .returning();
      
    return updatedAttendance;
  }

  async getTodayAttendance(): Promise<(Attendance & { user: User })[]> {
    const today = new Date().toISOString().split('T')[0];
    
    return await db
      .select({
        id: attendance.id,
        userId: attendance.userId,
        date: attendance.date,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        status: attendance.status,
        checkInMethod: attendance.checkInMethod,
        checkOutMethod: attendance.checkOutMethod,
        notes: attendance.notes,
        user: users
      })
      .from(attendance)
      .innerJoin(users, eq(attendance.userId, users.id))
      .where(eq(attendance.date, today));
  }

  // Leave Request Methods
  async createLeaveRequest(leaveRequestData: InsertLeaveRequest): Promise<LeaveRequest> {
    try {
      // Format the startDate and endDate as needed
      const result = await db.transaction(async (tx) => {
        // Insert with only the values defined in the schema
        const [newLeaveRequest] = await tx
          .insert(leaveRequests)
          .values({
            userId: leaveRequestData.userId,
            startDate: leaveRequestData.startDate,
            endDate: leaveRequestData.endDate,
            type: leaveRequestData.type,
            reason: leaveRequestData.reason || null,
            // Let the database handle the default values:
            // status defaults to 'pending'
            // requestDate defaults to NOW()
          })
          .returning();
          
        return newLeaveRequest;
      });
      
      return result;
    } catch (error) {
      console.error("Error creating leave request:", error);
      throw error;
    }
  }

  async getLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    const [request] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id));
      
    return request;
  }

  async getUserLeaveRequests(userId: number): Promise<LeaveRequest[]> {
    return await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.userId, userId))
      .orderBy(desc(leaveRequests.requestDate));
  }

  async updateLeaveRequest(id: number, leaveRequestData: Partial<LeaveRequest>): Promise<LeaveRequest | undefined> {
    const [updatedRequest] = await db
      .update(leaveRequests)
      .set(leaveRequestData)
      .where(eq(leaveRequests.id, id))
      .returning();
      
    return updatedRequest;
  }

  async getPendingLeaveRequests(): Promise<(LeaveRequest & { user: User })[]> {
    return await db
      .select({
        id: leaveRequests.id,
        userId: leaveRequests.userId,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        type: leaveRequests.type,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        approvedById: leaveRequests.approvedById,
        requestDate: leaveRequests.requestDate,
        responseDate: leaveRequests.responseDate,
        responseNotes: leaveRequests.responseNotes,
        user: users
      })
      .from(leaveRequests)
      .innerJoin(users, eq(leaveRequests.userId, users.id))
      .where(eq(leaveRequests.status, 'pending'))
      .orderBy(desc(leaveRequests.requestDate));
  }

  async respondToLeaveRequest(id: number, status: 'approved' | 'rejected', approvedById: number, notes?: string): Promise<LeaveRequest | undefined> {
    // Let the database handle the date
    const [updatedRequest] = await db
      .update(leaveRequests)
      .set({
        status,
        approvedById,
        responseDate: new Date(), // Let Drizzle handle the date conversion
        responseNotes: notes || null
      })
      .where(eq(leaveRequests.id, id))
      .returning();
      
    return updatedRequest;
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
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's attendance with user information
    const todayAttendance = await db
      .select({
        id: attendance.id,
        userId: attendance.userId,
        date: attendance.date,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        status: attendance.status,
        checkInMethod: attendance.checkInMethod,
        checkOutMethod: attendance.checkOutMethod,
        notes: attendance.notes,
        firstName: users.firstName,
        lastName: users.lastName,
        department: users.department
      })
      .from(attendance)
      .innerJoin(users, eq(attendance.userId, users.id))
      .where(eq(attendance.date, today));
    
    // Count on-time vs late
    const onTime = todayAttendance.filter(att => att.status === 'present').length;
    const late = todayAttendance.filter(att => att.status === 'late').length;
    
    // Departmental breakdown
    const departmentMap = new Map<string, number>();
    for (const att of todayAttendance) {
      if (att.department) {
        const dept = att.department;
        departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1);
      }
    }
    
    const departmentalBreakdown = Array.from(departmentMap.entries()).map(([department, count]) => ({
      department,
      count
    }));
    
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
    
    // Recent activity - we'll create an array of check-in and check-out activities
    const activities = [];
    for (const att of todayAttendance) {
      if (att.checkInTime) {
        activities.push({
          id: att.id,
          userId: att.userId,
          userName: `${att.firstName} ${att.lastName}`,
          time: new Date(att.checkInTime).toLocaleTimeString(),
          type: 'Check In',
          status: att.status
        });
      }
      
      if (att.checkOutTime) {
        activities.push({
          id: att.id,
          userId: att.userId,
          userName: `${att.firstName} ${att.lastName}`,
          time: new Date(att.checkOutTime).toLocaleTimeString(),
          type: 'Check Out',
          status: att.status
        });
      }
    }
    
    // Sort by time (newest first) and take only the most recent 5
    const recentActivity = activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
    
    return {
      totalAttendanceToday: todayAttendance.length,
      onTime,
      late,
      departmentalBreakdown,
      attendanceByHour,
      recentActivity
    };
  }
}

// Import the db instance
import { db } from "./db";

// Create a database storage instance
// Using MemStorage instead of DatabaseStorage for now to troubleshoot employee data persistence
export const storage = new MemStorage();
