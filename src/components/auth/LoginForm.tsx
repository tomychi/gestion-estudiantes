"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "El DNI o email es requerido")
    .refine(
      (val) => {
        const isDNI = /^\d{7,8}$/.test(val);
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        return isDNI || isEmail;
      },
      { message: "Ingresá un DNI válido (7-8 dígitos) o email" },
    ),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError("");
    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          identifier: data.identifier,
          password: data.password,
          redirect: false,
        });
        if (result?.error) {
          setError("DNI/email o contraseña incorrectos");
          return;
        }
        if (result?.ok) {
          const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
          router.push(callbackUrl);
          router.refresh();
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ocurrió un error. Intentá nuevamente.",
        );
      }
    });
  };

  const setupSuccess = searchParams.get("setup") === "success";
  const passwordChanged = searchParams.get("passwordChanged") === "true";
  const registered = searchParams.get("registered") === "true";
  const hasSuccess = setupSuccess || passwordChanged || registered;

  return (
    <>
      <style>{`
        /* ── Tokens ──────────────────────────────────────── */
        .login-page {
          --font-display: 'Plus Jakarta Sans', sans-serif;
          --font-body:    'DM Sans', sans-serif;
          --bg:           #f4f4f5;
          --surface:      #ffffff;
          --surface-2:    #f4f4f5;
          --surface-3:    #e4e4e7;
          --primary:      #00618e;
          --primary-mid:  #0089c6;
          --primary-lite: #3eb7fe;
          --primary-tint: rgba(0,97,142,0.07);
          --primary-focus: rgba(0,97,142,0.18);
          --text-1:       #18181b;
          --text-2:       #52525b;
          --text-3:       #a1a1aa;
          --danger:       #b91c1c;
          --danger-bg:    #fff1f1;
          --danger-border: rgba(185,28,28,0.2);
          --success:      #0f7b55;
          --success-bg:   #ecfdf5;
          --success-border: rgba(15,123,85,0.2);
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
        .login-page *, .login-page *::before, .login-page *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* ── Card ────────────────────────────────────────── */
        .login-card {
          background: var(--surface);
          border-radius: var(--r-xl);
          box-shadow: var(--shadow-card);
          width: 100%;
          max-width: 400px;
          overflow: hidden;
        }

        /* ── Card header ─────────────────────────────────── */
        .login-card__header {
          background: linear-gradient(135deg, #004e73 0%, var(--primary) 40%, var(--primary-mid) 75%, var(--primary-lite) 100%);
          padding: 2rem 1.75rem 1.75rem;
          position: relative;
          overflow: hidden;
        }
        .login-card__header::before {
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
        .login-card__logo {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: var(--r-md);
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
        }
        .login-card__title {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }
        .login-card__subtitle {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.65);
          margin-top: 0.375rem;
        }

        /* ── Card body ───────────────────────────────────── */
        .login-card__body {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* ── Alerts ──────────────────────────────────────── */
        .login-alert {
          border-radius: var(--r-md);
          padding: 0.875rem 1rem;
          display: flex;
          gap: 0.625rem;
          align-items: flex-start;
          font-size: 0.8125rem;
          line-height: 1.4;
        }
        .login-alert--error {
          background: var(--danger-bg);
          border: 1px solid var(--danger-border);
          color: var(--danger);
        }
        .login-alert--success {
          background: var(--success-bg);
          border: 1px solid var(--success-border);
          color: var(--success);
        }
        .login-alert__icon {
          width: 1.125rem;
          height: 1.125rem;
          flex-shrink: 0;
          margin-top: 0.05rem;
        }
        .login-alert__title {
          font-weight: 700;
          margin-bottom: 0.15rem;
        }

        /* ── Field ───────────────────────────────────────── */
        .login-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .login-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-2);
        }
        .login-input-wrap { position: relative; }
        .login-input {
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
        .login-input::placeholder { color: var(--text-3); }
        .login-input:focus {
          border-color: var(--primary);
          background: var(--surface);
          box-shadow: 0 0 0 3px var(--primary-focus);
        }
        .login-input--error {
          border-color: var(--danger);
          background: var(--danger-bg);
        }
        .login-input--error:focus {
          box-shadow: 0 0 0 3px rgba(185,28,28,0.12);
        }
        .login-input--with-btn { padding-right: 3rem; }
        .login-input-btn {
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
        .login-input-btn:hover { color: var(--text-1); }
        .login-field-error {
          font-size: 0.75rem;
          color: var(--danger);
          font-weight: 500;
        }

        /* ── Submit ──────────────────────────────────────── */
        .login-submit {
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
          margin-top: 0.25rem;
        }
        .login-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0,97,142,0.4);
        }
        .login-submit:active:not(:disabled) { transform: scale(0.99); }
        .login-submit:disabled { opacity: 0.55; cursor: not-allowed; }
        .login-submit__spinner {
          width: 1.125rem;
          height: 1.125rem;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Footer link ─────────────────────────────────── */
        .login-footer {
          text-align: center;
          padding-bottom: 0.25rem;
        }
        .login-footer p {
          font-size: 0.8125rem;
          color: var(--text-3);
        }
        .login-footer a {
          color: var(--primary);
          font-weight: 600;
          text-decoration: none;
          transition: opacity 0.12s;
        }
        .login-footer a:hover { opacity: 0.75; }
      `}</style>

      <div className="login-page">
        <div className="login-card">
          {/* Header */}
          <div className="login-card__header">
            <div className="login-card__logo">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                <path d="M16 3H8L6 7h12l-2-4z" />
              </svg>
            </div>
            <h1 className="login-card__title">Sistema Alas</h1>
            <p className="login-card__subtitle">Ingresá con tu DNI o email</p>
          </div>

          {/* Body */}
          <div className="login-card__body">
            {/* Error */}
            {error && (
              <div className="login-alert login-alert--error" role="alert">
                <svg
                  className="login-alert__icon"
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

            {/* Success */}
            {hasSuccess && (
              <div className="login-alert login-alert--success" role="status">
                <svg
                  className="login-alert__icon"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="login-alert__title">
                    {setupSuccess && "¡Administrador creado!"}
                    {passwordChanged && "¡Contraseña actualizada!"}
                    {registered && "¡Contraseña creada!"}
                  </p>
                  <p>Iniciá sesión con tus credenciales</p>
                </div>
              </div>
            )}

            {/* DNI / Email */}
            <div className="login-field">
              <label htmlFor="identifier" className="login-label">
                DNI o Email
              </label>
              <div className="login-input-wrap">
                <input
                  {...register("identifier")}
                  id="identifier"
                  type="text"
                  placeholder="12345678 o tu@email.com"
                  disabled={isPending}
                  className={`login-input${errors.identifier ? " login-input--error" : ""}`}
                  autoComplete="username"
                />
              </div>
              {errors.identifier && (
                <p className="login-field-error">{errors.identifier.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="password" className="login-label">
                Contraseña
              </label>
              <div className="login-input-wrap">
                <input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  disabled={isPending}
                  className={`login-input login-input--with-btn${errors.password ? " login-input--error" : ""}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="login-input-btn"
                  disabled={isPending}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
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
              {errors.password && (
                <p className="login-field-error">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isPending}
              className="login-submit"
            >
              {isPending ? (
                <>
                  <div className="login-submit__spinner" />
                  Iniciando sesión...
                </>
              ) : (
                "Ingresar"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
