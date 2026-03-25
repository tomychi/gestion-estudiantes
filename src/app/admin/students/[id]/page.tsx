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
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const { id: studentId } = await params;
  const supabase = createAdminClient();

  const { data: student, error: studentError } = await supabase
    .from("User")
    .select(
      `*, schoolDivision:SchoolDivision(*, school:School(*)), product:Product(*)`,
    )
    .eq("id", studentId)
    .eq("role", "STUDENT")
    .single();

  if (studentError || !student) redirect("/admin/students");

  const { data: payments } = await supabase
    .from("Payment")
    .select("*")
    .eq("userId", studentId)
    .order("submittedAt", { ascending: false });

  const approvedPayments =
    payments?.filter((p) => p.status === "APPROVED") ?? [];
  const pendingPayments = payments?.filter((p) => p.status === "PENDING") ?? [];
  const rejectedPayments =
    payments?.filter((p) => p.status === "REJECTED") ?? [];

  const installmentStatus = Array.from(
    { length: student.installments },
    (_, i) => {
      const num = i + 1;
      const amount = student.totalAmount / student.installments;
      const paymentsForInstallment =
        payments?.filter(
          (p) => p.installmentNumber === num && p.status === "APPROVED",
        ) ?? [];
      const totalPaid = paymentsForInstallment.reduce(
        (s, p) => s + p.amount,
        0,
      );
      const isPaid = totalPaid >= amount;
      const lastPayment = paymentsForInstallment.at(-1) ?? null;
      return {
        number: num,
        amount,
        paid: isPaid,
        amountPaid: totalPaid,
        paymentDate: lastPayment?.paymentDate ?? null,
      };
    },
  );

  return (
    <AdminLayout session={session}>
      <style>{`
        .sdp-back {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #52525b;
          text-decoration: none;
          padding: 0.5rem 0.875rem 0.5rem 0.625rem;
          border-radius: 9999px;
          background: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          transition: background 0.12s, transform 0.12s;
          margin-bottom: 0.25rem;
          width: fit-content;
        }
        .sdp-back:hover { background: #f4f4f5; transform: translateX(-2px); }
      `}</style>

      <Link href="/admin/students" className="sdp-back">
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Volver a estudiantes
      </Link>

      <StudentDetailClient
        student={student}
        payments={payments ?? []}
        installmentStatus={installmentStatus}
        stats={{
          approved: approvedPayments.length,
          pending: pendingPayments.length,
          rejected: rejectedPayments.length,
        }}
      />
    </AdminLayout>
  );
}
