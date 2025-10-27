import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  // Si no hay sesión, redirigir al login
  if (!session) {
    redirect("/login");
  }

  // Redirigir según el rol
  if (session.user.role === "ADMIN") {
    redirect("/admin");
  } else {
    redirect("/dashboard");
  }
}
