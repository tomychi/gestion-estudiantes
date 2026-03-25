import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardStats from "@/components/admin/DashboardStats";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/supabase-admin";

export const metadata: Metadata = {
  title: "Dashboard - Sistema Alas",
  description: "Panel de administración",
};

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const supabase = createAdminClient();

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

  const totalRevenue =
    approvedPayments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const pendingAmount =
    pendingPayments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const totalBalance =
    students?.reduce((s, u) => s + Number(u.balance), 0) ?? 0;
  const totalExpected =
    students?.reduce((s, u) => s + Number(u.totalAmount), 0) ?? 0;
  const approvedCount =
    allPayments?.filter((p) => p.status === "APPROVED").length ?? 0;
  const rejectedCount =
    allPayments?.filter((p) => p.status === "REJECTED").length ?? 0;
  const totalReviewed = approvedCount + rejectedCount;
  const approvalRate =
    totalReviewed > 0
      ? Number(((approvedCount / totalReviewed) * 100).toFixed(1))
      : 0;

  const stats = {
    totalStudents: totalStudents ?? 0,
    totalSchools: totalSchools ?? 0,
    totalProducts: totalProducts ?? 0,
    pendingPayments: pendingPaymentsCount ?? 0,
    totalRevenue,
    pendingAmount,
    totalBalance,
    totalExpected,
    approvalRate,
    approvedCount,
    rejectedCount,
  };

  return (
    <AdminLayout session={session}>
      <style>{`
        .adm-page { display: flex; flex-direction: column; gap: 1.5rem; }
        .adm-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .adm-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(1.375rem, 3vw, 1.875rem);
          font-weight: 800;
          color: #18181b;
          letter-spacing: -0.02em;
        }
        .adm-sub { font-size: 0.875rem; color: #a1a1aa; margin-top: 0.2rem; }
        .adm-quick-actions { display: flex; gap: 0.625rem; flex-wrap: wrap; }
        .btn-adm-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.125rem;
          border-radius: 9999px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 700;
          background: linear-gradient(135deg, #00618e 0%, #0089c6 100%);
          color: white;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(0,97,142,0.3);
          transition: transform 0.15s, box-shadow 0.15s;
          white-space: nowrap;
        }
        .btn-adm-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0,97,142,0.38);
        }
        .btn-adm-warning {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1.125rem;
          border-radius: 9999px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 700;
          background: rgba(161,98,7,0.10);
          color: #a16207;
          text-decoration: none;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .btn-adm-warning:hover { background: rgba(161,98,7,0.16); }
        .adm-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 1.25rem;
          height: 1.25rem;
          padding: 0 0.3rem;
          border-radius: 9999px;
          font-size: 0.6875rem;
          font-weight: 800;
          background: #a16207;
          color: white;
        }
      `}</style>

      <div className="adm-page">
        <div className="adm-header">
          <div>
            <h1 className="adm-title">Dashboard</h1>
            <p className="adm-sub">Bienvenido, {session.user.firstName}</p>
          </div>
          <div className="adm-quick-actions">
            <Link href="/admin/students/create" className="btn-adm-primary">
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                viewBox="0 0 24 24"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nuevo estudiante
            </Link>
            <Link href="/admin/payments" className="btn-adm-warning">
              {stats.pendingPayments > 0 && (
                <span className="adm-badge">{stats.pendingPayments}</span>
              )}
              Revisar pagos
            </Link>
          </div>
        </div>

        <DashboardStats stats={stats} />
      </div>
    </AdminLayout>
  );
}
