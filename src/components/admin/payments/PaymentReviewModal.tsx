// src/components/admin/payments/PaymentReviewModal.tsx
"use client";

import Image from "next/image";
import { useState } from "react";

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
  reviewedAt: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    dni: string;
    email: string | null;
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
    product: {
      name: string;
    };
  };
}

interface Props {
  payments: Payment[]; // Changed from single payment to array
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  adminId: string;
}

export default function PaymentReviewModal({
  payments,
  isOpen,
  onClose,
  onComplete,
  adminId,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Use first payment for display (they all share same user/receipt)
  const payment = payments[0];

  // Calculate totals
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const installmentNumbers = payments
    .map((p) => p.installmentNumber)
    .filter((n) => n !== null)
    .sort((a, b) => a! - b!);

  const handleApprove = async () => {
    if (
      !confirm(
        `¿Estás seguro de aprobar este pago de ${payments.length} cuota(s)?`,
      )
    )
      return;

    setIsSubmitting(true);
    setError("");

    try {
      // Approve all payments in the group
      const approvePromises = payments.map((p) =>
        fetch(`/api/admin/payments/${p.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "APPROVE" }),
        }).then((res) => res.json()),
      );

      const results = await Promise.all(approvePromises);

      // Check if any failed
      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        setError(
          failed[0].error || `Error al aprobar ${failed.length} cuota(s)`,
        );
        setIsSubmitting(false);
        return;
      }

      onComplete();
    } catch (err) {
      setError("Error de conexión. Intentá nuevamente.");
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Ingresá una razón para el rechazo");
      return;
    }

    if (
      !confirm(
        `¿Estás seguro de rechazar este pago de ${payments.length} cuota(s)?`,
      )
    )
      return;

    setIsSubmitting(true);
    setError("");

    try {
      // Reject all payments in the group
      const rejectPromises = payments.map((p) =>
        fetch(`/api/admin/payments/${p.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "REJECT",
            rejectionReason: rejectionReason.trim(),
          }),
        }).then((res) => res.json()),
      );

      const results = await Promise.all(rejectPromises);

      // Check if any failed
      const failed = results.filter((r) => !r.success);
      if (failed.length > 0) {
        setError(
          failed[0].error || `Error al rechazar ${failed.length} cuota(s)`,
        );
        setIsSubmitting(false);
        return;
      }

      onComplete();
    } catch (err) {
      setError("Error de conexión. Intentá nuevamente.");
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isPending = payment.status === "PENDING";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {isPending ? "Revisar Pago" : "Detalles del Pago"}
            </h2>
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

        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Student Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Información del Estudiante
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Nombre</p>
                <p className="text-sm font-semibold text-gray-900">
                  {payment.user.firstName} {payment.user.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">DNI</p>
                <p className="text-sm font-semibold text-gray-900">
                  {payment.user.dni}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Colegio</p>
                <p className="text-sm font-semibold text-gray-900">
                  {payment.user.schoolDivision?.school.name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">División</p>
                <p className="text-sm font-semibold text-gray-900">
                  {payment.user.schoolDivision
                    ? `${payment.user.schoolDivision.division} - ${payment.user.schoolDivision.year}`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-semibold text-gray-900">
                  {payment.user.email || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Producto</p>
                <p className="text-sm font-semibold text-gray-900">
                  {payment.user.product.name}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Detalles del Pago
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Monto Total:</span>
                    <span className="text-sm font-bold text-gray-900">
                      ${totalAmount.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cuota(s):</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {installmentNumbers.join(", ")}
                    </span>
                  </div>
                  {payments.length > 1 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Cantidad de cuotas:
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {payments.length}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fecha envío:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(payment.submittedAt).toLocaleDateString(
                        "es-AR",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Referencia:</span>
                    <span className="text-sm text-gray-900 font-mono">
                      {payment.transactionRef || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Estado:</span>
                    <span
                      className={`text-sm font-semibold ${
                        payment.status === "APPROVED"
                          ? "text-green-600"
                          : payment.status === "REJECTED"
                            ? "text-red-600"
                            : "text-yellow-600"
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
              </div>

              {payment.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Notas del estudiante
                  </h3>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    {payment.notes}
                  </p>
                </div>
              )}

              {payment.rejectionReason && (
                <div>
                  <h3 className="text-sm font-medium text-red-700 mb-2">
                    Razón de rechazo
                  </h3>
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                    {payment.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            {/* Balance Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Estado de Cuenta
              </h3>
              <div className="bg-indigo-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-indigo-700">Total:</span>
                  <span className="text-sm font-bold text-indigo-900">
                    ${payment.user.totalAmount.toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-indigo-700">Pagado:</span>
                  <span className="text-sm font-semibold text-indigo-900">
                    ${payment.user.paidAmount.toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-indigo-200">
                  <span className="text-sm font-medium text-indigo-700">
                    Saldo:
                  </span>
                  <span className="text-lg font-bold text-indigo-900">
                    ${payment.user.balance.toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="pt-2 border-t border-indigo-200">
                  <div className="flex justify-between text-xs text-indigo-600">
                    <span>Cuotas totales:</span>
                    <span>{payment.user.installments}</span>
                  </div>
                </div>
              </div>

              {isPending && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Nuevo saldo si se aprueba:</strong>
                    <br />$
                    {(payment.user.balance - totalAmount).toLocaleString(
                      "es-AR",
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Receipt Preview */}
          {payment.receiptUrl && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Comprobante de Pago
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {payment.receiptUrl.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  <Image
                    src={payment.receiptUrl}
                    alt="Comprobante"
                    width={800}
                    height={500}
                    className="w-full h-auto max-h-[500px] object-contain bg-gray-50"
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Preview del PDF */}
                    <iframe
                      src={payment.receiptUrl}
                      className="w-full h-[500px] border border-gray-200 rounded-lg"
                      title="Preview Comprobante PDF"
                    />

                    {/* Botón para abrir en nueva pestaña */}
                    <div className="text-center">
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
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
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        Abrir PDF en nueva pestaña
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && isPending && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-900 mb-3">
                Razón del Rechazo
              </h3>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={isSubmitting}
                placeholder="Explicá por qué rechazás este pago..."
                className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white text-gray-900 disabled:opacity-50"
              />
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
              {isPending ? "Cancelar" : "Cerrar"}
            </button>

            {isPending && !showRejectForm && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
                >
                  Rechazar
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmitting}
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
                      Aprobando...
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
                      Aprobar Pago
                    </>
                  )}
                </button>
              </>
            )}

            {showRejectForm && (
              <button
                type="button"
                onClick={handleReject}
                disabled={isSubmitting || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                    Rechazando...
                  </>
                ) : (
                  "Confirmar Rechazo"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
