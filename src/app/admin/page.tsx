// src/app/admin/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardStats from "@/components/admin/DashboardStats";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard - Sistema Alas",
  description: "Panel de administración",
};

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Get all stats in parallel
  const [
    { count: totalStudents },
    { count: totalSchools },
    { count: totalProducts },
    { count: pendingPaymentsCount },
    { data: approvedPayments },
    { data: pendingPayments },
    { data: allPayments },
    { data: students },
  ] = await Promise.all([
    supabase
      .from("User")
      .select("*", { count: "exact", head: true })
      .eq("role", "STUDENT"),
    supabase.from("School").select("*", { count: "exact", head: true }),
    supabase.from("Product").select("*", { count: "exact", head: true }),
    supabase
      .from("Payment")
      .select("*", { count: "exact", head: true })
      .eq("status", "PENDING"),
    supabase.from("Payment").select("amount").eq("status", "APPROVED"),
    supabase.from("Payment").select("amount").eq("status", "PENDING"),
    supabase.from("Payment").select("status"),
    supabase.from("User").select("balance, totalAmount").eq("role", "STUDENT"),
  ]);

  // Calculate stats
  const totalRevenue =
    approvedPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const pendingAmount =
    pendingPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalBalance =
    students?.reduce((sum, s) => sum + Number(s.balance), 0) || 0;
  const totalExpected =
    students?.reduce((sum, s) => sum + Number(s.totalAmount), 0) || 0;

  // Approval rate
  const approvedCount =
    allPayments?.filter((p) => p.status === "APPROVED").length || 0;
  const rejectedCount =
    allPayments?.filter((p) => p.status === "REJECTED").length || 0;
  const totalReviewed = approvedCount + rejectedCount;
  const approvalRate =
    totalReviewed > 0 ? ((approvedCount / totalReviewed) * 100).toFixed(1) : 0;

  const stats = {
    totalStudents: totalStudents || 0,
    totalSchools: totalSchools || 0,
    totalProducts: totalProducts || 0,
    pendingPayments: pendingPaymentsCount || 0,
    totalRevenue,
    pendingAmount,
    totalBalance,
    totalExpected,
    approvalRate: Number(approvalRate),
    approvedCount,
    rejectedCount,
  };

  return (
    <AdminLayout session={session}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Bienvenido, {session.user.firstName}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3">
            <Link
              href="/admin/students/create"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nuevo Estudiante
            </Link>
            <Link
              href="/admin/payments"
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors"
            >
              {stats.pendingPayments > 0 && (
                <span className="px-2 py-0.5 bg-white text-yellow-600 rounded-full text-xs font-bold">
                  {stats.pendingPayments}
                </span>
              )}
              Revisar Pagos
            </Link>
          </div>
        </div>

        {/* Stats */}
        <DashboardStats stats={stats} />
      </div>
    </AdminLayout>
  );
}
