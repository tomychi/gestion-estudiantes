import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createAdminClient } from "@/lib/supabase/supabase-admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    const { id: studentId } = await params;

    const supabase = createAdminClient();

    const { data: payments, error } = await supabase
      .from("Payment")
      .select("*")
      .eq("userId", studentId)
      .order("installmentNumber", { ascending: true });

    if (error) {
      console.error("Error fetching payments:", error);
      return NextResponse.json(
        { success: false, error: "Error al obtener pagos" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      payments: payments || [],
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
