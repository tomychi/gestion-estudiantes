// ─── app/admin/schools/page.tsx ──────────────────────────────────────────────

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import AdminLayout from "@/components/admin/AdminLayout";
import SchoolsList from "@/components/admin/schools/SchoolsList";
import { createAdminClient } from "@/lib/supabase/supabase-admin";

export const metadata: Metadata = {
  title: "Colegios - Sistema Alas",
  description: "Gestión de colegios",
};

export default async function SchoolsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const supabase = createAdminClient();

  const { data: schools } = await supabase
    .from("School")
    .select(`*, divisions:SchoolDivision(count)`)
    .order("name", { ascending: true });

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
      <SchoolsList schools={schoolsWithStats} />
    </AdminLayout>
  );
}
