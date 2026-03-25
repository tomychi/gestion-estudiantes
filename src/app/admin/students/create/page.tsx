import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import AdminLayout from "@/components/admin/AdminLayout";
import CreateStudentForm from "@/components/admin/students/CreateStudentForm";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/supabase-admin";

export const metadata: Metadata = {
  title: "Crear Estudiante - Sistema Alas",
  description: "Crear un nuevo estudiante",
};

export default async function CreateStudentPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const supabase = createAdminClient();

  const [{ data: schools }, { data: products }] = await Promise.all([
    supabase
      .from("School")
      .select("id, name, address")
      .order("name", { ascending: true }),
    supabase
      .from("Product")
      .select("id, name, currentPrice")
      .order("name", { ascending: true }),
  ]);

  return (
    <AdminLayout session={session}>
      <style>{`
        .cs-page {
          max-width: 720px;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .cs-header {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }
        .cs-back {
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.875rem;
          background: #ffffff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #52525b;
          text-decoration: none;
          flex-shrink: 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          transition: background 0.12s, transform 0.12s;
        }
        .cs-back:hover { background: #f4f4f5; transform: translateX(-2px); }
        .cs-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(1.25rem, 3vw, 1.75rem);
          font-weight: 800;
          color: #18181b;
          letter-spacing: -0.02em;
        }
        .cs-sub { font-size: 0.875rem; color: #a1a1aa; margin-top: 0.15rem; }
        .cs-info {
          background: rgba(0,97,142,0.06);
          border: 1px solid rgba(0,97,142,0.14);
          border-radius: 1.25rem;
          padding: 1rem 1.125rem;
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }
        .cs-info__icon {
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 0.5rem;
          background: rgba(0,97,142,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #00618e;
          flex-shrink: 0;
        }
        .cs-info__title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #00618e;
          margin-bottom: 0.375rem;
        }
        .cs-info__list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .cs-info__list li {
          font-size: 0.8125rem;
          color: #004e73;
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          line-height: 1.4;
        }
        .cs-info__list li::before {
          content: '·';
          font-weight: 700;
          color: #00618e;
          flex-shrink: 0;
        }
      `}</style>

      <div className="cs-page">
        {/* Header */}
        <div className="cs-header">
          <Link href="/admin/students" className="cs-back" aria-label="Volver">
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div>
            <h1 className="cs-title">Crear estudiante</h1>
            <p className="cs-sub">Agregá un nuevo estudiante al sistema</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="cs-info">
          <div className="cs-info__icon">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="cs-info__title">Antes de empezar</p>
            <ul className="cs-info__list">
              <li>
                Podés crear un colegio y división nuevos si no existen en el
                sistema
              </li>
              <li>La contraseña inicial del estudiante será su DNI</li>
              <li>Todos los campos marcados con * son obligatorios</li>
            </ul>
          </div>
        </div>

        {/* Form */}
        <CreateStudentForm schools={schools || []} products={products || []} />
      </div>
    </AdminLayout>
  );
}
