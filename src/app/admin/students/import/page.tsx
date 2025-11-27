import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import AdminLayout from "@/components/admin/AdminLayout";
import ImportStudentsForm from "@/components/admin/students/ImportStudentsForm";
import { createAdminClient } from "@/lib/supabase/supabase-admin";

export const metadata: Metadata = {
  title: "Importar Estudiantes - Sistema Alas",
  description: "Importar estudiantes desde Excel",
};

export default async function ImportStudentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const supabase = createAdminClient();

  // Get schools and products for validation
  const [{ data: schools }, { data: products }] = await Promise.all([
    supabase.from("School").select("id, name").order("name"),
    supabase.from("Product").select("id, name, currentPrice").order("name"),
  ]);

  return (
    <AdminLayout session={session}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Importar Estudiantes desde Excel
          </h1>
          <p className="text-gray-600 mt-1">
            Subí un archivo Excel con los datos de los estudiantes
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Formato del archivo Excel
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p className="font-medium">
              El archivo debe tener esta estructura:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <strong>Fila 1:</strong> COLEGIO: [Nombre del colegio] (celda
                A1)
              </li>
              <li>
                <strong>Fila 2:</strong> DIVISIÓN: [Ej: 5to A] (celda A2)
              </li>
              <li>
                <strong>Fila 3:</strong> AÑO: [Ej: 2025] (celda A3)
              </li>
              <li>
                <strong>Fila 4:</strong> Dejá vacía
              </li>
              <li>
                <strong>Fila 5:</strong> Encabezados (Nombre, Apellido, DNI)
              </li>
              <li>
                <strong>Fila 6+:</strong> Datos de estudiantes
              </li>
            </ul>
            <p className="mt-3 font-medium">
              ⚠️ Después de subir el Excel podrás configurar el producto,
              precio, cuotas y editar los datos.
            </p>
          </div>
        </div>

        {/* Import Form */}
        <ImportStudentsForm
          schools={schools || []}
          products={products || []}
          adminId={session.user.id}
        />
      </div>
    </AdminLayout>
  );
}
