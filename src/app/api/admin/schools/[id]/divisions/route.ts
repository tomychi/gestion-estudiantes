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

    const { id: schoolId } = await params;

    const supabase = createAdminClient();

    const { data: divisions, error } = await supabase
      .from("SchoolDivision")
      .select("id, division, year")
      .eq("schoolId", schoolId)
      .order("year", { ascending: false })
      .order("division", { ascending: true });

    if (error) {
      console.error("Error fetching divisions:", error);
      return NextResponse.json(
        { success: false, error: "Error al obtener divisiones" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: divisions || [],
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
