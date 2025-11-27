import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import AdminLayout from "@/components/admin/AdminLayout";
import StudentsList from "@/components/admin/students/StudentsList";
import { createAdminClient } from "@/lib/supabase/supabase-admin";

export const metadata: Metadata = {
  title: "Estudiantes - Sistema Alas",
  description: "Gestión de estudiantes",
};

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const supabase = createAdminClient();

  // Get students with relations
  const { data: students } = await supabase
    .from("User")
    .select(
      `
      *,
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
    `,
    )
    .eq("role", "STUDENT")
    .order("createdAt", { ascending: false });

  // Get schools for filter
  const { data: schools } = await supabase
    .from("School")
    .select("id, name")
    .order("name", { ascending: true });

  // Get products for filter
  const { data: products } = await supabase
    .from("Product")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <AdminLayout session={session}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Estudiantes</h1>
            <p className="text-gray-600 mt-1">
              Gestioná los estudiantes y sus pagos
            </p>
          </div>
        </div>

        {/* Students List */}
        <StudentsList
          students={students || []}
          schools={schools || []}
          products={products || []}
        />
      </div>
    </AdminLayout>
  );
}
