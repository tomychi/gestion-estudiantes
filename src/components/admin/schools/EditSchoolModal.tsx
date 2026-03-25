"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { School } from "@/types";

const editSchoolSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  address: z.string().optional(),
});

type EditSchoolFormData = z.infer<typeof editSchoolSchema>;

interface Props {
  school: School;
  isOpen: boolean;
  onClose: () => void;
  onSchoolUpdated: (school: School) => void;
}

export default function EditSchoolModal({
  school,
  isOpen,
  onClose,
  onSchoolUpdated,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditSchoolFormData>({
    resolver: zodResolver(editSchoolSchema),
    defaultValues: { name: school.name, address: school.address || "" },
  });

  useEffect(() => {
    reset({ name: school.name, address: school.address || "" });
  }, [school, reset]);

  const onSubmit = async (data: EditSchoolFormData) => {
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/schools/${school.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!result.success) {
          setError(result.error || "Error al actualizar el colegio");
          return;
        }
        onSchoolUpdated(result.school);
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
        .esm2-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 50;
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          backdrop-filter: blur(2px);
        }
        .esm2-modal {
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
        .esm2-modal *, .esm2-modal *::before, .esm2-modal *::after {
          box-sizing: border-box; margin: 0; padding: 0;
        }

        .esm2-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 1rem;
          padding: 1.375rem 1.5rem 1.125rem;
          border-bottom: 1px solid var(--surface-3);
        }
        .esm2-header__icon {
          width: 2.5rem; height: 2.5rem;
          border-radius: var(--r-md);
          background: var(--primary-tint);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary);
          margin-bottom: 0.75rem;
        }
        .esm2-header__title {
          font-family: var(--font-display);
          font-size: 1.125rem; font-weight: 800;
          color: var(--text-1); letter-spacing: -0.01em;
        }
        .esm2-header__sub { font-size: 0.8125rem; color: var(--text-3); margin-top: 0.2rem; }
        .esm2-close {
          width: 2rem; height: 2rem;
          border-radius: var(--r-md);
          background: var(--surface-2); border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-3); flex-shrink: 0;
          transition: background 0.12s, color 0.12s;
        }
        .esm2-close:hover { background: var(--surface-3); color: var(--text-1); }
        .esm2-close:disabled { opacity: 0.5; cursor: not-allowed; }

        .esm2-body {
          padding: 1.25rem 1.5rem;
          display: flex; flex-direction: column; gap: 0.875rem;
        }

        .esm2-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .esm2-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-2); }
        .esm2-label__hint { font-weight: 400; color: var(--text-3); font-size: 0.75rem; }
        .esm2-input {
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
        .esm2-input::placeholder { color: var(--text-3); }
        .esm2-input:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 3px var(--primary-focus); }
        .esm2-input--error { border-color: var(--danger); background: var(--danger-bg); }
        .esm2-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .esm2-field-error { font-size: 0.75rem; color: var(--danger); font-weight: 500; }

        .esm2-alert {
          border-radius: var(--r-md);
          padding: 0.75rem 0.875rem;
          font-size: 0.8125rem;
          background: var(--danger-bg);
          border: 1px solid var(--danger-border);
          color: var(--danger);
        }

        .esm2-footer {
          display: flex; gap: 0.625rem;
          padding: 1rem 1.5rem 1.375rem;
          border-top: 1px solid var(--surface-3);
        }
        .esm2-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: var(--r-full);
          font-family: var(--font-display);
          font-size: 0.9375rem; font-weight: 700;
          border: none; cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s, background 0.12s, opacity 0.12s;
        }
        .esm2-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
        .esm2-btn--cancel { background: var(--surface-2); color: var(--text-2); flex-shrink: 0; }
        .esm2-btn--cancel:hover:not(:disabled) { background: var(--surface-3); }
        .esm2-btn--submit {
          flex: 1;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-mid) 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(0,97,142,0.3);
        }
        .esm2-btn--submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,97,142,0.38); }
        .esm2-spinner {
          width: 1rem; height: 1rem;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: esm2-spin 0.7s linear infinite;
        }
        @keyframes esm2-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="esm2-overlay" onClick={handleClose}>
        <div className="esm2-modal" onClick={(e) => e.stopPropagation()}>
          <div className="esm2-header">
            <div>
              <div className="esm2-header__icon">
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
              <p className="esm2-header__title">Editar colegio</p>
              <p className="esm2-header__sub">{school.name}</p>
            </div>
            <button
              className="esm2-close"
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

          <form id="edit-school-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="esm2-body">
              {error && <div className="esm2-alert">{error}</div>}

              <div className="esm2-field">
                <label htmlFor="edit-school-name" className="esm2-label">
                  Nombre del colegio *
                </label>
                <input
                  {...register("name")}
                  id="edit-school-name"
                  type="text"
                  disabled={isPending}
                  className={`esm2-input${errors.name ? " esm2-input--error" : ""}`}
                />
                {errors.name && (
                  <p className="esm2-field-error">{errors.name.message}</p>
                )}
              </div>

              <div className="esm2-field">
                <label htmlFor="edit-school-address" className="esm2-label">
                  Dirección <span className="esm2-label__hint">(opcional)</span>
                </label>
                <input
                  {...register("address")}
                  id="edit-school-address"
                  type="text"
                  disabled={isPending}
                  placeholder="Ej: Bolívar 263, CABA"
                  className={`esm2-input${errors.address ? " esm2-input--error" : ""}`}
                />
                {errors.address && (
                  <p className="esm2-field-error">{errors.address.message}</p>
                )}
              </div>
            </div>

            <div className="esm2-footer">
              <button
                type="button"
                className="esm2-btn esm2-btn--cancel"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="esm2-btn esm2-btn--submit"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <div className="esm2-spinner" /> Guardando...
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
