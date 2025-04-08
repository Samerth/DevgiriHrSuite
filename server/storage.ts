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
    const user: User = { ...insertUser, id, isActive: true };
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
    const newAttendance: Attendance = { ...attendanceData, id };
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
    const newLeaveRequest: LeaveRequest = { 
      ...leaveRequestData, 
      id, 
      status: 'pending', 
      requestDate: new Date(),
      responseDate: null,
      responseNotes: null,
      approvedById: null
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
    
    const updatedLeaveRequest: LeaveRequest = { 
      ...leaveRequest, 
      status: status,
      approvedById,
      responseDate: new Date(),
      responseNotes: notes || null
    };
    
    this.leaveRequests.set(id, updatedLeaveRequest);
    return updatedLeaveRequest;
  }
}

export const storage = new MemStorage();
