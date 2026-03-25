"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SerializedUserWithRelations } from "@/types";

interface Props {
  student: SerializedUserWithRelations;
  isOpen: boolean;
  onClose: () => void;
}

const TALLE_OPTIONS = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "2",
  "4",
  "6",
  "8",
  "10",
  "12",
  "14",
  "16",
];

export default function EditStudentModal({ student, isOpen, onClose }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: student.firstName,
    lastName: student.lastName,
    dni: student.dni,
    email: student.email || "",
    phone: student.phone || "",
    size: student.size || "",
    notes: "",
  });

  const set = (patch: Partial<typeof formData>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      dni: student.dni,
      email: student.email || "",
      phone: student.phone || "",
      size: student.size || "",
      notes: "",
    });
    setError("");
    setSuccess(false);
  }, [student]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.error || "Error al actualizar");
        setIsSubmitting(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.refresh();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión.");
      setIsSubmitting(false);
    }
  };

  const handleQuickSizeChange = async (size: string) => {
    setError("");
    setSuccess(false);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
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
      set({ size });
      setSuccess(true);
      setTimeout(() => {
        router.refresh();
        setSuccess(false);
        setIsSubmitting(false);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .esm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          backdrop-filter: blur(2px);
        }
        .esm-modal {
          --font-display: 'Plus Jakarta Sans', sans-serif;
          --font-body:    'DM Sans', sans-serif;
          --surface:      #ffffff;
          --surface-2:    #f4f4f5;
          --surface-3:    #e4e4e7;
          --primary:      #00618e;
          --primary-mid:  #0089c6;
          --primary-tint: rgba(0,97,142,0.08);
          --primary-tint-s: rgba(0,97,142,0.14);
          --primary-focus: rgba(0,97,142,0.15);
          --text-1:       #18181b;
          --text-2:       #52525b;
          --text-3:       #a1a1aa;
          --success:      #0f7b55;
          --success-bg:   rgba(15,123,85,0.08);
          --success-border: rgba(15,123,85,0.2);
          --danger:       #b91c1c;
          --danger-bg:    rgba(185,28,28,0.08);
          --danger-border: rgba(185,28,28,0.2);
          --r-sm:  0.5rem;
          --r-md:  0.875rem;
          --r-lg:  1.25rem;
          --r-xl:  1.75rem;
          --r-full: 9999px;

          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: 0 24px 60px rgba(0,0,0,0.18);
          width: 100%;
          max-width: 540px;
          max-height: 90svh;
          overflow-y: auto;
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
        }
        .esm-modal *, .esm-modal *::before, .esm-modal *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* Header */
        .esm-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.375rem 1.5rem 1.125rem;
          border-bottom: 1px solid var(--surface-3);
        }
        .esm-header__icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: var(--r-md);
          background: var(--primary-tint);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
          margin-bottom: 0.75rem;
        }
        .esm-header__title {
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--text-1);
          letter-spacing: -0.01em;
        }
        .esm-header__sub { font-size: 0.8125rem; color: var(--text-3); margin-top: 0.2rem; }
        .esm-close {
          width: 2rem; height: 2rem;
          border-radius: var(--r-md);
          background: var(--surface-2);
          border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: var(--text-3);
          flex-shrink: 0;
          transition: background 0.12s, color 0.12s;
        }
        .esm-close:hover { background: var(--surface-3); color: var(--text-1); }
        .esm-close:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Body */
        .esm-body {
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.125rem;
        }

        /* Quick size section */
        .esm-size-section {
          background: var(--primary-tint);
          border: 1px solid rgba(0,97,142,0.15);
          border-radius: var(--r-lg);
          padding: 1rem;
        }
        .esm-size-section__label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.75rem;
        }
        .esm-size-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }
        .esm-size-btn {
          padding: 0.4rem 0.75rem;
          border-radius: var(--r-full);
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 700;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: all 0.12s;
        }
        .esm-size-btn--idle {
          background: var(--surface);
          border-color: var(--surface-3);
          color: var(--text-2);
        }
        .esm-size-btn--idle:hover { border-color: var(--primary); color: var(--primary); }
        .esm-size-btn--active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
          box-shadow: 0 3px 8px rgba(0,97,142,0.3);
        }
        .esm-size-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .esm-size-current {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: var(--primary);
          font-weight: 600;
          margin-top: 0.75rem;
        }

        /* Section divider label */
        .esm-section-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* 2col grid */
        .esm-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.875rem;
        }
        @media (max-width: 400px) { .esm-2col { grid-template-columns: 1fr; } }

        /* Fields */
        .esm-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .esm-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-2); }
        .esm-label__hint { font-weight: 400; color: var(--text-3); font-size: 0.75rem; }
        .esm-input {
          width: 100%;
          padding: 0.6875rem 0.875rem;
          border-radius: var(--r-md);
          border: 1.5px solid var(--surface-3);
          background: var(--surface-2);
          font-family: var(--font-body);
          font-size: 0.9375rem;
          color: var(--text-1);
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          -webkit-appearance: none;
        }
        .esm-input::placeholder { color: var(--text-3); }
        .esm-input:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 3px var(--primary-focus); }
        .esm-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .esm-textarea { resize: vertical; min-height: 4.5rem; }

        /* Alerts */
        .esm-alert {
          border-radius: var(--r-md);
          padding: 0.875rem 1rem;
          font-size: 0.8125rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }
        .esm-alert--error   { background: var(--danger-bg);  border: 1px solid var(--danger-border);  color: var(--danger); }
        .esm-alert--success { background: var(--success-bg); border: 1px solid var(--success-border); color: var(--success); }

        /* Footer */
        .esm-footer {
          display: flex;
          gap: 0.625rem;
          padding: 1rem 1.5rem 1.375rem;
          border-top: 1px solid var(--surface-3);
        }
        .esm-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: var(--r-full);
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: transform 0.12s, box-shadow 0.12s, background 0.12s, opacity 0.12s;
        }
        .esm-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
        .esm-btn--cancel { background: var(--surface-2); color: var(--text-2); flex-shrink: 0; }
        .esm-btn--cancel:hover:not(:disabled) { background: var(--surface-3); }
        .esm-btn--submit {
          flex: 1;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-mid) 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(0,97,142,0.3);
        }
        .esm-btn--submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0,97,142,0.38);
        }
        .esm-spinner {
          width: 1rem; height: 1rem;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: esm-spin 0.7s linear infinite;
        }
        @keyframes esm-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="esm-overlay" onClick={onClose}>
        <div className="esm-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="esm-header">
            <div>
              <div className="esm-header__icon">
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
              <p className="esm-header__title">Editar estudiante</p>
              <p className="esm-header__sub">
                {student.firstName} {student.lastName} · DNI {student.dni}
              </p>
            </div>
            <button
              className="esm-close"
              onClick={onClose}
              disabled={isSubmitting}
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

          <div className="esm-body">
            {/* Quick size */}
            <div className="esm-size-section">
              <p className="esm-size-section__label">Cambio rápido de talle</p>
              <div className="esm-size-grid">
                {TALLE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleQuickSizeChange(size)}
                    disabled={isSubmitting}
                    className={`esm-size-btn ${formData.size === size ? "esm-size-btn--active" : "esm-size-btn--idle"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {formData.size && (
                <p className="esm-size-current">
                  <svg
                    width="12"
                    height="12"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Talle actual: <strong>{formData.size}</strong>
                </p>
              )}
            </div>

            {/* Personal info */}
            <form id="edit-student-form" onSubmit={handleSubmit}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.875rem",
                }}
              >
                <p className="esm-section-label">Datos personales</p>

                <div className="esm-2col">
                  <div className="esm-field">
                    <label className="esm-label">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => set({ firstName: e.target.value })}
                      disabled={isSubmitting}
                      className="esm-input"
                    />
                  </div>
                  <div className="esm-field">
                    <label className="esm-label">Apellido *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => set({ lastName: e.target.value })}
                      disabled={isSubmitting}
                      className="esm-input"
                    />
                  </div>
                  <div className="esm-field">
                    <label className="esm-label">Email</label>
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={formData.email}
                      onChange={(e) => set({ email: e.target.value })}
                      disabled={isSubmitting}
                      className="esm-input"
                    />
                  </div>
                  <div className="esm-field">
                    <label className="esm-label">Teléfono</label>
                    <input
                      type="tel"
                      placeholder="351XXXXXXX"
                      value={formData.phone}
                      onChange={(e) => set({ phone: e.target.value })}
                      disabled={isSubmitting}
                      className="esm-input"
                    />
                  </div>
                </div>

                <div className="esm-field">
                  <label className="esm-label">
                    Talle manual{" "}
                    <span className="esm-label__hint">
                      (si no está en la lista de arriba)
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Talle personalizado"
                    value={formData.size}
                    onChange={(e) => set({ size: e.target.value })}
                    disabled={isSubmitting}
                    className="esm-input"
                  />
                </div>

                <div className="esm-field">
                  <label className="esm-label">
                    Notas <span className="esm-label__hint">(opcional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Información adicional sobre los cambios..."
                    value={formData.notes}
                    onChange={(e) => set({ notes: e.target.value })}
                    disabled={isSubmitting}
                    className="esm-input esm-textarea"
                  />
                </div>
              </div>
            </form>

            {/* Alerts */}
            {error && (
              <div className="esm-alert esm-alert--error">
                <svg
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
                {error}
              </div>
            )}
            {success && (
              <div className="esm-alert esm-alert--success">
                <svg
                  width="14"
                  height="14"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                ¡Cambios guardados!
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="esm-footer">
            <button
              type="button"
              className="esm-btn esm-btn--cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="edit-student-form"
              className="esm-btn esm-btn--submit"
              disabled={isSubmitting || success}
            >
              {isSubmitting ? (
                <>
                  <div className="esm-spinner" /> Guardando...
                </>
              ) : success ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Guardado
                </>
              ) : (
                "Guardar cambios"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
