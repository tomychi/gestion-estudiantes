"use client";

import { useState } from "react";

export default function CashPaymentForm() {
  const [step, setStep] = useState<"search" | "payment">("search");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [dni, setDni] = useState("");
  const [student, setStudent] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>(
    [],
  );
  const [amount, setAmount] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [notes, setNotes] = useState("");

  const paidInstallments = new Set(
    payments
      .filter((p) => p.status === "APPROVED" && p.installmentNumber)
      .map((p) => p.installmentNumber),
  );

  const pendingInstallments = new Set(
    payments
      .filter((p) => p.status === "PENDING" && p.installmentNumber)
      .map((p) => p.installmentNumber),
  );

  const searchStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const studentRes = await fetch(`/api/admin/students/search?dni=${dni}`);
      const studentData = await studentRes.json();

      if (!studentData.success) {
        setError(studentData.error || "Estudiante no encontrado");
        setStudent(null);
        return;
      }

      const paymentsRes = await fetch(
        `/api/admin/students/${studentData.student.id}/payments`,
      );
      const paymentsData = await paymentsRes.json();

      setStudent(studentData.student);
      setPayments(paymentsData.success ? paymentsData.payments : []);
      setStep("payment");
    } catch (err) {
      setError("Error al buscar estudiante");
    } finally {
      setLoading(false);
    }
  };

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
          studentDni: dni,
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
        setStep("search");
        setDni("");
        setStudent(null);
        setPayments([]);
        setSelectedInstallments([]);
        setAmount("");
        setReceiptNumber("");
        setNotes("");
        setSuccess("");
      }, 2000);
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {step === "search" && (
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            1. Buscar Estudiante
          </h2>
          <form onSubmit={searchStudent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI del Estudiante
              </label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ej: 12345678"
                className="w-full px-4 py-2 pr-10 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !dni}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Buscando..." : "Buscar Estudiante"}
            </button>
          </form>
        </div>
      )}

      {step === "payment" && student && (
        <div className="p-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">
              {student.firstName} {student.lastName}
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>DNI: {student.dni}</p>
              <p>Total: ${student.totalAmount?.toLocaleString()}</p>
              <p>Pagado: ${student.paidAmount?.toLocaleString()}</p>
              <p className="font-medium text-indigo-600">
                Balance: ${student.balance?.toLocaleString()}
              </p>
            </div>
          </div>

          <form onSubmit={submitPayment} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                2. Seleccionar Cuotas
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
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
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
                    Cuotas: {selectedInstallments.join(", ")}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                3. Monto Recibido
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-6 py-2 pr-10 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Recibo (Opcional)
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="Ej: REC-001"
                className="w-full px-6 py-2 pr-10 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (Opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Información adicional..."
                rows={3}
                className="w-full px-6 py-2 pr-10 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep("search");
                  setStudent(null);
                  setPayments([]);
                  setSelectedInstallments([]);
                  setAmount("");
                  setReceiptNumber("");
                  setNotes("");
                  setError("");
                }}
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
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
