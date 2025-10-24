"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createSchoolSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  address: z.string().optional(),
});

type CreateSchoolFormData = z.infer<typeof createSchoolSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSchoolCreated: (school: any) => void;
}

export default function CreateSchoolModal({
  isOpen,
  onClose,
  onSchoolCreated,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateSchoolFormData>({
    resolver: zodResolver(createSchoolSchema),
  });

  const onSubmit = async (data: CreateSchoolFormData) => {
    setError("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/schools", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (!result.success) {
          setError(result.error || "Error al crear el colegio");
          return;
        }

        onSchoolCreated(result.school);
        reset();
      } catch (err) {
        setError("Ocurrió un error. Intentá nuevamente.");
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      reset();
      setError("");
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
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Agregar Colegio</h2>
            <button
              onClick={handleClose}
              disabled={isPending}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre del Colegio *
              </label>
              <input
                {...register("name")}
                id="name"
                type="text"
                placeholder="Ej: Colegio Nacional de Buenos Aires"
                disabled={isPending}
                className={`w-full px-4 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.name ? "border-red-300 bg-red-50" : "border-gray-300"
                } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Dirección (Opcional)
              </label>
              <input
                {...register("address")}
                id="address"
                type="text"
                placeholder="Ej: Bolívar 263, CABA"
                disabled={isPending}
                className={`w-full px-4 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.address
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.address.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
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
                    Creando...
                  </>
                ) : (
                  "Crear Colegio"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
