// ============================================
// ENUMS & CONSTANTS
// ============================================

export type UserRole = "ADMIN" | "STUDENT";
export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED";
export type NotificationStatus = "success" | "failure" | "pending";

// ============================================
// DATABASE MODELS (Base types from Prisma/Supabase)
// ============================================

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string | null;
  phone: string | null;
  size: string | null;
  schoolDivisionId: string | null;
  productId: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  installments: number;
  role: UserRole;
  emailVerified: Date | null;
  image: string | null;
  notes: string | null;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
}

export interface School {
  id: string;
  name: string;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SchoolWithStats extends School {
  studentCount?: number;
  divisionCount?: number;
}

export interface SchoolDivision {
  id: string;
  schoolId: string;
  division: string;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  currentPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithStats extends Product {
  studentCount?: number;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  status: PaymentStatus;
  installmentNumber: number | null;
  receiptUrl: string | null;
  transactionRef: string | null;
  paymentDate: Date | null;
  notes: string | null;
  rejectionReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date | null; // 🆕 NUEVO
  lateFeeAmount?: number; // 🆕 NUEVO
  isOverdue?: boolean;
}

// ============================================
// EXTENDED TYPES (with relations - for API responses & components)
// ============================================

export interface UserWithRelations extends User {
  schoolDivision:
    | (SchoolDivision & {
        school: School;
      })
    | null;
  product: Product;
}

export interface PaymentWithUser extends Payment {
  user: UserWithRelations;
}

export interface SchoolDivisionWithSchool extends SchoolDivision {
  school: School;
}

// ============================================
// SESSION & AUTH TYPES
// ============================================

export interface Session {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    role: UserRole;
  };
}

// ============================================
// UI/COMPONENT SPECIFIC TYPES
// ============================================

export interface InstallmentStatus {
  number: number;
  amount: number;
  paid: boolean;
  paymentDate: string | null;
}

export interface PaymentStats {
  approved: number;
  pending: number;
  rejected: number;
  total?: number;
}

export interface NotificationConfig {
  bg: string;
  border: string;
  icon: string;
  title: string;
  message: string;
}

// ============================================
// FORM DATA TYPES
// ============================================

export interface StudentFormData {
  firstName: string;
  lastName: string;
  dni: string;
  email?: string;
  phone?: string;
  size?: string;
  notes?: string;
  schoolDivisionId?: string;
  productId?: string;
  totalAmount?: number;
  installments?: number;
}

export interface CreateStudentPayload {
  firstName: string;
  lastName: string;
  dni: string;
  email?: string;
  phone?: string;
  size?: string;
  productId: string;
  totalAmount: number;
  installments: number;
  paidAmount?: number;
  notes?: string;

  // School options
  schoolId?: string;
  schoolName?: string;
  schoolAddress?: string;

  // Division options
  divisionId?: string;
  divisionName?: string;
  divisionYear?: number;
}

export interface PaymentFormData {
  installments: number[];
  amount: number;
  receiptNumber?: string;
  notes?: string;
}

export interface CashPaymentFormData {
  studentDni: string;
  installments: number[];
  amount: number;
  receiptNumber?: string | null;
  notes?: string | null;
}

export interface ParsedStudent {
  firstName: string;
  lastName: string;
  dni: string;
  size?: string;
  email?: string;
  phone?: string;
}

export interface ImportData {
  school: string;
  division: string;
  year: number;
  students: ParsedStudent[];
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  page?: number;
  limit?: number;
  total?: number;
}

// ============================================
// FILTER & SEARCH TYPES
// ============================================

export interface StudentFilters {
  searchTerm?: string;
  schoolId?: string;
  productId?: string;
  divisionId?: string;
}

export interface PaymentFilters {
  status?: PaymentStatus | "all";
  schoolId?: string;
  limit?: number;
}

export interface SchoolBasic {
  id: string;
  name: string;
}

export interface ProductBasic {
  id: string;
  name: string;
  currentPrice: number;
}

export interface SchoolFormData {
  id: string;
  name: string;
  address?: string | null;
}

export interface ProductFormData {
  id: string;
  name: string;
  currentPrice?: number;
}

// ============================================
// UTILITY TYPES
// ============================================

// Helper para convertir Date a string (para serialización JSON)
export type Serialized<T> = T extends Date
  ? string
  : T extends object
    ? { [K in keyof T]: Serialized<T[K]> }
    : T;

// User serializado (fechas como strings)
export type SerializedUser = Serialized<User>;
export type SerializedPayment = Serialized<Payment>;
export type SerializedUserWithRelations = Serialized<UserWithRelations>;
export type SerializedPaymentWithUser = Serialized<PaymentWithUser>;
