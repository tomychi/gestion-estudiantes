import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const dni = searchParams.get("dni");

    if (!dni) {
      return NextResponse.json(
        { success: false, error: "DNI requerido" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: student, error } = await supabase
      .from("User")
      .select(
        `
        id,
        firstName,
        lastName,
        dni,
        email,
        totalAmount,
        paidAmount,
        balance,
        installments,
        schoolDivision:SchoolDivision(
          division,
          year,
          school:School(name)
        ),
        product:Product(name)
      `,
      )
      .eq("dni", dni)
      .eq("role", "STUDENT")
      .single();

    if (error || !student) {
      return NextResponse.json(
        { success: false, error: "Estudiante no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("Error searching student:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    );
  }
}
