export const isProduction = process.env.NODE_ENV === "production";

export const getBaseUrl = () => {
  // En el cliente (browser)
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // 🆕 PRIORIDAD 1: Variable explícita para desarrollo con ngrok
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // PRIORIDAD 2: En Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // PRIORIDAD 3: NextAuth URL (desarrollo local)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // PRIORIDAD 4: Fallback final
  return "http://localhost:3000";
};
