"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  totalInstallments: number;
  existingPayments: Array<{
    installmentNumber: number | null;
    status: string;
  }>;
}

export default function UploadPaymentModal({
  isOpen,
  onClose,
  userId,
  totalAmount,
  paidAmount,
  balance,
  totalInstallments,
  existingPayments,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form state
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>(
    [],
  );
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [filePreview, setFilePreview] = useState<string>("");

  // Calculate installment amount
  const installmentAmount = totalAmount / totalInstallments;

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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedInstallments([]);
      setFile(null);
      setNotes("");
      setFilePreview("");
      setError("");
      setSuccess(false);
    }
  }, [isOpen]);

  const handleInstallmentToggle = (installmentNum: number) => {
    setSelectedInstallments((prev) =>
      prev.includes(installmentNum)
        ? prev.filter((n) => n !== installmentNum)
        : [...prev, installmentNum].sort((a, b) => a - b),
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Tipo de archivo inválido. Solo PDF, JPG, PNG, WEBP");
      return;
    }

    // Validate file size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Archivo muy grande. Máximo 10MB");
      return;
    }

    setFile(selectedFile);
    setError("");

    // Create preview for images
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (selectedInstallments.length === 0) {
      setError("Seleccioná al menos una cuota");
      return;
    }

    if (!file) {
      setError("Subí un comprobante de pago");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("installments", JSON.stringify(selectedInstallments));
      formData.append(
        "amount",
        (installmentAmount * selectedInstallments.length).toString(),
      );
      if (notes) formData.append("notes", notes);

      const res = await fetch("/api/payments/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || "Error al subir el pago");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        router.refresh();
        onClose();
      }, 2000);
    } catch (err) {
      setError("Error de conexión. Intentá nuevamente.");
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Subir Comprobante de Pago
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error/Success Messages */}
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
              ¡Pago enviado exitosamente! Esperá la revisión del administrador.
            </div>
          )}

          {/* Installments Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Seleccioná las cuotas a pagar
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: totalInstallments }, (_, i) => i + 1).map(
                (installmentNum) => {
                  const isPaid = paidInstallments.has(installmentNum);
                  const isPending = pendingInstallments.has(installmentNum);
                  const isDisabled = isPaid || isPending || isSubmitting;

                  return (
                    <button
                      key={installmentNum}
                      type="button"
                      onClick={() =>
                        !isDisabled && handleInstallmentToggle(installmentNum)
                      }
                      disabled={isDisabled}
                      className={`p-4 border-2 rounded-lg font-medium transition-all relative ${
                        isPaid
                          ? "border-green-300 bg-green-50 text-green-700 cursor-not-allowed opacity-60"
                          : isPending
                            ? "border-yellow-300 bg-yellow-50 text-yellow-700 cursor-not-allowed opacity-60"
                            : selectedInstallments.includes(installmentNum)
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                              : "border-gray-300 bg-white text-gray-700 hover:border-indigo-300 cursor-pointer"
                      } ${isDisabled ? "cursor-not-allowed" : ""}`}
                    >
                      {isPaid && (
                        <span className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                      {isPending && (
                        <span className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full p-1">
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
                        </span>
                      )}
                      <div className="text-sm mb-1">
                        Cuota {installmentNum}
                        {isPaid && " ✓"}
                        {isPending && " ⏳"}
                      </div>
                      <div className="text-lg font-bold">
                        ${installmentAmount.toLocaleString("es-AR")}
                      </div>
                      {isPaid && (
                        <div className="text-xs mt-1 text-green-600">
                          Pagada
                        </div>
                      )}
                      {isPending && (
                        <div className="text-xs mt-1 text-yellow-600">
                          Pendiente
                        </div>
                      )}
                    </button>
                  );
                },
              )}
            </div>

            {selectedInstallments.length > 0 && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-indigo-900 font-medium">
                    Total a pagar:
                  </span>
                  <span className="text-2xl font-bold text-indigo-700">
                    $
                    {(
                      installmentAmount * selectedInstallments.length
                    ).toLocaleString("es-AR")}
                  </span>
                </div>
                <p className="text-sm text-indigo-600 mt-2">
                  Cuotas seleccionadas: {selectedInstallments.join(", ")}
                </p>
              </div>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comprobante de pago *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                {file ? (
                  <div className="space-y-2">
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="max-h-40 mx-auto rounded-lg"
                      />
                    ) : (
                      <svg
                        className="w-12 h-12 text-indigo-600 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                    <p className="text-sm font-medium text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setFilePreview("");
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Cambiar archivo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm font-medium text-gray-900">
                      Click para seleccionar archivo
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, PNG o WEBP (máx. 10MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Notas adicionales (opcional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              placeholder="Ej: Transferencia desde cuenta de mi padre, referencia 12345..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 disabled:opacity-50"
            />
          </div>

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
            <button
              type="submit"
              disabled={
                isSubmitting ||
                selectedInstallments.length === 0 ||
                !file ||
                success
              }
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                  Subiendo...
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
                  Enviado
                </>
              ) : (
                "Enviar Pago"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
