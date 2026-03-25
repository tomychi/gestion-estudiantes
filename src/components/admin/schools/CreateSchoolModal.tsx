"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { School } from "@/types";

const createSchoolSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  address: z.string().optional(),
});

type CreateSchoolFormData = z.infer<typeof createSchoolSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSchoolCreated: (school: School) => void;
}

export default function CreateSchoolModal({
  isOpen,
  onClose,
  onSchoolCreated,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

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
        onSchoolCreated(result.data);
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
        .csm-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 50;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          backdrop-filter: blur(2px);
        }
        .csm-modal {
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
          max-width: 440px;
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
        }
        .csm-modal *, .csm-modal *::before, .csm-modal *::after {
          box-sizing: border-box; margin: 0; padding: 0;
        }
        .csm-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 1rem;
          padding: 1.375rem 1.5rem 1.125rem;
          border-bottom: 1px solid var(--surface-3);
        }
        .csm-header__icon {
          width: 2.5rem; height: 2.5rem;
          border-radius: var(--r-md);
          background: var(--primary-tint);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary);
          margin-bottom: 0.75rem;
        }
        .csm-header__title {
          font-family: var(--font-display);
          font-size: 1.125rem; font-weight: 800;
          color: var(--text-1); letter-spacing: -0.01em;
        }
        .csm-header__sub { font-size: 0.8125rem; color: var(--text-3); margin-top: 0.2rem; }
        .csm-close {
          width: 2rem; height: 2rem;
          border-radius: var(--r-md);
          background: var(--surface-2); border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-3); flex-shrink: 0;
          transition: background 0.12s, color 0.12s;
        }
        .csm-close:hover { background: var(--surface-3); color: var(--text-1); }
        .csm-close:disabled { opacity: 0.5; cursor: not-allowed; }
        .csm-body {
          padding: 1.25rem 1.5rem;
          display: flex; flex-direction: column; gap: 0.875rem;
        }
        .csm-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .csm-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-2); }
        .csm-label__hint { font-weight: 400; color: var(--text-3); font-size: 0.75rem; }
        .csm-input {
          width: 100%;
          padding: 0.6875rem 0.875rem;
          border-radius: var(--r-md);
          border: 1.5px solid var(--surface-3);
          background: var(--surface-2);
          font-family: var(--font-body);
          font-size: 0.9375rem; color: var(--text-1);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          -webkit-appearance: none;
        }
        .csm-input::placeholder { color: var(--text-3); }
        .csm-input:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 3px var(--primary-focus); }
        .csm-input--error { border-color: var(--danger); background: var(--danger-bg); }
        .csm-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .csm-field-error { font-size: 0.75rem; color: var(--danger); font-weight: 500; }
        .csm-alert {
          border-radius: var(--r-md);
          padding: 0.75rem 0.875rem;
          font-size: 0.8125rem;
          background: var(--danger-bg);
          border: 1px solid var(--danger-border);
          color: var(--danger);
        }
        .csm-footer {
          display: flex; gap: 0.625rem;
          padding: 1rem 1.5rem 1.375rem;
          border-top: 1px solid var(--surface-3);
        }
        .csm-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: var(--r-full);
          font-family: var(--font-display);
          font-size: 0.9375rem; font-weight: 700;
          border: none; cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s, background 0.12s, opacity 0.12s;
        }
        .csm-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
        .csm-btn--cancel { background: var(--surface-2); color: var(--text-2); flex-shrink: 0; }
        .csm-btn--cancel:hover:not(:disabled) { background: var(--surface-3); }
        .csm-btn--submit {
          flex: 1;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-mid) 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(0,97,142,0.3);
        }
        .csm-btn--submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,97,142,0.38); }
        .csm-spinner {
          width: 1rem; height: 1rem;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: csm-spin 0.7s linear infinite;
        }
        @keyframes csm-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="csm-overlay" onClick={handleClose}>
        <div className="csm-modal" onClick={(e) => e.stopPropagation()}>
          <div className="csm-header">
            <div>
              <div className="csm-header__icon">
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
                  <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
                </svg>
              </div>
              <p className="csm-header__title">Agregar colegio</p>
              <p className="csm-header__sub">
                Completá los datos del nuevo colegio
              </p>
            </div>
            <button
              className="csm-close"
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

          <form id="create-school-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="csm-body">
              {error && <div className="csm-alert">{error}</div>}

              <div className="csm-field">
                <label htmlFor="csm-name" className="csm-label">
                  Nombre del colegio *
                </label>
                <input
                  {...register("name")}
                  id="csm-name"
                  type="text"
                  placeholder="Ej: Colegio Nacional de Buenos Aires"
                  disabled={isPending}
                  className={`csm-input${errors.name ? " csm-input--error" : ""}`}
                />
                {errors.name && (
                  <p className="csm-field-error">{errors.name.message}</p>
                )}
              </div>

              <div className="csm-field">
                <label htmlFor="csm-address" className="csm-label">
                  Dirección <span className="csm-label__hint">(opcional)</span>
                </label>
                <input
                  {...register("address")}
                  id="csm-address"
                  type="text"
                  placeholder="Ej: Bolívar 263, CABA"
                  disabled={isPending}
                  className={`csm-input${errors.address ? " csm-input--error" : ""}`}
                />
                {errors.address && (
                  <p className="csm-field-error">{errors.address.message}</p>
                )}
              </div>
            </div>

            <div className="csm-footer">
              <button
                type="button"
                className="csm-btn csm-btn--cancel"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="csm-btn csm-btn--submit"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <div className="csm-spinner" /> Creando...
                  </>
                ) : (
                  "Crear colegio"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
