import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import AdminLayout from "@/components/admin/AdminLayout";
import CreateStudentForm from "@/components/admin/students/CreateStudentForm";

export const metadata: Metadata = {
  title: "Crear Estudiante - Sistema Alas",
  description: "Crear un nuevo estudiante",
};

export default async function CreateStudentPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  // Get schools, products, and divisions for the form
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <a
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
          </a>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Crear Estudiante
            </h1>
            <p className="text-gray-600 mt-1">
              Agregá un nuevo estudiante al sistema
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
              <p className="font-medium mb-1">Información importante</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>
                  Podés crear un colegio y división nuevos si no existen en el
                  sistema
                </li>
                <li>
                  La contraseña inicial del estudiante será su DNI (podrán
                  cambiarla)
                </li>
                <li>Todos los campos marcados con * son obligatorios</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <CreateStudentForm
          schools={schools || []}
          products={products || []}
          adminId={session.user.id}
        />
      </div>
    </AdminLayout>
  );
}
