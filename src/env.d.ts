declare namespace NodeJS {
  interface ProcessEnv {
    NEXTAUTH_SECRET: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    MERCADOPAGO_ACCESS_TOKEN: string;
    MERCADOPAGO_PUBLIC_KEY: string;
    NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: string;
  }
}
