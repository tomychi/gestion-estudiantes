// ─── app/admin/payments/page.tsx ─────────────────────────────────────────────

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
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const supabase = createAdminClient();

  const { data: payments } = await supabase
    .from("Payment")
    .select(
      `
      *,
      user:User(
        id, firstName, lastName, dni, email,
        totalAmount, paidAmount, balance, installments,
        schoolDivision:SchoolDivision(
          id, division, year,
          school:School(id, name)
        ),
        product:Product(id, name)
      )
    `,
    )
    .order("submittedAt", { ascending: false });

  const { data: schools } = await supabase
    .from("School")
    .select("id, name")
    .order("name", { ascending: true });

  const pendingCount =
    payments?.filter((p) => p.status === "PENDING").length ?? 0;
  const approvedCount =
    payments?.filter((p) => p.status === "APPROVED").length ?? 0;
  const rejectedCount =
    payments?.filter((p) => p.status === "REJECTED").length ?? 0;
  const totalCount = payments?.length ?? 0;

  return (
    <AdminLayout session={session}>
      <PaymentsList
        initialPayments={payments || []}
        schools={schools || []}
        adminId={session.user.id}
        counts={{
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          total: totalCount,
        }}
      />
    </AdminLayout>
  );
}
