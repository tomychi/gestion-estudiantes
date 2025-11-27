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

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const supabase = createAdminClient();

  // Get products with student count
  const { data: products } = await supabase
    .from("Product")
    .select("*")
    .order("name", { ascending: true });

  // Get student count per product
  const productsWithStats = await Promise.all(
    (products || []).map(async (product) => {
      const { count: studentCount } = await supabase
        .from("User")
        .select("*", { count: "exact", head: true })
        .eq("productId", product.id)
        .eq("role", "STUDENT");

      return {
        ...product,
        studentCount: studentCount || 0,
      };
    }),
  );

  return (
    <AdminLayout session={session}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
            <p className="text-gray-600 mt-1">
              Gestioná los productos disponibles para los estudiantes
            </p>
          </div>
        </div>

        {/* Products List */}
        <ProductsList products={productsWithStats} />
      </div>
    </AdminLayout>
  );
}
