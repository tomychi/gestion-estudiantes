import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";

export const metadata: Metadata = {
  title: "Cambiar Contraseña - Sistema Alas",
  description: "Cambiá tu contraseña",
};

export default async function ChangePasswordPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return <ChangePasswordForm userId={session.user.id} dni={session.user.dni} />;
}
