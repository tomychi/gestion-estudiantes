// src/app/admin/students/[id]/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";
import StudentDetailClient from "@/components/admin/students/StudentDetailClient";
import { createAdminClient } from "@/lib/supabase/supabase-admin";

export const metadata: Metadata = {
  title: "Detalle del Estudiante - Sistema Alas",
  description: "Ver información completa del estudiante",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const { id: studentId } = await params;

  const supabase = createAdminClient();

  // Get student data
  const { data: student, error: studentError } = await supabase
    .from("User")
    .select(
      `
      *,
      schoolDivision:SchoolDivision(
        *,
        school:School(*)
      ),
      product:Product(*)
    `,
    )
    .eq("id", studentId)
    .eq("role", "STUDENT")
    .single();

  if (studentError || !student) {
    redirect("/admin/students");
  }

  // Get all payments
  const { data: payments } = await supabase
    .from("Payment")
    .select("*")
    .eq("userId", studentId)
    .order("submittedAt", { ascending: false });

  // Calculate payment stats
  const approvedPayments =
    payments?.filter((p) => p.status === "APPROVED") || [];
  const pendingPayments = payments?.filter((p) => p.status === "PENDING") || [];
  const rejectedPayments =
    payments?.filter((p) => p.status === "REJECTED") || [];

  // Calculate installments status
  const installmentStatus = Array.from(
    { length: student.installments },
    (_, i) => {
      const installmentNum = i + 1;
      const installmentAmount = student.totalAmount / student.installments;

      // Sumar TODOS los pagos aprobados para esta cuota
      const paymentsForInstallment =
        payments?.filter(
          (p) =>
            p.installmentNumber === installmentNum && p.status === "APPROVED",
        ) || [];

      const totalPaidForInstallment = paymentsForInstallment.reduce(
        (sum, p) => sum + p.amount,
        0,
      );

      // La cuota está pagada si el total pagado >= monto de la cuota
      const isPaid = totalPaidForInstallment >= installmentAmount;

      // Obtener fecha del último pago
      const lastPayment =
        paymentsForInstallment.length > 0
          ? paymentsForInstallment[paymentsForInstallment.length - 1]
          : null;

      return {
        number: installmentNum,
        amount: installmentAmount, // Siempre mostrar el monto fijo de la cuota
        paid: isPaid,
        amountPaid: totalPaidForInstallment, // 🆕 Cuánto se pagó realmente
        paymentDate: lastPayment?.paymentDate || null,
      };
    },
  );

  return (
    <AdminLayout session={session}>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/students"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-gray-600 mt-1">
              DNI: {student.dni} • {student.schoolDivision?.school.name} -{" "}
              {student.schoolDivision?.division}
            </p>
          </div>
        </div>

        {/* Client Component with all the details */}
        <StudentDetailClient
          student={student}
          payments={payments || []}
          installmentStatus={installmentStatus}
          stats={{
            approved: approvedPayments.length,
            pending: pendingPayments.length,
            rejected: rejectedPayments.length,
          }}
        />
      </div>
    </AdminLayout>
  );
}
