import { Metadata } from "next";
import SetupAdminForm from "@/components/setup/SetupAdminForm";
import { checkAdminExists } from "@/app/actions/setup-admin";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Configuración Inicial - Sistema Alas",
  description: "Crear el primer administrador del sistema",
};

export default async function SetupAdminPage() {
  // Check if admin already exists
  const { exists } = await checkAdminExists();

  if (exists) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-purple-50 to-pink-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-white"
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
            <h1 className="text-2xl font-bold text-gray-900">
              Configuración Inicial
            </h1>
            <p className="text-gray-600 mt-2">
              Creá el primer administrador del sistema
            </p>
          </div>

          {/* Alert Info */}
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
            <svg
              className="w-5 h-5 shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm">
              <p className="font-medium mb-1">
                Esta página solo aparece una vez
              </p>
              <p>
                Después de crear el primer administrador, esta página ya no
                estará disponible.
              </p>
            </div>
          </div>

          {/* Form */}
          <SetupAdminForm />

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Al crear el administrador aceptás los términos del sistema</p>
          </div>
        </div>
      </div>
    </div>
  );
}
