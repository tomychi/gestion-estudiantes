// ─── app/admin/products/page.tsx ─────────────────────────────────────────────

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import AdminLayout from "@/components/admin/AdminLayout";
import ProductsList from "@/components/admin/products/ProductsList";
import { createAdminClient } from "@/lib/supabase/supabase-admin";

export const metadata: Metadata = {
  title: "Productos - Sistema Alas",
  description: "Gestión de productos",
};

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const supabase = createAdminClient();

  const { data: products } = await supabase
    .from("Product")
    .select("*")
    .order("name", { ascending: true });

  const productsWithStats = await Promise.all(
    (products || []).map(async (product) => {
      const { count: studentCount } = await supabase
        .from("User")
        .select("*", { count: "exact", head: true })
        .eq("productId", product.id)
        .eq("role", "STUDENT");
      return { ...product, studentCount: studentCount || 0 };
    }),
  );

  return (
    <AdminLayout session={session}>
      <ProductsList products={productsWithStats} />
    </AdminLayout>
  );
}
