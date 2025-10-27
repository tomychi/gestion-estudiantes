"use client";

import { useEffect, useState } from "react";
import UploadPaymentModal from "./UploadPaymentModal";
import InstallmentsTable from "./InstallmentsTable";

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
  const [selectedInstallmentsForPayment, setSelectedInstallmentsForPayment] =
    useState<number[]>([]);

  const [isMercadoPagoLoading, setIsMercadoPagoLoading] = useState(false);
  const [paymentNotification, setPaymentNotification] = useState<
    "success" | "failure" | "pending" | null
  >(null);

  // Calculate installment amount
  const installmentAmount = user.totalAmount / user.installments;

  // Handler for installments selection from the table
  const handleInstallmentsSelection = (selectedInstallments: number[]) => {
    setSelectedInstallmentsForPayment(selectedInstallments);
  };

  const handleMercadoPagoPayment = async () => {
    if (selectedInstallmentsForPayment.length === 0) {
      alert("Por favor, seleccioná al menos una cuota para pagar");
      return;
    }

    setIsMercadoPagoLoading(true);

    try {
      const totalAmount =
        selectedInstallmentsForPayment.length * installmentAmount;

      const response = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          installments: selectedInstallmentsForPayment,
          totalAmount: totalAmount,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.error || "Error al crear la preferencia de pago");
        setIsMercadoPagoLoading(false);
        return;
      }

      // Redirect to MercadoPago checkout
      window.location.href = data.sandbox_init_point || data.init_point;
    } catch (error) {
      console.error("Error:", error);
      alert("Error al procesar el pago. Intentá nuevamente.");
      setIsMercadoPagoLoading(false);
    }
  };

  // Detect payment status from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment") as
      | "success"
      | "failure"
      | "pending"
      | null;

    if (paymentStatus) {
      setPaymentNotification(paymentStatus);
      window.history.replaceState({}, "", "/dashboard");

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setPaymentNotification(null);
      }, 5000);
    }
  }, []);

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
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white mb-8">
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

        {/* NEW: Installments Table Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Gestión de Cuotas
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Seleccioná las cuotas que querés pagar
              </p>
            </div>
            <button
              onClick={handleMercadoPagoPayment}
              disabled={
                selectedInstallmentsForPayment.length === 0 ||
                isMercadoPagoLoading
              }
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                selectedInstallmentsForPayment.length > 0 &&
                !isMercadoPagoLoading
                  ? "bg-[#009EE3] text-white hover:bg-[#0084C2] hover:shadow-lg active:scale-95"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isMercadoPagoLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Procesando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  Pagar con Mercado Pago
                </span>
              )}
            </button>
          </div>

          {/* Installments Table Component */}
          <InstallmentsTable
            totalInstallments={user.installments}
            installmentAmount={installmentAmount}
            existingPayments={payments}
            onSelectionChange={handleInstallmentsSelection}
          />
        </div>

        {/* Payments History Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Historial de Pagos
            </h3>
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
                      <p className="font-medium text-gray-900">
                        {payment.installmentNumber
                          ? `Cuota ${payment.installmentNumber}`
                          : "Sin cuota asignada"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(payment.submittedAt).toLocaleDateString(
                          "es-AR",
                        )}
                      </p>
                      {payment.status === "REJECTED" &&
                        payment.rejectionReason && (
                          <p className="text-sm text-red-600 mt-1">
                            Motivo: {payment.rejectionReason}
                          </p>
                        )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${payment.amount.toLocaleString("es-AR")}
                    </p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
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
                className="mx-auto h-12 w-12 text-gray-400"
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay pagos todavía
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Comenzá subiendo tu primer pago
              </p>
            </div>
          )}
          {paymentNotification && (
            <PaymentNotification
              status={paymentNotification}
              onClose={() => setPaymentNotification(null)}
            />
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

function PaymentNotification({
  status,
  onClose,
}: {
  status: "success" | "failure" | "pending";
  onClose: () => void;
}) {
  const config = {
    success: {
      bg: "bg-green-50",
      border: "border-green-500",
      icon: "text-green-600",
      title: "¡Pago Exitoso!",
      message:
        "Tu pago fue aprobado correctamente. Las cuotas se actualizarán en unos momentos.",
    },
    failure: {
      bg: "bg-red-50",
      border: "border-red-500",
      icon: "text-red-600",
      title: "Pago Rechazado",
      message:
        "No pudimos procesar tu pago. Por favor, verificá tus datos e intentá nuevamente.",
    },
    pending: {
      bg: "bg-yellow-50",
      border: "border-yellow-500",
      icon: "text-yellow-600",
      title: "Pago Pendiente",
      message:
        "Tu pago está siendo procesado. Te notificaremos cuando se confirme.",
    },
  };

  const current = config[status];

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${current.bg} border-l-4 ${current.border} p-4 rounded-lg shadow-lg max-w-md animate-slide-in`}
    >
      <div className="flex items-start gap-3">
        <div className={current.icon}>
          {status === "success" && (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {status === "failure" && (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {status === "pending" && (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{current.title}</h3>
          <p className="text-sm text-gray-700 mt-1">{current.message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
