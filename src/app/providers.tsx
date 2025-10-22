"use client";

import { SessionProvider } from "next-auth/react";
import TempPasswordChecker from "@/components/auth/TempPasswordChecker";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TempPasswordChecker />
      {children}
    </SessionProvider>
  );
}
