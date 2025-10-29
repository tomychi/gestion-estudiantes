"use client";

import { Payment, SerializedUserWithRelations } from "@/types";
import { useEffect, useState } from "react";

interface Props {
  student: SerializedUserWithRelations;
  isOpen: boolean;
  onClose: () => void;
}

export default function CashPaymentModalSingle({
  student,
  isOpen,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>(
    [],
  );
  const [amount, setAmount] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [notes, setNotes] = useState("");

  const calculateCoveredInstallments = (paymentAmount: number) => {
    if (!paymentAmount || paymentAmount <= 0) return 0;

    // Si paga el total exacto (o más), cubren todas las cuotas
    if (paymentAmount >= student.totalAmount) {
      return student.installments;
    }

    const installmentAmount = student.totalAmount / student.installments;

    // Usar floor pero con un margen de tolerancia del 1% por cuota
    const exactCovered = paymentAmount / installmentAmount;
    const floorCovered = Math.floor(exactCovered);

    // Si está muy cerca de la siguiente cuota (dentro del 1% del valor de una cuota)
    const remainder = exactCovered - floorCovered;
    const threshold = 0.98; // 98% de la cuota

    if (remainder >= threshold) {
      return Math.min(floorCovered + 1, student.installments);
    }

    return floorCovered;
  };

  // Auto-seleccionar cuotas cuando cambia el monto
  const handleAmountChange = (value: string) => {
    setAmount(value);

    const numericAmount = parseFloat(value);
    if (!numericAmount || numericAmount <= 0) {
      return;
    }

    const coveredCount = calculateCoveredInstallments(numericAmount);

    // Auto-seleccionar las primeras N cuotas disponibles
    const availableInstallments = Array.from(
      { length: student.installments },
      (_, i) => i + 1,
    ).filter((num) => {
      return !paidInstallments.has(num) && !pendingInstallments.has(num);
    });

    const toSelect = availableInstallments.slice(0, coveredCount);
    setSelectedInstallments(toSelect);
  };

  // Fetch payments when modal opens
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

  // Load payments when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPayments();
      // Reset form
      setSelectedInstallments([]);
      setAmount("");
      setReceiptNumber("");
      setNotes("");
      setError("");
      setSuccess("");
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

  const toggleInstallment = (installmentNum: number) => {
    const isPaid = paidInstallments.has(installmentNum);
    const isPending = pendingInstallments.has(installmentNum);
    if (isPaid || isPending) return;

    if (selectedInstallments.includes(installmentNum)) {
      setSelectedInstallments(
        selectedInstallments.filter((i) => i !== installmentNum),
      );
    } else {
      setSelectedInstallments(
        [...selectedInstallments, installmentNum].sort((a, b) => a - b),
      );
    }
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/payments/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentDni: student.dni,
          installments: selectedInstallments,
          amount: parseFloat(amount),
          receiptNumber: receiptNumber || null,
          notes: notes || null,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Error al registrar el pago");
        return;
      }

      setSuccess(data.message);

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError("Error al registrar el pago");
    } finally {
      setLoading(false);
    }
  };

  const getInstallmentStatus = (installmentNum: number) => {
    if (paidInstallments.has(installmentNum)) return "paid";
    if (pendingInstallments.has(installmentNum)) return "pending";
    if (selectedInstallments.includes(installmentNum)) return "selected";
    return "available";
  };

  const getInstallmentStyles = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-300 cursor-not-allowed opacity-60";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300 cursor-not-allowed opacity-60";
      case "selected":
        return "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700";
      default:
        return "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-indigo-400";
    }
  };

  const getInstallmentLabel = (status: string, installmentNum: number) => {
    switch (status) {
      case "paid":
        return `${installmentNum} ✓`;
      case "pending":
        return `${installmentNum} ⏳`;
      default:
        return installmentNum;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                💵 Pago en Efectivo
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {student.firstName} {student.lastName} - DNI: {student.dni}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
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

          {/* Content */}
          <div className="p-6">
            {/* Student Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 space-y-1">
                <p>Total: ${student.totalAmount?.toLocaleString()}</p>
                <p>Pagado: ${student.paidAmount?.toLocaleString()}</p>
                <p className="font-medium text-indigo-600">
                  Balance: ${student.balance?.toLocaleString()}
                </p>
              </div>
            </div>

            <form onSubmit={submitPayment} className="space-y-6">
              {/* Select Installments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Seleccionar Cuotas a Pagar
                </label>

                <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                    <span>Pagada ✓</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                    <span>En Revisión ⏳</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-indigo-600 rounded"></div>
                    <span className="text-indigo-600 font-medium">
                      Seleccionada
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                  {Array.from(
                    { length: student.installments },
                    (_, i) => i + 1,
                  ).map((installmentNum) => {
                    const status = getInstallmentStatus(installmentNum);
                    return (
                      <button
                        key={installmentNum}
                        type="button"
                        onClick={() => toggleInstallment(installmentNum)}
                        disabled={status === "paid" || status === "pending"}
                        className={`py-2.5 px-2 rounded-lg font-semibold transition-all border-2 ${getInstallmentStyles(status)}`}
                      >
                        {getInstallmentLabel(status, installmentNum)}
                      </button>
                    );
                  })}
                </div>

                {selectedInstallments.length > 0 && (
                  <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-sm font-medium text-indigo-900">
                      Cuotas seleccionadas: {selectedInstallments.join(", ")}
                    </p>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto Recibido
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                    required
                  />
                </div>
                {amount && parseFloat(amount) > 0 && (
                  <p className="text-xs text-indigo-600 mt-1">
                    Este monto cubre aproximadamente{" "}
                    {calculateCoveredInstallments(parseFloat(amount))} cuota(s)
                  </p>
                )}
              </div>
              {/* Receipt Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Recibo (Opcional)
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="Ej: REC-001"
                  className="w-full px-4 py-2 pr-10 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (Opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Información adicional..."
                  rows={3}
                  className="w-full px-4 py-2 pr-10 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    loading || selectedInstallments.length === 0 || !amount
                  }
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Registrando..." : "Registrar Pago"}
                </button>

                {/* Warning si el monto no coincide */}
                {selectedInstallments.length > 0 &&
                  amount &&
                  (() => {
                    const installmentAmount =
                      student.totalAmount / student.installments;
                    const expectedAmount =
                      selectedInstallments.length * installmentAmount;
                    const actualAmount = parseFloat(amount);
                    const difference = Math.abs(expectedAmount - actualAmount);

                    // Usar porcentaje en vez de monto fijo para manejar redondeos
                    const percentageDiff = (difference / expectedAmount) * 100;

                    if (percentageDiff > 5) {
                      // Más del 5% de diferencia
                      return (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                          <p className="text-sm font-medium">⚠️ Atención</p>
                          <p className="text-xs mt-1">
                            Seleccionaste {selectedInstallments.length} cuota(s)
                            (${expectedAmount.toFixed(2)}) pero el monto
                            ingresado es ${actualAmount.toLocaleString()}.
                            {actualAmount > expectedAmount &&
                              percentageDiff > 10 && (
                                <span className="block mt-1 font-medium">
                                  💡 Con ${actualAmount.toLocaleString()}{" "}
                                  podrías pagar{" "}
                                  {calculateCoveredInstallments(actualAmount)}{" "}
                                  cuota(s).
                                </span>
                              )}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
