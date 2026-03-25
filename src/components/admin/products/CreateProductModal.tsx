"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Product } from "@/types";

const createProductSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  basePrice: z.string().min(1, "El precio base es requerido"),
  currentPrice: z.string().min(1, "El precio actual es requerido"),
});

type CreateProductFormData = z.infer<typeof createProductSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: Product) => void;
}

export default function CreateProductModal({
  isOpen,
  onClose,
  onProductCreated,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
  });

  const onSubmit = async (data: CreateProductFormData) => {
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            basePrice: parseFloat(data.basePrice),
            currentPrice: parseFloat(data.currentPrice),
          }),
        });
        const result = await res.json();
        if (!result.success) {
          setError(result.error || "Error al crear el producto");
          return;
        }
        onProductCreated(result.product);
        reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ocurrió un error");
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
    <>
      <style>{`
        .cpm2-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 50;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          backdrop-filter: blur(2px);
        }
        .cpm2-modal {
          --font-display: 'Plus Jakarta Sans', sans-serif;
          --font-body:    'DM Sans', sans-serif;
          --surface:      #ffffff;
          --surface-2:    #f4f4f5;
          --surface-3:    #e4e4e7;
          --primary:      #00618e;
          --primary-mid:  #0089c6;
          --primary-tint: rgba(0,97,142,0.08);
          --primary-focus: rgba(0,97,142,0.15);
          --text-1:       #18181b;
          --text-2:       #52525b;
          --text-3:       #a1a1aa;
          --danger:       #b91c1c;
          --danger-bg:    rgba(185,28,28,0.08);
          --danger-border: rgba(185,28,28,0.2);
          --r-md:  0.875rem;
          --r-xl:  1.75rem;
          --r-full: 9999px;

          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: 0 24px 60px rgba(0,0,0,0.18);
          width: 100%;
          max-width: 480px;
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
        }
        .cpm2-modal *, .cpm2-modal *::before, .cpm2-modal *::after {
          box-sizing: border-box; margin: 0; padding: 0;
        }

        .cpm2-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 1rem; padding: 1.375rem 1.5rem 1.125rem;
          border-bottom: 1px solid var(--surface-3);
        }
        .cpm2-header__icon {
          width: 2.5rem; height: 2.5rem; border-radius: var(--r-md);
          background: var(--primary-tint);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary); margin-bottom: 0.75rem;
        }
        .cpm2-header__title {
          font-family: var(--font-display);
          font-size: 1.125rem; font-weight: 800;
          color: var(--text-1); letter-spacing: -0.01em;
        }
        .cpm2-header__sub { font-size: 0.8125rem; color: var(--text-3); margin-top: 0.2rem; }
        .cpm2-close {
          width: 2rem; height: 2rem; border-radius: var(--r-md);
          background: var(--surface-2); border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-3); flex-shrink: 0;
          transition: background 0.12s, color 0.12s;
        }
        .cpm2-close:hover { background: var(--surface-3); color: var(--text-1); }
        .cpm2-close:disabled { opacity: 0.5; cursor: not-allowed; }

        .cpm2-body {
          padding: 1.25rem 1.5rem;
          display: flex; flex-direction: column; gap: 0.875rem;
        }

        .cpm2-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }
        @media (max-width: 400px) { .cpm2-2col { grid-template-columns: 1fr; } }

        .cpm2-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .cpm2-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-2); }
        .cpm2-label__hint { font-weight: 400; color: var(--text-3); font-size: 0.75rem; }

        .cpm2-input {
          width: 100%; padding: 0.6875rem 0.875rem;
          border-radius: var(--r-md);
          border: 1.5px solid var(--surface-3);
          background: var(--surface-2);
          font-family: var(--font-body);
          font-size: 0.9375rem; color: var(--text-1);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          -webkit-appearance: none;
        }
        .cpm2-input::placeholder { color: var(--text-3); }
        .cpm2-input:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 3px var(--primary-focus); }
        .cpm2-input--error { border-color: var(--danger); background: var(--danger-bg); }
        .cpm2-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .cpm2-textarea { resize: none; min-height: 5rem; }
        .cpm2-field-error { font-size: 0.75rem; color: var(--danger); font-weight: 500; }

        .cpm2-alert {
          border-radius: var(--r-md); padding: 0.75rem 0.875rem;
          font-size: 0.8125rem;
          background: var(--danger-bg); border: 1px solid var(--danger-border); color: var(--danger);
        }

        .cpm2-footer {
          display: flex; gap: 0.625rem;
          padding: 1rem 1.5rem 1.375rem;
          border-top: 1px solid var(--surface-3);
        }
        .cpm2-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.75rem 1.25rem; border-radius: var(--r-full);
          font-family: var(--font-display); font-size: 0.9375rem; font-weight: 700;
          border: none; cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s, background 0.12s, opacity 0.12s;
        }
        .cpm2-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
        .cpm2-btn--cancel { background: var(--surface-2); color: var(--text-2); flex-shrink: 0; }
        .cpm2-btn--cancel:hover:not(:disabled) { background: var(--surface-3); }
        .cpm2-btn--submit {
          flex: 1;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-mid) 100%);
          color: white; box-shadow: 0 4px 12px rgba(0,97,142,0.3);
        }
        .cpm2-btn--submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,97,142,0.38); }
        .cpm2-spinner {
          width: 1rem; height: 1rem;
          border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
          border-radius: 50%; animation: cpm2-spin 0.7s linear infinite;
        }
        @keyframes cpm2-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="cpm2-overlay" onClick={handleClose}>
        <div className="cpm2-modal" onClick={(e) => e.stopPropagation()}>
          <div className="cpm2-header">
            <div>
              <div className="cpm2-header__icon">
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
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
              </div>
              <p className="cpm2-header__title">Agregar producto</p>
              <p className="cpm2-header__sub">
                Completá los datos del nuevo producto
              </p>
            </div>
            <button
              className="cpm2-close"
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

          <form id="create-product-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="cpm2-body">
              {error && <div className="cpm2-alert">{error}</div>}

              <div className="cpm2-field">
                <label htmlFor="cpm2-name" className="cpm2-label">
                  Nombre del producto *
                </label>
                <input
                  {...register("name")}
                  id="cpm2-name"
                  type="text"
                  placeholder="Ej: Buzo de Egresados 2025"
                  disabled={isPending}
                  className={`cpm2-input${errors.name ? " cpm2-input--error" : ""}`}
                />
                {errors.name && (
                  <p className="cpm2-field-error">{errors.name.message}</p>
                )}
              </div>

              <div className="cpm2-field">
                <label htmlFor="cpm2-desc" className="cpm2-label">
                  Descripción{" "}
                  <span className="cpm2-label__hint">(opcional)</span>
                </label>
                <textarea
                  {...register("description")}
                  id="cpm2-desc"
                  rows={3}
                  placeholder="Descripción del producto..."
                  disabled={isPending}
                  className={`cpm2-input cpm2-textarea${errors.description ? " cpm2-input--error" : ""}`}
                />
                {errors.description && (
                  <p className="cpm2-field-error">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="cpm2-2col">
                <div className="cpm2-field">
                  <label htmlFor="cpm2-base" className="cpm2-label">
                    Precio base *
                  </label>
                  <input
                    {...register("basePrice")}
                    id="cpm2-base"
                    type="number"
                    step="0.01"
                    placeholder="150000"
                    disabled={isPending}
                    className={`cpm2-input${errors.basePrice ? " cpm2-input--error" : ""}`}
                  />
                  {errors.basePrice && (
                    <p className="cpm2-field-error">
                      {errors.basePrice.message}
                    </p>
                  )}
                </div>
                <div className="cpm2-field">
                  <label htmlFor="cpm2-current" className="cpm2-label">
                    Precio actual *
                  </label>
                  <input
                    {...register("currentPrice")}
                    id="cpm2-current"
                    type="number"
                    step="0.01"
                    placeholder="150000"
                    disabled={isPending}
                    className={`cpm2-input${errors.currentPrice ? " cpm2-input--error" : ""}`}
                  />
                  {errors.currentPrice && (
                    <p className="cpm2-field-error">
                      {errors.currentPrice.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="cpm2-footer">
              <button
                type="button"
                className="cpm2-btn cpm2-btn--cancel"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="cpm2-btn cpm2-btn--submit"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <div className="cpm2-spinner" /> Creando...
                  </>
                ) : (
                  "Crear producto"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
