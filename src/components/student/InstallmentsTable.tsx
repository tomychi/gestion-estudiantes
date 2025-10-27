"use client";

import { useState, useEffect } from "react";

interface Payment {
  installmentNumber: number | null;
  status: string;
  amount: number;
  submittedAt?: string;
}

interface Props {
  totalInstallments: number;
  installmentAmount: number;
  existingPayments: Payment[];
  onSelectionChange: (selectedInstallments: number[]) => void;
  disabled?: boolean;
}

export default function InstallmentsTable({
  totalInstallments,
  installmentAmount,
  existingPayments,
  onSelectionChange,
  disabled = false,
}: Props) {
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>(
    [],
  );

  // Calculate which installments are paid or pending
  const paidInstallments = new Set(
    existingPayments
      .filter((p) => p.status === "APPROVED" && p.installmentNumber)
      .map((p) => p.installmentNumber as number),
  );

  const pendingInstallments = new Set(
    existingPayments
      .filter((p) => p.status === "PENDING" && p.installmentNumber)
      .map((p) => p.installmentNumber as number),
  );

  // Get payment date for each installment
  const getPaymentDate = (installmentNum: number): string | null => {
    const payment = existingPayments.find(
      (p) => p.installmentNumber === installmentNum && p.status === "APPROVED",
    );
    return payment?.submittedAt
      ? new Date(payment.submittedAt).toLocaleDateString("es-AR")
      : null;
  };

  const handleInstallmentToggle = (installmentNum: number) => {
    if (disabled) return;

    const isPaid = paidInstallments.has(installmentNum);
    const isPending = pendingInstallments.has(installmentNum);

    // Don't allow selection of paid or pending installments
    if (isPaid || isPending) return;

    setSelectedInstallments((prev) => {
      const newSelection = prev.includes(installmentNum)
        ? prev.filter((n) => n !== installmentNum)
        : [...prev, installmentNum].sort((a, b) => a - b);

      // Notify parent component
      onSelectionChange(newSelection);

      return newSelection;
    });
  };

  // Reset selection when disabled changes
  useEffect(() => {
    if (disabled && selectedInstallments.length > 0) {
      setSelectedInstallments([]);
      // Use setTimeout to avoid calling setState during render
      setTimeout(() => {
        onSelectionChange([]);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]); // ✅ Remover onSelectionChange de las dependencias
  const calculateTotal = () => {
    return selectedInstallments.length * installmentAmount;
  };

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Estado de Cuotas
        </h3>
        {selectedInstallments.length > 0 && (
          <div className="text-sm">
            <span className="font-medium text-indigo-600">
              {selectedInstallments.length} cuota(s) seleccionada(s)
            </span>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <input
                  type="checkbox"
                  disabled
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-not-allowed opacity-50"
                />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Cuota
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Monto
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Estado
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Fecha de Pago
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: totalInstallments }, (_, i) => i + 1).map(
              (installmentNum) => {
                const isPaid = paidInstallments.has(installmentNum);
                const isPending = pendingInstallments.has(installmentNum);
                const isSelected =
                  selectedInstallments.includes(installmentNum);
                const isDisabled = isPaid || isPending || disabled;
                const paymentDate = getPaymentDate(installmentNum);

                return (
                  <tr
                    key={installmentNum}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-indigo-50"
                        : isPaid
                          ? "bg-green-50"
                          : isPending
                            ? "bg-yellow-50"
                            : "hover:bg-gray-50"
                    } ${!isDisabled && !isPaid && !isPending ? "cursor-pointer" : ""}`}
                    onClick={() => handleInstallmentToggle(installmentNum)}
                  >
                    {/* Checkbox Column */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={isPaid || isSelected}
                        disabled={isDisabled}
                        onChange={() => handleInstallmentToggle(installmentNum)}
                        onClick={(e) => e.stopPropagation()}
                        className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${
                          isDisabled
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        }`}
                      />
                    </td>

                    {/* Installment Number */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          Cuota {installmentNum}
                        </div>
                        {isPaid && (
                          <span
                            className="ml-2 inline-flex items-center"
                            title="Cuota pagada"
                          >
                            <svg
                              className="w-5 h-5 text-green-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        )}
                        {isPending && (
                          <span
                            className="ml-2 inline-flex items-center"
                            title="Pago en revisión"
                          >
                            <svg
                              className="w-5 h-5 text-yellow-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ${installmentAmount.toLocaleString("es-AR")}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isPaid
                            ? "bg-green-100 text-green-800"
                            : isPending
                              ? "bg-yellow-100 text-yellow-800"
                              : isSelected
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {isPaid
                          ? "Pagada"
                          : isPending
                            ? "En Revisión"
                            : isSelected
                              ? "Seleccionada"
                              : "Pendiente"}
                      </span>
                    </td>

                    {/* Payment Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {paymentDate || "-"}
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: totalInstallments }, (_, i) => i + 1).map(
          (installmentNum) => {
            const isPaid = paidInstallments.has(installmentNum);
            const isPending = pendingInstallments.has(installmentNum);
            const isSelected = selectedInstallments.includes(installmentNum);
            const isDisabled = isPaid || isPending || disabled;
            const paymentDate = getPaymentDate(installmentNum);

            return (
              <div
                key={installmentNum}
                onClick={() => handleInstallmentToggle(installmentNum)}
                className={`border-2 rounded-lg p-4 transition-all ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50"
                    : isPaid
                      ? "border-green-300 bg-green-50"
                      : isPending
                        ? "border-yellow-300 bg-yellow-50"
                        : "border-gray-200 bg-white"
                } ${!isDisabled ? "cursor-pointer active:scale-95" : "cursor-not-allowed opacity-70"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isPaid || isSelected}
                      disabled={isDisabled}
                      onChange={() => handleInstallmentToggle(installmentNum)}
                      onClick={(e) => e.stopPropagation()}
                      className={`h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${
                        isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
                    />
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        Cuota {installmentNum}
                      </div>
                      <div className="text-xl font-bold text-gray-900 mt-1">
                        ${installmentAmount.toLocaleString("es-AR")}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                      isPaid
                        ? "bg-green-100 text-green-800"
                        : isPending
                          ? "bg-yellow-100 text-yellow-800"
                          : isSelected
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {isPaid && (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {isPending && (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {isPaid
                      ? "Pagada"
                      : isPending
                        ? "En Revisión"
                        : isSelected
                          ? "Seleccionada"
                          : "Pendiente"}
                  </span>
                </div>

                {paymentDate && (
                  <div className="text-sm text-gray-600 mt-2 flex items-center gap-1">
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Pagada el {paymentDate}
                  </div>
                )}
              </div>
            );
          },
        )}
      </div>

      {/* Summary Footer */}
      {selectedInstallments.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-lg p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-indigo-900 mb-1">
                Cuotas seleccionadas
              </div>
              <div className="text-xs text-indigo-700">
                {selectedInstallments.join(", ")}
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end">
              <div className="text-sm font-medium text-indigo-900 mb-1">
                Total a pagar
              </div>
              <div className="text-3xl font-bold text-indigo-700">
                ${calculateTotal().toLocaleString("es-AR")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
          <span>Pagada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
          <span>En Revisión</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-100 border-2 border-indigo-500 rounded"></div>
          <span>Seleccionada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
          <span>Pendiente de pago</span>
        </div>
      </div>
    </div>
  );
}
