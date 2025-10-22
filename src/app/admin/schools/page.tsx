import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import AdminLayout from "@/components/admin/AdminLayout";
import SchoolsList from "@/components/admin/schools/SchoolsList";

export const metadata: Metadata = {
  title: "Colegios - Sistema Alas",
  description: "Gestión de colegios",
};

export default async function SchoolsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Get schools with division count
  const { data: schools } = await supabase
    .from("School")
    .select(
      `
      *,
      divisions:SchoolDivision(count)
    `,
    )
    .order("name", { ascending: true });

  // Get total students per school
  const schoolsWithStats = await Promise.all(
    (schools || []).map(async (school) => {
      const { count: studentCount } = await supabase
        .from("User")
        .select("*", { count: "exact", head: true })
        .eq("role", "STUDENT")
        .in(
          "schoolDivisionId",
          await supabase
            .from("SchoolDivision")
            .select("id")
            .eq("schoolId", school.id)
            .then((res) => res.data?.map((d) => d.id) || []),
        );

      return {
        ...school,
        studentCount: studentCount || 0,
        divisionCount: school.divisions[0]?.count || 0,
      };
    }),
  );

  return (
    <AdminLayout session={session}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Colegios</h1>
            <p className="text-gray-600 mt-1">
              Gestioná los colegios del sistema
            </p>
          </div>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">
                Las divisiones se crean automáticamente
              </p>
              <p className="text-blue-700">
                Cuando cargues o importes estudiantes, el sistema creará
                automáticamente las divisiones con el año de egreso
                correspondiente.
              </p>
            </div>
          </div>
        </div>

        {/* Schools List */}
        <SchoolsList schools={schoolsWithStats} />
      </div>
    </AdminLayout>
  );
}
