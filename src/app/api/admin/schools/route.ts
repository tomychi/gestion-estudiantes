import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const createSchoolSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  address: z.string().optional().nullable(),
});

// POST - Create new school
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validatedData = createSchoolSchema.parse(body);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Check if school with same name already exists
    const { data: existing } = await supabase
      .from("School")
      .select("id")
      .eq("name", validatedData.name)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Ya existe un colegio con ese nombre" },
        { status: 400 },
      );
    }

    // Create school
    const { data: school, error } = await supabase
      .from("School")
      .insert({
        name: validatedData.name,
        address: validatedData.address || null,
      })
      .select()
      .single();

    if (error || !school) {
      console.error("Error creating school:", error);
      return NextResponse.json(
        { success: false, error: "Error al crear el colegio" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: school,
      message: "Colegio creado exitosamente",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: `Error de validación: ${error.issues.map((e) => e.message).join(", ")}`,
        },
        { status: 400 },
      );
    }

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

// GET - Get all schools
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: schools, error } = await supabase
      .from("School")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching schools:", error);
      return NextResponse.json(
        { success: false, error: "Error al obtener los colegios" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: schools || [],
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
