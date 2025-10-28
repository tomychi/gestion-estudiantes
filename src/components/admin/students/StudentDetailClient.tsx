// src/components/admin/students/StudentDetailClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string | null;
  phone: string | null;
  size: string | null;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  installments: number;
  notes: string | null;
  createdAt: string;
  schoolDivision: {
    id: string;
    division: string;
    year: number;
    school: {
      id: string;
      name: string;
      address: string | null;
    };
  } | null;
  product: {
    id: string;
    name: string;
    description: string | null;
    currentPrice: number;
  };
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  installmentNumber: number | null;
  receiptUrl: string | null;
  transactionRef: string | null;
  notes: string | null;
  rejectionReason: string | null;
  submittedAt: string;
  paymentDate: string | null;
}

interface InstallmentStatus {
  number: number;
  amount: number;
  paid: boolean;
  paymentDate: string | null;
}

interface Props {
  student: Student;
  payments: Payment[];
  installmentStatus: InstallmentStatus[];
  stats: {
    approved: number;
    pending: number;
    rejected: number;
  };
}

export default function StudentDetailClient({
  student,
  payments,
  installmentStatus,
  stats,
}: Props) {
  const [selectedTab, setSelectedTab] = useState<"info" | "payments">("info");
  const [approvingPayments, setApprovingPayments] = useState<Set<string>>(
    new Set(),
  );
  const [rejectingPayments, setRejectingPayments] = useState<Set<string>>(
    new Set(),
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };

    const labels = {
      PENDING: "Pendiente",
      APPROVED: "Aprobado",
      REJECTED: "Rechazado",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const handleQuickApprove = async (paymentId: string) => {
    if (!confirm("¿Aprobar este pago?")) return;

    setApprovingPayments((prev) => new Set(prev).add(paymentId));

    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Error al aprobar");
        return;
      }

      window.location.reload();
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setApprovingPayments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  const handleQuickReject = async (paymentId: string) => {
    const reason = prompt("Razón del rechazo:");
    if (!reason?.trim()) return;

    setRejectingPayments((prev) => new Set(prev).add(paymentId));

    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT",
          rejectionReason: reason.trim(),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Error al rechazar");
        return;
      }

      window.location.reload();
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setRejectingPayments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-medium">Saldo Pendiente</p>
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg
                className="w-5 h-5 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${student.balance.toLocaleString("es-AR")}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            de ${student.totalAmount.toLocaleString("es-AR")}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-medium">Pagos Aprobados</p>
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.approved}</p>
          <p className="text-xs text-gray-500 mt-1">
            ${student.paidAmount.toLocaleString("es-AR")} pagado
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-medium">
              Pagos Pendientes
            </p>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg
                className="w-5 h-5 text-yellow-600"
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
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-medium">Cuotas Pagadas</p>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg
                className="w-5 h-5 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {installmentStatus.filter((i) => i.paid).length} /{" "}
            {student.installments}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab("info")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === "info"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Información Personal
          </button>
          <button
            onClick={() => setSelectedTab("payments")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              selectedTab === "payments"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Historial de Pagos
            {stats.pending > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                {stats.pending}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === "info" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Datos Personales
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-semibold text-gray-900">
                    {student.firstName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Apellido</p>
                  <p className="font-semibold text-gray-900">
                    {student.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">DNI</p>
                  <p className="font-semibold text-gray-900">{student.dni}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Talle</p>
                  <p className="font-semibold text-gray-900">
                    {student.size || "No especificado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">
                    {student.email || "No especificado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-semibold text-gray-900">
                    {student.phone || "No especificado"}
                  </p>
                </div>
              </div>
            </div>

            {/* School Info */}
            {student.schoolDivision && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Información Académica
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Colegio</p>
                    <p className="font-semibold text-gray-900">
                      {student.schoolDivision.school.name}
                    </p>
                    {student.schoolDivision.school.address && (
                      <p className="text-sm text-gray-500">
                        {student.schoolDivision.school.address}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">División</p>
                      <p className="font-semibold text-gray-900">
                        {student.schoolDivision.division}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Año de Egreso</p>
                      <p className="font-semibold text-gray-900">
                        {student.schoolDivision.year}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {student.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-yellow-900 mb-2">
                  Notas Adicionales
                </h3>
                <p className="text-sm text-yellow-800">{student.notes}</p>
              </div>
            )}
          </div>

          {/* Product & Payment Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Producto
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-semibold text-gray-900">
                    {student.product.name}
                  </p>
                </div>
                {student.product.description && (
                  <div>
                    <p className="text-sm text-gray-600">Descripción</p>
                    <p className="text-sm text-gray-700">
                      {student.product.description}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Precio</p>
                  <p className="font-semibold text-gray-900">
                    ${student.product.currentPrice.toLocaleString("es-AR")}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Plan */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Estado de Cuotas
              </h3>
              <div className="space-y-2">
                {installmentStatus.map((inst) => (
                  <div
                    key={inst.number}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      inst.paid
                        ? "bg-green-50 border border-green-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          inst.paid
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        {inst.paid ? (
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          inst.number
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            inst.paid ? "text-green-900" : "text-gray-900"
                          }`}
                        >
                          Cuota {inst.number}
                        </p>
                        {inst.paid && inst.paymentDate && (
                          <p className="text-xs text-green-600">
                            {new Date(inst.paymentDate).toLocaleDateString(
                              "es-AR",
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <p
                      className={`text-sm font-semibold ${
                        inst.paid ? "text-green-700" : "text-gray-700"
                      }`}
                    >
                      ${inst.amount.toLocaleString("es-AR")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Acciones
              </h3>
              <div className="space-y-3">
                <Link
                  href={`/admin/payments?search=${student.dni}`}
                  className="block w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors text-center"
                >
                  Ver Pagos
                </Link>
                <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors">
                  Editar Datos
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Payments Tab */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cuota
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Notas
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.submittedAt).toLocaleDateString(
                          "es-AR",
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {payment.installmentNumber || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        ${payment.amount.toLocaleString("es-AR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {payment.notes || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {payment.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleQuickApprove(payment.id)}
                              disabled={approvingPayments.has(payment.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Aprobar pago"
                            >
                              {approvingPayments.has(payment.id) ? (
                                <>
                                  <svg
                                    className="animate-spin h-3 w-3"
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
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  <span>Aprobando...</span>
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-3 h-3"
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
                                  <span>Aprobar</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleQuickReject(payment.id)}
                              disabled={rejectingPayments.has(payment.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Rechazar pago"
                            >
                              {rejectingPayments.has(payment.id) ? (
                                <>
                                  <svg
                                    className="animate-spin h-3 w-3"
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
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  <span>Rechazando...</span>
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-3 h-3"
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
                                  <span>Rechazar</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
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
              <p className="text-gray-600 font-medium">
                No hay pagos registrados
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
