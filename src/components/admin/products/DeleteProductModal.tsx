"use client";

import { ProductWithStats } from "@/types";
import { useState, useTransition } from "react";

interface Props {
  product: ProductWithStats;
  isOpen: boolean;
  onClose: () => void;
  onProductDeleted: (productId: string) => void;
}

export default function DeleteProductModal({
  product,
  isOpen,
  onClose,
  onProductDeleted,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const hasStudents = (product.studentCount ?? 0) > 0;

  const handleDelete = () => {
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/products/${product.id}`, {
          method: "DELETE",
        });
        const result = await res.json();
        if (!result.success) {
          setError(result.error || "Error al eliminar el producto");
          return;
        }
        onProductDeleted(product.id);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ocurrió un error. Intentá nuevamente.",
        );
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
        .dpm-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50;
          display: flex; align-items: center; justify-content: center; padding: 1rem;
          backdrop-filter: blur(2px);
        }
        .dpm-modal {
          --font-display: 'Plus Jakarta Sans', sans-serif;
          --font-body:    'DM Sans', sans-serif;
          --surface: #fff; --surface-2: #f4f4f5; --surface-3: #e4e4e7;
          --text-1: #18181b; --text-2: #52525b; --text-3: #a1a1aa;
          --danger: #b91c1c; --danger-bg: rgba(185,28,28,0.08); --danger-border: rgba(185,28,28,0.2);
          --warning: #a16207; --warning-bg: rgba(161,98,7,0.08); --warning-border: rgba(161,98,7,0.2);
          --r-md: 0.875rem; --r-xl: 1.75rem; --r-full: 9999px;
          background: var(--surface); border-radius: var(--r-xl);
          box-shadow: 0 24px 60px rgba(0,0,0,0.18);
          width: 100%; max-width: 420px; overflow: hidden;
          font-family: var(--font-body); -webkit-font-smoothing: antialiased;
        }
        .dpm-modal *, .dpm-modal *::before, .dpm-modal *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .dpm-header {
          padding: 1.5rem 1.5rem 1.125rem;
          display: flex; flex-direction: column; align-items: center; text-align: center;
          border-bottom: 1px solid var(--surface-3);
        }
        .dpm-header__icon {
          width: 3rem; height: 3rem; border-radius: 50%;
          background: var(--danger-bg); border: 1px solid var(--danger-border);
          display: flex; align-items: center; justify-content: center;
          color: var(--danger); margin-bottom: 1rem;
        }
        .dpm-header__title { font-family: var(--font-display); font-size: 1.125rem; font-weight: 800; color: var(--text-1); margin-bottom: 0.375rem; }
        .dpm-header__sub { font-size: 0.875rem; color: var(--text-2); line-height: 1.4; }
        .dpm-header__sub strong { font-weight: 700; color: var(--text-1); }
        .dpm-body { padding: 1.125rem 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .dpm-alert {
          border-radius: var(--r-md); padding: 0.875rem 1rem;
          display: flex; gap: 0.625rem; align-items: flex-start;
          font-size: 0.8125rem; line-height: 1.4;
        }
        .dpm-alert__icon { flex-shrink: 0; margin-top: 0.05rem; }
        .dpm-alert--danger  { background: var(--danger-bg);  border: 1px solid var(--danger-border);  color: var(--danger); }
        .dpm-alert--warning { background: var(--warning-bg); border: 1px solid var(--warning-border); color: var(--warning); }
        .dpm-alert__title { font-weight: 700; margin-bottom: 0.2rem; }
        .dpm-alert--danger .dpm-alert__body  { color: #7f1d1d; }
        .dpm-alert--warning .dpm-alert__body { color: #713f12; }
        .dpm-footer { display: flex; gap: 0.625rem; padding: 1rem 1.5rem 1.375rem; border-top: 1px solid var(--surface-3); }
        .dpm-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.75rem 1.25rem; border-radius: var(--r-full);
          font-family: var(--font-display); font-size: 0.9375rem; font-weight: 700;
          border: none; cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s, background 0.12s, opacity 0.12s;
        }
        .dpm-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
        .dpm-btn--cancel { background: var(--surface-2); color: var(--text-2); flex-shrink: 0; }
        .dpm-btn--cancel:hover:not(:disabled) { background: var(--surface-3); }
        .dpm-btn--delete { flex: 1; background: var(--danger); color: white; box-shadow: 0 4px 12px rgba(185,28,28,0.25); }
        .dpm-btn--delete:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(185,28,28,0.35); }
        .dpm-spinner { width: 1rem; height: 1rem; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: dpm-spin 0.7s linear infinite; }
        @keyframes dpm-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="dpm-overlay" onClick={handleClose}>
        <div className="dpm-modal" onClick={(e) => e.stopPropagation()}>
          <div className="dpm-header">
            <div className="dpm-header__icon">
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </div>
            <p className="dpm-header__title">¿Eliminar producto?</p>
            <p className="dpm-header__sub">
              Estás por eliminar <strong>{product.name}</strong>
            </p>
          </div>

          <div className="dpm-body">
            {hasStudents ? (
              <div className="dpm-alert dpm-alert--danger">
                <svg
                  className="dpm-alert__icon"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="dpm-alert__title">No se puede eliminar</p>
                  <p className="dpm-alert__body">
                    Este producto tiene{" "}
                    <strong>{product.studentCount} estudiante(s)</strong>{" "}
                    asociados. Reasignalos primero.
                  </p>
                </div>
              </div>
            ) : (
              <div className="dpm-alert dpm-alert--warning">
                <svg
                  className="dpm-alert__icon"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="dpm-alert__title">
                    Esta acción no se puede deshacer
                  </p>
                  <p className="dpm-alert__body">
                    El producto será eliminado permanentemente del sistema.
                  </p>
                </div>
              </div>
            )}
            {error && (
              <div className="dpm-alert dpm-alert--danger">
                <svg
                  className="dpm-alert__icon"
                  width="14"
                  height="14"
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
          </div>

          <div className="dpm-footer">
            <button
              type="button"
              className="dpm-btn dpm-btn--cancel"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancelar
            </button>
            {!hasStudents && (
              <button
                type="button"
                className="dpm-btn dpm-btn--delete"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <div className="dpm-spinner" /> Eliminando...
                  </>
                ) : (
                  "Sí, eliminar"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
