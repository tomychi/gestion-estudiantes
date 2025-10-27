"use client";

import { useState } from "react";
import UploadPaymentModal from "./UploadPaymentModal";

interface Session {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  balance: number;
  totalAmount: number;
  paidAmount: number;
  installments: number;
  size: string | null;
  schoolDivision: {
    division: string;
    year: number;
    school: {
      name: string;
    };
  } | null;
  product: {
    name: string;
    description: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  installmentNumber: number | null;
  submittedAt: string;
  rejectionReason?: string;
}

interface Props {
  session: Session;
  user: User;
  payments: Payment[];
}

export default function DashboardClient({ session, user, payments }: Props) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hola, {session.user.firstName}! 👋
            </h1>
            <p className="text-sm text-gray-600">
              {user.schoolDivision?.school?.name} -{" "}
              {user.schoolDivision?.division}
            </p>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Cerrar Sesión
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance Card con barra de progreso */}
        <div className="bg-linear-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white mb-8">
          <h2 className="text-lg font-medium opacity-90 mb-2">Tu Saldo</h2>
          <div className="flex items-baseline gap-4 mb-6">
            <span className="text-5xl font-bold">
              ${user.balance.toLocaleString("es-AR")}
            </span>
            <span className="text-lg opacity-80">
              de ${user.totalAmount.toLocaleString("es-AR")}
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="mb-6">
            <div className="flex justify-between text-sm opacity-90 mb-2">
              <span>Progreso de pago</span>
              <span>
                {Math.round((user.paidAmount / user.totalAmount) * 100)}%
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(user.paidAmount / user.totalAmount) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
            <div>
              <p className="text-sm opacity-80">Pagado</p>
              <p className="text-xl font-semibold">
                ${user.paidAmount.toLocaleString("es-AR")}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-80">Cuotas</p>
              <p className="text-xl font-semibold">
                {Math.round(
                  (user.paidAmount / user.totalAmount) * user.installments,
                )}{" "}
                / {user.installments}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-80">Estado</p>
              <p className="text-xl font-semibold">
                {user.balance === 0 ? "✅ Completo" : "⏳ Pendiente"}
              </p>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tu Producto
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-8 h-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                {user.product.name}
              </h4>
              <p className="text-sm text-gray-600">
                {user.product.description}
              </p>
              {user.size && (
                <p className="text-sm text-gray-500 mt-1">Talle: {user.size}</p>
              )}
            </div>
          </div>
        </div>

        {/* Payments Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Mis Pagos</h3>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              + Subir Pago
            </button>
          </div>

          {payments && payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        payment.status === "APPROVED"
                          ? "bg-green-100"
                          : payment.status === "REJECTED"
                            ? "bg-red-100"
                            : "bg-yellow-100"
                      }`}
                    >
                      {payment.status === "APPROVED" ? (
                        <svg
                          className="w-6 h-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : payment.status === "REJECTED" ? (
                        <svg
                          className="w-6 h-6 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6 text-yellow-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        ${payment.amount.toLocaleString("es-AR")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.submittedAt).toLocaleDateString(
                          "es-AR",
                        )}
                        {payment.installmentNumber &&
                          ` - Cuota ${payment.installmentNumber}`}
                      </p>
                    </div>
                    {/* mostrar el notes de porque se rechazo el pago*/}
                    <div className="flex-1 border-l border-gray-300 pl-4">
                      {payment.rejectionReason && (
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-red-700 whitespace-nowrap">
                            Razón de rechazo:
                          </h3>
                          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-1 flex-1">
                            {payment.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : payment.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {payment.status === "APPROVED"
                        ? "Aprobado"
                        : payment.status === "REJECTED"
                          ? "Rechazado"
                          : "Pendiente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600 font-medium mb-2">
                Aún no tenés pagos registrados
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Subí tu primer comprobante de pago para comenzar
              </p>
              <button
                onClick={() => setIsUploadModalOpen(true)}
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
                Subir Primer Pago
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Upload Payment Modal */}
      <UploadPaymentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        userId={user.id}
        totalAmount={user.totalAmount}
        paidAmount={user.paidAmount}
        balance={user.balance}
        totalInstallments={user.installments}
        existingPayments={payments}
      />
    </div>
  );
}
