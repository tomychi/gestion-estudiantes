import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardStats from "@/components/admin/DashboardStats";

export const metadata: Metadata = {
  title: "Panel de Administración - Sistema Alas",
  description: "Dashboard administrativo",
};

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Get statistics
  const [
    { count: totalStudents },
    { count: totalSchools },
    { count: totalProducts },
    { count: pendingPayments },
    { data: payments },
    { data: recentStudents },
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
    supabase.from("User").select("amount, status"),
    supabase
      .from("User")
      .select("*, schoolDivision:SchoolDivision(division, school:School(name))")
      .eq("role", "STUDENT")
      .order("createdAt", { ascending: false })
      .limit(5),
  ]);

  // Calculate financial stats
  const totalRevenue =
    payments?.reduce(
      (sum, p) => (p.status === "APPROVED" ? sum + Number(p.amount) : sum),
      0,
    ) || 0;
  const pendingAmount =
    payments?.reduce(
      (sum, p) => (p.status === "PENDING" ? sum + Number(p.amount) : sum),
      0,
    ) || 0;

  const stats = {
    totalStudents: totalStudents || 0,
    totalSchools: totalSchools || 0,
    totalProducts: totalProducts || 0,
    pendingPayments: pendingPayments || 0,
    totalRevenue,
    pendingAmount,
  };

  return (
    <AdminLayout session={session}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {session.user.firstName}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Aquí está el resumen de tu sistema
          </p>
        </div>

        {/* Stats Grid */}
        <DashboardStats stats={stats} />

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Students */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Estudiantes Recientes
              </h2>
              <a
                href="/admin/students"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Ver todos →
              </a>
            </div>
            <div className="space-y-3">
              {recentStudents && recentStudents.length > 0 ? (
                recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold text-sm">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          DNI: {student.dni}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {student.schoolDivision?.school?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.schoolDivision?.division}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No hay estudiantes registrados
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Acciones Rápidas
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/admin/students/create"
                className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors group"
              >
                <svg
                  className="w-8 h-8 text-indigo-600 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-900">
                  Agregar Estudiante
                </span>
              </a>

              <a
                href="/admin/schools"
                className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
              >
                <svg
                  className="w-8 h-8 text-green-600 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-900">
                  Gestionar Colegios
                </span>
              </a>

              <a
                href="/admin/products"
                className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
              >
                <svg
                  className="w-8 h-8 text-purple-600 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-900">
                  Gestionar Productos
                </span>
              </a>

              <a
                href="/admin/payments"
                className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
              >
                <svg
                  className="w-8 h-8 text-orange-600 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-900">
                  Revisar Pagos
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
