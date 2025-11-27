"use client";

import { useEffect, useState } from "react";
import { Payment, SerializedUserWithRelations } from "@/types";

interface Props {
  student: SerializedUserWithRelations;
  isOpen: boolean;
  onClose: () => void;
}

export default function TransferPaymentModalSingle({
  student,
  isOpen,
  onClose,
}: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);

  const [selectedInstallments, setSelectedInstallments] = useState<number[]>(
    [],
  );
  const [amount, setAmount] = useState("");
  const [transferReference, setTransferReference] = useState("");
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const installmentAmount = student.totalAmount / student.installments;

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch(`/api/admin/students/${student.id}/payments`);
        const data = await res.json();
        if (data.success) {
          setPayments(data.payments);
        }
      } catch (err) {
        console.error("Error fetching payments:", err);
      }
    };

    if (isOpen) {
      fetchPayments();
      // Reset form
      setSelectedInstallments([]);
      setAmount("");
      setTransferReference("");
      setTransferDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setError("");
      setSuccess(false);
    }
  }, [isOpen, student.id]);

  const paidInstallments = new Set(
    payments
      .filter((p) => p.status === "APPROVED" && p.installmentNumber)
      .map((p) => p.installmentNumber as number),
  );

  const pendingInstallments = new Set(
    payments
      .filter((p) => p.status === "PENDING" && p.installmentNumber)
      .map((p) => p.installmentNumber as number),
  );

  // Get paid installments
  const handleInstallmentToggle = (installmentNum: number) => {
    const isPaid = paidInstallments.has(installmentNum);
    const isPending = pendingInstallments.has(installmentNum);

    if (isPaid || isPending) return; // 👈 AGREGAR ESTA LÍNEA

    setSelectedInstallments((prev) => {
      const newSelection = prev.includes(installmentNum)
        ? prev.filter((n) => n !== installmentNum)
        : [...prev, installmentNum].sort((a, b) => a - b);

      const newAmount = newSelection.length * installmentAmount;
      setAmount(newAmount.toString());

      return newSelection;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedInstallments.length === 0) {
      setError("Seleccioná al menos una cuota");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Ingresá un monto válido");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/payments/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentDni: student.dni,
          installments: selectedInstallments,
          amount: parseFloat(amount),
          transferReference: transferReference.trim() || undefined,
          transferDate: transferDate || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Error al registrar la transferencia");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || "Error al registrar la transferencia");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedInstallments([]);
      setAmount("");
      setTransferReference("");
      setTransferDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setError("");
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  🏦 Registrar Transferencia
                </h2>
                <p className="text-sm text-gray-600">
                  {student.firstName} {student.lastName} - DNI: {student.dni}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
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

          {/* Success Alert */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>¡Transferencia registrada exitosamente! Recargando...</span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Balance Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    Saldo Pendiente
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${student.balance.toLocaleString("es-AR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600 font-medium">
                    Monto por Cuota
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${installmentAmount.toLocaleString("es-AR")}
                  </p>
                </div>
              </div>
            </div>

            {/* Select Installments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Seleccioná las cuotas a pagar *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Array.from(
                  { length: student.installments },
                  (_, i) => i + 1,
                ).map((installmentNum) => {
                  const isSelected =
                    selectedInstallments.includes(installmentNum);
                  const isPaid = paidInstallments.has(installmentNum);
                  const isPending = pendingInstallments.has(installmentNum);
                  const isDisabled = isPaid || isPending;

                  return (
                    <button
                      key={installmentNum}
                      type="button"
                      onClick={() => handleInstallmentToggle(installmentNum)}
                      disabled={isSubmitting || isDisabled} // 👈 CAMBIAR ESTA LÍNEA
                      className={`p-3 rounded-lg border-2 font-medium transition-all ${
                        isPaid
                          ? "bg-green-100 border-green-300 text-green-800 cursor-not-allowed opacity-60"
                          : isPending
                            ? "bg-yellow-100 border-yellow-300 text-yellow-800 cursor-not-allowed opacity-60"
                            : isSelected
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-gray-300 text-gray-700 hover:border-blue-400"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Cuota {installmentNum}
                      {isPaid && " ✓"}
                      {isPending && " ⏳"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transfer Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Referencia / Operación
                </label>
                <input
                  type="text"
                  value={transferReference}
                  onChange={(e) => setTransferReference(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Ej: 123456789"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Transferencia
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  disabled={isSubmitting}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto Total * (se calcula automáticamente)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  $
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSubmitting}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-lg font-semibold disabled:opacity-50"
                />
              </div>
              {selectedInstallments.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  {selectedInstallments.length} cuota(s) × $
                  {installmentAmount.toLocaleString("es-AR")} = $
                  {(
                    selectedInstallments.length * installmentAmount
                  ).toLocaleString("es-AR")}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas adicionales (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                rows={3}
                placeholder="Información adicional sobre la transferencia..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 disabled:opacity-50 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  selectedInstallments.length === 0 ||
                  !amount ||
                  parseFloat(amount) <= 0
                }
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                ) : (
                  <>
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Registrar Transferencia
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
