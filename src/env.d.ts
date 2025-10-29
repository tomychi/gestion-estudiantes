declare namespace NodeJS {
  interface ProcessEnv {
    // Auth
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;

    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    // Mercado Pago
    MERCADOPAGO_ACCESS_TOKEN: string;
    MERCADOPAGO_PUBLIC_KEY: string;
    NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: string;

    // App
    NEXT_PUBLIC_APP_URL?: string;

    // Vercel (auto-seteadas)
    VERCEL_URL?: string;
    NODE_ENV: "development" | "production" | "test";
  }
}
