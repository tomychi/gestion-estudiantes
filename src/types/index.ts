export type UserRole = "ADMIN" | "STUDENT";

export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED";

// Database types
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
}
