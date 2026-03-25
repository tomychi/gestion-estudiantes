"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signOut } from "next-auth/react";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "La contraseña actual es requerida"),
    newPassword: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "La nueva contraseña debe ser diferente a la actual",
    path: ["newPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface Props {
  userId: string;
  dni: string;
}

// ─── Reusable password field ──────────────────────────────────────────────────

function PasswordField({
  id,
  label,
  hint,
  placeholder,
  disabled,
  error,
  registration,
}: {
  id: string;
  label: string;
  hint?: string;
  placeholder: string;
  disabled: boolean;
  error?: string;
  registration: object;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="cp-field">
      <label htmlFor={id} className="cp-label">
        {label}
        {hint && <span className="cp-label__hint">{hint}</span>}
      </label>
      <div className="cp-input-wrap">
        <input
          {...registration}
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={
            id === "currentPassword" ? "current-password" : "new-password"
          }
          className={`cp-input cp-input--with-btn${error ? " cp-input--error" : ""}`}
        />
        {/* tabIndex=-1 fixes the tab-order bug */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          disabled={disabled}
          className="cp-eye-btn"
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {show ? (
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
              <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
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
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="cp-field-error">{error}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChangePasswordForm({ userId, dni }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          }),
        });
        const result = await res.json();
        if (!result.success) {
          setError(result.error || "Error al cambiar la contraseña");
          return;
        }
        await signOut({ redirect: false });
        router.push("/login?passwordChanged=true");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ocurrió un error. Intentá nuevamente.",
        );
      }
    });
  };

  return (
    <>
      <style>{`
        .cp-root {
          --font-display: 'Plus Jakarta Sans', sans-serif;
          --font-body:    'DM Sans', sans-serif;
          --bg:           #f4f4f5;
          --surface:      #ffffff;
          --surface-2:    #f4f4f5;
          --surface-3:    #e4e4e7;
          --primary:      #00618e;
          --primary-mid:  #0089c6;
          --primary-lite: #3eb7fe;
          --primary-focus: rgba(0,97,142,0.18);
          --text-1:       #18181b;
          --text-2:       #52525b;
          --text-3:       #a1a1aa;
          --danger:       #b91c1c;
          --danger-bg:    #fff1f1;
          --danger-border: rgba(185,28,28,0.2);
          --warning:      #a16207;
          --warning-bg:   #fefce8;
          --warning-border: rgba(161,98,7,0.22);
          --r-sm:  0.5rem;
          --r-md:  0.875rem;
          --r-lg:  1.25rem;
          --r-xl:  1.75rem;
          --r-full: 9999px;
          --shadow-card: 0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);

          font-family: var(--font-body);
          background: var(--bg);
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 1.25rem;
          -webkit-font-smoothing: antialiased;
        }
        .cp-root *, .cp-root *::before, .cp-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* ── Card ────────────────────────────────────────── */
        .cp-card {
          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-card);
          width: 100%;
          max-width: 420px;
          overflow: hidden;
        }

        /* ── Header ──────────────────────────────────────── */
        .cp-card__header {
          background: linear-gradient(135deg, #004e73 0%, var(--primary) 40%, var(--primary-mid) 75%, var(--primary-lite) 100%);
          padding: 2rem 1.75rem 1.75rem;
          position: relative;
          overflow: hidden;
        }
        .cp-card__header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -15%;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          pointer-events: none;
        }
        .cp-card__icon {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: var(--r-md);
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          color: white;
        }
        .cp-card__title {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }
        .cp-card__subtitle {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.65);
          margin-top: 0.375rem;
        }

        /* ── Body ────────────────────────────────────────── */
        .cp-card__body {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* ── Warning banner ──────────────────────────────── */
        .cp-warning {
          border-radius: var(--r-md);
          padding: 0.875rem 1rem;
          background: var(--warning-bg);
          border: 1px solid var(--warning-border);
          display: flex;
          gap: 0.625rem;
          align-items: flex-start;
        }
        .cp-warning__icon {
          width: 1.125rem;
          height: 1.125rem;
          flex-shrink: 0;
          color: var(--warning);
          margin-top: 0.05rem;
        }
        .cp-warning__title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--warning);
          margin-bottom: 0.2rem;
        }
        .cp-warning__body {
          font-size: 0.8125rem;
          color: #713f12;
          line-height: 1.4;
        }

        /* ── Error alert ─────────────────────────────────── */
        .cp-error {
          border-radius: var(--r-md);
          padding: 0.875rem 1rem;
          background: var(--danger-bg);
          border: 1px solid var(--danger-border);
          display: flex;
          gap: 0.625rem;
          align-items: center;
          font-size: 0.8125rem;
          color: var(--danger);
        }
        .cp-error svg { flex-shrink: 0; }

        /* ── Fields ──────────────────────────────────────── */
        .cp-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .cp-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-2);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .cp-label__hint {
          font-size: 0.75rem;
          font-weight: 400;
          color: var(--text-3);
        }
        .cp-input-wrap { position: relative; }
        .cp-input {
          width: 100%;
          padding: 0.8125rem 1rem;
          border-radius: var(--r-md);
          border: 1.5px solid var(--surface-3);
          background: var(--surface-2);
          font-family: var(--font-body);
          font-size: 0.9375rem;
          color: var(--text-1);
          outline: none;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
          -webkit-appearance: none;
        }
        .cp-input::placeholder { color: var(--text-3); }
        .cp-input:focus {
          border-color: var(--primary);
          background: var(--surface);
          box-shadow: 0 0 0 3px var(--primary-focus);
        }
        .cp-input--error {
          border-color: var(--danger);
          background: var(--danger-bg);
        }
        .cp-input--error:focus {
          box-shadow: 0 0 0 3px rgba(185,28,28,0.12);
        }
        .cp-input--with-btn { padding-right: 3rem; }
        .cp-eye-btn {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-3);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: var(--r-sm);
          transition: color 0.12s;
        }
        .cp-eye-btn:hover { color: var(--text-1); }
        .cp-field-error {
          font-size: 0.75rem;
          color: var(--danger);
          font-weight: 500;
        }

        /* ── Divider ─────────────────────────────────────── */
        .cp-divider {
          height: 1px;
          background: var(--surface-3);
          margin: 0.25rem 0;
        }

        /* ── Submit ──────────────────────────────────────── */
        .cp-submit {
          width: 100%;
          padding: 0.9375rem;
          border-radius: var(--r-full);
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-mid) 100%);
          color: white;
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 16px rgba(0,97,142,0.35);
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
        }
        .cp-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0,97,142,0.4);
        }
        .cp-submit:active:not(:disabled) { transform: scale(0.99); }
        .cp-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .cp-submit__spinner {
          width: 1.125rem;
          height: 1.125rem;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: cp-spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes cp-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="cp-root">
        <div className="cp-card">
          {/* Header */}
          <div className="cp-card__header">
            <div className="cp-card__icon">
              <svg
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <h1 className="cp-card__title">Cambiar contraseña</h1>
            <p className="cp-card__subtitle">
              Por seguridad, elegí una contraseña nueva
            </p>
          </div>

          {/* Body */}
          <div className="cp-card__body">
            {/* Warning */}
            <div className="cp-warning">
              <svg
                className="cp-warning__icon"
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
                <p className="cp-warning__title">Contraseña temporal activa</p>
                <p className="cp-warning__body">
                  Tu contraseña actual es tu DNI. Cambiala por una más segura
                  para continuar.
                </p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="cp-error" role="alert">
                <svg
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
                <span>{error}</span>
              </div>
            )}

            {/* Current password */}
            <PasswordField
              id="currentPassword"
              label="Contraseña actual"
              hint={`(tu DNI: ${dni})`}
              placeholder="Ingresá tu DNI"
              disabled={isPending}
              error={errors.currentPassword?.message}
              registration={register("currentPassword")}
            />

            <div className="cp-divider" />

            {/* New password */}
            <PasswordField
              id="newPassword"
              label="Nueva contraseña"
              placeholder="Mínimo 6 caracteres"
              disabled={isPending}
              error={errors.newPassword?.message}
              registration={register("newPassword")}
            />

            {/* Confirm password */}
            <PasswordField
              id="confirmPassword"
              label="Confirmá la nueva contraseña"
              placeholder="Repetí tu nueva contraseña"
              disabled={isPending}
              error={errors.confirmPassword?.message}
              registration={register("confirmPassword")}
            />

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isPending}
              className="cp-submit"
              style={{ marginTop: "0.25rem" }}
            >
              {isPending ? (
                <>
                  <div className="cp-submit__spinner" />
                  Cambiando contraseña...
                </>
              ) : (
                "Cambiar contraseña"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
