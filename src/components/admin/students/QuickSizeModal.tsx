"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  studentId: string;
  studentName: string;
  currentSize: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newSize: string) => void;
}

const TALLE_OPTIONS = [
  { value: "XS", label: "XS" },
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "XXL", label: "XXL" },
  { value: "XXXL", label: "XXXL" },
  { value: "2", label: "2" },
  { value: "4", label: "4" },
  { value: "6", label: "6" },
  { value: "8", label: "8" },
  { value: "10", label: "10" },
  { value: "12", label: "12" },
  { value: "14", label: "14" },
  { value: "16", label: "16" },
];

export default function QuickSizeModal({
  studentId,
  studentName,
  currentSize,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedSize, setSelectedSize] = useState(currentSize || "");
  const [customSize, setCustomSize] = useState("");

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSize(currentSize || "");
      setCustomSize("");
      setError("");
    }
  }, [isOpen, currentSize]);

  // Close on ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSizeClick = async (size: string) => {
    setError("");
    setIsSubmitting(true);
    setSelectedSize(size);

    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || "Error al actualizar el talle");
        setIsSubmitting(false);
        return;
      }

      // Success callback
      if (onSuccess) {
        onSuccess(size);
      }

      // Refresh data
      router.refresh();

      // Close modal after a brief success indication
      setTimeout(() => {
        onClose();
        setIsSubmitting(false);
      }, 500);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error de conexión. Intentá nuevamente.";

      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleCustomSizeSubmit = async () => {
    if (!customSize.trim()) return;

    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size: customSize.trim() }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || "Error al actualizar el talle");
        setIsSubmitting(false);
        return;
      }

      // Success callback
      if (onSuccess) {
        onSuccess(customSize.trim());
      }

      // Refresh data
      router.refresh();

      // Close modal
      setTimeout(() => {
        onClose();
        setIsSubmitting(false);
      }, 500);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error de conexión. Intentá nuevamente.";

      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleRemoveSize = async () => {
    setError("");
    setIsSubmitting(true);
    setSelectedSize("");

    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size: "" }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || "Error al quitar el talle");
        setIsSubmitting(false);
        return;
      }

      // Success callback
      if (onSuccess) {
        onSuccess("");
      }

      // Refresh data
      router.refresh();

      // Close modal
      setTimeout(() => {
        onClose();
        setIsSubmitting(false);
      }, 500);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error de conexión. Intentá nuevamente.";

      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cambiar Talle</h2>
              <p className="text-sm text-gray-600 mt-1">{studentName}</p>
            </div>
            <button
              onClick={onClose}
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

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Current Size Indicator */}
            {currentSize && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-blue-900">
                    Talle actual: <strong>{currentSize}</strong>
                  </span>
                </div>
                <button
                  onClick={handleRemoveSize}
                  disabled={isSubmitting}
                  className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                >
                  Quitar talle
                </button>
              </div>
            )}

            {/* Size Selection Grid */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Seleccioná un talle
              </label>
              <div className="grid grid-cols-5 gap-2">
                {TALLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSizeClick(option.value)}
                    disabled={isSubmitting}
                    className={`relative px-4 py-3 rounded-lg font-bold text-lg transition-all disabled:opacity-50 ${
                      selectedSize === option.value
                        ? "bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300 scale-105"
                        : "bg-white text-gray-700 border-2 border-gray-300 hover:border-indigo-500 hover:shadow-md active:scale-95"
                    }`}
                  >
                    {option.label}
                    {selectedSize === option.value && !isSubmitting && (
                      <svg
                        className="absolute top-1 right-1 w-4 h-4"
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
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Size Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                O ingresá un talle personalizado
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCustomSizeSubmit();
                    }
                  }}
                  disabled={isSubmitting}
                  placeholder="Ej: XL Slim, 42, etc."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 disabled:opacity-50"
                />
                <button
                  onClick={handleCustomSizeSubmit}
                  disabled={isSubmitting || !customSize.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <svg
                  className="w-5 h-5 mt-0.5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Loading State */}
            {isSubmitting && (
              <div className="flex items-center justify-center gap-2 text-indigo-600">
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
                <span className="font-medium">Guardando...</span>
              </div>
            )}

            {/* Help Text */}
            <p className="text-xs text-gray-500 text-center">
              💡 Tip: Hacé click en un talle para guardarlo automáticamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
