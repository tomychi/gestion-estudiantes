"use client";

import { useState, useTransition } from "react";

interface School {
  id: string;
  name: string;
  studentCount: number;
}

interface Props {
  school: School;
  isOpen: boolean;
  onClose: () => void;
  onSchoolDeleted: (schoolId: string) => void;
}

export default function DeleteSchoolModal({
  school,
  isOpen,
  onClose,
  onSchoolDeleted,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");

  const handleDelete = () => {
    setError("");

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/schools/${school.id}`, {
          method: "DELETE",
        });

        const result = await res.json();

        if (!result.success) {
          setError(result.error || "Error al eliminar el colegio");
          return;
        }

        onSchoolDeleted(school.id);
      } catch (err) {
        setError("Ocurrió un error. Intentá nuevamente.");
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  const hasStudents = school.studentCount > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              ¿Eliminar Colegio?
            </h2>
            <p className="text-gray-600">
              Estás por eliminar{" "}
              <span className="font-semibold">{school.name}</span>
            </p>
          </div>

          {/* Warning or Error */}
          {hasStudents ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">No se puede eliminar</p>
                  <p>
                    Este colegio tiene{" "}
                    <strong>{school.studentCount} estudiante(s)</strong>{" "}
                    asociados. Debés eliminar o reasignar los estudiantes
                    primero.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">
                    Esta acción no se puede deshacer
                  </p>
                  <p>
                    Se eliminarán todas las divisiones asociadas a este colegio.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            {!hasStudents && (
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isPending ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                    Eliminando...
                  </>
                ) : (
                  "Sí, Eliminar"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
