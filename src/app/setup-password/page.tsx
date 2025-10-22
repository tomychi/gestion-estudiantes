import { Metadata } from "next";
import { Suspense } from "react";
import SetupPasswordForm from "@/components/auth/SetupPasswordForm";

export const metadata: Metadata = {
  title: "Crear Contraseña - Sistema Alas",
  description: "Configurá tu contraseña por primera vez",
};

export default function SetupPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
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
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Primera Vez</h1>
            <p className="text-gray-600 mt-2">
              Creá tu contraseña para ingresar
            </p>
          </div>

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5"
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
              <p className="font-medium mb-1">¿Primera vez en el sistema?</p>
              <p>
                Ingresá tu DNI y creá una contraseña segura para acceder a tu
                cuenta.
              </p>
            </div>
          </div>

          {/* Form */}
          <Suspense fallback={<FormSkeleton />}>
            <SetupPasswordForm />
          </Suspense>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              ← Volver al inicio de sesión
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  );
}
