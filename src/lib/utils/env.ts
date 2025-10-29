export const isProduction = process.env.NODE_ENV === "production";

export const getBaseUrl = () => {
  // En el cliente (browser)
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // En Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Fallback
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
};
