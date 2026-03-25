// ─── EditProductModal.tsx ─────────────────────────────────────────────────────

"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ProductWithStats } from "@/types";

const editProductSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  basePrice: z.string().min(1, "El precio base es requerido"),
  currentPrice: z.string().min(1, "El precio actual es requerido"),
});

type EditProductFormData = z.infer<typeof editProductSchema>;

interface EditProps {
  product: ProductWithStats;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: (product: ProductWithStats) => void;
}

export function EditProductModal({
  product,
  isOpen,
  onClose,
  onProductUpdated,
}: EditProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

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
        setError(err instanceof Error ? err.message : "Ocurrió un error");
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
    <>
      <style>{`
        .epm-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50;
          display: flex; align-items: center; justify-content: center; padding: 1rem;
          backdrop-filter: blur(2px);
        }
        .epm-modal {
          --font-display: 'Plus Jakarta Sans', sans-serif;
          --font-body:    'DM Sans', sans-serif;
          --surface: #fff; --surface-2: #f4f4f5; --surface-3: #e4e4e7;
          --primary: #00618e; --primary-mid: #0089c6;
          --primary-tint: rgba(0,97,142,0.08); --primary-focus: rgba(0,97,142,0.15);
          --text-1: #18181b; --text-2: #52525b; --text-3: #a1a1aa;
          --danger: #b91c1c; --danger-bg: rgba(185,28,28,0.08); --danger-border: rgba(185,28,28,0.2);
          --r-md: 0.875rem; --r-xl: 1.75rem; --r-full: 9999px;
          background: var(--surface); border-radius: var(--r-xl);
          box-shadow: 0 24px 60px rgba(0,0,0,0.18);
          width: 100%; max-width: 480px; overflow: hidden;
          font-family: var(--font-body); -webkit-font-smoothing: antialiased;
        }
        .epm-modal *, .epm-modal *::before, .epm-modal *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .epm-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 1rem; padding: 1.375rem 1.5rem 1.125rem; border-bottom: 1px solid var(--surface-3);
        }
        .epm-header__icon {
          width: 2.5rem; height: 2.5rem; border-radius: var(--r-md);
          background: var(--primary-tint); display: flex; align-items: center; justify-content: center;
          color: var(--primary); margin-bottom: 0.75rem;
        }
        .epm-header__title { font-family: var(--font-display); font-size: 1.125rem; font-weight: 800; color: var(--text-1); letter-spacing: -0.01em; }
        .epm-header__sub { font-size: 0.8125rem; color: var(--text-3); margin-top: 0.2rem; }
        .epm-close {
          width: 2rem; height: 2rem; border-radius: var(--r-md); background: var(--surface-2); border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-3); flex-shrink: 0;
          transition: background 0.12s, color 0.12s;
        }
        .epm-close:hover { background: var(--surface-3); color: var(--text-1); }
        .epm-close:disabled { opacity: 0.5; cursor: not-allowed; }
        .epm-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.875rem; }
        .epm-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }
        @media (max-width: 400px) { .epm-2col { grid-template-columns: 1fr; } }
        .epm-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .epm-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-2); }
        .epm-label__hint { font-weight: 400; color: var(--text-3); font-size: 0.75rem; }
        .epm-input {
          width: 100%; padding: 0.6875rem 0.875rem; border-radius: var(--r-md);
          border: 1.5px solid var(--surface-3); background: var(--surface-2);
          font-family: var(--font-body); font-size: 0.9375rem; color: var(--text-1); outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s; -webkit-appearance: none;
        }
        .epm-input::placeholder { color: var(--text-3); }
        .epm-input:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 3px var(--primary-focus); }
        .epm-input--error { border-color: var(--danger); background: var(--danger-bg); }
        .epm-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .epm-textarea { resize: none; min-height: 5rem; }
        .epm-field-error { font-size: 0.75rem; color: var(--danger); font-weight: 500; }
        .epm-alert { border-radius: var(--r-md); padding: 0.75rem 0.875rem; font-size: 0.8125rem; background: var(--danger-bg); border: 1px solid var(--danger-border); color: var(--danger); }
        .epm-footer { display: flex; gap: 0.625rem; padding: 1rem 1.5rem 1.375rem; border-top: 1px solid var(--surface-3); }
        .epm-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.75rem 1.25rem; border-radius: var(--r-full);
          font-family: var(--font-display); font-size: 0.9375rem; font-weight: 700;
          border: none; cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s, background 0.12s, opacity 0.12s;
        }
        .epm-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
        .epm-btn--cancel { background: var(--surface-2); color: var(--text-2); flex-shrink: 0; }
        .epm-btn--cancel:hover:not(:disabled) { background: var(--surface-3); }
        .epm-btn--submit { flex: 1; background: linear-gradient(135deg, var(--primary) 0%, var(--primary-mid) 100%); color: white; box-shadow: 0 4px 12px rgba(0,97,142,0.3); }
        .epm-btn--submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,97,142,0.38); }
        .epm-spinner { width: 1rem; height: 1rem; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: epm-spin 0.7s linear infinite; }
        @keyframes epm-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="epm-overlay" onClick={handleClose}>
        <div className="epm-modal" onClick={(e) => e.stopPropagation()}>
          <div className="epm-header">
            <div>
              <div className="epm-header__icon">
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <p className="epm-header__title">Editar producto</p>
              <p className="epm-header__sub">{product.name}</p>
            </div>
            <button
              className="epm-close"
              onClick={handleClose}
              disabled={isPending}
              aria-label="Cerrar"
            >
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                viewBox="0 0 24 24"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <form id="edit-product-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="epm-body">
              {error && <div className="epm-alert">{error}</div>}
              <div className="epm-field">
                <label htmlFor="epm-name" className="epm-label">
                  Nombre del producto *
                </label>
                <input
                  {...register("name")}
                  id="epm-name"
                  type="text"
                  disabled={isPending}
                  className={`epm-input${errors.name ? " epm-input--error" : ""}`}
                />
                {errors.name && (
                  <p className="epm-field-error">{errors.name.message}</p>
                )}
              </div>
              <div className="epm-field">
                <label htmlFor="epm-desc" className="epm-label">
                  Descripción{" "}
                  <span className="epm-label__hint">(opcional)</span>
                </label>
                <textarea
                  {...register("description")}
                  id="epm-desc"
                  rows={3}
                  disabled={isPending}
                  className={`epm-input epm-textarea${errors.description ? " epm-input--error" : ""}`}
                />
              </div>
              <div className="epm-2col">
                <div className="epm-field">
                  <label htmlFor="epm-base" className="epm-label">
                    Precio base *
                  </label>
                  <input
                    {...register("basePrice")}
                    id="epm-base"
                    type="number"
                    step="0.01"
                    disabled={isPending}
                    className={`epm-input${errors.basePrice ? " epm-input--error" : ""}`}
                  />
                  {errors.basePrice && (
                    <p className="epm-field-error">
                      {errors.basePrice.message}
                    </p>
                  )}
                </div>
                <div className="epm-field">
                  <label htmlFor="epm-current" className="epm-label">
                    Precio actual *
                  </label>
                  <input
                    {...register("currentPrice")}
                    id="epm-current"
                    type="number"
                    step="0.01"
                    disabled={isPending}
                    className={`epm-input${errors.currentPrice ? " epm-input--error" : ""}`}
                  />
                  {errors.currentPrice && (
                    <p className="epm-field-error">
                      {errors.currentPrice.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="epm-footer">
              <button
                type="button"
                className="epm-btn epm-btn--cancel"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="epm-btn epm-btn--submit"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <div className="epm-spinner" /> Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default EditProductModal;
