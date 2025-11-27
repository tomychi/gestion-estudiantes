import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/supabase-admin";

const updateProductSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  basePrice: z.number().positive(),
  currentPrice: z.number().positive(),
});

// PUT - Update product
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    const supabase = createAdminClient();

    const { data: product, error } = await supabase
      .from("Product")
      .update(validatedData)
      .eq("id", id)
      .select()
      .single();

    if (error || !product) {
      return NextResponse.json(
        { success: false, error: "Error al actualizar el producto" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Unknown error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const supabase = createAdminClient();

    // Check if product has students
    const { count: studentCount } = await supabase
      .from("User")
      .select("*", { count: "exact", head: true })
      .eq("productId", id)
      .eq("role", "STUDENT");

    if (studentCount && studentCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No se puede eliminar. Hay ${studentCount} estudiante(s) con este producto`,
        },
        { status: 400 },
      );
    }

    // Delete product
    const { error } = await supabase.from("Product").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: "Error al eliminar el producto" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Producto eliminado exitosamente",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
