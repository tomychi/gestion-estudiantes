import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import AdminLayout from "@/components/admin/AdminLayout";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/supabase-admin";

export const metadata: Metadata = {
  title: "Divisiones - Sistema Alas",
  description: "Ver divisiones del colegio",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SchoolDivisionsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const { id: schoolId } = await params;
  const supabase = createAdminClient();

  const { data: school } = await supabase
    .from("School")
    .select("id, name, address")
    .eq("id", schoolId)
    .single();

  if (!school) redirect("/admin/schools");

  const { data: divisions } = await supabase
    .from("SchoolDivision")
    .select("id, division, year, createdAt")
    .eq("schoolId", schoolId)
    .order("year", { ascending: false })
    .order("division", { ascending: true });

  const divisionsWithStats = await Promise.all(
    (divisions || []).map(async (division) => {
      const { count: studentCount } = await supabase
        .from("User")
        .select("*", { count: "exact", head: true })
        .eq("schoolDivisionId", division.id)
        .eq("role", "STUDENT");
      return { ...division, studentCount: studentCount || 0 };
    }),
  );

  const divisionsByYear = divisionsWithStats.reduce(
    (acc, d) => {
      if (!acc[d.year]) acc[d.year] = [];
      acc[d.year].push(d);
      return acc;
    },
    {} as Record<number, typeof divisionsWithStats>,
  );

  const years = Object.keys(divisionsByYear)
    .map(Number)
    .sort((a, b) => b - a);
  const totalStudents = divisionsWithStats.reduce(
    (s, d) => s + d.studentCount,
    0,
  );

  return (
    <AdminLayout session={session}>
      <style>{`
        .sd-page { display: flex; flex-direction: column; gap: 1.25rem; }

        .sd-header { display: flex; align-items: flex-start; gap: 0.875rem; }
        .sd-back {
          display: inline-flex; align-items: center; justify-content: center;
          width: 2.25rem; height: 2.25rem; border-radius: 0.875rem;
          background: #ffffff; color: #52525b; text-decoration: none; flex-shrink: 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: background 0.12s, transform 0.12s;
          margin-top: 0.2rem;
        }
        .sd-back:hover { background: #f4f4f5; transform: translateX(-2px); }
        .sd-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(1.25rem, 3vw, 1.75rem);
          font-weight: 800; color: #18181b; letter-spacing: -0.02em;
        }
        .sd-address {
          display: flex; align-items: center; gap: 0.375rem;
          font-size: 0.8125rem; color: #a1a1aa; margin-top: 0.2rem;
        }

        .sd-stats {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;
        }
        .sd-stat {
          background: #ffffff; border-radius: 1.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          padding: 1rem 1.125rem;
        }
        .sd-stat__label {
          font-size: 0.75rem; font-weight: 600; color: #a1a1aa;
          text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.375rem;
        }
        .sd-stat__value {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(1.5rem, 4vw, 2rem); font-weight: 800; line-height: 1;
          color: #00618e;
        }

        .sd-year-section { display: flex; flex-direction: column; gap: 0.75rem; }
        .sd-year-label {
          display: flex; align-items: center; gap: 0.5rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 1rem; font-weight: 700; color: #18181b;
        }
        .sd-year-badge {
          font-size: 0.75rem; font-weight: 500; color: #a1a1aa;
          font-family: 'DM Sans', sans-serif;
        }

        .sd-div-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;
        }
        @media (min-width: 640px)  { .sd-div-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .sd-div-grid { grid-template-columns: repeat(4, 1fr); } }

        .sd-div-card {
          background: #ffffff; border-radius: 1.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          padding: 1.125rem; text-decoration: none;
          display: flex; flex-direction: column; gap: 0.75rem;
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .sd-div-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }
        .sd-div-card__top {
          display: flex; align-items: center; justify-content: space-between;
        }
        .sd-div-card__name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 1.375rem; font-weight: 800; color: #18181b;
          transition: color 0.12s;
        }
        .sd-div-card:hover .sd-div-card__name { color: #00618e; }
        .sd-div-card__arrow { color: #a1a1aa; transition: color 0.12s, transform 0.12s; }
        .sd-div-card:hover .sd-div-card__arrow { color: #00618e; transform: translateX(3px); }
        .sd-div-card__stat {
          background: rgba(0,97,142,0.07); border-radius: 0.875rem; padding: 0.625rem 0.75rem;
        }
        .sd-div-card__stat-label {
          font-size: 0.6875rem; font-weight: 700; color: #00618e;
          text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.2rem;
        }
        .sd-div-card__stat-value {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 1.5rem; font-weight: 800; color: #00618e; line-height: 1;
        }
        .sd-div-card__hint {
          font-size: 0.75rem; color: #a1a1aa; text-align: center;
          transition: color 0.12s;
        }
        .sd-div-card:hover .sd-div-card__hint { color: #00618e; }

        .sd-empty {
          background: #ffffff; border-radius: 1.75rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          padding: 3rem 1.5rem; text-align: center;
        }
        .sd-empty__icon { width: 3.5rem; height: 3.5rem; margin: 0 auto 1rem; color: #a1a1aa; }
        .sd-empty__title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 1.0625rem; font-weight: 700; color: #18181b; margin-bottom: 0.375rem;
        }
        .sd-empty__sub { font-size: 0.875rem; color: #a1a1aa; margin-bottom: 1.5rem; }
        .sd-empty__btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.625rem 1.125rem; border-radius: 9999px;
          font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.875rem; font-weight: 700;
          background: linear-gradient(135deg, #00618e 0%, #0089c6 100%);
          color: white; text-decoration: none;
          box-shadow: 0 4px 12px rgba(0,97,142,0.3);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .sd-empty__btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,97,142,0.38); }
      `}</style>

      <div className="sd-page">
        {/* Header */}
        <div className="sd-header">
          <Link href="/admin/schools" className="sd-back" aria-label="Volver">
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
            <h1 className="sd-title">{school.name}</h1>
            {school.address && (
              <p className="sd-address">
                <svg
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {school.address}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="sd-stats">
          <div className="sd-stat">
            <p className="sd-stat__label">Estudiantes</p>
            <p className="sd-stat__value">{totalStudents}</p>
          </div>
          <div className="sd-stat">
            <p className="sd-stat__label">Divisiones</p>
            <p className="sd-stat__value">{divisionsWithStats.length}</p>
          </div>
          <div className="sd-stat">
            <p className="sd-stat__label">Años</p>
            <p className="sd-stat__value">{years.length}</p>
          </div>
        </div>

        {/* Divisions by year */}
        {years.length > 0 ? (
          years.map((year) => (
            <div key={year} className="sd-year-section">
              <div className="sd-year-label">
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Promoción {year}
                <span className="sd-year-badge">
                  · {divisionsByYear[year].length} división
                  {divisionsByYear[year].length !== 1 ? "es" : ""}
                </span>
              </div>

              <div className="sd-div-grid">
                {divisionsByYear[year].map((division) => (
                  <Link
                    key={division.id}
                    href={`/admin/students?division=${division.id}`}
                    className="sd-div-card"
                  >
                    <div className="sd-div-card__top">
                      <span className="sd-div-card__name">
                        {division.division}
                      </span>
                      <svg
                        className="sd-div-card__arrow"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                    <div className="sd-div-card__stat">
                      <p className="sd-div-card__stat-label">Estudiantes</p>
                      <p className="sd-div-card__stat-value">
                        {division.studentCount}
                      </p>
                    </div>
                    <p className="sd-div-card__hint">Ver estudiantes →</p>
                  </Link>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="sd-empty">
            <svg
              className="sd-empty__icon"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="sd-empty__title">No hay divisiones registradas</p>
            <p className="sd-empty__sub">
              Las divisiones se crean automáticamente al agregar estudiantes
            </p>
            <Link href="/admin/students/create" className="sd-empty__btn">
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
              Agregar primer estudiante
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
