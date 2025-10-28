// src/app/admin/cash-payment/page.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import AdminLayout from "@/components/admin/AdminLayout";
import CashPaymentForm from "@/components/admin/CashPaymentForm";

export const metadata: Metadata = {
  title: "Registrar Pago en Efectivo - Sistema Alas",
  description: "Registrar pago en efectivo de estudiantes",
};

export default async function CashPaymentPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <AdminLayout session={session}>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            💵 Registrar Pago en Efectivo
          </h1>
          <p className="text-gray-600 mt-2">
            Registrá pagos en efectivo realizados en el local
          </p>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
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
              <p className="font-medium mb-1">¿Cómo funciona?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Ingresá el DNI del estudiante</li>
                <li>Seleccioná las cuotas que está pagando</li>
                <li>Ingresá el monto recibido</li>
                <li>El pago se aprueba automáticamente</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <CashPaymentForm />
      </div>
    </AdminLayout>
  );
}
