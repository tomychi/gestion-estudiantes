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
        // Check if it's a valid DNI (7-8 digits) or email
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
          // Redirect based on role (handled by middleware)
          const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
          router.push(callbackUrl);
          router.refresh();
        }
      } catch (err) {
        setError("Ocurrió un error. Intentá nuevamente.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Success message if coming from setup */}
      {searchParams.get("setup") === "success" && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">
            ¡Administrador creado exitosamente!
          </p>
          <p className="text-sm mt-1">Iniciá sesión con tus credenciales</p>
        </div>
      )}

      {/* Success message if password was changed */}
      {searchParams.get("passwordChanged") === "true" && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">
            ¡Contraseña cambiada exitosamente!
          </p>
          <p className="text-sm mt-1">Iniciá sesión con tu nueva contraseña</p>
        </div>
      )}

      {/* Success message if coming from registration */}
      {searchParams.get("registered") === "true" && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <p className="text-sm">
            ¡Contraseña creada exitosamente! Iniciá sesión.
          </p>
        </div>
      )}

      {/* Identifier Field */}
      <div>
        <label
          htmlFor="identifier"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          DNI o Email
        </label>
        <input
          {...register("identifier")}
          id="identifier"
          type="text"
          placeholder="12345678 o tu@email.com"
          disabled={isPending}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400 focus:border-transparent transition-colors ${
            errors.identifier
              ? "border-red-300 bg-red-50"
              : "border-gray-300 bg-white"
          } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
        />
        {errors.identifier && (
          <p className="mt-1 text-sm text-red-600">
            {errors.identifier.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Contraseña
        </label>
        <div className="relative">
          <input
            {...register("password")}
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            disabled={isPending}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-400 focus:border-transparent transition-colors ${
              errors.password
                ? "border-red-300 bg-red-50"
                : "border-gray-300 bg-white"
            } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            disabled={isPending}
          >
            {showPassword ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            Iniciando sesión...
          </>
        ) : (
          "Ingresar"
        )}
      </button>

      {/* First time users message */}
      <div className="text-center pt-2">
        <p className="text-sm text-gray-600">
          ¿Primera vez?{" "}
          <a
            href="/setup-password"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Creá tu contraseña
          </a>
        </p>
      </div>
    </form>
  );
}
