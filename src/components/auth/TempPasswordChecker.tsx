"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function TempPasswordChecker() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Don't check if not authenticated or already on change-password page
    if (status !== "authenticated" || pathname === "/change-password") {
      return;
    }

    // Only check for students
    if (session?.user?.role !== "STUDENT") {
      return;
    }

    const checkTempPassword = async () => {
      try {
        const res = await fetch("/api/check-temp-password");
        const data = await res.json();

        if (data.success && data.hasTempPassword) {
          router.push("/change-password");
        }
      } catch (error) {
        console.error("Error checking temp password:", error);
      }
    };

    checkTempPassword();
  }, [status, session, pathname, router]);

  return null;
}
