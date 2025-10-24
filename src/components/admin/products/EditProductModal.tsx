"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const editProductSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  basePrice: z.string().min(1, "El precio base es requerido"),
  currentPrice: z.string().min(1, "El precio actual es requerido"),
});

type EditProductFormData = z.infer<typeof editProductSchema>;

interface Product {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  currentPrice: number;
}

interface Props {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: (product: any) => void;
}

export default function EditProductModal({
  product,
  isOpen,
  onClose,
  onProductUpdated,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      name: product.name,
      description: product.description || "",
      basePrice: product.basePrice.toString(),
      currentPrice: product.currentPrice.toString(),
    },
  });

  useEffect(() => {
    reset({
      name: product.name,
      description: product.description || "",
      basePrice: product.basePrice.toString(),
      currentPrice: product.currentPrice.toString(),
    });
  }, [product, reset]);

  const onSubmit = async (data: EditProductFormData) => {
    setError("");

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/products/${product.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            basePrice: parseFloat(data.basePrice),
            currentPrice: parseFloat(data.currentPrice),
          }),
        });

        const result = await res.json();

        if (!result.success) {
          setError(result.error || "Error al actualizar el producto");
          return;
        }

        onProductUpdated(result.product);
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Editar Producto</h2>
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre del Producto *
              </label>
              <input
                {...register("name")}
                id="name"
                type="text"
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

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Descripción (Opcional)
              </label>
              <textarea
                {...register("description")}
                id="description"
                rows={3}
                disabled={isPending}
                className={`w-full px-4 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none ${
                  errors.description
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300"
                } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="basePrice"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Precio Base *
                </label>
                <input
                  {...register("basePrice")}
                  id="basePrice"
                  type="number"
                  step="0.01"
                  disabled={isPending}
                  className={`w-full px-4 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.basePrice
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                {errors.basePrice && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.basePrice.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="currentPrice"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Precio Actual *
                </label>
                <input
                  {...register("currentPrice")}
                  id="currentPrice"
                  type="number"
                  step="0.01"
                  disabled={isPending}
                  className={`w-full px-4 py-2 bg-white text-gray-900 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.currentPrice
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                {errors.currentPrice && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.currentPrice.message}
                  </p>
                )}
              </div>
            </div>

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
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
