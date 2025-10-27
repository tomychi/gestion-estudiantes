// src/components/admin/students/RegisterCashPaymentModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  installments: number;
  schoolDivision: {
    division: string;
    year: number;
    school: {
      name: string;
    };
  } | null;
}

interface Payment {
  installmentNumber: number | null;
  status: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
}

export default function RegisterCashPaymentModal({
  isOpen,
  onClose,
  student,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [selectedInstallments, setSelectedInstallments] = useState<number[]>(
    [],
  );
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");

  const [loadingPayments, setLoadingPayments] = useState(false);
  const [existingPaymentsData, setexistingPaymentsData] = useState<Payment[]>(
    [],
  );

  const installmentAmount = student.totalAmount / student.installments;

  // Calculate which installments are already paid or pending
  const paidInstallments = new Set(
    existingPaymentsData
      .filter((p) => p.status === "APPROVED" && p.installmentNumber)
      .map((p) => p.installmentNumber as number),
  );
  const pendingInstallments = new Set(
    existingPaymentsData
      .filter((p) => p.status === "PENDING" && p.installmentNumber)
      .map((p) => p.installmentNumber as number),
  );

  // Load payments when modal opens
  useEffect(() => {
    if (isOpen && student) {
      setLoadingPayments(true);
      fetch(`/api/students/${student.id}/payments`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setexistingPaymentsData(data.payments || []);
          }
        })
        .catch((err) => {
          console.error("Error loading payments:", err);
          setexistingPaymentsData([]);
        })
        .finally(() => setLoadingPayments(false));
    } else {
      // Reset form when closed
      setSelectedInstallments([]);
      setAmount("");
      setNotes("");
      setReceiptNumber("");
      setError("");
      setSuccess(false);
      setexistingPaymentsData([]);
    }
  }, [isOpen, student]);

  // Auto-calculate amount when installments change
  useEffect(() => {
    if (selectedInstallments.length > 0) {
      setAmount((installmentAmount * selectedInstallments.length).toFixed(2));
    } else {
      setAmount("");
    }
  }, [selectedInstallments, installmentAmount]);

  const handleInstallmentToggle = (installmentNum: number) => {
    if (
      paidInstallments.has(installmentNum) ||
      pendingInstallments.has(installmentNum)
    ) {
      return;
    }

    setSelectedInstallments((prev) =>
      prev.includes(installmentNum)
        ? prev.filter((n) => n !== installmentNum)
        : [...prev, installmentNum].sort((a, b) => a - b),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (selectedInstallments.length === 0) {
      setError("Seleccioná al menos una cuota");
      return;
    }

    if (!notes.trim()) {
      setError("Ingresá una nota descriptiva del pago");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Ingresá un monto válido");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/payments/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          installments: selectedInstallments,
          amount: parseFloat(amount),
          notes: notes.trim(),
          receiptNumber: receiptNumber.trim() || undefined,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || "Error al registrar el pago");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        router.refresh();
        onClose();
      }, 2000);
    } catch (err) {
      setError(
        `Error al registrar el pago: ${
          err instanceof Error ? err.message : "Error desconocido"
        }`,
      );
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const availableInstallments = Array.from(
    { length: student.installments },
    (_, i) => i + 1,
  ).filter((n) => !paidInstallments.has(n) && !pendingInstallments.has(n));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                💵 Registrar Pago en Efectivo
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {student.firstName} {student.lastName} - DNI: {student.dni}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg
                className="w-6 h-6"
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
            </button>
          </div>
        </div>
        {loadingPayments && (
          <div className="p-6 text-center">
            <svg
              className="animate-spin h-8 w-8 text-indigo-600 mx-auto"
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
            <p className="text-gray-600 mt-2">
              Cargando información de pagos...
            </p>
          </div>
        )}

        {!loadingPayments && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* todo el contenido del form */}
          </form>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              ¡Pago registrado exitosamente!
            </div>
          )}

          {/* Student Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Estado de Cuenta
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total</p>
                <p className="font-bold text-gray-900">
                  ${student.totalAmount.toLocaleString("es-AR")}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Pagado</p>
                <p className="font-bold text-green-600">
                  ${student.paidAmount.toLocaleString("es-AR")}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Saldo</p>
                <p className="font-bold text-orange-600">
                  ${student.balance.toLocaleString("es-AR")}
                </p>
              </div>
            </div>
          </div>

          {/* Installments Selection */}
          {availableInstallments.length > 0 ? (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Seleccioná las cuotas pagadas
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.from(
                    { length: student.installments },
                    (_, i) => i + 1,
                  ).map((installmentNum) => {
                    const isPaid = paidInstallments.has(installmentNum);
                    const isPending = pendingInstallments.has(installmentNum);
                    const isSelected =
                      selectedInstallments.includes(installmentNum);
                    const isDisabled = isPaid || isPending || isSubmitting;

                    return (
                      <button
                        key={installmentNum}
                        type="button"
                        onClick={() => handleInstallmentToggle(installmentNum)}
                        disabled={isDisabled}
                        className={`p-4 border-2 rounded-lg font-medium transition-all relative ${
                          isPaid
                            ? "border-green-300 bg-green-50 text-green-700 cursor-not-allowed"
                            : isPending
                              ? "border-yellow-300 bg-yellow-50 text-yellow-700 cursor-not-allowed"
                              : isSelected
                                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                : "border-gray-300 bg-white text-gray-700 hover:border-indigo-300"
                        }`}
                      >
                        {isPaid && (
                          <span className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            ✓
                          </span>
                        )}
                        {isPending && (
                          <span className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            ⏳
                          </span>
                        )}
                        <div className="text-sm mb-1">
                          Cuota {installmentNum}
                        </div>
                        <div className="text-lg font-bold">
                          ${installmentAmount.toLocaleString("es-AR")}
                        </div>
                        {isPaid && <div className="text-xs mt-1">Pagada</div>}
                        {isPending && (
                          <div className="text-xs mt-1">Pendiente</div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedInstallments.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-green-900 font-medium">
                        Cuotas seleccionadas:
                      </span>
                      <span className="text-green-700">
                        {selectedInstallments.join(", ")}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto Total Recibido *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-calculado según cuotas seleccionadas (editable)
                </p>
              </div>

              {/* Receipt Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Recibo (opcional)
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Ej: REC-001234"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas *
                </label>
                <textarea
                  required
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Ej: Pago en efectivo - Registro por encargado de caja"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
                />
              </div>
            </>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <svg
                className="w-12 h-12 text-green-600 mx-auto mb-3"
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
              <p className="text-green-900 font-semibold">
                ¡Todas las cuotas están pagadas!
              </p>
              <p className="text-green-700 text-sm mt-1">
                Este estudiante no tiene cuotas pendientes.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            {availableInstallments.length > 0 && (
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  selectedInstallments.length === 0 ||
                  !notes.trim() ||
                  success
                }
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
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
                    Registrando...
                  </>
                ) : success ? (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Registrado
                  </>
                ) : (
                  "💵 Registrar Pago"
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
