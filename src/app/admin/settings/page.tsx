import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import AdminLayout from "@/components/admin/AdminLayout";
import SettingsForm from "@/components/admin/settings/SettingsForm";

export const metadata: Metadata = {
  title: "Configuración - Sistema Alas",
  description: "Gestión de configuración del sistema",
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <AdminLayout session={session}>
      <SettingsForm />
    </AdminLayout>
  );
}
