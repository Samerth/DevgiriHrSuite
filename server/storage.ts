import { eq, and, desc, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { users, attendance, leaveRequests } from './db/schema';
import type { User, InsertUser, LeaveRequest, InsertLeaveRequest } from '../shared/schema';
import { 
  attendanceStatusEnum, leaveStatusEnum
} from "@shared/schema";
import { between, gte, lte, like, or, isNull, asc } from "drizzle-orm";
import { db } from "./db";
import { type Database } from "drizzle-orm";
import { PgDatabase } from 'drizzle-orm/pg-core';

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

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...userData,
      id,
      isActive: true,
      joinDate: userData.joinDate ? new Date(userData.joinDate) : new Date(),
      role: userData.role || 'employee',
      department: userData.department || null,
      position: userData.position || null,
      phone: userData.phone || null,
      address: userData.address || null,
      employeeId: userData.employeeId || null,
      qrCode: userData.qrCode || null,
      profileImageUrl: userData.profileImageUrl || null
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
    const formattedData = {
      ...attendanceData,
      date: new Date(attendanceData.date),
      checkInTime: attendanceData.checkInTime ? new Date(attendanceData.checkInTime) : null,
      checkOutTime: attendanceData.checkOutTime ? new Date(attendanceData.checkOutTime) : null
    };

    const result = await this.db.insert(attendance).values(formattedData).returning();
    return result[0];
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
    // Ensure date is a valid Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    const dateStr = dateObj.toISOString().split('T')[0];

    const result = await this.db.select()
      .from(attendance)
      .where(eq(attendance.userId, userId));

    return result.find(att => {
      // Handle both Date objects and string dates
      const attDate = att.date instanceof Date ? att.date : new Date(att.date);
      const attDateStr = attDate.toISOString().split('T')[0];
      return attDateStr === dateStr;
    });
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
    const requestDate = new Date();
    const leaveRequest: LeaveRequest = {
      ...leaveRequestData,
      id,
      status: 'pending',
      requestDate,
      responseDate: null,
      responseNotes: null,
      approvedById: null,
      reason: leaveRequestData.reason || null
    };
    this.leaveRequests.set(id, leaveRequest);
    return leaveRequest;
  }

  async getLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    return this.leaveRequests.get(id);
  }

  async getUserLeaveRequests(userId: number): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values())
      .filter(req => req.userId === userId)
      .sort((a, b) => {
        const dateA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
        const dateB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
        return dateB - dateA;
      });
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
      .sort((a, b) => {
        const dateA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
        const dateB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
        return dateB - dateA;
      });
  }

  async respondToLeaveRequest(id: number, status: 'approved' | 'rejected', approvedById: number, notes?: string): Promise<LeaveRequest | undefined> {
    const leaveRequest = this.leaveRequests.get(id);
    if (!leaveRequest) return undefined;

    const responseDate = new Date();
    const updatedLeaveRequest: LeaveRequest = {
      ...leaveRequest,
      status,
      approvedById,
      responseDate,
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
            status: att.status || 'unknown'
          });
        }

        if (att.checkOutTime) {
          activities.push({
            id: att.id,
            userId: att.userId,
            userName: `${user.firstName} ${user.lastName}`,
            time: new Date(att.checkOutTime).toLocaleTimeString(),
            type: 'Check Out',
            status: att.status || 'unknown'
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
  private db: PostgresJsDatabase;

  constructor(db: PostgresJsDatabase) {
    this.db = db;
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
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
        role: userData.role || 'employee',
        qrCode: userData.qrCode || null,
        phone: userData.phone || null,
        position: userData.position || null,
        address: userData.address || null,
        profileImageUrl: userData.profileImageUrl || null,
        employeeId: userData.employeeId || null
      };

      const result = await this.db.insert(users).values(userDataWithDate).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users).where(eq(users.isActive, true));
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await this.db.update(users)
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
      await this.db.update(users)
        .set({ isActive: false })
        .where(eq(users.id, id));

      return true;
    } catch (error) {
      console.error('Error in deleteUser:', error);
      throw error;
    }
  }

  async searchUsers(query: string, department?: string): Promise<User[]> {
    let queryBuilder = this.db.select().from(users).where(eq(users.isActive, true));

    if (query) {
      queryBuilder = queryBuilder.where(
        or(
          like(users.firstName, `%${query}%`),
          like(users.lastName, `%${query}%`),
          like(users.email, `%${query}%`),
          like(users.employeeId, `%${query}%`)
        )
      );
    }

    if (department) {
      queryBuilder = queryBuilder.where(eq(users.department, department));
    }

    return await queryBuilder;
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const formattedData = {
      ...attendanceData,
      date: new Date(attendanceData.date),
      checkInTime: attendanceData.checkInTime ? new Date(attendanceData.checkInTime) : null,
      checkOutTime: attendanceData.checkOutTime ? new Date(attendanceData.checkOutTime) : null
    };

    const result = await this.db.insert(attendance).values(formattedData).returning();
    return result[0];
  }

  async getAttendance(id: number): Promise<Attendance | undefined> {
    const result = await this.db.select().from(attendance).where(eq(attendance.id, id));
    return result[0];
  }

  async getUserAttendance(userId: number): Promise<Attendance[]> {
    return await this.db.select()
      .from(attendance)
      .where(eq(attendance.userId, userId))
      .orderBy(desc(attendance.date));
  }

  async getUserAttendanceByDate(userId: number, date: Date): Promise<Attendance | undefined> {
    // Ensure date is a valid Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    const dateStr = dateObj.toISOString().split('T')[0];

    const result = await this.db.select()
      .from(attendance)
      .where(eq(attendance.userId, userId));

    return result.find(att => {
      // Handle both Date objects and string dates
      const attDate = att.date instanceof Date ? att.date : new Date(att.date);
      const attDateStr = attDate.toISOString().split('T')[0];
      return attDateStr === dateStr;
    });
  }

  async getUserAttendanceByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Attendance[]> {
    return await this.db.select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          between(attendance.date, startDate, endDate)
        )
      )
      .orderBy(desc(attendance.date));
  }

  async updateAttendance(id: number, attendanceData: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    // Ensure date is properly formatted if it exists
    const formattedData = attendanceData.date 
      ? {
          ...attendanceData,
          date: attendanceData.date instanceof Date 
            ? attendanceData.date 
            : new Date(attendanceData.date)
        }
      : attendanceData;

    const result = await this.db.update(attendance)
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

    return await this.db.select({
      ...attendance,
      user: users
    })
    .from(attendance)
    .leftJoin(users, eq(attendance.userId, users.id))
    .where(between(attendance.date, today, tomorrow));
  }

  async createLeaveRequest(leaveRequestData: InsertLeaveRequest): Promise<LeaveRequest> {
    const result = await this.db.insert(leaveRequests)
      .values({
        ...leaveRequestData,
        status: 'pending',
        requestDate: new Date(),
      })
      .returning();
    return result[0];
  }

  async getLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    const result = await this.db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
    return result[0];
  }

  async getUserLeaveRequests(userId: number): Promise<LeaveRequest[]> {
    return await this.db.select()
      .from(leaveRequests)
      .where(eq(leaveRequests.userId, userId))
      .orderBy(desc(leaveRequests.requestDate));
  }

  async updateLeaveRequest(id: number, leaveRequestData: Partial<LeaveRequest>): Promise<LeaveRequest | undefined> {
    const result = await this.db.update(leaveRequests)
      .set(leaveRequestData)
      .where(eq(leaveRequests.id, id))
      .returning();
    return result[0];
  }

  async getPendingLeaveRequests(): Promise<(LeaveRequest & { user: User })[]> {
    return await this.db.select({
      ...leaveRequests,
      user: users
    })
    .from(leaveRequests)
    .leftJoin(users, eq(leaveRequests.userId, users.id))
    .where(eq(leaveRequests.status, 'pending'))
    .orderBy(desc(leaveRequests.requestDate));
  }

  async respondToLeaveRequest(id: number, status: 'approved' | 'rejected', approvedById: number, notes?: string): Promise<LeaveRequest | undefined> {
    const result = await this.db.update(leaveRequests)
      .set({
        status,
        approvedById,
        responseDate: new Date(),
        responseNotes: notes
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
    const todayAttendance = await this.db.select()
      .from(attendance)
      .where(between(attendance.date, today, tomorrow));

    // Get all users for reference
    const allUsers = await this.db.select().from(users);

    // Calculate statistics
    const totalAttendanceToday = todayAttendance.length;
    const onTime = todayAttendance.filter(a => a.status === 'present').length;
    const late = todayAttendance.filter(a => a.status === 'late').length;

    // Calculate departmental breakdown
    const departmentalBreakdown = allUsers.reduce((acc, user) => {
      if (user.department) {
        acc[user.department] = (acc[user.department] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Format departmental breakdown
    const formattedDepartmentalBreakdown = Object.entries(departmentalBreakdown)
      .map(([department, count]) => ({ department, count }));

    // Calculate attendance by hour
    const attendanceByHour = todayAttendance.reduce((acc, att) => {
      const hour = new Date(att.checkInTime).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Format attendance by hour
    const formattedAttendanceByHour = Object.entries(attendanceByHour)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }));

    // Get recent activity
    const recentActivity = todayAttendance
      .map(att => {
        const user = allUsers.find(u => u.id === att.userId);
        return {
          id: att.id,
          userId: att.userId,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          time: att.checkInTime.toISOString(),
          type: 'check-in',
          status: att.status
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
      recentActivity
    };
  }

  async permanentlyDeleteInactiveUsers(): Promise<number> {
    try {
      // Delete all inactive users from the database
      const result = await this.db.delete(users)
        .where(eq(users.isActive, false));

      return result.rowCount || 0;
    } catch (error) {
      console.error('Error in permanentlyDeleteInactiveUsers:', error);
      throw error;
    }
  }

  async permanentlyDeleteUser(userId: number): Promise<boolean> {
    try {
      // First delete all attendance records for this user
      await this.db.delete(attendance)
        .where(eq(attendance.userId, userId));

      // Then delete the user
      const result = await this.db.delete(users)
        .where(eq(users.id, userId))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error in permanentlyDeleteUser:', error);
      throw error;
    }
  }
}

// Create a database storage instance
export const storage = new DatabaseStorage(db);