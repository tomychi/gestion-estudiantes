import { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Iniciar Sesión - Sistema Alas",
  description: "Inicia sesión para gestionar tus pagos de buzo",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFormSkeleton() {
  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f4f5",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          borderRadius: "1.75rem",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ height: 160, background: "#0089c6", opacity: 0.4 }} />
        <div
          style={{
            padding: "1.75rem",
            background: "white",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {[80, 80, 52].map((h, i) => (
            <div
              key={i}
              style={{
                height: h,
                borderRadius: "0.875rem",
                background: "#e4e4e7",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
