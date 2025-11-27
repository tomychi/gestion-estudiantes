import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import AdminLayout from "@/components/admin/AdminLayout";
import PaymentsList from "@/components/admin/payments/PaymentsList";
import { createAdminClient } from "@/lib/supabase/supabase-admin";

export const metadata: Metadata = {
  title: "Gestión de Pagos - Sistema Alas",
  description: "Administrar pagos de estudiantes",
};

export default async function AdminPaymentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const supabase = createAdminClient();

  // Get all payments with user info
  const { data: payments } = await supabase
    .from("Payment")
    .select(
      `
      *,
      user:User(
        id,
        firstName,
        lastName,
        dni,
        email,
        totalAmount,
        paidAmount,
        balance,
        installments,
        schoolDivision:SchoolDivision(
          id,
          division,
          year,
          school:School(
            id,
            name
          )
        ),
        product:Product(
          id,
          name
        )
      )
    `,
    )
    .order("submittedAt", { ascending: false });

  // Get schools for filter
  const { data: schools } = await supabase
    .from("School")
    .select("id, name")
    .order("name", { ascending: true });

  // Calculate counts
  const pendingCount =
    payments?.filter((p) => p.status === "PENDING").length || 0;
  const approvedCount =
    payments?.filter((p) => p.status === "APPROVED").length || 0;
  const rejectedCount =
    payments?.filter((p) => p.status === "REJECTED").length || 0;

  return (
    <AdminLayout session={session}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Pagos</h1>
          <p className="text-gray-600 mt-1">
            Revisá y aprobá los comprobantes de pago de los estudiantes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">
                Pagos Pendientes
              </p>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">
                Pagos Aprobados
              </p>
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{approvedCount}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">
                Pagos Rechazados
              </p>
              <div className="p-2 bg-red-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{rejectedCount}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">Total Pagos</p>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-indigo-600"
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
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {payments?.length || 0}
            </p>
          </div>
        </div>

        {/* Payments List */}
        <PaymentsList
          initialPayments={payments || []}
          schools={schools || []}
          adminId={session.user.id}
        />
      </div>
    </AdminLayout>
  );
}
