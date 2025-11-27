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

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const { id: schoolId } = await params;

  const supabase = createAdminClient();

  // Get school info
  const { data: school } = await supabase
    .from("School")
    .select("id, name, address")
    .eq("id", schoolId)
    .single();

  if (!school) {
    redirect("/admin/schools");
  }

  // Get divisions with student count
  const { data: divisions } = await supabase
    .from("SchoolDivision")
    .select("id, division, year, createdAt")
    .eq("schoolId", schoolId)
    .order("year", { ascending: false })
    .order("division", { ascending: true });

  // Get student count for each division
  const divisionsWithStats = await Promise.all(
    (divisions || []).map(async (division) => {
      const { count: studentCount } = await supabase
        .from("User")
        .select("*", { count: "exact", head: true })
        .eq("schoolDivisionId", division.id)
        .eq("role", "STUDENT");

      return {
        ...division,
        studentCount: studentCount || 0,
      };
    }),
  );

  // Group by year
  const divisionsByYear = divisionsWithStats.reduce(
    (acc, division) => {
      if (!acc[division.year]) {
        acc[division.year] = [];
      }
      acc[division.year].push(division);
      return acc;
    },
    {} as Record<number, typeof divisionsWithStats>,
  );

  const years = Object.keys(divisionsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <AdminLayout session={session}>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin/schools"
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
            <h1 className="text-3xl font-bold text-gray-900">{school.name}</h1>
            {school.address && (
              <p className="text-gray-600 mt-1 flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {school.address}
              </p>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-100">Total Estudiantes</p>
              <svg
                className="w-8 h-8 opacity-80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <p className="text-4xl font-bold">
              {divisionsWithStats.reduce((sum, d) => sum + d.studentCount, 0)}
            </p>
          </div>

          <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-purple-100">Total Divisiones</p>
              <svg
                className="w-8 h-8 opacity-80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <p className="text-4xl font-bold">{divisionsWithStats.length}</p>
          </div>

          <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-100">Años Activos</p>
              <svg
                className="w-8 h-8 opacity-80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-4xl font-bold">{years.length}</p>
          </div>
        </div>

        {/* Divisions by Year */}
        {years.length > 0 ? (
          <div className="space-y-6">
            {years.map((year) => (
              <div key={year}>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Promoción {year}
                  <span className="text-sm font-normal text-gray-500">
                    ({divisionsByYear[year].length} división
                    {divisionsByYear[year].length !== 1 ? "es" : ""})
                  </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {divisionsByYear[year].map((division) => (
                    <Link
                      key={division.id}
                      href={`/admin/students?division=${division.id}`}
                      className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all overflow-hidden"
                    >
                      <div className="p-6">
                        {/* Division Name */}
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {division.division}
                          </h3>
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>

                        {/* Student Count */}
                        <div className="bg-indigo-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-1">
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
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                              />
                            </svg>
                            <span className="text-sm font-medium text-indigo-900">
                              Estudiantes
                            </span>
                          </div>
                          <p className="text-3xl font-bold text-indigo-700">
                            {division.studentCount}
                          </p>
                        </div>

                        {/* Click indicator */}
                        <div className="mt-4 text-center text-sm text-gray-500 group-hover:text-indigo-600 transition-colors">
                          Click para ver estudiantes →
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay divisiones registradas
            </h3>
            <p className="text-gray-600 mb-6">
              Las divisiones se crean automáticamente al importar o agregar
              estudiantes
            </p>
            <Link
              href="/admin/students/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
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
              Agregar Primer Estudiante
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
